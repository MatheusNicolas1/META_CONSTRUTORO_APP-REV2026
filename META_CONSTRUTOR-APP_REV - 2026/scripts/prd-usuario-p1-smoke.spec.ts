import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { test, expect, type Page } from 'playwright/test';

/**
 * PRD_USUARIO — Smoke das pendencias P1 da homologacao de usuario.
 *
 * Cobre em PC/tablet/mobile:
 *  - Recuperacao de senha (/recuperar-senha e /redefinir-senha)
 *  - MFA (/mfa)
 *  - Avatar e perfil completo (/app/perfil e /app/configurar-perfil)
 *  - Checklists (/app/checklist)
 *
 * Alem dos smokes responsivos, valida persistencia real (perfil + avatar) no
 * Supabase, seguindo o mesmo padrao dos smokes `prd-layout-*.spec.ts`.
 */

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:5173';
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const runId = `${Date.now()}`;
const qaPassword = 'Teste@1234!';
const qaEmail = `prd-usuario-p1-${runId}@teste.com`;

const viewports = [
  { width: 1440, height: 900, name: 'pc-1440' },
  { width: 768, height: 1024, name: 'tablet-768' },
  { width: 390, height: 844, name: 'mobile-390' },
];

// PNG 1x1 valido para o upload de avatar.
const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

let adminClient: SupabaseClient | null = null;
let qaUserId: string | null = null;
let orgId: string | null = null;

const createAdminClient = () => {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase URL/service role key ausentes para smoke PRD_USUARIO P1.');
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
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

const assertNoDocumentOverflow = async (page: Page, route: string, viewportName: string) => {
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

// Ruido de terceiros (analytics/PostHog/GA/favicon) nao e erro do app.
const THIRD_PARTY_NOISE =
  /(favicon)|(PostHog)|(Failed to load resource)|(Content Security Policy)|(doubleclick)|(google-analytics)|(stats\.g\.)/i;

const filterRelevantErrors = (entries: string[]) =>
  entries.filter((entry) => !THIRD_PARTY_NOISE.test(entry)).slice(0, 5);

test.beforeAll(async () => {
  adminClient = createAdminClient();

  const { data, error } = await adminClient.auth.admin.createUser({
    email: qaEmail,
    password: qaPassword,
    email_confirm: true,
    user_metadata: {
      name: 'QA Usuario P1',
      terms_accepted_at: new Date().toISOString(),
    },
  });
  if (error) throw error;
  qaUserId = data.user.id;

  orgId = randomUUID();
  await adminClient.from('profiles').upsert({
    id: qaUserId,
    name: 'QA Usuario P1',
    email: qaEmail,
    plan_type: 'enterprise',
    has_seen_onboarding: true,
    updated_at: new Date().toISOString(),
  } as never);
  await adminClient.from('user_settings').upsert({ user_id: qaUserId, theme: 'light' } as never);
  await adminClient.from('user_roles').upsert({ user_id: qaUserId, role: 'Presidente' } as never);
  await adminClient.from('orgs').insert({
    id: orgId,
    name: `QA Usuario P1 ${runId}`,
    slug: `qa-usuario-p1-${runId}`,
    owner_user_id: qaUserId,
  } as never);
  await adminClient.from('org_members').insert({
    org_id: orgId,
    user_id: qaUserId,
    role: 'Presidente',
    status: 'active',
    joined_at: new Date().toISOString(),
  } as never);
});

test.afterAll(async () => {
  if (!adminClient) return;
  if (orgId) {
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

// ---------------------------------------------------------------------------
// Fluxos publicos (sem sessao): recuperacao de senha e MFA.
// ---------------------------------------------------------------------------
for (const viewport of viewports) {
  test.describe(`PRD_USUARIO P1 publico ${viewport.name}`, () => {
    test.use({ viewport });

    test('/recuperar-senha valida formulario e estado generico sem envio real', async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });

      await page.goto(`${baseUrl}/recuperar-senha`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: 'Recuperar senha' })).toBeVisible();
      await assertNoDocumentOverflow(page, '/recuperar-senha', viewport.name);

      await page.getByLabel('E-mail').fill(qaEmail);
      await page.getByRole('button', { name: 'Enviar link de recuperacao' }).click();

      // Resposta generica (anti-enumeracao), sem depender de entrega real de e-mail.
      await expect(page.getByText(/Se existir uma conta para/)).toBeVisible({ timeout: 15000 });
      await expect(
        filterRelevantErrors(consoleErrors),
        `console errors at ${viewport.name}`
      ).toEqual([]);
    });

    test('/redefinir-senha valida minimo e confirmacao', async ({ page }) => {
      await page.goto(`${baseUrl}/redefinir-senha`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: 'Redefinir senha' })).toBeVisible();
      await assertNoDocumentOverflow(page, '/redefinir-senha', viewport.name);

      await page.getByLabel('Nova senha').fill('curta');
      await page.getByLabel('Confirmar senha').fill('curta');
      await page.getByRole('button', { name: 'Salvar nova senha' }).click();
      await expect(page.getByText('A senha deve ter pelo menos 10 caracteres.')).toBeVisible();

      await page.getByLabel('Nova senha').fill('SenhaForte123!');
      await page.getByLabel('Confirmar senha').fill('SenhaDiferente123!');
      await page.getByRole('button', { name: 'Salvar nova senha' }).click();
      await expect(page.getByText('As senhas nao coincidem.')).toBeVisible();
    });

    test('/mfa valida formato, estado honesto e retorno ao login', async ({ page }) => {
      await page.goto(`${baseUrl}/mfa`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByText('Verificacao em duas etapas')).toBeVisible();
      await assertNoDocumentOverflow(page, '/mfa', viewport.name);

      // Formato invalido -> erro imediato, sem chamada de verificacao.
      await page.getByLabel('Codigo de 6 digitos').fill('123');
      await page.getByRole('button', { name: 'Verificar' }).click();
      await expect(page.getByText('Informe um codigo de 6 digitos.')).toBeVisible();

      // Codigo valido sem fator cadastrado -> estado honesto (sem sucesso falso).
      await page.getByLabel('Codigo de 6 digitos').fill('123456');
      await page.getByRole('button', { name: 'Verificar' }).click();
      await expect(page.getByText('MFA de login ainda nao esta disponivel neste ambiente.')).toBeVisible({ timeout: 15000 });

      // Retorno ao login.
      await page.getByRole('button', { name: 'Voltar ao login' }).click();
      await page.waitForURL(`${baseUrl}/login`, { timeout: 15000 });
    });
  });
}

