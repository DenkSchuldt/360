/**
 * Lifecycle adapter for the legacy, vendored PANOLENS renderer.
 * Keep one adapter per mounted viewport and replace only its panorama.
 */
export function createPanoramaViewer(container) {
  const existingNodes = new Set(container.childNodes);
  const viewer = new window.PANOLENS.Viewer({
    container,
    cameraFov: 65,
    autoRotate: true,
    autoRotateSpeed: 1,
    autoRotateActivationDuration: 10000,
    controlButtons: ['fullscreen', 'setting'],
  });
  const ownedNodes = [...container.childNodes].filter(node => !existingNodes.has(node));
  viewer.getCamera().translateX(500);
  viewer.getCamera().translateY(-100);

  let destroyed = false;
  let disposeCurrentPanorama;

  return {
    load(src, onProgress = () => {}) {
      if (destroyed) {
        throw new Error('Cannot load a panorama into a disposed viewer.');
      }
      disposeCurrentPanorama?.();

      const panorama = new window.PANOLENS.ImagePanorama(src);
      let disposed = false;
      const originalOnLoad = panorama.onLoad.bind(panorama);
      const originalDispatchEvent = panorama.dispatchEvent.bind(panorama);

      // PANOLENS cannot cancel its image request. A late callback must not write
      // into the material nulled by dispose(), or leak its newly loaded texture.
      panorama.onLoad = texture => {
        if (disposed) {
          texture.dispose();
          return;
        }
        originalOnLoad(texture);
      };
      // onLoad also schedules an untracked RAF. Suppress its eventual load event
      // after cleanup so it cannot restart the disposed panorama's fade tween.
      panorama.dispatchEvent = event => {
        if (!disposed) originalDispatchEvent(event);
      };

      const handleEnter = () => onProgress(0);
      const handleProgress = ({ progress }) => {
        if (progress.total > 0) {
          const percent = Math.min(100, progress.loaded / progress.total * 100);
          onProgress(percent === 100 ? undefined : percent);
        }
      };
      const handleComplete = () => onProgress(undefined);
      panorama.addEventListener('enter', handleEnter);
      panorama.addEventListener('progress', handleProgress);
      panorama.addEventListener('load', handleComplete);
      panorama.addEventListener('error', handleComplete);

      const disposePanorama = () => {
        if (disposed) return;
        panorama.removeEventListener('enter', handleEnter);
        panorama.removeEventListener('progress', handleProgress);
        panorama.removeEventListener('load', handleComplete);
        panorama.removeEventListener('error', handleComplete);
        // dispose() removes the panorama from its scene and notifies the viewer.
        // Keep dispatch enabled until that synchronous notification has fired.
        panorama.dispose();
        disposed = true;
        if (disposeCurrentPanorama === disposePanorama) {
          disposeCurrentPanorama = undefined;
        }
      };
      disposeCurrentPanorama = disposePanorama;
      viewer.add(panorama);
      viewer.setPanorama(panorama);
      return disposePanorama;
    },

    dispose() {
      if (destroyed) return;
      destroyed = true;
      disposeCurrentPanorama?.();
      viewer.disableAutoRate();
      viewer.unregisterMouseAndTouchEvents();
      viewer.reticle?.end();
      viewer.controls.forEach(control => control.dispose());
      // Unlike dispose(), destroy() also cancels the viewer's animation frame.
      // The panorama is already detached, so it will not be disposed twice.
      viewer.destroy();
      const renderer = viewer.getRenderer();
      renderer.dispose();
      renderer.forceContextLoss?.();
      ownedNodes.forEach(node => {
        if (node.parentNode === container) container.removeChild(node);
      });
    },
  };
}
