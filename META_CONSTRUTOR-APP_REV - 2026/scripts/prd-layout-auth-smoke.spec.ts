import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { test, expect, type Page } from 'playwright/test';

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:5173';
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const qaPassword = 'Teste@1234!';
const qaEmail = `prd-layout-${Date.now()}@teste.com`;

const viewports = [
  { width: 320, height: 740, name: 'mobile-320' },
  { width: 390, height: 844, name: 'mobile-390' },
  { width: 768, height: 1024, name: 'tablet-768' },
  { width: 1024, height: 768, name: 'desktop-1024' },
  { width: 1440, height: 900, name: 'desktop-1440' },
  { width: 1920, height: 1080, name: 'desktop-1920' },
];

const authenticatedRoutes = [
  '/app/dashboard',
  '/app/rdo',
  '/app/rdo/novo',
  '/app/obras',
  '/app/relatorios',
  '/app/configuracoes',
];

let adminClient: SupabaseClient | null = null;
let qaUserId: string | null = null;
let qaObraId: string | null = null;
let qaRdoId: string | null = null;

const login = async (page: Page) => {
  await page.route('**/functions/v1/accept-invite', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, activated: 0, memberships: [] }),
    });
  });
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('Digite seu e-mail ou celular').fill(qaEmail);
  await page.getByPlaceholder('Digite sua senha').fill(qaPassword);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.waitForURL(`${baseUrl}/app/dashboard`, { timeout: 20000 });
};

