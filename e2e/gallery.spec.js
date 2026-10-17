import { expect, test } from '@playwright/test';

// Observe actual GPU texture uploads; the renderer, image loading and React
// remain real. This also catches successful requests that never reach WebGL.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__galleryTextureUploads = [];
    window.__galleryContexts = new Set();
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (...args) {
      const result = originalGetContext.apply(this, args);
      if (args[0] === 'webgl2' && result) window.__galleryContexts.add(result);
      return result;
    };
    for (const method of ['texImage2D', 'texSubImage2D']) {
      const original = WebGL2RenderingContext.prototype[method];
      WebGL2RenderingContext.prototype[method] = function (...args) {
        const source = args.at(-1);
        if (source instanceof HTMLImageElement && source.naturalWidth > 0) {
          window.__galleryTextureUploads.push({ source: source.src, width: source.naturalWidth });
        } else if ((source instanceof HTMLCanvasElement || (typeof OffscreenCanvas !== 'undefined' && source instanceof OffscreenCanvas)) && source.width > 0) {
          // Three can resize photos larger than the GPU's maximum texture size.
          window.__galleryTextureUploads.push({ source: 'resized-photo', width: source.width });
        }
        return original.apply(this, args);
      };
    }
  });
});

async function expectLoadedPanorama(page) {
  await expect(page.locator('.my-vwr')).toHaveAttribute('data-panorama-state', 'ready');
  await expect.poll(() => page.evaluate(() => {
    const source = document.querySelector('.my-vwr')?.dataset.panoramaSource;
    return Boolean(source && window.__galleryTextureUploads.some(upload => (upload.source.endsWith(source) || upload.source === 'resized-photo') && upload.width > 0));
  }), { message: 'Expected the loaded photo to reach a real GPU texture' }).toBe(true);
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
  const fullscreen = page.getByRole('button', { name: 'Pantalla completa', exact: true });
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
  expect(await page.evaluate(() => window.__galleryContexts.size)).toBe(1);
  expect(errors).toEqual([]);
});


test('supports drag, touch, zoom and paused autorotation without changing photos', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('?id=1595694311865');
  await expectLoadedPanorama(page);
  await page.getByRole('button', { name: 'Pausar autorrotación' }).click();
  const canvas = page.locator('.panorama-canvas');
  const bounds = await canvas.boundingBox();
  const x = bounds.x + bounds.width * 0.5;
  const y = bounds.y + bounds.height * 0.5;
  // Let any autorotation damping settle, then compare actual rendered pixels.
  await page.waitForTimeout(400);
  const before = await canvas.screenshot();
  if (test.info().project.name === 'mobile') {
    const session = await page.context().newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let step = 1; step <= 8; step++) {
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + step * 12, y: y + step * 3 }] });
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(300);
    expect((await canvas.screenshot()).equals(before)).toBe(false);
    const beforePinch = await canvas.screenshot();
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x - 25, y }, { x: x + 25, y }] });
    for (let step = 1; step <= 5; step++) {
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - 25 - step * 8, y }, { x: x + 25 + step * 8, y }] });
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(300);
    expect((await canvas.screenshot()).equals(beforePinch)).toBe(false);
  } else {
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 120, y + 30, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(300);
    expect((await canvas.screenshot()).equals(before)).toBe(false);
    const beforeZoom = await canvas.screenshot();
    await page.mouse.wheel(0, -180);
    await page.waitForTimeout(300);
    expect((await canvas.screenshot()).equals(beforeZoom)).toBe(false);
  }
  await page.getByRole('button', { name: 'Acercar', exact: true }).click();
  await page.getByRole('button', { name: 'Alejar', exact: true }).click();
  await page.getByRole('button', { name: 'Activar autorrotación' }).click();
  await expect(page.getByRole('button', { name: 'Pausar autorrotación' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.my-vwr-header strong')).toHaveText('Alausí');
  await expect(page).toHaveURL(/id=1595694311865/);
  expect(await page.evaluate(() => window.__galleryContexts.size)).toBe(1);
  expect(errors).toEqual([]);
});

test('recovers from a failed image load and replaces an interrupted load', async ({ page }) => {
  let failFirst = true;
  await page.route('**/images/**', async route => {
    if (failFirst) {
      failFirst = false;
      await route.abort();
    } else await route.continue();
  });
  await page.goto('?id=1595694311865');
  await expect(page.getByRole('alert')).toContainText('No se pudo cargar esta foto');
  await page.getByRole('button', { name: 'Reintentar' }).click();
  await expectLoadedPanorama(page);
  await expect(page.getByRole('alert')).toHaveCount(0);
  for (let index = 0; index < 5; index++) await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await expectLoadedPanorama(page);
  await expect(page.getByRole('spinbutton', { name: 'Número de panorama' })).toHaveValue('6');
  await expect(page.locator('.panorama-canvas')).toHaveCount(1);
  expect(await page.evaluate(() => window.__galleryContexts.size)).toBe(1);
});
