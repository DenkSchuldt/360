import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { Texture, TextureLoader } from 'three';

const fixtures = vi.hoisted(() => ({ renderers: [], textureRequests: [], resizeObservers: [], rendererFailure: undefined }));
export const { renderers, textureRequests, resizeObservers } = fixtures;
export function setRendererFailure(error) { fixtures.rendererFailure = error; }

// jsdom cannot create a WebGL context. Keep the installed Three scene, camera,
// geometry, textures and OrbitControls real; replace only its GPU boundary.
vi.mock('three', async importOriginal => {
  const actual = await importOriginal();
  class WebGLRenderer {
    constructor(options = {}) {
      if (fixtures.rendererFailure) throw fixtures.rendererFailure;
      this.domElement = options.canvas || document.createElement('canvas');
      this.options = options;
      this.capabilities = { getMaxAnisotropy: () => 16 };
      this.setPixelRatio = vi.fn(value => { this.pixelRatio = value; });
      this.setSize = vi.fn((width, height) => {
        this.domElement.width = width;
        this.domElement.height = height;
        Object.defineProperties(this.domElement, {
          clientWidth: { configurable: true, value: width },
          clientHeight: { configurable: true, value: height },
        });
      });
      this.render = vi.fn((scene, camera) => {
        this.scene = scene;
        this.camera = camera;
      });
      this.dispose = vi.fn();
      this.forceContextLoss = vi.fn();
      fixtures.renderers.push(this);
    }
  }
  return { ...actual, WebGLRenderer };
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

for (const method of ['setPointerCapture', 'releasePointerCapture']) {
  if (!HTMLCanvasElement.prototype[method]) {
    Object.defineProperty(HTMLCanvasElement.prototype, method, {
      configurable: true, writable: true, value: () => {},
    });
  }
}

beforeEach(() => {
  localStorage.clear();
  renderers.length = 0;
  textureRequests.length = 0;
  resizeObservers.length = 0;
  fixtures.rendererFailure = undefined;

  // Image requests are completed explicitly, including late callbacks, so the
  // real adapter's cancellation and texture ownership remain under test.
  vi.spyOn(TextureLoader.prototype, 'load').mockImplementation(function (source, onLoad, onProgress, onError) {
    const texture = new Texture();
    vi.spyOn(texture, 'dispose');
    textureRequests.push({
      source,
      texture,
      resolve: (result = texture) => onLoad?.(result),
      progress: event => onProgress?.(event),
      reject: error => onError?.(error),
    });
    return texture;
  });

  vi.stubGlobal('ResizeObserver', class ResizeObserver {
    constructor(callback) {
      this.callback = callback;
      this.observe = vi.fn();
      this.unobserve = vi.fn();
      this.disconnect = vi.fn();
      resizeObservers.push(this);
    }
  });

  vi.spyOn(HTMLCanvasElement.prototype, 'setPointerCapture').mockImplementation(() => {});
  vi.spyOn(HTMLCanvasElement.prototype, 'releasePointerCapture').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});