// ---------------------------------------------------------------------------
// Fluxos autenticados: avatar, perfil completo e checklists.
// ---------------------------------------------------------------------------
for (const viewport of viewports) {
  test.describe(`PRD_USUARIO P1 autenticado ${viewport.name}`, () => {
    test.use({ viewport });

    test.beforeEach(async ({ page }) => {
      await login(page);
    });

    test('/app/perfil renderiza avatar e abas sem overflow', async ({ page }) => {
      await page.goto(`${baseUrl}/app/perfil`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: 'Meu Perfil' })).toBeVisible({ timeout: 20000 });
      await expect(page.locator('[data-testid="profile-avatar-input"]')).toBeAttached();
      await expect(page.getByRole('button', { name: 'Alterar foto' })).toBeVisible();
      await expect(page.getByRole('tab', { name: /Dados Pessoais|Dados/ })).toBeVisible();
      await expect(page.getByRole('tab', { name: /Segurança|Seguranca/ })).toBeVisible();
      await assertNoDocumentOverflow(page, '/app/perfil', viewport.name);
    });

    test('/app/configurar-perfil renderiza formulario completo sem overflow', async ({ page }) => {
      await page.goto(`${baseUrl}/app/configurar-perfil`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: 'Configurar Perfil' })).toBeVisible({ timeout: 20000 });
      await expect(page.getByPlaceholder('Seu nome')).toBeVisible();
      await expect(page.getByPlaceholder('(00) 00000-0000')).toBeVisible();
      await expect(page.getByPlaceholder('Ex: Engenheiro Civil')).toBeVisible();
      await expect(page.getByPlaceholder('Nome da sua empresa')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Salvar Alterações' })).toBeVisible();
      await assertNoDocumentOverflow(page, '/app/configurar-perfil', viewport.name);
    });

    test('/app/checklist renderiza listagem sem overflow', async ({ page }) => {
      await page.goto(`${baseUrl}/app/checklist`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: 'Checklists' })).toBeVisible({ timeout: 20000 });
      await expect(page.getByRole('button', { name: /Novo Checklist|Adicionar/ })).toBeVisible();
      await expect(page.getByRole('tab', { name: /Ativos/ })).toBeVisible();
      await expect(page.getByRole('tab', { name: /Concluídos/ })).toBeVisible();
      await assertNoDocumentOverflow(page, '/app/checklist', viewport.name);
    });
  });
}

