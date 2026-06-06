import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { test, expect, type Page } from 'playwright/test';

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:5173';
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const runId = `${Date.now()}`;
const qaPassword = 'Teste@1234!';
const qaEmail = `prd-layout-inventory-${runId}@teste.com`;
const publicSlug = `prd-layout-public-${runId}`;

let adminClient: SupabaseClient | null = null;
let qaUserId: string | null = null;
let orgId: string | null = null;

const publicRoutes = [
  '/',
  '/home',
  '/sobre',
  '/contato',
  '/preco',
  '/checkout?plan=basic',
  '/checkout/success',
  '/checkout/cancel',
  '/login',
  '/criar-conta',
  '/recuperar-senha',
  '/redefinir-senha',
  '/mfa',
  '/renovar-sessao',
  '/atualizacoes',
  '/carreiras',
  '/blog',
  '/central-ajuda',
  '/documentacao',
  '/status',
  '/api',
  '/legal/privacidade',
  '/legal/termos',
  '/legal/cookies',
  '/legal/lgpd',
] as const;

const authenticatedRoutes = [
  '/app/dashboard',
  '/app/obras',
  '/app/rdo',
  '/app/rdo/novo',
  '/app/atividades',
  '/app/checklist',
  '/app/equipes',
  '/app/equipes/novo',
  '/app/colaboradores',
  '/app/colaboradores/novo',
  '/app/equipamentos',
  '/app/mais',
  '/app/documentos',
  '/app/fornecedores',
  '/app/despesas',
  '/app/relatorios',
  '/app/integracoes',
  '/app/configuracoes',
  '/app/perfil',
  '/app/notificacoes',
  '/app/feedback',
  '/app/faq',
  '/app/seguranca',
  '/app/admin/dashboard',
  '/app/configurar-perfil',
] as const;

const legacyRedirectRoutes = [
  '/dashboard',
  '/obras',
  '/rdo',
  '/atividades',
  '/checklist',
  '/equipes',
  '/colaboradores',
  '/equipamentos',
  '/mais',
  '/documentos',
  '/fornecedores',
  '/despesas',
  '/relatorios',
  '/integracoes',
  '/configuracoes',
  '/perfil',
  '/notificacoes',
  '/feedback',
  '/faq',
  '/seguranca',
  '/admin/dashboard',
] as const;

const viewports = [
  { width: 320, height: 720, name: 'mobile-320' },
  { width: 390, height: 844, name: 'mobile-390' },
  { width: 768, height: 1024, name: 'tablet-768' },
  { width: 1440, height: 900, name: 'desktop-1440' },
];

const createAdminClient = () => {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase URL/service role key ausentes para smoke de inventario.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

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
  await page.waitForURL(`${baseUrl}/app/dashboard`, { timeout: 25000 });
};

const expectNoDocumentOverflow = async (page: Page, route: string, viewportName: string) => {
  await page
    .waitForFunction(() => document.body.innerText.trim().length > 0, undefined, { timeout: 15000 })
    .catch(() => undefined);
  const metrics = await page.evaluate(() => ({
    href: window.location.href,
    viewportWidth: window.innerWidth,
    htmlScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    visibleText: document.body.innerText.slice(0, 800),
  }));

  expect(metrics.visibleText.trim().length, `${route} nao renderizou texto util em ${viewportName}`).toBeGreaterThan(0);
  expect(
    Math.max(metrics.htmlScrollWidth, metrics.bodyScrollWidth),
    `${route} overflowed at ${viewportName}: ${JSON.stringify(metrics)}`
  ).toBeLessThanOrEqual(metrics.viewportWidth + 2);

  return metrics;
};

test.describe.configure({ mode: 'serial' });
test.setTimeout(150000);

test.beforeAll(async () => {
  adminClient = createAdminClient();
  qaUserId = (await adminClient.auth.admin.createUser({
    email: qaEmail,
    password: qaPassword,
    email_confirm: true,
    user_metadata: {
      name: 'QA Inventario Layout',
      terms_accepted_at: new Date().toISOString(),
    },
  })).data.user?.id || null;

  if (!qaUserId) throw new Error('Usuario QA inventario nao foi criado.');

  orgId = randomUUID();
  await adminClient.from('profiles').upsert({
    id: qaUserId,
    name: 'QA Inventario Layout',
    email: qaEmail,
    slug: publicSlug,
    is_public: true,
    company: 'Meta Construtor QA',
    position: 'Engenharia QA',
    plan_type: 'enterprise',
    has_seen_onboarding: true,
    updated_at: new Date().toISOString(),
  } as never);
  await adminClient.from('user_settings').upsert({
    user_id: qaUserId,
    theme: 'light',
  } as never);
  await adminClient.from('user_roles').upsert({
    user_id: qaUserId,
    role: 'Presidente',
  } as never);
  await adminClient.from('orgs').insert({
    id: orgId,
    name: `QA Inventario ${runId}`,
    slug: `qa-inventory-${runId}`,
    owner_user_id: qaUserId,
  } as never);
  await adminClient.from('org_members').insert({
    org_id: orgId,
    user_id: qaUserId,
    role: 'Presidente',
    status: 'active',
    joined_at: new Date().toISOString(),
  } as never);
  await adminClient.from('org_credits').upsert({
    org_id: orgId,
    plan_type: 'enterprise',
    rdo_credits_balance: 999,
  } as never, { onConflict: 'org_id' });
});

test.afterAll(async () => {
  if (!adminClient) return;

  if (orgId) {
    await adminClient.from('org_credits').delete().eq('org_id', orgId);
    await adminClient.from('org_members').delete().eq('org_id', orgId);
    await adminClient.from('orgs').delete().eq('id', orgId);
  }
  if (qaUserId) {
    await adminClient.from('user_roles').delete().eq('user_id', qaUserId);
    await adminClient.from('user_settings').delete().eq('user_id', qaUserId);
    await adminClient.from('profiles').delete().eq('id', qaUserId);
    await adminClient.auth.admin.deleteUser(qaUserId);
  }
});

for (const viewport of viewports) {
  test.describe(`PRD_LAYOUT inventario publico ${viewport.name}`, () => {
    test.use({ viewport });

    test('rotas publicas renderizam sem overflow horizontal', async ({ page }) => {
      for (const route of publicRoutes) {
        await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded' });
        await expectNoDocumentOverflow(page, route, viewport.name);
      }

      const route = `/perfil/${publicSlug}`;
      await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded' });
      await expectNoDocumentOverflow(page, route, viewport.name);
    });
  });
}

for (const viewport of viewports) {
  test.describe(`PRD_LAYOUT inventario autenticado ${viewport.name}`, () => {
    test.use({ viewport });

    test('rotas autenticadas estaticas renderizam sem overflow horizontal', async ({ page }) => {
      await login(page);

      for (const route of authenticatedRoutes) {
        await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded' });
        const metrics = await expectNoDocumentOverflow(page, route, viewport.name);
        expect(metrics.href, `${route} deve permanecer em area autenticada`).toContain(route);
        expect(metrics.visibleText).not.toContain('Acesse sua conta');
      }
    });

    test('rotas legadas redirecionam para /app sem overflow horizontal', async ({ page }) => {
      await login(page);

      for (const route of legacyRedirectRoutes) {
        await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded' });
        const metrics = await expectNoDocumentOverflow(page, route, viewport.name);
        expect(metrics.href, `${route} deve redirecionar para /app`).toContain('/app');
      }
    });
  });
}
