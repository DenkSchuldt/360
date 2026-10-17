
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

`build/` is a complete static site, including `public/images/` and the vendored
renderer. The default `/360/` base preserves GitHub project-page URLs. For a
custom domain served from its root, build with `npm run build -- --base=/`.
The router and image URLs follow the configured base automatically.

### GitHub Pages

After this workflow is merged, pushes to `master` run the component/lifecycle
checks, production build, high-severity dependency audit, and desktop/mobile
browser tests in **Check gallery**. Only after these checks succeed does the
workflow upload its exact `build/` output. The dependent deployment job publishes
that same artifact to GitHub Pages.
Pull requests and forks never deploy. There is no rebuild in the deployment job,
no personal access token, and no npm publishing/deployment helper.

Before enabling the first deployment, a repository administrator must verify
**Settings → Pages → Build and deployment → Source: GitHub Actions**.
The current source setting has not been verified; adding this workflow does not
change it. If the `github-pages` environment has protection rules, allow `master`
and satisfy any required approvals. See the
[GitHub Pages setup documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site#publishing-with-a-custom-github-actions-workflow).
Review and intentionally merge the deployment PR only when ready to publish.

The site keeps its `/360/` base and
[existing project-page URL](https://denkschuldt.github.io/360/). The workflow does
not update the legacy `gh-pages` branch. Master runs are serialized, while newer
PR updates cancel obsolete PR checks. If more validation jobs are added later,
include them in the deployment job's `needs` before relying on them as gates.

For another static hosting service, upload the contents of `build/` as the site's
root. Do not upload source files or `node_modules`.

The old `gh-pages` npm helper was removed because its current release has an
unpatched transitive vulnerability. See [modernization notes](docs/modernization.md)
for dependency changes and the retained panorama-engine limitation.
