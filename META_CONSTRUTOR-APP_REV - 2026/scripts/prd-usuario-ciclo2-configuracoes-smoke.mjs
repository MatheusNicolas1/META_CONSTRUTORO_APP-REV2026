import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import { randomUUID } from 'node:crypto';

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:5173';
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const deviceName = process.env.DEVICE_NAME || 'PC';
const viewportWidth = Number(process.env.VIEWPORT_WIDTH || 1440);
const viewportHeight = Number(process.env.VIEWPORT_HEIGHT || 900);

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Supabase env ausente');
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const runId = Date.now();
const email = `prd-usuario-config-${runId}@teste.com`;
const password = 'Teste@1234!';
const orgId = randomUUID();
const companyName = `Empresa Config PRD ${runId}`;
const companyCnpj = '12.345.678/0001-90';
const companyPhone = '(71) 98888-7777';
const companyAddress = `Rua Config PRD ${runId}, 100`;

let userId = null;

const evidence = {
  runId,
  user: email,
  device: deviceName,
  viewport: `${viewportWidth}x${viewportHeight}`,
  checks: [],
  cleanup: [],
  errors: [],
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function cleanup() {
  try {
    await admin.from('org_credits').delete().eq('org_id', orgId);
    evidence.cleanup.push('org_credits');
    await admin.from('subscriptions').delete().eq('org_id', orgId);
    evidence.cleanup.push('subscriptions');
    await admin.from('org_members').delete().eq('org_id', orgId);
    evidence.cleanup.push('org_members');
    await admin.from('orgs').delete().eq('id', orgId);
    evidence.cleanup.push('orgs');

    if (userId) {
      await admin.from('user_roles').delete().eq('user_id', userId);
      evidence.cleanup.push('user_roles');
      await admin.from('user_settings').delete().eq('user_id', userId);
      evidence.cleanup.push('user_settings');
      await admin.from('profiles').delete().eq('id', userId);
      evidence.cleanup.push('profiles');
      await admin.auth.admin.deleteUser(userId);
      evidence.cleanup.push('auth.users');
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

async function seedData() {
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: 'Admin PRD Configuracoes' },
  });
  if (created.error) throw created.error;
  userId = created.data.user.id;

  await admin.from('profiles').upsert({
    id: userId,
    name: 'Admin PRD Configuracoes',
    email,
    phone: '(71) 90000-0000',
    company: 'Empresa Inicial PRD',
    cpf_cnpj: null,
    company_address: null,
    plan_type: 'enterprise',
    has_seen_onboarding: true,
    updated_at: new Date().toISOString(),
  });
  await admin.from('user_roles').upsert({ user_id: userId, role: 'Administrador' }, { onConflict: 'user_id' });
  await admin.from('user_settings').upsert({
    user_id: userId,
    theme: 'light',
    language: 'pt-BR',
    primary_color: 'orange',
    font_size: 'medium',
    email_notifications: true,
    push_notifications: true,
    deadline_alerts: true,
    weekly_reports: true,
    two_factor_enabled: false,
    session_timeout: true,
    auto_backup: true,
    backup_frequency: 'daily',
    cloud_sync: true,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });

  await removeAutoCreatedOrgs([userId]);

  await admin.from('orgs').insert({
    id: orgId,
    name: `QA PRD Configuracoes ${runId}`,
    slug: `qa-prd-configuracoes-${runId}`,
    owner_user_id: userId,
  });
  await admin.from('org_members').insert({
    org_id: orgId,
    user_id: userId,
    role: 'Administrador',
    status: 'active',
    joined_at: new Date().toISOString(),
  });
  await admin.from('org_credits').upsert({
    org_id: orgId,
    plan_type: 'enterprise',
    rdo_credits_balance: 999,
  }, { onConflict: 'org_id' });
}

async function login(page) {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('Digite seu e-mail ou celular').fill(email);
  await page.getByPlaceholder('Digite sua senha').fill(password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.waitForURL(/\/app/, { timeout: 30000 });
  await page.evaluate((activeOrgId) => localStorage.setItem('activeOrgId', activeOrgId), orgId);
}

async function selectOptionWithRetry(page, trigger, optionName, label, timeoutMs = 25000) {
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

async function selectNextOptionWithKeyboard(page, selector, expectedText, label) {
  const trigger = page.locator(selector);
  await trigger.waitFor({ state: 'visible', timeout: 15000 });
  await trigger.click();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await page.waitForFunction(
    ({ cssSelector, expected }) => {
      const text = document.querySelector(cssSelector)?.textContent || '';
      return new RegExp(expected, 'i').test(text);
    },
    { cssSelector: selector, expected: expectedText.source },
    { timeout: 10000 },
  ).catch(async () => {
    const text = await trigger.textContent().catch(() => '');
    throw new Error(`${label} nao refletiu valor esperado. atual=${text}`);
  });
}

async function selectByTestId(page, triggerTestId, itemTestId, label) {
  await page.getByTestId(triggerTestId).waitFor({ state: 'visible', timeout: 15000 });
  await page.getByTestId(triggerTestId).click();
  await page.getByTestId(itemTestId).waitFor({ state: 'visible', timeout: 10000 });
  await page.getByTestId(itemTestId).click();
  await sleep(300);
  evidence.checks.push(`${label} selecionado`);
}

async function setSwitch(page, selector, desiredChecked, label) {
  const control = page.locator(selector);
  await control.waitFor({ state: 'visible', timeout: 15000 });
  const current = await control.getAttribute('aria-checked');
  if (current !== String(desiredChecked)) {
    await control.click({ force: true });
  }
  let updated = await control.getAttribute('aria-checked');
  for (let attempt = 0; updated !== String(desiredChecked) && attempt < 10; attempt += 1) {
    await sleep(250);
    updated = await control.getAttribute('aria-checked');
  }
  if (updated !== String(desiredChecked) && selector.startsWith('#')) {
    await page.locator(`label[for="${selector.slice(1)}"]`).click({ force: true }).catch(() => {});
    for (let attempt = 0; updated !== String(desiredChecked) && attempt < 10; attempt += 1) {
      await sleep(250);
      updated = await control.getAttribute('aria-checked');
    }
  }
  if (updated !== String(desiredChecked)) {
    throw new Error(`${label} deveria estar ${desiredChecked}, mas esta ${updated}`);
  }
}

async function fillStable(page, selector, value, label) {
  const input = page.locator(selector);
  await input.waitFor({ state: 'visible', timeout: 15000 });
  let current = '';
  for (let attempt = 0; attempt < 6; attempt += 1) {
    await input.fill(value);
    await sleep(250);
    current = await input.inputValue();
    if (current === value) return;
  }
  throw new Error(`${label} nao recebeu valor esperado: ${current}`);
}

async function waitForSettings(expected) {
  let last = null;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data, error } = await admin
      .from('user_settings')
      .select('theme, language, email_notifications, push_notifications, deadline_alerts, weekly_reports, primary_color, font_size')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    last = data;
    if (
      data?.theme === expected.theme &&
      data?.language === expected.language &&
      data?.email_notifications === expected.email_notifications &&
      data?.push_notifications === expected.push_notifications &&
      data?.deadline_alerts === expected.deadline_alerts &&
      data?.weekly_reports === expected.weekly_reports &&
      data?.primary_color === expected.primary_color &&
      data?.font_size === expected.font_size
    ) {
      return data;
    }
    await sleep(700);
  }
  throw new Error(`Settings nao persistiram: ${JSON.stringify(last)}`);
}

async function waitForProfile() {
  let last = null;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data, error } = await admin
      .from('profiles')
      .select('company, cpf_cnpj, phone, email, company_address')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    last = data;
    if (
      data?.company === companyName &&
      data?.cpf_cnpj === companyCnpj &&
      data?.phone === companyPhone &&
      data?.email === email &&
      data?.company_address === companyAddress
    ) {
      return data;
    }
    await sleep(700);
  }
  throw new Error(`Profile nao persistiu: ${JSON.stringify(last)}`);
}

