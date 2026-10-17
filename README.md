
# Aventuras en 360

I created this project to show the touristic places I've been in with a 360º view. All pictures featured are mine and taken by myself, sometimes with a phone, others with a 360 camera.

<img
  src="https://github.com/DenkSchuldt/360/blob/master/portrait.png?raw=true"
  alt="Image showing the Quilotoa lagoon, in Ecuador"/>

I really hope you find this site inspiring. Enjoy it!


## Run locally

Use Node.js 24 LTS (see `.nvmrc`) and npm. The committed lockfile makes installs
reproducible.

```sh
npm ci
npm start
```

Open `http://localhost:5173/360/`. The application still uses the original photos,
layout, Spanish labels and panorama controls.

## Checks

```sh
npm run check             # Component/lifecycle tests and production build
npx playwright install chromium
npm run test:e2e          # Real panoramas in desktop and mobile Chromium
npm audit
```

The browser tests require the production build from `npm run build`. They check
real image loading, the single live viewer, navigation, filtering and the actual
published dialog. GitHub CI runs these checks on every pull request.

## Build and deployment

```sh
npm run build
npm run preview
```

`build/` is a complete static site, including `public/images/` and the bundled
Three.js renderer. The default `/360/` base preserves GitHub project-page URLs. For a
custom domain served from its root, build with `npm run build -- --base=/`.
The router and image URLs follow the configured base automatically.

Deployment is deliberately separate from checks. To publish manually to the
existing GitHub Pages branch, use a separate checkout of `gh-pages`, replace its
site files with the contents of `build/`, preserve any existing `CNAME`, review
the diff, then commit and push that branch when you intend to publish. For a
static hosting service, upload the contents of `build/` as the site's root.
Do not upload source files or `node_modules`. No command in this project deploys
or publishes automatically.

The old `gh-pages` npm helper was removed because its current release has an
unpatched transitive vulnerability. See [modernization notes](docs/modernization.md)
for dependency changes and the native Three.js panorama engine.
