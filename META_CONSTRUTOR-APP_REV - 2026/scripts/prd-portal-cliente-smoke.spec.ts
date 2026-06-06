// Smoke test - Portal do Cliente (público e interno)
// Sem dependência de autenticação anônima total; pode rodar com Playwright
// exigindo `BASE_URL` e token de teste válido

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

// Token fixo para teste (deve existir no banco)
const TOKEN_TESTE = process.env.PORTAL_TEST_TOKEN || '';

test.describe('Portal do Cliente (MVP)', () => {
  test('Rota pública /portal/:token carrega sem sessão auth', async ({ page }) => {
    if (!TOKEN_TESTE) {
      test.skip('TOKEN_TESTE não configurado');
      return;
    }

    await page.goto(`${BASE_URL}/portal/${TOKEN_TESTE}`);
    await page.waitForLoadState('networkidle');

    const header = page.locator('header');
    await expect(header).toBeVisible();
  });

  test('Rota pública com token inválido mostra erro', async ({ page }) => {
    await page.goto(`${BASE_URL}/portal/token-invalido-123`);
    await page.waitForLoadState('networkidle');

    const erro = page.locator('text=Portal indisponível');
    await expect(erro).toBeVisible({ timeout: 10000 });
  });

  test('Rota interna /app/clientes-portal exige login', async ({ page }) => {
    await page.goto(`${BASE_URL}/app/clientes-portal`);
    await page.waitForLoadState('networkidle');

    // Deve redirecionar para login
    await expect(page).not.toHaveURL(/\/app\/clientes-portal$/);
  });
});

test.describe('Portal do Cliente - API (Edge Functions)', () => {
  test('POST portal-client-bootstrap sem token retorna 400', async ({ request }) => {
    const res = await request.post(`/functions/v1/portal-client-bootstrap`, {
      headers: { 'Content-Type': 'application/json' },
      data: {},
    });
    expect(res.status()).toBe(400);
  });

  test('POST portal-client-send-message sem token retorna 400', async ({ request }) => {
    const res = await request.post(`/functions/v1/portal-client-send-message`, {
      headers: { 'Content-Type': 'application/json' },
      data: {},
    });
    expect(res.status()).toBe(400);
  });

  test('POST portal-client-approve-item sem token retorna 400', async ({ request }) => {
    const res = await request.post(`/functions/v1/portal-client-approve-item`, {
      headers: { 'Content-Type': 'application/json' },
      data: {},
    });
    expect(res.status()).toBe(400);
  });
});
