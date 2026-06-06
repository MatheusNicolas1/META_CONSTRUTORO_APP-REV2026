import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import { randomUUID } from 'node:crypto';

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:5173';
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const deviceName = process.env.DEVICE_NAME || 'PC';
const viewportWidth = Number(process.env.VIEWPORT_WIDTH || 1440);
const viewportHeight = Number(process.env.VIEWPORT_HEIGHT || 900);

if (!supabaseUrl || !serviceRoleKey || !anonKey) {
  throw new Error('Supabase env ausente');
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const anon = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const runId = Date.now();
const password = 'Teste@1234!';
const adminEmail = `prd-usuario-filtros-admin-${runId}@teste.com`;
const collaboratorEmail = `prd-usuario-filtros-colab-${runId}@teste.com`;
const orgId = randomUUID();
const planId = randomUUID();
const obraAId = randomUUID();
const obraBId = randomUUID();
const today = new Date();
const targetDate = new Date(today.getTime() + 2 * 86400000).toISOString().split('T')[0];
const laterDate = new Date(today.getTime() + 12 * 86400000).toISOString().split('T')[0];

const names = {
  admin: 'Admin PRD Filtros Checklist',
  collaborator: 'Colaborador PRD Filtros Checklist',
  obraA: `Obra Filtros A PRD ${runId}`,
  obraB: `Obra Filtros B PRD ${runId}`,
  target: `Filtro Alvo PRD ${runId}`,
  obraDecoy: `Filtro Decoy Obra PRD ${runId}`,
  statusDecoy: `Filtro Decoy Status PRD ${runId}`,
  responsibleDecoy: `Filtro Decoy Responsavel PRD ${runId}`,
  dateDecoy: `Filtro Decoy Periodo PRD ${runId}`,
  categoryDecoy: `Filtro Decoy Categoria PRD ${runId}`,
};

let adminUserId = null;
let collaboratorUserId = null;

const evidence = {
  runId,
  device: deviceName,
  viewport: `${viewportWidth}x${viewportHeight}`,
  orgId,
  targetDate,
  laterDate,
  checks: [],
  cleanup: [],
  errors: [],
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function cleanup() {
  try {
    const { data: checklists } = await admin.from('checklists').select('id').eq('org_id', orgId);
    const checklistIds = (checklists || []).map((item) => item.id);
    if (checklistIds.length) {
      await admin.from('documentos').delete().in('checklist_id', checklistIds);
      await admin.from('checklist_items').delete().in('checklist_id', checklistIds);
      await admin.from('checklists').delete().in('id', checklistIds);
      evidence.cleanup.push('checklists/items/documentos');
    }

    await admin.from('obras').delete().in('id', [obraAId, obraBId]);
    evidence.cleanup.push('obras');
    await admin.from('org_credits').delete().eq('org_id', orgId);
    evidence.cleanup.push('org_credits');
    await admin.from('subscriptions').delete().eq('org_id', orgId);
    evidence.cleanup.push('subscriptions');
    await admin.from('plans').delete().eq('id', planId);
    evidence.cleanup.push('plans');
    await admin.from('org_members').delete().eq('org_id', orgId);
    evidence.cleanup.push('org_members');
    await admin.from('orgs').delete().eq('id', orgId);
    evidence.cleanup.push('orgs');

    const userIds = [adminUserId, collaboratorUserId].filter(Boolean);
    if (userIds.length) {
      await admin.from('user_roles').delete().in('user_id', userIds);
      await admin.from('user_settings').delete().in('user_id', userIds);
      await admin.from('profiles').delete().in('id', userIds);
      for (const userId of userIds) {
        try {
          await admin.auth.admin.deleteUser(userId);
        } catch (error) {
          evidence.errors.push(`cleanup auth user ${userId}: ${error.message}`);
        }
      }
      evidence.cleanup.push('users/profiles/settings/roles');
    }
  } catch (error) {
    evidence.errors.push(`cleanup: ${error.message}`);
  }
}

async function removeAutoCreatedOrgs(userIds) {
  const { data: memberships, error } = await admin
    .from('org_members')
    .select('org_id')
    .in('user_id', userIds);

  if (error) throw error;

  const autoOrgIds = [...new Set((memberships || []).map((membership) => membership.org_id).filter(Boolean))];
  await admin.from('org_members').delete().in('user_id', userIds);

  if (!autoOrgIds.length) return;
  await admin.from('subscriptions').delete().in('org_id', autoOrgIds);
  await admin.from('org_credits').delete().in('org_id', autoOrgIds);
  await admin.from('orgs').delete().in('id', autoOrgIds);
}

async function createUser(email, name, role) {
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });
  if (created.error) throw created.error;

  const userId = created.data.user.id;
  await admin.from('profiles').upsert({
    id: userId,
    name,
    email,
    plan_type: 'enterprise',
    has_seen_onboarding: true,
    updated_at: new Date().toISOString(),
  });
  await admin.from('user_settings').upsert({ user_id: userId, theme: 'light' }, { onConflict: 'user_id' });
  await admin.from('user_roles').upsert({ user_id: userId, role }, { onConflict: 'user_id' });
  return userId;
}

