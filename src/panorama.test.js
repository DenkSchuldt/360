import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SRGBColorSpace, Texture, Vector3 } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createPanoramaViewer } from './panorama';
import { renderers, resizeObservers, textureRequests } from './test/setup.js';

describe('native Three panorama adapter', () => {
  let container;
  let frames;
  let controllers;
  let controlsUpdate;
  let controlsDispose;
  let time;

  function frame() {
    time += 16;
    const queued = [...frames.entries()];
    queued.forEach(([id]) => frames.delete(id));
    queued.forEach(([, callback]) => callback(time));
  }

  function createViewer() {
    const viewer = createPanoramaViewer(container);
    controllers.push(viewer);
    frame();
    return viewer;
  }

  function activeControls() {
    return controlsUpdate.mock.contexts.at(-1);
  }

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    frames = new Map();
    controllers = [];
    time = 0;
    let nextFrame = 0;
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn(callback => {
        frames.set(++nextFrame, callback);
        return nextFrame;
      }),
    );
    vi.stubGlobal(
      'cancelAnimationFrame',
      vi.fn(id => frames.delete(id)),
    );
    controlsUpdate = vi.spyOn(OrbitControls.prototype, 'update');
    controlsDispose = vi.spyOn(OrbitControls.prototype, 'dispose');
    container = document.createElement('div');
    Object.defineProperties(container, {
      clientWidth: { configurable: true, value: 800 },
      clientHeight: { configurable: true, value: 400 },
    });
    document.body.append(container);
  });

  afterEach(() => {
    controllers.forEach(viewer => viewer.dispose());
    container.remove();
    delete document.hidden;
  });

  it('renders a real textured sphere with one canvas and one animation loop across source changes', () => {
    const viewer = createViewer();
    const renderer = renderers[0];
    const cleanupFirst = viewer.load('/first.jpg');
    const first = textureRequests[0];
    first.resolve();
    frame();

    expect(renderers).toHaveLength(1);
    expect(container.querySelectorAll('canvas')).toHaveLength(1);
    expect(renderer.camera.isPerspectiveCamera).toBe(true);
    expect(renderer.camera.fov).toBe(65);
    const mesh = renderer.scene.children.find(child => child.isMesh);
    expect(mesh.geometry.type).toBe('SphereGeometry');
    expect(mesh.material.map).toBe(first.texture);
    expect(first.texture.colorSpace).toBe(SRGBColorSpace);
    expect(frames.size).toBe(1);

    const cleanupSecond = viewer.load('/second.jpg');
    const second = textureRequests[1];
    second.resolve();
    cleanupFirst();
    cleanupFirst();
    frame();
    expect(renderers).toHaveLength(1);
    expect(first.texture.dispose).toHaveBeenCalledOnce();
    expect(second.texture.dispose).not.toHaveBeenCalled();
    expect(
      renderer.scene.children.find(child => child.isMesh).material.map,
    ).toBe(second.texture);
    expect(frames.size).toBe(1);
    cleanupSecond();
    cleanupSecond();
    expect(second.texture.dispose).toHaveBeenCalledOnce();
  });

  it('keeps one live photo texture and reuses GPU resources across fifty sequential photos', () => {
    const viewer = createViewer();
    const renderer = renderers[0];
    const mesh = renderer.scene.children.find(child => child.isMesh);
    const { geometry, material } = mesh;
    const disposeGeometry = vi.spyOn(geometry, 'dispose');
    const disposeMaterial = vi.spyOn(material, 'dispose');

    for (let index = 0; index < 50; index++) {
      viewer.load(`/photo-${index}.jpg`);
      const current = textureRequests.at(-1);
      current.resolve();
      frame();

      expect(renderers).toHaveLength(1);
      expect(container.querySelectorAll('canvas')).toHaveLength(1);
      expect(renderer.scene.children.find(child => child.isMesh)).toBe(mesh);
      expect(mesh.geometry).toBe(geometry);
      expect(mesh.material).toBe(material);
      expect(material.map).toBe(current.texture);
      expect(
        textureRequests.filter(
          request => request.texture.dispose.mock.calls.length === 0,
        ),
      ).toEqual([current]);
      for (const previous of textureRequests.slice(0, -1))
        expect(previous.texture.dispose).toHaveBeenCalledOnce();
      expect(disposeGeometry).not.toHaveBeenCalled();
      expect(disposeMaterial).not.toHaveBeenCalled();
      expect(frames.size).toBe(1);
    }

    viewer.dispose();
    for (const request of textureRequests)
      expect(request.texture.dispose).toHaveBeenCalledOnce();
    expect(disposeGeometry).toHaveBeenCalledOnce();
    expect(disposeMaterial).toHaveBeenCalledOnce();
    expect(renderer.dispose).toHaveBeenCalledOnce();
    expect(renderer.forceContextLoss).toHaveBeenCalledOnce();
    expect(container.querySelector('canvas')).toBeNull();
    expect(frames.size).toBe(0);
  });

  it('disposes GPU resources, controls, listeners, resize observer, pending timers and RAF exactly once', () => {
    const added = vi.spyOn(EventTarget.prototype, 'addEventListener');
    const removed = vi.spyOn(EventTarget.prototype, 'removeEventListener');
    const viewer = createViewer();
    viewer.load('/image.jpg');
    const request = textureRequests[0];
    request.resolve();
    frame();
    const renderer = renderers[0];
    const mesh = renderer.scene.children.find(child => child.isMesh);
    const disposeGeometry = vi.spyOn(mesh.geometry, 'dispose');
    const disposeMaterial = vi.spyOn(mesh.material, 'dispose');
    renderer.domElement.dispatchEvent(
      new WheelEvent('wheel', { deltaY: 1, cancelable: true }),
    );
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    const pendingFrame = [...frames.values()][0];
    const ownedListeners = added.mock.calls.map((args, index) => ({
      target: added.mock.contexts[index],
      args,
    }));

    viewer.dispose();
    viewer.dispose();
    expect(request.texture.dispose).toHaveBeenCalledOnce();
    expect(disposeGeometry).toHaveBeenCalledOnce();
    expect(disposeMaterial).toHaveBeenCalledOnce();
    expect(controlsDispose).toHaveBeenCalledOnce();
    expect(renderer.dispose).toHaveBeenCalledOnce();
    expect(renderer.forceContextLoss).toHaveBeenCalledOnce();
    expect(resizeObservers[0].disconnect).toHaveBeenCalledOnce();
    expect(container.querySelector('canvas')).toBeNull();
    expect(frames.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
    expect(() => viewer.load('/after-disposal.jpg')).toThrow(/disposed/i);

    const capture = options =>
      typeof options === 'boolean' ? options : Boolean(options?.capture);
    for (const {
      target,
      args: [type, callback, options],
    } of ownedListeners) {
      expect(
        removed.mock.calls.some(
          ([removedType, removedCallback, removedOptions], index) =>
            removed.mock.contexts[index] === target &&
            removedType === type &&
            removedCallback === callback &&
            capture(removedOptions) === capture(options),
        ),
        `unremoved ${type} listener`,
      ).toBe(true);
    }
    renderer.render.mockClear();
    pendingFrame(time + 16);
    vi.advanceTimersByTime(20000);
    expect(renderer.render).not.toHaveBeenCalled();
    expect(frames.size).toBe(0);
  });

  it('survives StrictMode setup/cleanup/setup and preserves React-owned overlay nodes', () => {
    const overlay = document.createElement('a');
    container.append(overlay);
    const first = createViewer();
    const cleanupFirst = first.load('/first.jpg');
    first.dispose();
    cleanupFirst();
    expect([...container.childNodes]).toEqual([overlay]);

    const second = createViewer();
    const cleanupSecond = second.load('/first.jpg');
    expect(renderers).toHaveLength(2);
    expect(container.querySelectorAll('canvas')).toHaveLength(1);
    expect(renderers[0].dispose).toHaveBeenCalledOnce();
    expect(renderers[1].dispose).not.toHaveBeenCalled();
    expect(frames.size).toBe(1);
    cleanupSecond();
    second.dispose();
    expect([...container.childNodes]).toEqual([overlay]);
    expect(frames.size).toBe(0);
  });

  it('ignores stale progress and errors and disposes late textures after replacement or unmount', () => {
    const viewer = createViewer();
    const onProgress = vi.fn();
    const onError = vi.fn();
    const cleanupFirst = viewer.load('/slow.jpg', onProgress, onError);
    const first = textureRequests[0];
    viewer.load('/replacement.jpg');
    const replacement = textureRequests[1];
    replacement.resolve();
    cleanupFirst();
    onProgress.mockClear();
    onError.mockClear();
    first.progress({ loaded: 1, total: 2 });
    first.reject(new Error('stale failure'));
    first.resolve();
    expect(first.texture.dispose).toHaveBeenCalledOnce();
    expect(onProgress).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
    frame();
    expect(
      renderers[0].scene.children.find(child => child.isMesh).material.map,
    ).toBe(replacement.texture);

    viewer.load('/unmounted.jpg', onProgress, onError);
    const pending = textureRequests[2];
    viewer.dispose();
    onProgress.mockClear();
    pending.progress({ loaded: 1, total: 2 });
    pending.reject(new Error('failure after unmount'));
    pending.resolve();
    expect(pending.texture.dispose).toHaveBeenCalledOnce();
    expect(onProgress).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it('cleans up a distinct texture supplied by a late load callback', () => {
    const viewer = createViewer();
    const cleanup = viewer.load('/cancelled.jpg');
    const pending = textureRequests[0];
    cleanup();
    const lateTexture = new Texture();
    const disposeTexture = vi.spyOn(lateTexture, 'dispose');
    expect(() => pending.resolve(lateTexture)).not.toThrow();
    expect(disposeTexture).toHaveBeenCalledOnce();
  });

  it('reports bounded progress and clears it on successful completion', () => {
    const viewer = createViewer();
    const onProgress = vi.fn();
    const onError = vi.fn();
    viewer.load('/image.jpg', onProgress, onError);
    const request = textureRequests[0];
    expect(onProgress).toHaveBeenLastCalledWith(0);
    request.progress({ loaded: 1, total: 2 });
    expect(onProgress).toHaveBeenLastCalledWith(50);
    request.progress({ loaded: 0, total: 0 });
    expect(onProgress).toHaveBeenLastCalledWith(50);
    request.progress({ loaded: 3, total: 2 });
    for (const [value] of onProgress.mock.calls) {
      if (value !== undefined) expect(value).toBeGreaterThanOrEqual(0);
      if (value !== undefined) expect(value).toBeLessThanOrEqual(100);
    }
    request.resolve();
    expect(onProgress).toHaveBeenLastCalledWith(undefined);
    expect(onError).not.toHaveBeenCalled();
  });

  it('surfaces current image failures, clears progress and permits a subsequent successful load', () => {
    const viewer = createViewer();
    const onProgress = vi.fn();
    const onError = vi.fn();
    viewer.load('/missing.jpg', onProgress, onError);
    const error = new Error('Image unavailable');
    textureRequests[0].reject(error);
    expect(onError).toHaveBeenCalledOnce();
    expect(onProgress).toHaveBeenLastCalledWith(undefined);

    viewer.load('/working.jpg', onProgress, onError);
    textureRequests[1].resolve();
    frame();
    expect(
      renderers[0].scene.children.find(child => child.isMesh).material.map,
    ).toBe(textureRequests[1].texture);
    expect(onError).toHaveBeenCalledOnce();
  });

  it('clamps zoom to 30–120 degrees and updates the real camera projection', () => {
    const viewer = createViewer();
    const camera = renderers[0].camera;
    const updateProjection = vi.spyOn(camera, 'updateProjectionMatrix');
    viewer.zoomBy(-10);
    expect(camera.fov).toBe(55);
    viewer.zoomBy(-1000);
    expect(camera.fov).toBe(30);
    viewer.zoomBy(1000);
    expect(camera.fov).toBe(120);
    expect(updateProjection).toHaveBeenCalled();
    expect(Number.isFinite(camera.projectionMatrix.elements[0])).toBe(true);
  });

  it('pauses automatic rotation during interaction and resumes after ten idle seconds', () => {
    const viewer = createViewer();
    const controls = activeControls();
    expect(controls.autoRotate).toBe(true);
    const canvas = renderers[0].domElement;
    canvas.dispatchEvent(
      new PointerEvent('pointerdown', {
        pointerId: 1,
        clientX: 300,
        clientY: 200,
        button: 0,
      }),
    );
    expect(controls.autoRotate).toBe(false);
    vi.advanceTimersByTime(20000);
    expect(controls.autoRotate).toBe(false);
    canvas.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1 }));
    vi.advanceTimersByTime(9999);
    expect(controls.autoRotate).toBe(false);
    vi.advanceTimersByTime(1);
    expect(controls.autoRotate).toBe(true);

    canvas.dispatchEvent(
      new PointerEvent('pointerdown', {
        pointerId: 2,
        clientX: 300,
        clientY: 200,
        button: 0,
      }),
    );
    canvas.dispatchEvent(new PointerEvent('pointerup', { pointerId: 2 }));
    viewer.setAutoRotate(false);
    vi.advanceTimersByTime(20000);
    expect(controls.autoRotate).toBe(false);
    viewer.setAutoRotate(true);
    expect(controls.autoRotate).toBe(true);
  });

  it('supports real OrbitControls dragging plus keyboard navigation and wheel FOV zoom', () => {
    const viewer = createViewer();
    viewer.setAutoRotate(false);
    const { camera, domElement: canvas } = renderers[0];
    const controls = activeControls();
    expect(controls.rotateSpeed).toBe(-0.15);
    const originalAzimuth = controls.getAzimuthalAngle();
    const originalDirection = camera.quaternion.clone();
    canvas.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        pointerId: 1,
        pointerType: 'mouse',
        clientX: 400,
        clientY: 200,
        button: 0,
      }),
    );
    canvas.dispatchEvent(
      new PointerEvent('pointermove', {
        bubbles: true,
        pointerId: 1,
        pointerType: 'mouse',
        clientX: 500,
        clientY: 240,
        button: 0,
      }),
    );
    canvas.dispatchEvent(
      new PointerEvent('pointerup', {
        bubbles: true,
        pointerId: 1,
        pointerType: 'mouse',
      }),
    );
    frame();
    expect(camera.quaternion.equals(originalDirection)).toBe(false);
    expect(controls.getAzimuthalAngle()).toBeGreaterThan(originalAzimuth);
    const afterDrag = camera.quaternion.clone();
    const arrow = new KeyboardEvent('keydown', {
      key: 'ArrowLeft',
      cancelable: true,
    });
    canvas.dispatchEvent(arrow);
    frame();
    expect(arrow.defaultPrevented).toBe(true);
    expect(camera.quaternion.equals(afterDrag)).toBe(false);
    expect(
      [...camera.position, ...camera.quaternion].every(Number.isFinite),
    ).toBe(true);

    const wheel = new WheelEvent('wheel', { deltaY: -100, cancelable: true });
    canvas.dispatchEvent(wheel);
    expect(wheel.defaultPrevented).toBe(true);
    expect(camera.fov).toBe(60);
    canvas.dispatchEvent(
      new KeyboardEvent('keydown', { key: '+', cancelable: true }),
    );
    expect(camera.fov).toBe(55);
    canvas.dispatchEvent(
      new KeyboardEvent('keydown', { key: '-', cancelable: true }),
    );
    expect(camera.fov).toBe(60);
  });

  it.each([
    ['ArrowRight', [1, 0, 0], 1],
    ['ArrowLeft', [1, 0, 0], -1],
    ['ArrowUp', [0, 1, 0], 1],
    ['ArrowDown', [0, 1, 0], -1],
  ])(
    '%s moves the viewing direction toward the matching screen edge',
    (key, axis, sign) => {
      const viewer = createViewer();
      viewer.setAutoRotate(false);
      const controls = activeControls();
      controls.enableDamping = false;
      controls.update(0);
      const { camera, domElement: canvas } = renderers[0];
      const screenAxis = new Vector3(...axis).applyQuaternion(
        camera.quaternion,
      );
      const before = camera.getWorldDirection(new Vector3());
      canvas.dispatchEvent(
        new KeyboardEvent('keydown', { key, cancelable: true }),
      );
      const movement = camera.getWorldDirection(new Vector3()).sub(before);
      expect(movement.dot(screenAxis) * sign).toBeGreaterThan(0.04);
    },
  );

  it('zooms with two-finger pinch while keeping the camera distance fixed', () => {
    const viewer = createViewer();
    viewer.setAutoRotate(false);
    const { camera, domElement: canvas } = renderers[0];
    const distance = camera.position.length();
    canvas.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        pointerId: 1,
        pointerType: 'touch',
        clientX: 300,
        clientY: 200,
      }),
    );
    canvas.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        pointerId: 2,
        pointerType: 'touch',
        clientX: 500,
        clientY: 200,
      }),
    );
    const beforePinch = camera.quaternion.toArray();
    canvas.dispatchEvent(
      new PointerEvent('pointermove', {
        bubbles: true,
        pointerId: 2,
        pointerType: 'touch',
        clientX: 500,
        clientY: 200,
      }),
    );
    expect(camera.quaternion.toArray()).toEqual(beforePinch);
    expect(camera.fov).toBe(65);
    canvas.dispatchEvent(
      new PointerEvent('pointermove', {
        bubbles: true,
        pointerId: 2,
        pointerType: 'touch',
        clientX: 600,
        clientY: 200,
      }),
    );
    expect(camera.fov).toBeLessThan(65);
    expect(camera.quaternion.toArray()).toEqual(beforePinch);
    canvas.dispatchEvent(
      new PointerEvent('pointermove', {
        bubbles: true,
        pointerId: 2,
        pointerType: 'touch',
        clientX: 400,
        clientY: 200,
      }),
    );
    expect(camera.fov).toBeGreaterThan(65);
    expect(camera.position.length()).toBeCloseTo(distance);
    expect(
      [...camera.position, ...camera.quaternion].every(Number.isFinite),
    ).toBe(true);
    canvas.dispatchEvent(
      new PointerEvent('pointerup', {
        bubbles: true,
        pointerId: 1,
        pointerType: 'touch',
      }),
    );
    canvas.dispatchEvent(
      new PointerEvent('pointerup', {
        bubbles: true,
        pointerId: 2,
        pointerType: 'touch',
      }),
    );
  });

  it('suspends animation while the tab is hidden and resumes with a single frame loop', () => {
    const viewer = createViewer();
    const renderer = renderers[0];
    expect(frames.size).toBe(1);
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(frames.size).toBe(0);
    renderer.render.mockClear();
    frame();
    expect(renderer.render).not.toHaveBeenCalled();

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event('visibilitychange'));
    document.dispatchEvent(new Event('visibilitychange'));
    expect(frames.size).toBe(1);
    frame();
    expect(renderer.render).toHaveBeenCalledOnce();
    expect(frames.size).toBe(1);
    viewer.dispose();
    document.dispatchEvent(new Event('visibilitychange'));
    expect(frames.size).toBe(0);
  });

  it('resizes the renderer and camera without starting another animation loop', () => {
    createViewer();
    const renderer = renderers[0];
    expect(resizeObservers[0].observe).toHaveBeenCalledWith(container);
    expect(renderer.camera.aspect).toBe(2);
    Object.defineProperties(container, {
      clientWidth: { configurable: true, value: 300 },
      clientHeight: { configurable: true, value: 600 },
    });
    resizeObservers[0].callback([{ target: container }]);
    expect(renderer.setSize.mock.calls.at(-1).slice(0, 2)).toEqual([300, 600]);
    expect(renderer.camera.aspect).toBe(0.5);
    expect(frames.size).toBe(1);
  });
});
