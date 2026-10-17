import { StrictMode } from 'react';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { describe, expect, it, vi } from 'vitest';
import Viewer from './Viewer.jsx';
import rawData from '../data.json';
import {
  renderers,
  resizeObservers,
  setRendererFailure,
  textureRequests,
} from '../test/setup.js';

function viewerElement(panorama, idx = 0) {
  return (
    <StrictMode>
      <Viewer
        {...panorama}
        idx={idx}
        total={rawData.length}
        anchoredTags={[]}
        setAnchoredTags={vi.fn()}
        setCurrentIndex={vi.fn()}
        openTagsDialog={vi.fn()}
      />
    </StrictMode>
  );
}

describe('Viewer lifecycle under React StrictMode', () => {
  it('keeps one live canvas and renderer while replacing textures without remounting the viewer', () => {
    vi.stubEnv('BASE_URL', '/360/');
    const disposeControls = vi.spyOn(OrbitControls.prototype, 'dispose');
    const { container, rerender, unmount } = render(viewerElement(rawData[0]));
    const viewport = container.querySelector('.my-vwr');
    const activeRenderer = renderers.at(-1);
    const firstRequest = textureRequests.at(-1);

    expect(renderers).toHaveLength(2);
    expect(renderers[0].dispose).toHaveBeenCalledOnce();
    expect(activeRenderer.dispose).not.toHaveBeenCalled();
    expect(viewport).toContainElement(
      screen.getByLabelText('Ver ubicación en el mapa'),
    );
    expect(viewport).toContainElement(
      screen.getByLabelText('Controles de panorámica'),
    );
    expect(viewport.querySelector('.my-vwr-progress-wrapper')).not.toBeNull();
    expect(viewport.querySelectorAll('canvas')).toHaveLength(1);
    expect(firstRequest.source).toBe(`/360/images/${rawData[0].src}`);
    expect(screen.getByRole('spinbutton')).toHaveValue(1);
    act(() => firstRequest.resolve());
    expect(viewport).toHaveAttribute('data-panorama-state', 'ready');

    rerender(viewerElement(rawData[1], 1));
    const nextRequest = textureRequests.at(-1);
    expect(renderers).toHaveLength(2);
    expect(firstRequest.texture.dispose).toHaveBeenCalledOnce();
    expect(nextRequest.source).toBe(`/360/images/${rawData[1].src}`);
    expect(screen.getByRole('spinbutton')).toHaveValue(2);
    expect(viewport.querySelectorAll('canvas')).toHaveLength(1);
    expect(viewport).toHaveAttribute('data-panorama-state', 'loading');
    expect(viewport).not.toHaveAttribute('data-panorama-source');

    const requestCount = textureRequests.length;
    rerender(viewerElement(rawData[1], 0));
    expect(screen.getByRole('spinbutton')).toHaveValue(1);
    expect(textureRequests).toHaveLength(requestCount);
    act(() => nextRequest.resolve());
    expect(viewport).toHaveAttribute(
      'data-panorama-source',
      nextRequest.source,
    );

    unmount();
    expect(viewport.querySelectorAll('canvas')).toHaveLength(0);
    expect(disposeControls).toHaveBeenCalledTimes(2);
    for (const renderer of renderers) {
      expect(renderer.dispose).toHaveBeenCalledOnce();
      expect(renderer.forceContextLoss).toHaveBeenCalledOnce();
    }
    for (const observer of resizeObservers)
      expect(observer.disconnect).toHaveBeenCalledOnce();
    for (const request of textureRequests)
      expect(request.texture.dispose).toHaveBeenCalledOnce();
  });

  it('ignores stale progress, errors and load callbacks after a source change or unmount', () => {
    const { container, rerender, unmount } = render(viewerElement(rawData[0]));
    const firstRequest = textureRequests.at(-1);
    const viewport = container.querySelector('.my-vwr');
    const progress = viewport.querySelector('.my-vwr-progress-wrapper');
    act(() => firstRequest.progress({ loaded: 25, total: 100 }));
    expect(progress).toHaveAttribute('aria-hidden', 'false');
    rerender(viewerElement(rawData[1], 1));
    const nextRequest = textureRequests.at(-1);
    act(() => nextRequest.resolve());
    expect(progress).toHaveAttribute('aria-hidden', 'true');
    act(() => {
      firstRequest.progress({ loaded: 90, total: 100 });
      firstRequest.reject(new Error('Stale image failure'));
      firstRequest.resolve();
    });
    expect(progress).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(viewport).toHaveAttribute(
      'data-panorama-source',
      nextRequest.source,
    );
    expect(firstRequest.texture.dispose).toHaveBeenCalledOnce();

    unmount();
    expect(() => {
      nextRequest.progress({ loaded: 50, total: 100 });
      nextRequest.reject(new Error('Failure after unmount'));
      nextRequest.resolve();
    }).not.toThrow();
    expect(nextRequest.texture.dispose).toHaveBeenCalledOnce();
    expect(viewport).not.toHaveAttribute('data-panorama-state');
    expect(viewport).not.toHaveAttribute('data-panorama-source');
  });

  it('shows an actionable image error and retries with the existing renderer', async () => {
    const user = userEvent.setup();
    const { container } = render(viewerElement(rawData[0]));
    const viewport = container.querySelector('.my-vwr');
    const failedRequest = textureRequests.at(-1);
    act(() => failedRequest.reject(new Error('Image not found')));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'No se pudo cargar esta foto',
    );
    expect(viewport).toHaveAttribute('data-panorama-state', 'error');
    expect(viewport.querySelector('.my-vwr-progress-wrapper')).toHaveAttribute(
      'aria-hidden',
      'true',
    );

    const requestCount = textureRequests.length;
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(renderers).toHaveLength(2);
    expect(textureRequests).toHaveLength(requestCount + 1);
    expect(failedRequest.texture.dispose).toHaveBeenCalledOnce();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    const retry = textureRequests.at(-1);
    expect(retry.source).toBe(failedRequest.source);
    act(() => retry.resolve());
    expect(viewport).toHaveAttribute('data-panorama-state', 'ready');
  });

  it('provides exactly three accessible zoom and automatic rotation controls inside the viewport', async () => {
    const user = userEvent.setup();
    const updateControls = vi.spyOn(OrbitControls.prototype, 'update');
    const { container } = render(viewerElement(rawData[0]));
    const viewport = container.querySelector('.my-vwr');
    const toolbar = within(screen.getByLabelText('Controles de panorámica'));
    const buttons = toolbar.getAllByRole('button');
    expect(buttons).toHaveLength(3);
    for (const [index, name] of [
      'Alejar',
      'Acercar',
      'Pausar autorrotación',
    ].entries()) {
      expect(buttons[index]).toHaveAccessibleName(name);
    }
    expect(
      screen.queryByRole('button', { name: /pantalla completa/i }),
    ).not.toBeInTheDocument();
    expect(viewport).toContainElement(
      screen.getByRole('link', { name: 'Ver ubicación en el mapa' }),
    );
    act(() => textureRequests.at(-1).resolve());
    const renderer = renderers.at(-1);
    const controls = updateControls.mock.contexts.at(-1);
    expect(renderer.camera.fov).toBe(65);
    await user.click(screen.getByRole('button', { name: 'Acercar' }));
    expect(renderer.camera.fov).toBe(60);
    await user.click(screen.getByRole('button', { name: 'Alejar' }));
    expect(renderer.camera.fov).toBe(65);
    const pause = screen.getByRole('button', { name: 'Pausar autorrotación' });
    expect(pause).toHaveAttribute('aria-pressed', 'true');
    await user.click(pause);
    expect(controls.autoRotate).toBe(false);
    expect(
      screen.getByRole('button', { name: 'Activar autorrotación' }),
    ).toHaveAttribute('aria-pressed', 'false');
    await user.click(
      screen.getByRole('button', { name: 'Activar autorrotación' }),
    );
    expect(controls.autoRotate).toBe(true);
    expect(
      toolbar.getByRole('button', { name: 'Pausar autorrotación' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(toolbar.getAllByRole('button')).toHaveLength(3);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows an accessible WebGL 2 fallback without leaving canvases or loading photos', () => {
    setRendererFailure(new Error('WebGL 2 unavailable'));
    const { container } = render(viewerElement(rawData[0]));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'navegador compatible con WebGL 2',
    );
    expect(container.querySelector('canvas')).toBeNull();
    expect(textureRequests).toHaveLength(0);
    expect(resizeObservers).toHaveLength(0);
    expect(
      screen.queryByRole('button', { name: 'Reintentar' }),
    ).not.toBeInTheDocument();
  });
});
