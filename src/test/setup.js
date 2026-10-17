import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

// WebGL cannot run in jsdom. Keep React, Motion and the installed dialog real.
export const panoramas = [];
export const viewers = [];

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

beforeEach(() => {
  localStorage.clear();
  panoramas.length = 0;
  viewers.length = 0;

  class ImagePanorama {
    constructor(source) {
      this.source = source;
      this.listeners = new Map();
      this.addEventListener = vi.fn((event, listener) => {
        if (!this.listeners.has(event)) this.listeners.set(event, new Set());
        this.listeners.get(event).add(listener);
      });
      this.removeEventListener = vi.fn((event, listener) => {
        this.listeners.get(event)?.delete(listener);
      });
      this.dispatchEvent = vi.fn(event => this.emit(event.type, event));
      this.onLoad = vi.fn();
      this.dispose = vi.fn(() => {
        this.disposed = true;
        for (const viewer of viewers) {
          if (viewer.panorama === this) viewer.panorama = null;
        }
      });
      panoramas.push(this);
    }

    emit(event, details = {}) {
      this.listeners.get(event)?.forEach(listener => listener(details));
    }
  }

  class Viewer {
    constructor(options) {
      this.options = options;
      this.canvas = document.createElement('canvas');
      this.toolbar = document.createElement('div');
      this.toolbar.className = 'mock-panolens-toolbar';
      options.container.append(this.canvas, this.toolbar);
      this.camera = { translateX: vi.fn(), translateY: vi.fn() };
      this.getCamera = vi.fn(() => this.camera);
      this.renderer = { dispose: vi.fn(), forceContextLoss: vi.fn() };
      this.getRenderer = vi.fn(() => this.renderer);
      this.controls = [{ dispose: vi.fn() }, { dispose: vi.fn() }];
      this.reticle = { end: vi.fn() };
      this.disableAutoRate = vi.fn();
      this.unregisterMouseAndTouchEvents = vi.fn();
      this.clearAllCache = vi.fn();
      this.add = vi.fn(panorama => {
        if (this.disposed) throw new Error('A disposed PANOLENS viewer was reused');
        this.panorama = panorama;
      });
      this.remove = vi.fn();
      this.setPanorama = vi.fn(panorama => {
        if (this.disposed) throw new Error('A disposed PANOLENS viewer was reused');
        this.panorama = panorama;
      });
      this.dispose = vi.fn(() => { this.disposed = true; });
      this.destroy = vi.fn(() => { this.disposed = true; });
      viewers.push(this);
    }
  }

  window.PANOLENS = { ImagePanorama, Viewer };
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
