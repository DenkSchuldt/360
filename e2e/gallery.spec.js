import { expect, test } from '@playwright/test';

// Instrument the real vendor constructors to observe resource lifecycle. Nothing
// in the renderer, image loading, React, router, or dialog is mocked.
test.beforeEach(async ({ page }) => {
  await page.route('**/libs/panolens.min.js', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: `${await response.text()}
      window.__galleryViewers = [];
      window.__galleryPanoramas = [];
      const OriginalViewer = window.PANOLENS.Viewer;
      window.PANOLENS.Viewer = class extends OriginalViewer {
        constructor(options) {
          super(options);
          window.__galleryViewers.push(this);
          this.widget?.fullscreenElement?.setAttribute('data-testid', 'panorama-fullscreen');
        }
      };
      const OriginalPanorama = window.PANOLENS.ImagePanorama;
      window.PANOLENS.ImagePanorama = class extends OriginalPanorama {
        constructor(source) {
          super(source);
          this.addEventListener('load', () => { this.testLoaded = true; });
          window.__galleryPanoramas.push(this);
        }
      };
    ` });
  });
});

async function expectLoadedPanorama(page) {
  await page.waitForFunction(() => {
    const panorama = window.__galleryPanoramas?.at(-1);
    return panorama?.testLoaded && panorama.material?.map?.image?.width > 0;
  });
  await expect(page.locator('.my-vwr canvas')).toHaveCount(1);
}

test('loads real panoramas, navigates, filters, and keeps the dialog usable', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('?id=1595694311865&source=smoke');
  await expect(page.getByRole('heading', { name: 'Aventuras en 360º' })).toBeVisible();
  await expectLoadedPanorama(page);
  await expect(page.locator('.my-vwr-header strong')).toHaveText('Alausí');
  await page.screenshot({ path: test.info().outputPath('gallery.png') });
  const fullscreen = page.getByTestId('panorama-fullscreen');
  if (test.info().project.name === 'mobile') await fullscreen.tap();
  else await fullscreen.click();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement?.id)).toBe('myVwr');
  await expect(page.getByRole('link', { name: 'Ver ubicación en el mapa' })).toBeVisible();
  await page.evaluate(() => document.exitFullscreen());

  await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await expect(page.locator('.my-vwr-header strong')).toHaveText('Nariz del Diablo');
  await expectLoadedPanorama(page);
  await expect(page).toHaveURL(/id=1595694311864/);
  await expect(page).toHaveURL(/source=smoke/);

  await page.getByRole('button', { name: 'Filtrar por hashtags' }).click();
  const dialog = page.locator('.dnk-dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByText('#Chimborazo', { exact: true }).click();
  await dialog.getByRole('button', { name: 'Aplicar', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('spinbutton', { name: 'Número de panorama' })).toHaveAttribute('max', '5');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('my-tags')))).toEqual(['Chimborazo']);
  await expect(page.locator('.my-vwr-header strong')).toHaveText('Nariz del Diablo');

  await page.getByRole('button', { name: 'Filtrar por hashtags' }).click();
  await dialog.getByText('#Ecuador', { exact: true }).click();
  await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('my-tags')))).toEqual(['Chimborazo']);

  await page.getByRole('button', { name: 'Filtrar por hashtags' }).click();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await page.reload();
  await expectLoadedPanorama(page);
  await expect(page.locator('.my-vwr-header strong')).toHaveText('Nariz del Diablo');
  await expect(page.getByRole('spinbutton', { name: 'Número de panorama' })).toHaveValue('2');
  expect(errors).toEqual([]);
});

test('rapid navigation leaves one canvas and loads the final panorama', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('');
  for (let index = 0; index < 4; index++) {
    await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  }
  await expectLoadedPanorama(page);
  await expect(page.getByRole('spinbutton', { name: 'Número de panorama' })).toHaveValue('5');
  expect(await page.evaluate(() => window.__galleryViewers.length)).toBe(1);
  expect(errors).toEqual([]);
});
