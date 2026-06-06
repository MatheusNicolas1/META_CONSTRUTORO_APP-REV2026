import { test, expect } from 'playwright/test';

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:5173';

const routes = [
  '/home',
  '/preco',
  '/checkout?plan=basic',
  '/contato',
  '/login',
  '/app/dashboard',
  '/app/rdo',
  '/app/relatorios',
];

const viewports = [
  { width: 320, height: 720, name: 'mobile-320' },
  { width: 390, height: 844, name: 'mobile-390' },
  { width: 768, height: 1024, name: 'tablet-768' },
  { width: 1440, height: 900, name: 'desktop-1440' },
];

for (const viewport of viewports) {
  test.describe(`PRD_LAYOUT ${viewport.name}`, () => {
    test.use({ viewport });

    for (const route of routes) {
      test(`${route} has no document-level horizontal overflow`, async ({ page }) => {
        const consoleErrors: string[] = [];
        page.on('console', (message) => {
          if (message.type() === 'error') {
            consoleErrors.push(message.text());
          }
        });

        await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(800);

        const metrics = await page.evaluate(() => ({
          href: window.location.href,
          viewportWidth: window.innerWidth,
          htmlScrollWidth: document.documentElement.scrollWidth,
          bodyScrollWidth: document.body.scrollWidth,
          visibleText: document.body.innerText.slice(0, 500),
        }));

        expect(
          Math.max(metrics.htmlScrollWidth, metrics.bodyScrollWidth),
          `${route} overflowed at ${viewport.name}: ${JSON.stringify(metrics)}`
        ).toBeLessThanOrEqual(metrics.viewportWidth + 2);

        expect(
          consoleErrors.filter((entry) => !entry.includes('favicon')).slice(0, 5),
          `${route} console errors at ${viewport.name}`
        ).toEqual([]);
      });
    }
  });
}
