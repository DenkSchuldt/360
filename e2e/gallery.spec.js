import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__galleryTextureUploads = [];
    window.__galleryContexts = new Set();
    window.__galleryActiveTextures = new Set();
    window.__galleryTextureDeletes = 0;
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (...args) {
      const result = originalGetContext.apply(this, args);
      if (args[0] === 'webgl2' && result) window.__galleryContexts.add(result);
      return result;
    };
    const originalCreateTexture =
      WebGL2RenderingContext.prototype.createTexture;
    WebGL2RenderingContext.prototype.createTexture = function (...args) {
      const texture = originalCreateTexture.apply(this, args);
      if (texture) window.__galleryActiveTextures.add(texture);
      return texture;
    };
    const originalDeleteTexture =
      WebGL2RenderingContext.prototype.deleteTexture;
    WebGL2RenderingContext.prototype.deleteTexture = function (texture) {
      const result = originalDeleteTexture.call(this, texture);
      if (window.__galleryActiveTextures.delete(texture))
        window.__galleryTextureDeletes++;
      return result;
    };
    for (const method of ['texImage2D', 'texSubImage2D']) {
      const original = WebGL2RenderingContext.prototype[method];
      WebGL2RenderingContext.prototype[method] = function (...args) {
        const source = args.at(-1);
        if (source instanceof HTMLImageElement && source.naturalWidth > 0) {
          window.__galleryTextureUploads.push({
            source: source.src,
            width: source.naturalWidth,
          });
        } else if (
          (source instanceof HTMLCanvasElement ||
            (typeof OffscreenCanvas !== 'undefined' &&
              source instanceof OffscreenCanvas)) &&
          source.width > 0
        ) {
          window.__galleryTextureUploads.push({
            source: 'resized-photo',
            width: source.width,
          });
        }
        return original.apply(this, args);
      };
    }
  });
});

async function expectLoadedPanorama(page) {
  await expect(page.locator('.my-vwr')).toHaveAttribute(
    'data-panorama-state',
    'ready',
    { timeout: 15_000 },
  );
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const source =
            document.querySelector('.my-vwr')?.dataset.panoramaSource;
          return Boolean(
            source &&
            window.__galleryTextureUploads.some(
              upload =>
                (upload.source.endsWith(source) ||
                  upload.source === 'resized-photo') &&
                upload.width > 0,
            ),
          );
        }),
      { message: 'Expected the loaded photo to reach a real GPU texture' },
    )
    .toBe(true);
  await expect(page.locator('.my-vwr canvas')).toHaveCount(1);
}

async function expectAlignedControls(page) {
  await expect(page.locator('.social-links .brand-icon')).toHaveCount(3);
  await expect
    .poll(() =>
      page
        .locator('.social-links .brand-icon')
        .evaluateAll(images =>
          images.every(image => image.complete && image.naturalWidth > 0),
        ),
    )
    .toBe(true);
  for (const name of [
    'GitHub de Denny Schuldt',
    'X de Denny Schuldt',
    'Instagram de Denny Schuldt',
  ]) {
    await expect(page.getByRole('link', { name, exact: true })).toBeVisible();
  }
  const centers = await page
    .locator(
      '.my-vwr-footer .dnk-date, .my-vwr-footer .dnk-dot, .dnk-tags > .dnk-tag, .dnk-tags > .dnk-tag:last-child svg',
    )
    .evaluateAll(elements =>
      elements.map(element => {
        const rect = element.getBoundingClientRect();
        return rect.y + rect.height / 2;
      }),
    );
  expect(Math.max(...centers) - Math.min(...centers)).toBeLessThan(1.5);
  const viewport = await page.locator('.my-vwr').boundingBox();
  const buttons = page
    .getByLabel('Controles de panorámica', { exact: true })
    .getByRole('button');
  const controlNames = ['Alejar', 'Acercar', 'Pausar autorrotación'];
  await expect(buttons).toHaveCount(3);
  await expect(
    page.getByRole('button', { name: /pantalla completa/i }),
  ).toHaveCount(0);
  let previousRight = viewport.x;
  for (let index = 0; index < controlNames.length; index++) {
    await expect(buttons.nth(index)).toHaveAccessibleName(controlNames[index]);
    await expect(buttons.nth(index)).toBeVisible();
    const box = await buttons.nth(index).boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.x).toBeGreaterThanOrEqual(previousRight);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.x + viewport.width);
    expect(box.y + box.height).toBeLessThanOrEqual(
      viewport.y + viewport.height,
    );
    previousRight = box.x + box.width;
  }
}

