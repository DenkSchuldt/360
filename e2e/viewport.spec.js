import { expect, test } from '@playwright/test';

test.setTimeout(90_000);

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__viewportTextureUploads = 0;
    for (const method of ['texImage2D', 'texSubImage2D']) {
      const original = WebGL2RenderingContext.prototype[method];
      WebGL2RenderingContext.prototype[method] = function (...args) {
        const source = args.at(-1);
        const isPhoto =
          source instanceof HTMLImageElement && source.naturalWidth > 0;
        const isResizedPhoto =
          (source instanceof HTMLCanvasElement ||
            (typeof OffscreenCanvas !== 'undefined' &&
              source instanceof OffscreenCanvas)) &&
          source.width > 1 &&
          source.height > 1;
        const result = original.apply(this, args);
        if (isPhoto || isResizedPhoto) window.__viewportTextureUploads++;
        return result;
      };
    }
  });
});

async function loadPanorama(page) {
  await page.goto('?id=1595694311864&source=viewport');
  await expect(page.locator('.my-vwr')).toHaveAttribute(
    'data-panorama-state',
    'ready',
    { timeout: 45_000 },
  );
  await expect
    .poll(() => page.evaluate(() => window.__viewportTextureUploads))
    .toBeGreaterThan(0);
  await expect(page.locator('.my-vwr canvas')).toHaveCount(1);
  await expect(page.locator('.my-vwr-header strong')).toHaveText(
    'Nariz del Diablo',
  );
  await page.getByRole('button', { name: 'Pausar autorrotación' }).click();
}

async function expectViewportLayout(page, { fullBleed, insets = {} }) {
  await expect
    .poll(
      () =>
        page.evaluate(
          ({ fullBleed, insets }) => {
            const failures = [];
            const width = window.innerWidth;
            const height = window.innerHeight;
            const safe = { top: 0, right: 0, bottom: 0, left: 0, ...insets };
            const rect = selector =>
              document.querySelector(selector).getBoundingClientRect();
            const near = (actual, expected, name) => {
              if (Math.abs(actual - expected) > 1)
                failures.push(`${name}: ${actual} instead of ${expected}`);
            };
            const inside = (box, bounds, name) => {
              if (
                box.width <= 0 ||
                box.height <= 0 ||
                box.left < bounds.left - 1 ||
                box.top < bounds.top - 1 ||
                box.right > bounds.right + 1 ||
                box.bottom > bounds.bottom + 1
              )
                failures.push(`${name} is outside its available area`);
            };
            const separate = (a, b, name) => {
              if (
                Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
                Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1
              )
                failures.push(`${name} overlap`);
            };
            const root = rect('#AventurasEn360');
            const header = rect('.my-header');
            const main = rect('main');
            const viewer = rect('.my-vwr');
            const canvas = document.querySelector('.panorama-canvas');
            const canvasBox = canvas.getBoundingClientRect();
            near(root.top, 0, 'app top');
            near(root.bottom, height, 'app bottom');
            near(root.width, width, 'app width');
            near(header.top, 0, 'header top');
            near(main.top, header.bottom, 'content top');
            near(main.bottom, height, 'content bottom');
            for (const edge of ['left', 'top', 'right', 'bottom']) {
              near(canvasBox[edge], viewer[edge], `canvas ${edge}`);
              if (fullBleed) near(viewer[edge], main[edge], `photo ${edge}`);
            }
            const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
            near(
              canvas.width,
              Math.floor(canvas.clientWidth * pixelRatio),
              'canvas buffer width',
            );
            near(
              canvas.height,
              Math.floor(canvas.clientHeight * pixelRatio),
              'canvas buffer height',
            );
            if (fullBleed) {
              near(main.left, 0, 'content left');
              near(main.right, width, 'content right');
            } else {
              if (main.width > 1081 || main.left <= 0)
                failures.push('desktop content lost its centered width');
              inside(viewer, main, 'desktop photo');
            }
            for (const element of [document.documentElement, document.body]) {
              if (
                element.scrollWidth > width + 1 ||
                element.scrollHeight > height + 1
              )
                failures.push(`${element.tagName} has page overflow`);
            }
            if (window.scrollX !== 0 || window.scrollY !== 0)
              failures.push('page scrolled outside the app');
            const headerBounds = {
              left: safe.left,
              right: width - safe.right,
              top: safe.top,
              bottom: header.bottom,
            };
            const title = rect('.my-header h1');
            const socialLinks = rect('.social-links');
            inside(title, headerBounds, 'site title');
            inside(socialLinks, headerBounds, 'social links');
            separate(title, socialLinks, 'site title and social links');
            const controls = rect('.panorama-controls');
            inside(controls, viewer, 'panorama controls');
            const buttons = [
              ...document.querySelectorAll('.panorama-controls button'),
            ];
            for (const button of buttons) {
              const box = button.getBoundingClientRect();
              inside(box, controls, button.ariaLabel);
              if (box.width < 44 || box.height < 44)
                failures.push(`${button.ariaLabel} has a small touch target`);
            }
            for (let index = 1; index < buttons.length; index++)
              separate(
                buttons[index - 1].getBoundingClientRect(),
                buttons[index].getBoundingClientRect(),
                'panorama buttons',
              );
            const overlays = [
              '.my-vwr-header',
              '.my-vwr-footer',
              '.panorama-controls',
              '.my-vwr-marker',
              '.my-btn-left',
              '.my-btn-right',
            ].map(selector => ({ selector, box: rect(selector) }));
            const available = {
              left: safe.left,
              right: width - safe.right,
              top: main.top,
              bottom: height - safe.bottom,
            };
            for (const { selector, box } of overlays)
              inside(box, available, selector);
            for (let first = 0; first < overlays.length; first++) {
              for (let second = first + 1; second < overlays.length; second++) {
                separate(
                  overlays[first].box,
                  overlays[second].box,
                  `${overlays[first].selector} and ${overlays[second].selector}`,
                );
              }
            }
            return failures;
          },
          { fullBleed, insets },
        ),
      {
        message: 'Photo, canvas and controls must fit the current viewport',
        timeout: 10_000,
      },
    )
    .toEqual([]);
}

