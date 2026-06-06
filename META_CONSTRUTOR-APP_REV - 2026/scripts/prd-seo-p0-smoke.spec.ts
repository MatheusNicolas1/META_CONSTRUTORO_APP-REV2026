import { test, expect } from 'playwright/test';

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:5173';

const routes = [
  {
    path: '/home',
    title: /gestao de obras|Meta Construtor/i,
    h1: /Gest(?:a|\u00e3)o de obras, RDO e documentos/i,
    screenshotPrefix: 'prd-seo-home',
  },
  {
    path: '/preco',
    title: /preco|planos|Meta Construtor/i,
    h1: /Preços para organizar obras/i,
    screenshotPrefix: 'prd-seo-preco',
  },
  {
    path: '/sobre',
    title: /sobre|Meta Construtor/i,
    h1: /plataforma para tirar a gestão de obras do improviso/i,
    screenshotPrefix: 'prd-seo-sobre',
  },
  {
    path: '/contato',
    title: /contato|Meta Construtor/i,
    h1: /Fale com o Meta Construtor sobre sua rotina de obras/i,
    screenshotPrefix: 'prd-seo-contato',
  },
];

const viewports = [
  { name: 'desktop', width: 1366, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

for (const viewport of viewports) {
  test.describe(`SEO P0 ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const route of routes) {
      test(`${route.path} renders SEO P0 structure without horizontal overflow`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });

    await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    await expect(page).toHaveTitle(route.title);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toContainText(route.h1);

    const metrics = await page.evaluate(() => ({
      viewportWidth: window.innerWidth,
      htmlScrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
    }));

    expect(
      Math.max(metrics.htmlScrollWidth, metrics.bodyScrollWidth),
      `${route.path} overflow metrics: ${JSON.stringify(metrics)}`
    ).toBeLessThanOrEqual(metrics.viewportWidth + 2);

    expect(
      consoleErrors.filter((entry) => !entry.includes('favicon')).slice(0, 5),
      `${route.path} console errors`
    ).toEqual([]);

        await page.screenshot({
          path: `docs/evidence/${route.screenshotPrefix}-${viewport.name}-2026-05-31.png`,
          fullPage: true,
        });
      });
    }
  });
}