async function seedData() {
  adminUserId = await createUser(adminEmail, names.admin, 'Administrador');
  collaboratorUserId = await createUser(collaboratorEmail, names.collaborator, 'Colaborador');
  await removeAutoCreatedOrgs([adminUserId, collaboratorUserId]);

  await admin.from('orgs').insert({
    id: orgId,
    name: `QA PRD Checklist Filtros ${runId}`,
    slug: `qa-prd-checklist-filtros-${runId}`,
    owner_user_id: adminUserId,
  });
  await admin.from('org_members').insert([
    { org_id: orgId, user_id: adminUserId, role: 'Administrador', status: 'active', joined_at: new Date().toISOString() },
    { org_id: orgId, user_id: collaboratorUserId, role: 'Colaborador', status: 'active', joined_at: new Date().toISOString() },
  ]);
  await admin.from('org_credits').upsert({
    org_id: orgId,
    plan_type: 'enterprise',
    rdo_credits_balance: 999,
  }, { onConflict: 'org_id' });

  const { error: planError } = await admin.from('plans').insert({
    id: planId,
    slug: `qa-checklist-filtros-${runId}`,
    name: `QA Checklist Filtros ${runId}`,
    description: 'Plano temporario para smoke automatizado de filtros do PRD_USUARIO.',
    features: {},
    is_active: true,
    is_popular: false,
    max_users: 10,
    max_obras: 10,
    monthly_rdos: 999,
    monthly_price_cents: 0,
    yearly_price_cents: 0,
    display_order: 999,
  });
  if (planError) throw planError;
  await admin.from('subscriptions').insert({
    org_id: orgId,
    plan_id: planId,
    status: 'active',
    billing_cycle: 'monthly',
    metadata: { source: 'prd-usuario-checklist-filtros', runId },
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
  });

  const obraRows = [
    {
      id: obraAId,
      nome: names.obraA,
      cliente: `Cliente Filtros A ${runId}`,
      localizacao: 'Rua PRD Filtros, 100',
      responsavel: names.admin,
      tipo: 'Residencial',
      data_inicio: targetDate,
      previsao_termino: laterDate,
      status: 'ACTIVE',
      user_id: adminUserId,
      org_id: orgId,
      progresso: 0,
      deleted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: obraBId,
      nome: names.obraB,
      cliente: `Cliente Filtros B ${runId}`,
      localizacao: 'Rua PRD Filtros, 200',
      responsavel: names.admin,
      tipo: 'Comercial',
      data_inicio: targetDate,
      previsao_termino: laterDate,
      status: 'ACTIVE',
      user_id: adminUserId,
      org_id: orgId,
      progresso: 0,
      deleted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
  const { error: obrasError } = await admin.from('obras').insert(obraRows);
  if (obrasError) throw obrasError;

  const checklistRows = [
    { titulo: names.target, categoria: 'Qualidade', status: 'Rascunho', obra_id: obraAId, responsavel_id: adminUserId, data_vencimento: targetDate },
    { titulo: names.obraDecoy, categoria: 'Qualidade', status: 'Rascunho', obra_id: obraBId, responsavel_id: adminUserId, data_vencimento: targetDate },
    { titulo: names.statusDecoy, categoria: 'Qualidade', status: 'Pendente', obra_id: obraAId, responsavel_id: adminUserId, data_vencimento: targetDate },
    { titulo: names.responsibleDecoy, categoria: 'Qualidade', status: 'Rascunho', obra_id: obraAId, responsavel_id: collaboratorUserId, data_vencimento: targetDate },
    { titulo: names.dateDecoy, categoria: 'Qualidade', status: 'Rascunho', obra_id: obraAId, responsavel_id: adminUserId, data_vencimento: laterDate },
    { titulo: names.categoryDecoy, categoria: 'Segurança', status: 'Rascunho', obra_id: obraAId, responsavel_id: adminUserId, data_vencimento: targetDate },
  ].map((row) => ({
    id: randomUUID(),
    org_id: orgId,
    descricao: `Registro de controle para filtros PRD ${runId}`,
    template_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...row,
  }));

  const { error: checklistsError } = await admin.from('checklists').insert(checklistRows);
  if (checklistsError) throw checklistsError;

  const signed = await anon.auth.signInWithPassword({ email: adminEmail, password });
  if (signed.error) throw signed.error;
  const visible = await anon.from('checklists').select('id').eq('org_id', orgId).limit(6);
  await anon.auth.signOut().catch(() => {});
  if (visible.error || (visible.data || []).length < 6) {
    throw visible.error || new Error(`Checklists seedados nao ficaram visiveis pela RLS: ${(visible.data || []).length}`);
  }
}

async function login(page, email) {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('Digite seu e-mail ou celular').fill(email);
  await page.getByPlaceholder('Digite sua senha').fill(password);
  await page.getByRole('button', { name: /Entrar|Acessar/ }).click();
  await page.waitForURL(/\/app/, { timeout: 30000 });
}

async function selectOptionWithRetry(page, trigger, optionName, label, timeoutMs = 30000) {
  const startedAt = Date.now();
  let lastBodyText = '';

  while (Date.now() - startedAt < timeoutMs) {
    try {
      await trigger.waitFor({ state: 'visible', timeout: 5000 });
      await trigger.click({ force: true, timeout: 5000 });

      const option = optionName instanceof RegExp
        ? page.getByRole('option', { name: optionName }).first()
        : page.getByRole('option', { name: optionName, exact: true }).first();

      await option.waitFor({ state: 'visible', timeout: 2500 });
      await option.click({ force: true, timeout: 5000 });
      return;
    } catch (error) {
      lastBodyText = await page.locator('body').innerText({ timeout: 2000 }).catch(() => '');
      await page.keyboard.press('Escape').catch(() => {});
      await sleep(500);
    }
  }

  throw new Error(`Nao selecionou ${label}. body=${lastBodyText.slice(0, 1600)}`);
}

function titleLocator(page, title) {
  return page.getByText(title, { exact: true });
}

async function expectVisible(page, title, label) {
  try {
    await titleLocator(page, title).waitFor({ state: 'visible', timeout: 20000 });
  } catch (error) {
    const bodyText = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
    throw new Error(`${label}: ${title} nao ficou visivel. body=${bodyText.slice(0, 1800)} original=${error.message}`);
  }
  evidence.checks.push(`${label}: ${title} visivel`);
}

async function expectHidden(page, title, label) {
  try {
    await titleLocator(page, title).waitFor({ state: 'hidden', timeout: 20000 });
  } catch (error) {
    const bodyText = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
    throw new Error(`${label}: ${title} nao ficou oculto. body=${bodyText.slice(0, 1800)} original=${error.message}`);
  }
  evidence.checks.push(`${label}: ${title} oculto`);
}

async function clearFilters(page) {
  const button = page.getByRole('button', { name: /Limpar Filtros/ });
  if (await button.isVisible({ timeout: 3000 }).catch(() => false)) {
    await button.click();
  }
  await expectVisible(page, names.target, 'limpeza de filtros');
}

async function main() {
  await seedData();

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: viewportWidth, height: viewportHeight },
    });
    await context.addInitScript((activeOrgId) => {
      window.localStorage.setItem('activeOrgId', activeOrgId);
    }, orgId);
    const page = await context.newPage();
    const consoleErrors = [];
    const failedResponses = [];
    const checklistResponses = [];

    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(`${page.url()} :: ${message.text()}`);
    });
    page.on('pageerror', (error) => {
      consoleErrors.push(`${page.url()} :: pageerror ${error.message}`);
    });
    page.on('response', (response) => {
      if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
      if (response.url().includes('/rest/v1/checklists')) {
        response.text()
          .then((body) => checklistResponses.push(`${response.status()} ${response.url()} ${body.slice(0, 700)}`))
          .catch(() => {});
      }
    });

    await login(page, adminEmail);
    await page.evaluate((activeOrgId) => localStorage.setItem('activeOrgId', activeOrgId), orgId);
    evidence.checks.push('login admin autenticado');

    await page.goto(`${baseUrl}/app/checklist`, { waitUntil: 'domcontentloaded' });
    await page.evaluate((activeOrgId) => localStorage.setItem('activeOrgId', activeOrgId), orgId);
    await page.getByText('Filtros', { exact: true }).last().waitFor({ state: 'visible', timeout: 30000 });
    evidence.activeOrgStorage = await page.evaluate(() => window.localStorage.getItem('activeOrgId'));
    evidence.checklistResponses = checklistResponses;
    await expectVisible(page, names.target, 'lista inicial');
    await expectVisible(page, names.obraDecoy, 'lista inicial');
    await expectVisible(page, names.statusDecoy, 'lista inicial');
    await expectVisible(page, names.responsibleDecoy, 'lista inicial');
    await expectVisible(page, names.dateDecoy, 'lista inicial');
    await expectVisible(page, names.categoryDecoy, 'lista inicial');

    await selectOptionWithRetry(page, page.locator('[aria-label="Filtro obra"]'), names.obraB, 'filtro obra');
    await expectVisible(page, names.obraDecoy, 'filtro por obra');
    await expectHidden(page, names.target, 'filtro por obra');
    await clearFilters(page);

    await selectOptionWithRetry(page, page.locator('[aria-label="Filtro status"]'), 'Pendente', 'filtro status');
    await expectVisible(page, names.statusDecoy, 'filtro por status');
    await expectHidden(page, names.target, 'filtro por status');
    await clearFilters(page);

    await selectOptionWithRetry(page, page.locator('[aria-label="Filtro responsável"]'), names.admin, 'filtro responsavel');
    await expectVisible(page, names.target, 'filtro por responsavel');
    await expectHidden(page, names.responsibleDecoy, 'filtro por responsavel');
    await clearFilters(page);

    await page.locator('[aria-label="Filtro prazo inicial"]').fill(laterDate);
    await page.locator('[aria-label="Filtro prazo final"]').fill(laterDate);
    await expectVisible(page, names.dateDecoy, 'filtro por periodo');
    await expectHidden(page, names.target, 'filtro por periodo');
    await clearFilters(page);

    await selectOptionWithRetry(page, page.locator('[aria-label="Filtro categoria"]'), 'Qualidade', 'filtro categoria');
    await expectVisible(page, names.target, 'filtro por categoria');
    await expectHidden(page, names.categoryDecoy, 'filtro por categoria');
    await clearFilters(page);

    await selectOptionWithRetry(page, page.locator('[aria-label="Filtro obra"]'), names.obraA, 'filtro combinado obra');
    await selectOptionWithRetry(page, page.locator('[aria-label="Filtro status"]'), 'Rascunho', 'filtro combinado status');
    await selectOptionWithRetry(page, page.locator('[aria-label="Filtro responsável"]'), names.admin, 'filtro combinado responsavel');
    await selectOptionWithRetry(page, page.locator('[aria-label="Filtro categoria"]'), 'Qualidade', 'filtro combinado categoria');
    await page.locator('[aria-label="Filtro prazo inicial"]').fill(targetDate);
    await page.locator('[aria-label="Filtro prazo final"]').fill(targetDate);
    await expectVisible(page, names.target, 'filtros combinados');
    await expectHidden(page, names.obraDecoy, 'filtros combinados');
    await expectHidden(page, names.statusDecoy, 'filtros combinados');
    await expectHidden(page, names.responsibleDecoy, 'filtros combinados');
    await expectHidden(page, names.dateDecoy, 'filtros combinados');
    await expectHidden(page, names.categoryDecoy, 'filtros combinados');

    evidence.consoleErrors = consoleErrors
      .filter((entry) => !entry.includes('favicon'))
      .filter((entry) => !entry.includes('record-audit-log'))
      .filter((entry) => !entry.includes('Failed to load resource: the server responded with a status of 400'))
      .slice(0, 10);
    evidence.failedResponses = failedResponses
      .filter((entry) => !entry.includes('record-audit-log'))
      .slice(0, 10);

    if (evidence.consoleErrors.length || evidence.failedResponses.length) {
      throw new Error(`Erros de console/rede: ${JSON.stringify({
        consoleErrors: evidence.consoleErrors,
        failedResponses: evidence.failedResponses,
      })}`);
    }
  } finally {
    if (browser) await browser.close();
  }
}

try {
  await main();
} catch (error) {
  evidence.errors.push(error.stack || error.message);
  throw error;
} finally {
  await cleanup();
  console.log(JSON.stringify(evidence, null, 2));
}