test('fills mobile content through repeated portrait and landscape viewport changes', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'Mobile viewport regression');
  await page.setViewportSize({ width: 390, height: 664 });
  await loadPanorama(page);
  for (const [width, height] of [
    [390, 664],
    [390, 780],
    [390, 600],
    [390, 780],
    [844, 390],
    [844, 320],
    [844, 390],
    [667, 320],
    [320, 568],
    [390, 664],
  ]) {
    await test.step(`Viewport ${width} x ${height}`, async () => {
      await page.setViewportSize({ width, height });
      await expectViewportLayout(page, { fullBleed: true });
    });
  }
  await expect(page.locator('.my-vwr')).toHaveAttribute(
    'data-panorama-state',
    'ready',
  );
  await page.screenshot({
    path: test.info().outputPath('mobile-viewport.png'),
  });
});

test('keeps mobile overlays clear of portrait and landscape safe areas', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'Mobile safe-area regression');
  await page.setViewportSize({ width: 390, height: 664 });
  await loadPanorama(page);
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
    'content',
    /viewport-fit=cover/,
  );
  for (const scenario of [
    {
      width: 390,
      height: 664,
      insets: { top: 47, right: 0, bottom: 34, left: 0 },
    },
    {
      width: 390,
      height: 780,
      insets: { top: 47, right: 0, bottom: 34, left: 0 },
    },
    {
      width: 844,
      height: 390,
      insets: { top: 0, right: 47, bottom: 21, left: 47 },
    },
    {
      width: 667,
      height: 320,
      insets: { top: 0, right: 44, bottom: 21, left: 44 },
    },
    {
      width: 390,
      height: 664,
      insets: { top: 47, right: 0, bottom: 34, left: 0 },
    },
  ]) {
    await test.step(`Safe area at ${scenario.width} x ${scenario.height}`, async () => {
      await page.setViewportSize({
        width: scenario.width,
        height: scenario.height,
      });
      await page.evaluate(insets => {
        for (const [edge, value] of Object.entries(insets))
          document.documentElement.style.setProperty(
            `--safe-area-inset-${edge}`,
            `${value}px`,
          );
      }, scenario.insets);
      await expectViewportLayout(page, {
        fullBleed: true,
        insets: scenario.insets,
      });
    });
  }
  await page.screenshot({
    path: test.info().outputPath('mobile-safe-area.png'),
  });
});

test('preserves the centered desktop gallery when the viewport is resized', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Desktop layout regression');
  await loadPanorama(page);
  for (const [width, height] of [
    [1280, 800],
    [1024, 600],
    [1440, 900],
    [1280, 800],
  ]) {
    await page.setViewportSize({ width, height });
    await expectViewportLayout(page, { fullBleed: false });
  }
});
