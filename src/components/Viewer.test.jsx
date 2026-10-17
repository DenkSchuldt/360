import { StrictMode } from 'react';
import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Viewer from './Viewer.jsx';
import rawData from '../data.json';
import { panoramas, viewers } from '../test/setup.js';

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
  it('replaces panoramas without reusing destroyed viewers or leaking canvas nodes and listeners', () => {
    vi.stubEnv('BASE_URL', '/360/');
    const { container, rerender, unmount } = render(viewerElement(rawData[0]));
    const viewport = container.querySelector('.my-vwr');
    const activeViewer = viewers.at(-1);
    const firstPanorama = panoramas.at(-1);

    expect(viewers).toHaveLength(2);
    expect(viewers[0].destroy).toHaveBeenCalledTimes(1);
    expect(activeViewer.destroy).not.toHaveBeenCalled();
    // PANOLENS fullscreens its container, so React overlays must stay inside it.
    expect(activeViewer.options.container).toBe(viewport);
    expect(viewport).toContainElement(screen.getByLabelText('Ver ubicación en el mapa'));
    expect(viewport.querySelector('.my-vwr-progress-wrapper')).not.toBeNull();
    expect(viewport.querySelectorAll('canvas')).toHaveLength(1);
    expect(viewport.querySelectorAll('.mock-panolens-toolbar')).toHaveLength(1);
    expect(firstPanorama.source).toBe(`/360/images/${rawData[0].src}`);
    expect(screen.getByRole('spinbutton')).toHaveValue(1);

    rerender(viewerElement(rawData[1], 1));

    expect(viewers).toHaveLength(2);
    expect(firstPanorama.dispose).toHaveBeenCalledTimes(1);
    expect([...firstPanorama.listeners.values()].every(listeners => listeners.size === 0)).toBe(true);
    expect(activeViewer.setPanorama).toHaveBeenLastCalledWith(panoramas.at(-1));
    expect(panoramas.at(-1).source).toBe(`/360/images/${rawData[1].src}`);
    expect(screen.getByRole('spinbutton')).toHaveValue(2);
    expect(viewport.querySelectorAll('canvas')).toHaveLength(1);

    // Filtering can change the displayed position without changing the photo.
    const panoramaCount = panoramas.length;
    rerender(viewerElement(rawData[1], 0));
    expect(screen.getByRole('spinbutton')).toHaveValue(1);
    expect(panoramas).toHaveLength(panoramaCount);

    unmount();

    expect(viewport.querySelectorAll('canvas, .mock-panolens-toolbar')).toHaveLength(0);
    for (const viewer of viewers) {
      expect(viewer.destroy).toHaveBeenCalledTimes(1);
      expect(viewer.renderer.dispose).toHaveBeenCalledTimes(1);
      expect(viewer.renderer.forceContextLoss).toHaveBeenCalledTimes(1);
      for (const control of viewer.controls) expect(control.dispose).toHaveBeenCalledTimes(1);
    }
    for (const panorama of panoramas) {
      expect(panorama.dispose).toHaveBeenCalledTimes(1);
      expect([...panorama.listeners.values()].every(listeners => listeners.size === 0)).toBe(true);
    }
  });

  it('ignores progress from a panorama after replacement or unmount', () => {
    const { rerender, unmount } = render(viewerElement(rawData[0]));
    const firstPanorama = panoramas.at(-1);

    act(() => firstPanorama.emit('progress', { progress: { loaded: 25, total: 100 } }));
    rerender(viewerElement(rawData[1], 1));
    const nextPanorama = panoramas.at(-1);
    act(() => {
      firstPanorama.dispatchEvent({ type: 'progress', progress: { loaded: 90, total: 100 } });
      nextPanorama.emit('progress', { progress: { loaded: 100, total: 100 } });
    });
    expect(screen.getByRole('spinbutton')).toHaveValue(2);

    unmount();
    expect(() => {
      firstPanorama.dispatchEvent({ type: 'load' });
      nextPanorama.dispatchEvent({ type: 'progress', progress: { loaded: 50, total: 100 } });
    }).not.toThrow();
    expect([...nextPanorama.listeners.values()].every(listeners => listeners.size === 0)).toBe(true);
  });
});
