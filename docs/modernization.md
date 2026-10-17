# Dependency modernization

Stable npm releases verified on 2026-10-17. `package-lock.json` records the full
resolved dependency graph. Run `npm ci` rather than deleting the lockfile.

## Runtime

| Package | Previous range | Updated range |
| --- | --- | --- |
| lucide-react | external Font Awesome kit | ^1.59.0 |
| React / React DOM | ^16.13.1 | ^19.3.1 |
| @denkschuldt/react-dialog | ^1.0.3 | ^2.0.0 |
| dayjs | ^1.10.4 | ^1.11.23 |
| framer-motion | ^4.1.11 | ^14.3.0 |
| react-circular-progressbar | ^2.0.4 | ^2.2.0 |
| react-router-dom | ^5.2.0 | ^7.18.4 |

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
  social links use CodeXml, MessageCircle and Camera with explicit titles and
  accessible names; map, navigation, pin and filter controls use matching Lucide
  symbols. No icon kit, icon font, or Font Awesome dependency remains.
- Remove the `gh-pages` deploy helper and deploy scripts. Latest 6.3.0 pulls in
  `braces` through `globby`/`fast-glob`/`micromatch`, with the unpatched advisory
  [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
  The static output and safe manual deployment instructions remain available.
- Commit a lockfile, specify supported Node versions, and add read-only CI checks.

The Node range reflects the current test tools: Node 22.22.2+, 24.15.0+, or 26+.
Node 24 LTS is the recommended development/CI version.

## Retained panorama engine

The existing files `public/libs/panolens.min.js` and `public/libs/three.min.js`
are vendored browser globals, not npm dependencies. They are intentionally
unchanged in this update so the original controls and image renderer remain
intact. PANOLENS 0.11.0 declares THREE revision 105, while this repository already
bundles THREE revision 117. Updating THREE independently would require a separate
renderer compatibility migration, not just a version bump.

A small lifecycle adapter now keeps one viewer per mounted viewport, replaces
only panoramas, tears down its canvas/controls/renderer on unmount, and protects
against late image callbacks after disposal. React StrictMode replay no longer
reuses a disposed viewer or duplicates canvases. The overlay allows pointer
interaction with the panorama beneath it.

Known vendor limitation: this old PANOLENS build does not correctly remove all
of its fullscreen/device-orientation global listeners. The adapter cleans up
resources exposed by its public API, but does not rewrite the minified vendor
files or claim to fix those legacy listener leaks. The gallery mounts one
viewport and reuses it while navigating; a future renderer migration should
address this upstream limitation.

## Validation

- Component integration tests use real React, Motion and `react-dialog`; only
  the WebGL renderer is mocked in jsdom.
- Adapter regression tests also exercise the actual vendored ImagePanorama and
  THREE implementation for delayed image loads and cleanup ordering.
- Playwright checks real WebGL/image rendering and user flows on desktop and
  mobile Chromium. CI has the complete original photo collection.
- No changes to photos, visual identity, production hosting or publication.
