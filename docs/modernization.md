# Dependency modernization

Stable npm releases verified on 2026-10-17. `package-lock.json` records the full
resolved dependency graph. Run `npm ci` rather than deleting the lockfile.

## Runtime

| Package                    | Previous range            | Updated range |
| -------------------------- | ------------------------- | ------------- |
| lucide-react               | external Font Awesome kit | ^1.59.0       |
| React / React DOM          | ^16.13.1                  | ^19.3.1       |
| @denkschuldt/react-dialog  | ^1.0.3                    | ^2.0.0        |
| dayjs                      | ^1.10.4                   | ^1.11.23      |
| framer-motion              | ^4.1.11                   | ^14.3.0       |
| react-circular-progressbar | ^2.0.4                    | ^2.2.0        |
| react-router-dom           | ^5.2.0                    | ^7.18.4       |

`react-dialog` 2.0.0 is the published npm release and declares React 19 support.
The old text inside its packaged README still says unpublished; the registry
metadata and installed package are authoritative. The documentation-only 2.0.1
source change is not used as a dependency until it is published.

- Replace removed `ReactDOM.render` with `createRoot` and the modern JSX transform.
- Replace the removed router history API with search parameters, preserving
  shared IDs, unrelated query parameters, and saved selection.
- Keep selected panoramas consistent when filters change. Ignore malformed or
  obsolete saved tags instead of rendering an empty, broken viewer.
- Replace Motion's removed `layoutTransition` prop with `layout`.
- Retain the dialog's public API and add explicit Cancel/Escape dismissal without
  applying draft tags.

## Development tools

- Replace retired Create React App (`react-scripts` 3.4.1) with Vite 8.3.4 and
  @vitejs/plugin-react 6.1.2. JSX entry points now use `.jsx` extensions.
- Replace end-of-life native `node-sass` with Dart Sass 1.105.2.
- Update Testing Library and add Vitest 5.0.5, jsdom 30.1.3 and Playwright 1.64.1.
- Move testing/build packages out of runtime dependencies.
- Remove unused `react-window`; no code imported it.
- Remove unused Facebook, Twitter-widget and GitHub-button SDK scripts from the
  HTML entry. The existing social-profile links remain.
- Replace Font Awesome entirely with local Lucide React SVG icons, as requested.
  Real-browser tests exposed that unavailable kit requests made the icon-only
  map/filter controls invisible. Lucide 1 does not ship brand logos, so the same
  social links now use three local, monochrome GitHub/X/Instagram SVG icons from
  Simple Icons with explicit accessible names; map, navigation, pin and filter
  controls keep Lucide symbols. Brand-source and license notes are stored beside
  the SVG assets. No icon kit, icon font, or Font Awesome dependency remains.
- Remove the `gh-pages` deploy helper and deploy scripts. Latest 6.3.0 pulls in
  `braces` through `globby`/`fast-glob`/`micromatch`, with the unpatched advisory
  [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
  The static output and safe manual deployment instructions remain available.
- Commit a lockfile, specify supported Node versions, and add read-only CI checks.

The Node range reflects the current test tools: Node 22.22.2+, 24.15.0+, or 26+.
Node 24 LTS is the recommended development/CI version.

## Native Three.js panorama engine

The follow-on engine migration replaces vendored PANOLENS 0.11.0 / THREE r117
with the published `three` 0.186.1 npm release (verified 2026-10-17). PANOLENS
expected THREE r105, and even its latest 0.12.1 npm package depends on
`three ^0.105.2`. Its official repository has been archived since June 2023.
This is a maintenance/compatibility decision, not a claim of a known vendor
security vulnerability.

The photo-only gallery does not need PANOLENS hotspots, tours or video support.
It now follows Three's [official panorama example](https://threejs.org/examples/webgl_panorama_equirectangular.html):
an inward-viewed sphere, equirectangular photo texture, perspective camera and
first-party OrbitControls. The initial photo orientation and 65° field of view
are preserved, as are navigation, filtering, map links and the React UI.

- Mouse/touch drag rotates the panorama; wheel and two-finger pinch change FOV
  between 30° and 120°, rather than moving the camera outside the sphere.
- Accessible Lucide controls provide zoom and autorotation pause/resume.
  The fullscreen button was removed after the requested iPhone preview review.
  Focus the panorama to use arrow keys and +/-.
- Autorotation is frame-rate independent and resumes 10 seconds after
  interaction. It can be explicitly paused. Hidden tabs stop the render loop.
- A single canvas/renderer is reused across photos. Stale texture callbacks are
  ignored and disposed. Unmount disposes textures, material, geometry, renderer,
  controls, observers, listeners, idle timers and animation frames.
- Scope navigation-button CSS to direct children of main so it cannot overlap
  the new toolbar. Center the date/hashtag/plus row and keep 44px controls clear
  of the mobile footer.
- Image failures offer a retry; unsupported WebGL 2 browsers receive an
  explanatory message instead of a blank viewer.
- The user chose the simple normal panorama experience. The old PANOLENS
  sensor/Cardboard/stereoscopic settings menu is not part of this implementation;
  no device-motion permission is requested and no VR/headset support is claimed.
- Current Three requires WebGL 2. This intentionally drops the legacy WebGL 1
  renderer path. The browser tests cover current Chromium desktop/mobile;
  physical iOS/Android sensor/headset behavior is outside this scope.

### Mobile viewport and drag follow-up

The app uses the dynamic viewport height (`100dvh`, with a `100vh` fallback),
flexes its photo area below the app bar, and keeps the panorama edge-to-edge on
phones in portrait and landscape. `viewport-fit=cover` lets the background fill
the screen while safe-area insets keep interactive controls clear of the notch
and home indicator. The app cannot control Safari’s own toolbar or background.

OrbitControls rotation speed changes from -0.15 to -0.45: the same pointer travel
rotates three times farther in the same direction. A 100px horizontal drag in a
400px-high viewer changes the azimuth by 40.5° instead of 13.5°. Pinch, wheel,
zoom buttons, field-of-view limits and autorotation speed are unchanged.
Mouse and touch regressions assert the angle and unchanged camera distance/FOV.

### Memory ownership

Changing photos detaches and disposes the previous GPU texture before loading
its replacement; the scene, sphere geometry, material, renderer and canvas are
reused. Late callbacks from superseded loads cannot attach a stale texture.
This does not cancel an already-started image download or force browser image
cache/decoded-image memory to disappear immediately. Browser-managed memory and
transient decoding allocations are distinct from retained WebGL resources.

Three is MIT licensed; its notice is included in `public/third-party-licenses/`.
There is no panorama-viewer service or license fee. Removing the vendored global
scripts brings the engine into the npm lockfile and normal dependency auditing.

## Validation

- Component integration tests use real React, Motion and `react-dialog`; only
  the WebGL renderer is mocked in jsdom.
- Adapter regression tests exercise real Three geometry/camera/OrbitControls,
  with only WebGL and image I/O mocked for deterministic jsdom checks.
- Playwright checks real WebGL/image rendering and user flows on desktop and
  mobile Chromium. It also observes actual texture creation/deletion through six
  sequential photo changes; this measures retained resource counts, not heap/RAM.
  Unit regressions cover fifty replacements and final teardown. CI has the
  complete original photo collection.
- No changes to photos, visual identity, production hosting or publication.