const createAdminClient = () => {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase URL/service role key ausentes para smoke autenticado.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

const ensureQaOrg = async (client: SupabaseClient, userId: string) => {
  await client.from('profiles').upsert({
    id: userId,
    name: 'QA Layout',
    email: qaEmail,
    plan_type: 'enterprise',
    has_seen_onboarding: true,
    updated_at: new Date().toISOString(),
  } as never);
  await client.from('user_settings').upsert({
    user_id: userId,
    theme: 'light',
  } as never);

  for (let attempt = 0; attempt < 8; attempt++) {
    const { data } = await client
      .from('org_members')
      .select('org_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (data?.org_id) return data.org_id as string;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  const orgId = randomUUID();
  await client.from('orgs').upsert({
    id: orgId,
    name: 'QA Layout Meta Construtor',
    slug: `qa-layout-${userId.slice(0, 8)}`,
    owner_user_id: userId,
    updated_at: new Date().toISOString(),
  } as never);
  await client.from('org_members').upsert({
    org_id: orgId,
    user_id: userId,
    role: 'Administrador',
    status: 'active',
  } as never);
  await client.from('user_roles').upsert({
    user_id: userId,
    role: 'Administrador',
  } as never);

  return orgId;
};

const seedQaData = async (client: SupabaseClient, userId: string, orgId: string) => {
  const today = new Date().toISOString().split('T')[0];
  const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  const { data: obra, error: obraError } = await client
    .from('obras')
    .insert({
      nome: 'Obra QA Layout Responsivo com Nome Extenso',
      cliente: 'Cliente QA Layout',
      localizacao: 'Rua de Testes Responsivos, 123',
      responsavel: 'Engenharia QA',
      tipo: 'Residencial',
      data_inicio: today,
      previsao_termino: nextMonth,
      observacoes: 'Dados temporarios para validacao responsiva.',
      user_id: userId,
      org_id: orgId,
      progresso: 42,
      status: 'ACTIVE',
    } as never)
    .select('id')
    .single();

  if (obraError) throw obraError;

  const { data: rdo, error: rdoError } = await client
    .from('rdos')
    .insert({
      obra_id: obra.id,
      data: today,
      periodo: 'Manhã',
      clima: 'Ensolarado',
      equipe_ociosa: false,
      observacoes: 'RDO temporario para smoke responsivo autenticado.',
      criado_por_id: userId,
      org_id: orgId,
      status: 'DRAFT',
      detalhes: {},
    } as never)
    .select('id')
    .single();

  if (rdoError) throw rdoError;

  return {
    obraId: obra.id as string,
    rdoId: rdo.id as string,
  };
};

test.beforeAll(async () => {
  adminClient = createAdminClient();

  const { data, error } = await adminClient.auth.admin.createUser({
    email: qaEmail,
    password: qaPassword,
    email_confirm: true,
    user_metadata: {
      name: 'QA Layout',
      terms_accepted_at: new Date().toISOString(),
    },
  });

  if (error) throw error;
  qaUserId = data.user.id;
  const orgId = await ensureQaOrg(adminClient, qaUserId);
  const seeded = await seedQaData(adminClient, qaUserId, orgId);
  qaObraId = seeded.obraId;
  qaRdoId = seeded.rdoId;
});

test.afterAll(async () => {
  if (adminClient && qaUserId) {
    await adminClient.auth.admin.deleteUser(qaUserId);
  }
});

for (const viewport of viewports) {
  test.describe(`PRD_LAYOUT authenticated ${viewport.name}`, () => {
    test.use({ viewport });

    test.beforeEach(async ({ page }) => {
      await login(page);
    });

    for (const route of authenticatedRoutes) {
      test(`${route} renders authenticated content without document overflow`, async ({ page }) => {
        const consoleErrors: string[] = [];
        page.on('console', (message) => {
          if (message.type() === 'error') consoleErrors.push(message.text());
        });

        await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1200);

        const metrics = await page.evaluate(() => ({
          href: window.location.href,
          viewportWidth: window.innerWidth,
          htmlScrollWidth: document.documentElement.scrollWidth,
          bodyScrollWidth: document.body.scrollWidth,
          text: document.body.innerText.slice(0, 800),
        }));

        expect(metrics.href, `${route} should stay authenticated`).toContain(route);
        expect(metrics.text, `${route} should not render access/login screen`).not.toContain('Acesse sua conta');
        expect(
          Math.max(metrics.htmlScrollWidth, metrics.bodyScrollWidth),
          `${route} overflowed at ${viewport.name}: ${JSON.stringify(metrics)}`
        ).toBeLessThanOrEqual(metrics.viewportWidth + 2);
        expect(
          consoleErrors.filter((entry) => !entry.includes('favicon')).slice(0, 5),
          `${route} console errors at ${viewport.name}`
        ).toEqual([]);

        if (route === '/app/dashboard') {
          const dashboardSearch = page.getByLabel('Buscar obras, RDOs e documentos');
          await expect(dashboardSearch).toBeEnabled();
          await page.keyboard.press('Control+K');
          const focusedSearch = await page.evaluate(() => ({
            tag: document.activeElement?.tagName,
            placeholder: document.activeElement?.getAttribute('placeholder') || '',
          }));
          expect(focusedSearch.tag, `Ctrl+K should focus inline dashboard search at ${viewport.name}`).toBe('INPUT');
          expect(
            focusedSearch.placeholder,
            `Ctrl+K should not open a modal search at ${viewport.name}`
          ).toContain('Busque obras');
          await expect(page.getByText('Busca Global')).toHaveCount(0);

          if (viewport.width >= 768) {
            await expect(page.locator('button').filter({ hasText: 'Mais' })).toBeVisible();

            const profileButton = page.locator('[data-tour="perfil"]');
            await expect(profileButton).toBeVisible();
            const profileMetrics = await profileButton.evaluate((node) => {
              const box = (node as HTMLElement).getBoundingClientRect();
              return {
                viewportWidth: window.innerWidth,
                viewportHeight: window.innerHeight,
                left: box.left,
                right: box.right,
                top: box.top,
                bottom: box.bottom,
              };
            });

            expect(
              profileMetrics.right,
              `profile button clipped on the right at ${viewport.name}: ${JSON.stringify(profileMetrics)}`
            ).toBeLessThanOrEqual(profileMetrics.viewportWidth + 2);
            expect(
              profileMetrics.left,
              `profile button clipped on the left at ${viewport.name}: ${JSON.stringify(profileMetrics)}`
            ).toBeGreaterThanOrEqual(-2);
            expect(
              profileMetrics.bottom,
              `profile button clipped on the bottom at ${viewport.name}: ${JSON.stringify(profileMetrics)}`
            ).toBeLessThanOrEqual(profileMetrics.viewportHeight + 2);
          }

          const calendarCard = page
            .getByText('Calendário de Atividades')
            .locator('xpath=ancestor::*[contains(@class, "bg-card") and contains(@class, "border-border")][1]');
          await calendarCard.scrollIntoViewIfNeeded();
          const calendarMetrics = await calendarCard.evaluate((card) => {
            const box = card.getBoundingClientRect();
            return {
              found: true,
              viewportWidth: window.innerWidth,
              cardClientWidth: (card as HTMLElement).clientWidth,
              cardScrollWidth: (card as HTMLElement).scrollWidth,
              left: box.left,
              right: box.right,
            };
          });

          expect(calendarMetrics.found, `calendar card should exist at ${viewport.name}`).toBe(true);
          expect(
            calendarMetrics.cardScrollWidth,
            `calendar card internal overflow at ${viewport.name}: ${JSON.stringify(calendarMetrics)}`
          ).toBeLessThanOrEqual(calendarMetrics.cardClientWidth + 2);
          expect(
            calendarMetrics.right,
            `calendar card clipped on the right at ${viewport.name}: ${JSON.stringify(calendarMetrics)}`
          ).toBeLessThanOrEqual(calendarMetrics.viewportWidth + 2);
          expect(
            calendarMetrics.left,
            `calendar card clipped on the left at ${viewport.name}: ${JSON.stringify(calendarMetrics)}`
          ).toBeGreaterThanOrEqual(-2);
        }
      });
    }

    test('dynamic obra and RDO detail routes render without document overflow', async ({ page }) => {
      const dynamicRoutes = [
        `/app/obras/${qaObraId}`,
        `/app/rdo/${qaRdoId}/visualizar`,
        `/app/rdo/${qaRdoId}/editar`,
      ];

      for (const route of dynamicRoutes) {
        await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1200);

        const metrics = await page.evaluate(() => ({
          href: window.location.href,
          viewportWidth: window.innerWidth,
          htmlScrollWidth: document.documentElement.scrollWidth,
          bodyScrollWidth: document.body.scrollWidth,
          text: document.body.innerText.slice(0, 800),
        }));

        expect(metrics.href, `${route} should stay authenticated`).toContain(route);
        expect(metrics.text, `${route} should not render access/login screen`).not.toContain('Acesse sua conta');
        expect(
          Math.max(metrics.htmlScrollWidth, metrics.bodyScrollWidth),
          `${route} overflowed at ${viewport.name}: ${JSON.stringify(metrics)}`
        ).toBeLessThanOrEqual(metrics.viewportWidth + 2);
      }
    });
  });
}

test.describe('PRD_LAYOUT theme persistence', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('theme toggle persists after reload in authenticated shell', async ({ page }) => {
    await login(page);
    await page.waitForTimeout(1200);

    const themeToggle = page.getByRole('button', { name: 'Toggle theme', exact: true });
    await expect(themeToggle).toBeVisible();

    await themeToggle.click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveClass(/dark/);

    await themeToggle.click();
    await expect(page.locator('html')).toHaveClass(/light/);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveClass(/light/);

    const metrics = await page.evaluate(() => ({
      viewportWidth: window.innerWidth,
      htmlScrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
    }));

    expect(Math.max(metrics.htmlScrollWidth, metrics.bodyScrollWidth)).toBeLessThanOrEqual(metrics.viewportWidth + 2);
  });
});
