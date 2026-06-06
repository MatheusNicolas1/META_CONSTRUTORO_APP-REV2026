import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { test, expect, type BrowserContext, type Page } from 'playwright/test';

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:5173';
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const qaPassword = 'Teste@1234!';
const runId = `${Date.now()}`;
const qaEmail = `prd-layout-pwa-${runId}@teste.com`;
const obraName = `Obra QA PWA ${runId}`;

let adminClient: SupabaseClient | null = null;
let qaUserId: string | null = null;
let orgId: string | null = null;
let obraId: string | null = null;

const createAdminClient = () => {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase URL/service role key ausentes para smoke PWA.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

const forceStandaloneMode = async (context: BrowserContext) => {
  await context.addInitScript(() => {
    const nativeMatchMedia = window.matchMedia.bind(window);
    window.matchMedia = (query: string) => {
      if (query.includes('display-mode: standalone')) {
        return {
          matches: true,
          media: query,
          onchange: null,
          addListener: () => undefined,
          removeListener: () => undefined,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
          dispatchEvent: () => false,
        } as MediaQueryList;
      }
      return nativeMatchMedia(query);
    };

    Object.defineProperty(window.navigator, 'standalone', {
      configurable: true,
      value: true,
    });
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

const expectNoDocumentOverflow = async (page: Page, label: string) => {
  const metrics = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    htmlScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));

  expect(
    Math.max(metrics.htmlScrollWidth, metrics.bodyScrollWidth),
    `${label} overflowed: ${JSON.stringify(metrics)}`
  ).toBeLessThanOrEqual(metrics.viewportWidth + 2);
};

const expectBottomNavigationDoesNotCoverContent = async (page: Page) => {
  await page.evaluate(() => {
    const main = document.querySelector('main');
    if (main instanceof HTMLElement) {
      main.scrollTop = main.scrollHeight;
    }
  });

  const metrics = await page.evaluate(() => {
    const nav = document.querySelector('nav.fixed.bottom-0');
    const main = document.querySelector('main');
    const navRect = nav?.getBoundingClientRect();
    const mainStyle = main ? getComputedStyle(main) : null;
    const mainElement = main instanceof HTMLElement ? main : null;
    const visibleButtons = Array.from(mainElement?.querySelectorAll('button') || [])
      .filter((button) => {
        if (button.offsetParent === null) return false;
        const rect = button.getBoundingClientRect();
        return rect.bottom > 0 && rect.top < window.innerHeight;
      });
    const lastButton = visibleButtons
      .at(-1);
    const lastButtonRect = lastButton?.getBoundingClientRect();

    return {
      hasBottomNav: Boolean(nav),
      navTop: navRect?.top ?? 0,
      navHeight: navRect?.height ?? 0,
      mainPaddingBottom: mainStyle ? Number.parseFloat(mainStyle.paddingBottom) : 0,
      mainScrollTop: mainElement?.scrollTop ?? 0,
      mainScrollHeight: mainElement?.scrollHeight ?? 0,
      mainClientHeight: mainElement?.clientHeight ?? 0,
      lastButtonBottom: lastButtonRect?.bottom ?? 0,
      visibleButtonCount: visibleButtons.length,
      viewportHeight: window.innerHeight,
      bodyText: document.body.innerText.slice(0, 500),
    };
  });

  expect(metrics.hasBottomNav, `bottom nav ausente: ${JSON.stringify(metrics)}`).toBe(true);
  expect(metrics.navHeight, `bottom nav deve ter altura touch real: ${JSON.stringify(metrics)}`).toBeGreaterThanOrEqual(64);
  expect(metrics.mainPaddingBottom, `main deve reservar espaco para bottom nav: ${JSON.stringify(metrics)}`).toBeGreaterThanOrEqual(80);
  expect(
    metrics.mainScrollHeight - metrics.mainScrollTop - metrics.mainClientHeight,
    `main deve chegar ao fim da rolagem: ${JSON.stringify(metrics)}`
  ).toBeLessThanOrEqual(2);
  expect(metrics.lastButtonBottom, `ultimo botao nao deve ficar sob a bottom nav: ${JSON.stringify(metrics)}`).toBeLessThanOrEqual(metrics.navTop + 2);
};

test.describe.configure({ mode: 'serial' });
test.setTimeout(120000);

test.beforeAll(async () => {
  adminClient = createAdminClient();
  qaUserId = (await adminClient.auth.admin.createUser({
    email: qaEmail,
    password: qaPassword,
    email_confirm: true,
    user_metadata: {
      name: 'QA PWA Layout',
      terms_accepted_at: new Date().toISOString(),
    },
  })).data.user?.id || null;

  if (!qaUserId) throw new Error('Usuario QA PWA nao foi criado.');

  await adminClient.from('profiles').upsert({
    id: qaUserId,
    name: 'QA PWA Layout',
    email: qaEmail,
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
    role: 'Administrador',
  } as never);

  orgId = randomUUID();
  await adminClient.from('orgs').insert({
    id: orgId,
    name: `QA PWA ${runId}`,
    slug: `qa-pwa-${runId}`,
    owner_user_id: qaUserId,
  } as never);
  await adminClient.from('org_members').insert({
    org_id: orgId,
    user_id: qaUserId,
    role: 'Administrador',
    status: 'active',
    joined_at: new Date().toISOString(),
  } as never);
  await adminClient.from('org_credits').upsert({
    org_id: orgId,
    plan_type: 'enterprise',
    rdo_credits_balance: 999,
  } as never, { onConflict: 'org_id' });

  const today = new Date().toISOString().split('T')[0];
  const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  const { data: obra, error: obraError } = await adminClient
    .from('obras')
    .insert({
      nome: obraName,
      cliente: 'Cliente QA PWA',
      localizacao: 'Rua QA PWA, 100',
      responsavel: 'QA PWA Layout',
      tipo: 'Residencial',
      data_inicio: today,
      previsao_termino: nextMonth,
      user_id: qaUserId,
      org_id: orgId,
      progresso: 10,
      status: 'ACTIVE',
    } as never)
    .select('id')
    .single();

  if (obraError) throw obraError;
  obraId = obra.id as string;
});

test.afterAll(async () => {
  if (!adminClient) return;

  if (obraId) {
    await adminClient.from('obras').delete().eq('id', obraId);
  }
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

test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});

test('PWA standalone mobile usa bottom navigation sem cobrir conteudo', async ({ context, page }) => {
  await forceStandaloneMode(context);
  await login(page);

  await page.goto(`${baseUrl}/app/dashboard`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('header')).toHaveCount(0);
  await expect(page.locator('[data-sidebar="sidebar"]')).toHaveCount(0);
  await expect(page.locator('nav.fixed.bottom-0')).toBeVisible();
  await expectNoDocumentOverflow(page, 'PWA dashboard mobile');
  await expectBottomNavigationDoesNotCoverContent(page);

  await page.goto(`${baseUrl}/app/rdo/novo`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /Novo Relat.rio Di.rio de Obra/i })).toBeVisible({ timeout: 15000 });
  await expect(page.locator('nav.fixed.bottom-0')).toBeVisible();
  await expectNoDocumentOverflow(page, 'PWA novo RDO mobile');
  await expectBottomNavigationDoesNotCoverContent(page);
});