test('loads real panoramas, navigates, filters, and keeps the dialog usable', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('?id=1595694311865&source=smoke');
  await expect(
    page.getByRole('heading', { name: 'Aventuras en 360º' }),
  ).toBeVisible();
  await expectLoadedPanorama(page);
  await expect(page.locator('.my-vwr-header strong')).toHaveText('Alausí');
  await expectAlignedControls(page);
  await page.screenshot({ path: test.info().outputPath('gallery.png') });
  await expect(
    page.getByRole('link', { name: 'Ver ubicación en el mapa' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await expect(page.locator('.my-vwr-header strong')).toHaveText(
    'Nariz del Diablo',
  );
  await expectLoadedPanorama(page);
  await expect(page).toHaveURL(/id=1595694311864/);
  await expect(page).toHaveURL(/source=smoke/);

  await page.getByRole('button', { name: 'Filtrar por hashtags' }).click();
  const dialog = page.locator('.dnk-dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByText('#Chimborazo', { exact: true }).click();
  await dialog.getByRole('button', { name: 'Aplicar', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole('spinbutton', { name: 'Número de panorama' }),
  ).toHaveAttribute('max', '5');
  await expect
    .poll(() =>
      page.evaluate(() => JSON.parse(localStorage.getItem('my-tags'))),
    )
    .toEqual(['Chimborazo']);
  await expect(page.locator('.my-vwr-header strong')).toHaveText(
    'Nariz del Diablo',
  );

  await page.getByRole('button', { name: 'Filtrar por hashtags' }).click();
  await dialog.getByText('#Ecuador', { exact: true }).click();
  await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(() => JSON.parse(localStorage.getItem('my-tags'))),
    )
    .toEqual(['Chimborazo']);

  await page.getByRole('button', { name: 'Filtrar por hashtags' }).click();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await page.reload();
  await expectLoadedPanorama(page);
  await expect(page.locator('.my-vwr-header strong')).toHaveText(
    'Nariz del Diablo',
  );
  await expect(
    page.getByRole('spinbutton', { name: 'Número de panorama' }),
  ).toHaveValue('2');
  expect(errors).toEqual([]);
});

test('rapid navigation leaves one canvas and loads the final panorama', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('');
  for (let index = 0; index < 4; index++) {
    await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  }
  await expectLoadedPanorama(page);
  await expect(
    page.getByRole('spinbutton', { name: 'Número de panorama' }),
  ).toHaveValue('5');
  expect(await page.evaluate(() => window.__galleryContexts.size)).toBe(1);
  expect(errors).toEqual([]);
});

test('releases old GPU textures and keeps a stable resource count across photo changes', async ({
  page,
}) => {
  test.setTimeout(120_000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('?id=1595694311865');
  await expectLoadedPanorama(page);
  const initialTextureCount = await page.evaluate(
    () => window.__galleryActiveTextures.size,
  );
  expect(initialTextureCount).toBeGreaterThan(0);

  for (let index = 0; index < 6; index++) {
    const previousSource = await page
      .locator('.my-vwr')
      .getAttribute('data-panorama-source');
    const previousDeleteCount = await page.evaluate(
      () => window.__galleryTextureDeletes,
    );
    await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
    await expect(page.locator('.my-vwr')).not.toHaveAttribute(
      'data-panorama-source',
      previousSource,
    );
    await expectLoadedPanorama(page);
    await expect
      .poll(() => page.evaluate(() => window.__galleryActiveTextures.size))
      .toBe(initialTextureCount);
    expect(
      await page.evaluate(() => window.__galleryTextureDeletes),
    ).toBeGreaterThan(previousDeleteCount);
    expect(await page.evaluate(() => window.__galleryContexts.size)).toBe(1);
  }

  console.info(
    'GPU texture resources',
    test.info().project.name,
    await page.evaluate(() => ({
      active: window.__galleryActiveTextures.size,
      deleted: window.__galleryTextureDeletes,
      contexts: window.__galleryContexts.size,
    })),
    'initial active:',
    initialTextureCount,
  );
  expect(errors).toEqual([]);
});

test('supports drag, touch, zoom and paused autorotation without changing photos', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('?id=1595694311865');
  await expectLoadedPanorama(page);
  await page.getByRole('button', { name: 'Pausar autorrotación' }).click();
  await expect(
    page.getByRole('button', { name: 'Activar autorrotación' }),
  ).toHaveAttribute('aria-pressed', 'false');
  const canvas = page.locator('.panorama-canvas');
  const bounds = await canvas.boundingBox();
  const x = bounds.x + bounds.width * 0.5;
  const y = bounds.y + bounds.height * 0.5;
  await page.waitForTimeout(400);
  const before = await canvas.screenshot();
  if (test.info().project.name === 'mobile') {
    const session = await page.context().newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x, y }],
    });
    for (let step = 1; step <= 8; step++) {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: x + step * 12, y: y + step * 3 }],
      });
    }
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
    await page.waitForTimeout(300);
    expect((await canvas.screenshot()).equals(before)).toBe(false);
    const beforePinch = await canvas.screenshot();
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [
        { x: x - 25, y },
        { x: x + 25, y },
      ],
    });
    for (let step = 1; step <= 5; step++) {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [
          { x: x - 25 - step * 8, y },
          { x: x + 25 + step * 8, y },
        ],
      });
    }
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
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
  const beforeButtonZoom = await canvas.screenshot();
  await page.getByRole('button', { name: 'Alejar', exact: true }).click();
  await expect
    .poll(async () => (await canvas.screenshot()).equals(beforeButtonZoom))
    .toBe(false);
  const afterZoomOut = await canvas.screenshot();
  await page.getByRole('button', { name: 'Acercar', exact: true }).click();
  await expect
    .poll(async () => (await canvas.screenshot()).equals(afterZoomOut))
    .toBe(false);
  await page.getByRole('button', { name: 'Activar autorrotación' }).click();
  await expect(
    page.getByRole('button', { name: 'Pausar autorrotación' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.my-vwr-header strong')).toHaveText('Alausí');
  await expect(page).toHaveURL(/id=1595694311865/);
  expect(await page.evaluate(() => window.__galleryContexts.size)).toBe(1);
  expect(errors).toEqual([]);
});

test('recovers from a failed image load and replaces an interrupted load', async ({
  page,
}) => {
  let failFirst = true;
  await page.route('**/images/**', async route => {
    if (failFirst) {
      failFirst = false;
      await route.abort();
    } else await route.continue();
  });
  await page.goto('?id=1595694311865');
  await expect(page.getByRole('alert')).toContainText(
    'No se pudo cargar esta foto',
  );
  await page.getByRole('button', { name: 'Reintentar' }).click();
  await expectLoadedPanorama(page);
  await expect(page.getByRole('alert')).toHaveCount(0);
  for (let index = 0; index < 5; index++)
    await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await expectLoadedPanorama(page);
  await expect(
    page.getByRole('spinbutton', { name: 'Número de panorama' }),
  ).toHaveValue('6');
  await expect(page.locator('.panorama-canvas')).toHaveCount(1);
  expect(await page.evaluate(() => window.__galleryContexts.size)).toBe(1);
});
