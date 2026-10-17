import {
  BackSide,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const MIN_FOV = 30;
const MAX_FOV = 120;
const IDLE_DELAY = 10000;

export function createPanoramaViewer(container) {
  const renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const canvas = renderer.domElement;
  canvas.className = 'panorama-canvas';
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute(
    'aria-label',
    'Foto panorámica 360. Arrastra para explorar; usa las flechas y los controles para acercar.',
  );
  container.append(canvas);

  const scene = new Scene();
  const camera = new PerspectiveCamera(65, 1, 1, 11000);
  camera.position.set(500, -100, 1);
  const geometry = new SphereGeometry(5000, 60, 40);
  const material = new MeshBasicMaterial({ side: BackSide });
  const sphere = new Mesh(geometry, material);
  sphere.scale.x = -1;
  sphere.visible = false;
  scene.add(sphere);

  const controls = new OrbitControls(camera, canvas);
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.touches.TWO = null;
  controls.rotateSpeed = -0.45;
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.autoRotateSpeed = 1;
  controls.autoRotate = true;
  controls.update();

  let destroyed = false;
  let animationFrame;
  let lastTime;
  let resumeTimer;
  let rotationEnabled = true;
  let disposeLoad;
  let generation = 0;
  const pointers = new Map();
  let pinchDistance;
  const disposedTextures = new WeakSet();
  const disposeTexture = texture => {
    if (texture && !disposedTextures.has(texture)) {
      disposedTextures.add(texture);
      texture.dispose();
    }
  };

  function pauseRotation() {
    controls.autoRotate = false;
    clearTimeout(resumeTimer);
    resumeTimer = undefined;
  }
  function resumeAfterIdle() {
    pauseRotation();
    if (!destroyed && rotationEnabled && pointers.size === 0) {
      resumeTimer = setTimeout(() => {
        resumeTimer = undefined;
        if (!destroyed) controls.autoRotate = rotationEnabled;
      }, IDLE_DELAY);
    }
  }
  function zoomBy(delta) {
    if (destroyed) return;
    camera.fov = MathUtils.clamp(camera.fov + delta, MIN_FOV, MAX_FOV);
    camera.updateProjectionMatrix();
    resumeAfterIdle();
  }
  function pointerDown(event) {
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    pinchDistance = getPinchDistance();
    pauseRotation();
    canvas.focus({ preventScroll: true });
  }
  function getPinchDistance() {
    if (pointers.size !== 2) return undefined;
    const [a, b] = [...pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
  function pointerMove(event) {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const distance = getPinchDistance();
    if (pinchDistance > 0 && distance > 0) {
      zoomBy(
        MathUtils.radToDeg(
          2 *
            Math.atan(
              (Math.tan(MathUtils.degToRad(camera.fov) / 2) * pinchDistance) /
                distance,
            ),
        ) - camera.fov,
      );
    }
    pinchDistance = distance;
  }
  function pointerUp(event) {
    pointers.delete(event.pointerId);
    pinchDistance = getPinchDistance();
    resumeAfterIdle();
  }
  function wheel(event) {
    event.preventDefault();
    const pixels =
      event.deltaY *
      (event.deltaMode === 1
        ? 16
        : event.deltaMode === 2
          ? canvas.clientHeight
          : 1);
    zoomBy(MathUtils.clamp(pixels * 0.05, -10, 10));
  }
  function keyDown(event) {
    const angle = MathUtils.degToRad(3);
    const actions = {
      ArrowLeft: () => controls.rotateLeft(-angle),
      ArrowRight: () => controls.rotateLeft(angle),
      ArrowUp: () => controls.rotateUp(-angle),
      ArrowDown: () => controls.rotateUp(angle),
      '+': () => zoomBy(-5),
      '=': () => zoomBy(-5),
      '-': () => zoomBy(5),
    };
    if (actions[event.key]) {
      event.preventDefault();
      resumeAfterIdle();
      actions[event.key]();
    }
  }
  canvas.addEventListener('pointerdown', pointerDown);
  canvas.addEventListener('pointermove', pointerMove);
  canvas.addEventListener('pointerup', pointerUp);
  canvas.addEventListener('pointercancel', pointerUp);
  canvas.addEventListener('lostpointercapture', pointerUp);
  canvas.addEventListener('wheel', wheel, { passive: false });
  canvas.addEventListener('keydown', keyDown);

  function resize() {
    if (destroyed) return;
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }
  const observer =
    typeof ResizeObserver === 'undefined'
      ? undefined
      : new ResizeObserver(resize);
  observer?.observe(container);
  window.addEventListener('resize', resize);
  resize();

  function animate(time) {
    if (destroyed) return;
    const delta =
      lastTime === undefined ? 0 : Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;
    controls.update(delta);
    renderer.render(scene, camera);
    animationFrame = requestAnimationFrame(animate);
  }
  function visibilityChange() {
    cancelAnimationFrame(animationFrame);
    lastTime = undefined;
    if (!document.hidden && !destroyed)
      animationFrame = requestAnimationFrame(animate);
  }
  document.addEventListener('visibilitychange', visibilityChange);
  animationFrame = requestAnimationFrame(animate);

  return {
    load(src, onProgress = () => {}, onError = () => {}) {
      if (destroyed)
        throw new Error('Cannot load a panorama into a disposed viewer.');
      disposeLoad?.();
      const currentGeneration = ++generation;
      let cancelled = false;
      let texture;
      const isCurrent = () =>
        !destroyed && !cancelled && generation === currentGeneration;
      container.dataset.panoramaState = 'loading';
      delete container.dataset.panoramaSource;
      onProgress(0);
      const cleanup = () => {
        if (cancelled) return;
        cancelled = true;
        if (material.map === texture) {
          material.map = null;
          sphere.visible = false;
        }
        disposeTexture(texture);
        if (disposeLoad === cleanup) disposeLoad = undefined;
      };
      disposeLoad = cleanup;
      texture = new TextureLoader().load(
        src,
        loadedTexture => {
          if (!isCurrent()) {
            disposeTexture(loadedTexture);
            return;
          }
          loadedTexture.colorSpace = SRGBColorSpace;
          material.map = loadedTexture;
          material.needsUpdate = true;
          sphere.visible = true;
          renderer.render(scene, camera);
          container.dataset.panoramaState = 'ready';
          container.dataset.panoramaSource = src;
          onProgress(undefined);
        },
        event => {
          if (isCurrent() && event.total > 0) {
            onProgress(Math.min(99, (event.loaded / event.total) * 100));
          }
        },
        () => {
          if (!isCurrent()) return;
          container.dataset.panoramaState = 'error';
          onProgress(undefined);
          onError(
            'No se pudo cargar esta foto. Reintenta o elige otra panorámica.',
          );
        },
      );
      return cleanup;
    },
    zoomBy,
    setAutoRotate(enabled) {
      if (destroyed) return;
      rotationEnabled = enabled;
      pauseRotation();
      controls.autoRotate = enabled && pointers.size === 0;
    },
    dispose() {
      if (destroyed) return;
      destroyed = true;
      disposeLoad?.();
      pauseRotation();
      cancelAnimationFrame(animationFrame);
      observer?.disconnect();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', visibilityChange);
      canvas.removeEventListener('pointerdown', pointerDown);
      canvas.removeEventListener('pointermove', pointerMove);
      canvas.removeEventListener('pointerup', pointerUp);
      canvas.removeEventListener('pointercancel', pointerUp);
      canvas.removeEventListener('lostpointercapture', pointerUp);
      canvas.removeEventListener('wheel', wheel);
      canvas.removeEventListener('keydown', keyDown);
      pointers.clear();
      controls.dispose();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
      delete container.dataset.panoramaState;
      delete container.dataset.panoramaSource;
    },
  };
}