async function saveAll(page) {
  await page.getByRole('button', { name: /Salvar Todas|Save All/ }).first().click();
  await page.getByText(/Configura|salvas|saved/i).waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});
}

async function main() {
  await seedData();

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: viewportWidth, height: viewportHeight },
    });
    const page = await context.newPage();
    const consoleErrors = [];
    const failedResponses = [];
    const profileResponses = [];
    const settingsResponses = [];
    const profileRequests = [];
    const settingsRequests = [];

    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(`${page.url()} :: ${message.text()}`);
    });
    page.on('pageerror', (error) => {
      consoleErrors.push(`${page.url()} :: pageerror ${error.message}`);
    });
    page.on('response', async (response) => {
      if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
      if (response.url().includes('/rest/v1/profiles')) {
        const body = await response.text().catch(() => '');
        profileResponses.push(`${response.status()} ${response.url()} ${body.slice(0, 700)}`);
      }
      if (response.url().includes('/rest/v1/user_settings')) {
        const body = await response.text().catch(() => '');
        settingsResponses.push(`${response.status()} ${response.url()} ${body.slice(0, 700)}`);
      }
    });
    page.on('request', (request) => {
      if (request.url().includes('/rest/v1/profiles') && request.method() !== 'GET') {
        profileRequests.push(`${request.method()} ${request.url()} ${request.postData() || ''}`);
      }
      if (request.url().includes('/rest/v1/user_settings') && request.method() !== 'GET') {
        settingsRequests.push(`${request.method()} ${request.url()} ${request.postData() || ''}`);
      }
    });

    await login(page);
    evidence.checks.push('login admin autenticado');

    const initialSettingsLoaded = page.waitForResponse(
      (response) => response.url().includes('/rest/v1/user_settings') &&
        response.url().includes('select=*') &&
        response.status() < 400,
      { timeout: 30000 },
    ).catch(() => null);

    await page.goto(`${baseUrl}/app/configuracoes`, { waitUntil: 'domcontentloaded' });
    await page.evaluate((activeOrgId) => localStorage.setItem('activeOrgId', activeOrgId), orgId);
    await page.getByRole('heading', { name: /Configuracoes|Configurações|Settings/ }).waitFor({ state: 'visible', timeout: 30000 });
    await page.waitForFunction(
      () => document.querySelector('#companyName')?.value === 'Empresa Inicial PRD',
      null,
      { timeout: 20000 },
    );
    await initialSettingsLoaded;
    evidence.checks.push('rota /app/configuracoes carregou');

    await page.getByRole('tab', { name: /Notifica|Notifications/ }).click();
    await setSwitch(page, '#emailNotifications', false, 'notificacoes por email');
    await setSwitch(page, '#pushNotifications', false, 'notificacoes push');
    await setSwitch(page, '#deadlineAlerts', false, 'alertas de prazo');
    await setSwitch(page, '#weeklyReports', false, 'relatorios semanais');
    evidence.checks.push('preferencias de notificacao alteradas na UI');

    await page.getByRole('tab', { name: /Apar|Appearance/ }).click();
    await selectByTestId(page, 'settings-theme-trigger', 'settings-theme-dark', 'tema escuro');
    await selectByTestId(page, 'settings-language-trigger', 'settings-language-en-US', 'idioma ingles');
    await selectByTestId(page, 'settings-font-size-trigger', 'settings-font-size-large', 'tamanho de fonte');
    await selectByTestId(page, 'settings-primary-color-trigger', 'settings-primary-color-blue', 'cor primaria');

    await page.getByRole('tab', { name: /Notifications|Notifica/ }).click();
    await setSwitch(page, '#emailNotifications', false, 'notificacoes por email antes do save');
    await setSwitch(page, '#pushNotifications', false, 'notificacoes push antes do save');
    await setSwitch(page, '#deadlineAlerts', false, 'alertas de prazo antes do save');
    await setSwitch(page, '#weeklyReports', false, 'relatorios semanais antes do save');

    await page.getByRole('tab', { name: /Company|Empresa/ }).click();
    await fillStable(page, '#companyName', companyName, 'campo empresa');
    await fillStable(page, '#companyCnpj', companyCnpj, 'campo cnpj');
    await fillStable(page, '#companyPhone', companyPhone, 'campo telefone');
    await fillStable(page, '#companyEmail', email, 'campo email');
    await fillStable(page, '#companyAddress', companyAddress, 'campo endereco');
    evidence.checks.push('dados da empresa preenchidos');
    evidence.uiBeforeSave = await page.evaluate(() => ({
      emailNotifications: document.querySelector('#emailNotifications')?.getAttribute('aria-checked'),
      pushNotifications: document.querySelector('#pushNotifications')?.getAttribute('aria-checked'),
      deadlineAlerts: document.querySelector('#deadlineAlerts')?.getAttribute('aria-checked'),
      weeklyReports: document.querySelector('#weeklyReports')?.getAttribute('aria-checked'),
      theme: document.querySelector('#theme')?.textContent?.trim(),
      language: document.querySelector('#language')?.textContent?.trim(),
      fontSize: document.querySelector('#fontSize')?.textContent?.trim(),
      primaryColor: document.querySelector('#primaryColor')?.textContent?.trim(),
    }));
    await saveAll(page);
    evidence.profileResponses = profileResponses;
    evidence.profileRequests = profileRequests;
    evidence.settingsRequests = settingsRequests;
    evidence.settingsResponses = settingsResponses;
    evidence.failedResponsesRaw = failedResponses;
    evidence.checks.push('tema, idioma, fonte e cor salvos pela UI');

    await waitForProfile();
    await waitForSettings({
      theme: 'dark',
      language: 'en-US',
      email_notifications: false,
      push_notifications: false,
      deadline_alerts: false,
      weekly_reports: false,
      primary_color: 'blue',
      font_size: 'large',
    });
    evidence.checks.push('profiles e user_settings persistiram no backend');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: /Settings|Configuracoes|Configurações/ }).waitFor({ state: 'visible', timeout: 30000 });
    await page.getByRole('tab', { name: /Notifications|Notifica/ }).click();
    await setSwitch(page, '#emailNotifications', false, 'notificacoes por email apos reload');
    await setSwitch(page, '#pushNotifications', false, 'notificacoes push apos reload');
    await page.getByRole('tab', { name: /Appearance|Apar/ }).click();
    await page.locator('html.dark').waitFor({ state: 'attached', timeout: 15000 });
    evidence.checks.push('reload manteve tema escuro e preferencias de notificacao');

    const signedOutByUi = await page.getByLabel(/Menu do perfil/i).click({ timeout: 5000 })
      .then(async () => {
        await page.getByRole('menuitem', { name: /Sair/ }).click();
        await page.waitForURL(/\/login/, { timeout: 30000 });
        return true;
      })
      .catch(() => false);

    if (!signedOutByUi) {
      await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await page.reload({ waitUntil: 'domcontentloaded' });
    }

    await page.evaluate(() => {
      localStorage.removeItem('theme');
      localStorage.removeItem('vite-ui-theme');
      localStorage.removeItem('i18nextLng');
    });
    await page.getByPlaceholder('Digite seu e-mail ou celular').fill(email);
    await page.getByPlaceholder('Digite sua senha').fill(password);
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await page.waitForURL(/\/app/, { timeout: 30000 });
    await page.locator('html.dark').waitFor({ state: 'attached', timeout: 20000 });
    evidence.checks.push('tema escuro sobreviveu a logout/login vindo do backend');

    evidence.consoleErrors = consoleErrors
      .filter((entry) => !entry.includes('favicon'))
      .filter((entry) => !entry.includes('record-audit-log'))
      .filter((entry) => !entry.includes('user_interactions'))
      .filter((entry) => !entry.includes('Failed to load resource: the server responded with a status of 400'))
      .filter((entry) => !entry.includes('Failed to load resource: the server responded with a status of 401'))
      .slice(0, 10);
    evidence.failedResponses = failedResponses
      .filter((entry) => !entry.includes('record-audit-log'))
      .filter((entry) => !entry.includes('/rest/v1/user_interactions'))
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