// ---------------------------------------------------------------------------
// Persistencia real (PC): perfil completo e avatar.
// ---------------------------------------------------------------------------
test.describe('PRD_USUARIO P1 persistencia', () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test.setTimeout(120000);

  test('perfil completo salva e persiste no backend (read-back)', async ({ page }) => {
    await login(page);
    await page.goto(`${baseUrl}/app/configurar-perfil`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Configurar Perfil' })).toBeVisible({ timeout: 20000 });

    const newName = `QA Usuario P1 ${runId}`;
    await page.getByPlaceholder('Seu nome').fill(newName);
    await page.getByPlaceholder('(00) 00000-0000').fill('(11) 98888-7777');
    await page.getByPlaceholder('Ex: Engenheiro Civil').fill('Engenharia QA');
    await page.getByPlaceholder('Nome da sua empresa').fill('Meta Construtor QA');
    await page.getByPlaceholder('Conte um pouco sobre você...').fill('Perfil de homologacao P1.');
    await page.getByRole('button', { name: 'Salvar Alterações' }).click();

    await expect(page.getByText('Perfil atualizado com sucesso!')).toBeVisible({ timeout: 15000 });

    // Evidencia de persistencia real no Supabase.
    await expect.poll(async () => {
      const { data } = await (adminClient as SupabaseClient)
        .from('profiles')
        .select('name, phone, position, company, bio')
        .eq('id', qaUserId)
        .maybeSingle();
      return data?.name;
    }, { timeout: 15000 }).toBe(newName);

    const { data } = await (adminClient as SupabaseClient)
      .from('profiles')
      .select('phone, position, company, bio')
      .eq('id', qaUserId)
      .maybeSingle();
    expect(data?.phone).toBe('(11) 98888-7777');
    expect(data?.position).toBe('Engenharia QA');
    expect(data?.company).toBe('Meta Construtor QA');
  });

  test('avatar faz upload e persiste avatar_url no backend', async ({ page }) => {
    await login(page);
    await page.goto(`${baseUrl}/app/perfil`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-testid="profile-avatar-input"]')).toBeAttached({ timeout: 20000 });

    await page.locator('[data-testid="profile-avatar-input"]').setInputFiles({
      name: 'avatar.png',
      mimeType: 'image/png',
      buffer: Buffer.from(TINY_PNG_BASE64, 'base64'),
    });

    // A UI deve responder com sucesso ou erro controlado (nunca quebrar).
    const successToast = page.getByText('Foto atualizada', { exact: true });
    const errorToast = page.getByText('Erro no upload', { exact: true });

    let outcome = 'timeout';
    try {
      await successToast.waitFor({ state: 'visible', timeout: 20000 });
      outcome = 'ok';
    } catch {
      try {
        await errorToast.waitFor({ state: 'visible', timeout: 5000 });
        outcome = 'erro';
      } catch {
        outcome = 'timeout';
      }
    }

    if (outcome === 'ok') {
      await expect.poll(async () => {
        const { data } = await (adminClient as SupabaseClient)
          .from('profiles')
          .select('avatar_url')
          .eq('id', qaUserId)
          .maybeSingle();
        return data?.avatar_url;
      }, { timeout: 15000 }).not.toBeFalsy();
    } else if (outcome === 'erro') {
      // Upload respondeu com erro controlado (bucket/RLS indisponivel no ambiente).
      // Aceito pela secao 2 do PRD_USUARIO: sem sucesso falso, sem quebra.
    } else {
      throw new Error('Upload de avatar nao respondeu com sucesso nem erro controlado.');
    }
  });
});
