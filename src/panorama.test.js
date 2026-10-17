// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPanoramaViewer } from './panorama';

const threeSource = readFileSync('public/libs/three.min.js', 'utf8');
const panolensSource = readFileSync('public/libs/panolens.min.js', 'utf8');

// Exercise the real legacy ImagePanorama and its async callbacks without needing
// a WebGL context. Only the viewer/renderer boundary is replaced with a fake.
describe('PANOLENS lifecycle adapter', () => {
  let container;
  let library;
  let animationFrames;
  let viewers;

  beforeEach(() => {
    animationFrames = [];
    viewers = [];
    const sandbox = {
      console: { ...console, warn: vi.fn() },
      performance: { now: () => 100 },
      self: {},
      setTimeout,
      clearTimeout,
      window: {
        devicePixelRatio: 1,
        requestAnimationFrame: callback => animationFrames.push(callback),
        cancelAnimationFrame: vi.fn(),
      },
    };
    vm.createContext(sandbox);
    vm.runInContext(threeSource, sandbox);
    vm.runInContext(panolensSource, sandbox);
    library = sandbox;

    class FakeViewer {
      constructor({ container: viewport }) {
        this.container = viewport;
        this.scene = new sandbox.THREE.Scene();
        this.camera = { translateX: vi.fn(), translateY: vi.fn() };
        this.renderer = { dispose: vi.fn(), forceContextLoss: vi.fn() };
        this.controls = [{ dispose: vi.fn() }, { dispose: vi.fn() }];
        this.reticle = { end: vi.fn() };
        this.disableAutoRate = vi.fn();
        this.unregisterMouseAndTouchEvents = vi.fn();
        this.canvas = document.createElement('canvas');
        this.mask = document.createElement('div');
        this.bar = document.createElement('div');
        viewport.append(this.canvas, this.mask, this.bar);
        this.destroy = vi.fn(() => {
          [...this.scene.children].forEach(panorama => panorama.dispose());
          this.bar.remove();
        });
        viewers.push(this);
      }
      getCamera() { return this.camera; }
      getRenderer() { return this.renderer; }
      add(panorama) {
        this.scene.add(panorama);
        panorama.addEventListener('panolens-viewer-handler', event => {
          if (event.method === 'onPanoramaDispose' && this.panorama === panorama) {
            this.panorama = null;
          }
        });
      }
      setPanorama(panorama) {
        this.panorama = panorama;
        panorama.dispatchEvent({ type: 'enter' });
      }
    }

    window.PANOLENS = { ...sandbox.PANOLENS, Viewer: FakeViewer };
    container = document.createElement('div');
    document.body.append(container);
  });

  afterEach(() => {
    container.remove();
    delete window.PANOLENS;
  });

  it('reuses the live viewer and disposes each replaced panorama exactly once', () => {
    const controller = createPanoramaViewer(container);
    const onProgress = vi.fn();
    const cleanupFirst = controller.load('/first.jpg', onProgress);
    const first = viewers[0].panorama;
    const disposeFirst = vi.spyOn(first, 'dispose');
    const cleanupSecond = controller.load('/second.jpg', onProgress);
    const second = viewers[0].panorama;
    const disposeSecond = vi.spyOn(second, 'dispose');

    expect(viewers).toHaveLength(1);
    expect(disposeFirst).toHaveBeenCalledTimes(1);
    expect(first.material).toBeNull();
    expect(viewers[0].scene.children).toEqual([second]);
    expect(viewers[0].destroy).not.toHaveBeenCalled();
    cleanupFirst();
    expect(disposeFirst).toHaveBeenCalledTimes(1);

    controller.dispose();
    cleanupSecond();
    controller.dispose();
    expect(disposeSecond).toHaveBeenCalledTimes(1);
    expect(viewers[0].destroy).toHaveBeenCalledTimes(1);
    expect(viewers[0].disableAutoRate).toHaveBeenCalledOnce();
    expect(viewers[0].unregisterMouseAndTouchEvents).toHaveBeenCalledOnce();
    viewers[0].controls.forEach(control => expect(control.dispose).toHaveBeenCalledOnce());
    expect(viewers[0].renderer.dispose).toHaveBeenCalledOnce();
    expect(viewers[0].renderer.forceContextLoss).toHaveBeenCalledOnce();
    expect(() => controller.load('/third.jpg')).toThrow('disposed viewer');
  });

  it('handles StrictMode setup/cleanup/setup with one canvas and preserves React-owned nodes', () => {
    const overlay = document.createElement('a');
    container.append(overlay);
    const first = createPanoramaViewer(container);
    const cleanupFirst = first.load('/first.jpg');
    first.dispose();
    cleanupFirst();
    expect([...container.childNodes]).toEqual([overlay]);

    const second = createPanoramaViewer(container);
    const cleanupSecond = second.load('/first.jpg');
    expect(viewers).toHaveLength(2);
    expect(container.querySelectorAll('canvas')).toHaveLength(1);
    expect(viewers[0].destroy).toHaveBeenCalledOnce();
    expect(viewers[1].destroy).not.toHaveBeenCalled();
    // Also cover the opposite cleanup order.
    cleanupSecond();
    second.dispose();
    expect([...container.childNodes]).toEqual([overlay]);
  });

  it('disposes an image texture arriving after panorama cleanup and ignores stale progress', () => {
    const controller = createPanoramaViewer(container);
    const onProgress = vi.fn();
    const cleanup = controller.load('/slow.jpg', onProgress);
    const panorama = viewers[0].panorama;
    // The legacy loader captures this function with bind() before cleanup.
    const pendingLoad = panorama.onLoad.bind(panorama);
    cleanup();
    onProgress.mockClear();
    const lateTexture = new library.THREE.Texture();
    const disposeTexture = vi.spyOn(lateTexture, 'dispose');
    expect(() => pendingLoad(lateTexture)).not.toThrow();
    panorama.onProgress({ loaded: 10, total: 20 });
    expect(disposeTexture).toHaveBeenCalledOnce();
    expect(onProgress).not.toHaveBeenCalled();
    expect(panorama.material).toBeNull();
    controller.dispose();
  });

  it('ignores an already queued load frame after cleanup instead of restarting a fade tween', () => {
    const controller = createPanoramaViewer(container);
    const onProgress = vi.fn();
    const cleanup = controller.load('/image.jpg', onProgress);
    const panorama = viewers[0].panorama;
    const texture = new library.THREE.Texture();
    const disposeTexture = vi.spyOn(texture, 'dispose');
    const fadeStart = vi.spyOn(panorama.fadeInAnimation, 'start');
    panorama.onLoad(texture);
    expect(animationFrames).toHaveLength(1);
    cleanup();
    onProgress.mockClear();
    animationFrames.forEach(callback => callback());
    expect(disposeTexture).toHaveBeenCalledOnce();
    expect(fadeStart).not.toHaveBeenCalled();
    expect(onProgress).not.toHaveBeenCalled();
    controller.dispose();
  });

  it('reports bounded progress and clears progress on successful load or error', () => {
    const controller = createPanoramaViewer(container);
    const onProgress = vi.fn();
    controller.load('/image.jpg', onProgress);
    const panorama = viewers[0].panorama;
    expect(onProgress).toHaveBeenLastCalledWith(0);
    panorama.onProgress({ loaded: 1, total: 2 });
    expect(onProgress).toHaveBeenLastCalledWith(50);
    panorama.onProgress({ loaded: 0, total: 0 });
    expect(onProgress).toHaveBeenLastCalledWith(50);
    panorama.onProgress({ loaded: 3, total: 2 });
    expect(onProgress).toHaveBeenLastCalledWith(undefined);
    panorama.onError();
    expect(onProgress).toHaveBeenLastCalledWith(undefined);
    panorama.onLoad(new library.THREE.Texture());
    animationFrames.forEach(callback => callback());
    expect(onProgress).toHaveBeenLastCalledWith(undefined);
    controller.dispose();
  });
});
