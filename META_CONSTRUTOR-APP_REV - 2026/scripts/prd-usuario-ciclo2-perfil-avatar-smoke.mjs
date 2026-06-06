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
const password = 'Teste@1234!';
const orgId = randomUUID();
const adminEmail = `prd-usuario-perfil-admin-${runId}@teste.com`;
const collaboratorEmail = `prd-usuario-perfil-colab-${runId}@teste.com`;

let adminUserId = null;
let collaboratorUserId = null;
const storageObjects = [];

const configProfile = {
  name: `Usuario Inicial PRD ${runId}`,
  phone: '(71) 97777-1111',
  position: 'Engenheiro QA',
  company: `Construtora Perfil ${runId}`,
  bio: `Biografia PRD ${runId}`,
};

const personalProfile = {
  name: `Usuario Perfil Final ${runId}`,
  phone: '(71) 96666-2222',
  company: `Construtora Avatar ${runId}`,
  cpf_cnpj: '123.456.789-10',
};

const evidence = {
  runId,
  device: deviceName,
  viewport: `${viewportWidth}x${viewportHeight}`,
  users: { admin: adminEmail, collaborator: collaboratorEmail },
  checks: [],
  cleanup: [],
  errors: [],
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

async function cleanup() {
  try {
    for (const object of storageObjects) {
      const { error } = await admin.storage.from(object.bucket).remove([object.path]);
      if (!error) evidence.cleanup.push(`storage:${object.bucket}/${object.path}`);
    }

    await admin.from('org_credits').delete().eq('org_id', orgId);
    evidence.cleanup.push('org_credits');
    await admin.from('subscriptions').delete().eq('org_id', orgId);
    evidence.cleanup.push('subscriptions');
    await admin.from('org_members').delete().eq('org_id', orgId);
    evidence.cleanup.push('org_members');
    await admin.from('orgs').delete().eq('id', orgId);
    evidence.cleanup.push('orgs');

    const userIds = [adminUserId, collaboratorUserId].filter(Boolean);
    if (userIds.length) {
      await admin.from('user_roles').delete().in('user_id', userIds);
      evidence.cleanup.push('user_roles');
      await admin.from('user_settings').delete().in('user_id', userIds);
      evidence.cleanup.push('user_settings');
      await admin.from('profiles').delete().in('id', userIds);
      evidence.cleanup.push('profiles');
      for (const userId of userIds) {
        await admin.auth.admin.deleteUser(userId);
      }
      evidence.cleanup.push('auth.users');
    }
  } catch (error) {
    evidence.errors.push(`cleanup: ${error.message}`);
  }
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
    phone: '',
    company: '',
    cpf_cnpj: null,
    avatar_url: null,
    plan_type: 'enterprise',
    has_seen_onboarding: false,
    updated_at: new Date().toISOString(),
  });
  await admin.from('user_roles').upsert({ user_id: userId, role }, { onConflict: 'user_id' });
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
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });

  return userId;
}

async function seedData() {
  adminUserId = await createUser(adminEmail, 'Admin PRD Perfil', 'Administrador');
  collaboratorUserId = await createUser(collaboratorEmail, 'Colaborador PRD Perfil', 'Colaborador');

  await removeAutoCreatedOrgs([adminUserId, collaboratorUserId]);

  await admin.from('orgs').insert({
    id: orgId,
    name: `QA PRD Perfil ${runId}`,
    slug: `qa-prd-perfil-${runId}`,
    owner_user_id: adminUserId,
  });

  await admin.from('org_members').insert([
    {
      org_id: orgId,
      user_id: adminUserId,
      role: 'Administrador',
      status: 'active',
      joined_at: new Date().toISOString(),
    },
    {
      org_id: orgId,
      user_id: collaboratorUserId,
      role: 'Colaborador',
      status: 'active',
      joined_at: new Date().toISOString(),
    },
  ]);

  await admin.from('org_credits').upsert({
    org_id: orgId,
    plan_type: 'enterprise',
    rdo_credits_balance: 999,
  }, { onConflict: 'org_id' });
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
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.waitForURL(/\/app/, { timeout: 30000 });
  await page.evaluate((activeOrgId) => localStorage.setItem('activeOrgId', activeOrgId), orgId);
}

async function fillStable(page, selector, value, label) {
  const input = page.locator(selector).first();
  await input.waitFor({ state: 'visible', timeout: 15000 });
  let current = '';
  for (let attempt = 0; attempt < 6; attempt += 1) {
    await input.fill(value);
    await sleep(200);
    current = await input.inputValue();
    if (current === value) return;
  }
  throw new Error(`${label} nao recebeu valor esperado: ${current}`);
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
  if (updated !== String(desiredChecked)) {
    throw new Error(`${label} deveria estar ${desiredChecked}, mas esta ${updated}`);
  }
}

async function waitForProfile(expected) {
  let last = null;
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const { data, error } = await admin
      .from('profiles')
      .select('name, phone, company, cpf_cnpj, position, bio, is_public, hide_signature, slug, avatar_url')
      .eq('id', adminUserId)
      .maybeSingle();
    if (error) throw error;
    last = data;
    const matches = Object.entries(expected).every(([key, value]) => {
      if (value instanceof RegExp) return value.test(data?.[key] || '');
      return data?.[key] === value;
    });
    if (matches) return data;
    await sleep(700);
  }
  throw new Error(`Profile nao persistiu: ${JSON.stringify(last)}`);
}

function parseStorageObject(publicUrl) {
  const marker = '/storage/v1/object/public/';
  const index = publicUrl.indexOf(marker);
  if (index < 0) return null;
  const rest = publicUrl.slice(index + marker.length);
  const [bucket, ...pathParts] = rest.split('/');
  const path = pathParts.join('/').split('?')[0];
  if (!bucket || !path) return null;
  return { bucket, path };
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

    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(`${page.url()} :: ${message.text()}`);
    });
    page.on('pageerror', (error) => {
      consoleErrors.push(`${page.url()} :: pageerror ${error.message}`);
    });
    page.on('response', (response) => {
      if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
    });

    await login(page, adminEmail);
    evidence.checks.push('login admin autenticado');

    await page.goto(`${baseUrl}/app/configurar-perfil`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: /Configurar Perfil/i }).waitFor({ state: 'visible', timeout: 30000 });
    await page.waitForFunction(
      () => document.querySelector('#name')?.value === 'Admin PRD Perfil',
      null,
      { timeout: 20000 },
    );
    await fillStable(page, '#name', configProfile.name, 'nome configuracao inicial');
    await fillStable(page, '#phone', configProfile.phone, 'telefone configuracao inicial');
    await fillStable(page, '#position', configProfile.position, 'cargo configuracao inicial');
    await fillStable(page, '#company', configProfile.company, 'empresa configuracao inicial');
    await fillStable(page, '#bio', configProfile.bio, 'bio configuracao inicial');
    await setSwitch(page, '#public-profile', true, 'perfil publico');
    await setSwitch(page, '#hide-signature', true, 'ocultar assinatura');
    await page.getByRole('button', { name: /Salvar Alteracoes|Salvar Alterações/i }).click();
    await waitForProfile({
      name: configProfile.name,
      phone: configProfile.phone,
      position: configProfile.position,
      company: configProfile.company,
      bio: configProfile.bio,
      is_public: true,
      hide_signature: true,
      slug: /^usuario-inicial-prd-/,
    });
    evidence.checks.push('configuracao inicial persistiu em profiles');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: /Configurar Perfil/i }).waitFor({ state: 'visible', timeout: 30000 });
    await page.waitForFunction(
      (expected) => document.querySelector('#name')?.value === expected,
      configProfile.name,
      { timeout: 15000 },
    );
    await setSwitch(page, '#public-profile', true, 'perfil publico apos reload');
    await setSwitch(page, '#hide-signature', true, 'ocultar assinatura apos reload');
    evidence.checks.push('configuracao inicial recarregou na UI');

    await page.goto(`${baseUrl}/app/perfil`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: /Meu Perfil/i }).waitFor({ state: 'visible', timeout: 30000 });
    await fillStable(page, '#name', personalProfile.name, 'nome dados pessoais');
    await fillStable(page, '#phone', personalProfile.phone, 'telefone dados pessoais');
    await fillStable(page, '#company', personalProfile.company, 'empresa dados pessoais');
    await fillStable(page, '#cpf_cnpj', personalProfile.cpf_cnpj, 'cpf/cnpj dados pessoais');
    await page.getByRole('button', { name: /Salvar Alteracoes|Salvar Alterações/i }).last().click();
    await waitForProfile({
      name: personalProfile.name,
      phone: personalProfile.phone,
      company: personalProfile.company,
      cpf_cnpj: personalProfile.cpf_cnpj,
    });
    evidence.checks.push('dados pessoais e documento persistiram em profiles');

    const avatarBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lCGj4wAAAABJRU5ErkJggg==',
      'base64',
    );
    await page.getByTestId('profile-avatar-input').setInputFiles({
      name: `avatar-prd-${runId}.png`,
      mimeType: 'image/png',
      buffer: avatarBuffer,
    });
    const profileWithAvatar = await waitForProfile({
      name: personalProfile.name,
      avatar_url: /^https?:\/\/.+\/storage\/v1\/object\/public\/.+/,
    });
    const storageObject = parseStorageObject(profileWithAvatar.avatar_url || '');
    if (storageObject) storageObjects.push(storageObject);
    await page.locator(`img[src="${profileWithAvatar.avatar_url}"]`).first().waitFor({ state: 'visible', timeout: 15000 });
    evidence.avatarUrl = profileWithAvatar.avatar_url;
    evidence.checks.push('avatar persistiu no backend e apareceu na UI');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: /Meu Perfil/i }).waitFor({ state: 'visible', timeout: 30000 });
    await page.locator(`img[src="${profileWithAvatar.avatar_url}"]`).first().waitFor({ state: 'visible', timeout: 15000 });
    evidence.checks.push('avatar recarregou apos reload');

    await page.getByRole('tab', { name: /Seguranca|Segurança/i }).click();
    await page.getByRole('button', { name: /^Excluir$/i }).click();
    await page.getByRole('heading', { name: /Excluir Conta Permanentemente/i }).waitFor({ state: 'visible', timeout: 15000 });
    await page.getByRole('button', { name: /Entendo, continuar/i }).click();
    await page.getByRole('heading', { name: /Confirmar Exclusao|Confirmar Exclusão/i }).waitFor({ state: 'visible', timeout: 15000 });
    const deleteButton = page.getByRole('button', { name: /Excluir minha conta/i });
    if (!(await deleteButton.isDisabled())) {
      throw new Error('Botao de exclusao deveria iniciar desabilitado');
    }
    await page.getByPlaceholder('EXCLUIR').fill('EXCLUIR');
    if (!(await deleteButton.isDisabled())) {
      throw new Error('Botao de exclusao deveria exigir senha alem da palavra EXCLUIR');
    }
    await page.getByPlaceholder('Digite sua senha').fill(password);
    if (await deleteButton.isDisabled()) {
      throw new Error('Botao de exclusao deveria habilitar apenas apos senha e EXCLUIR');
    }
    await page.getByRole('button', { name: /Cancelar/i }).click();
    await page.getByRole('heading', { name: /Confirmar Exclusao|Confirmar Exclusão/i }).waitFor({ state: 'hidden', timeout: 15000 });
    evidence.checks.push('acao sensivel de exclusao exige confirmacao em duas etapas, senha e palavra EXCLUIR');

    await login(page, collaboratorEmail);
    await page.goto(`${baseUrl}/app/configuracoes`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: /Acesso Negado/i }).waitFor({ state: 'visible', timeout: 30000 });
    await page.getByText(/nao tem permissao|não tem permissão/i).waitFor({ state: 'visible', timeout: 15000 });
    evidence.checks.push('colaborador sem permissao foi bloqueado em /app/configuracoes');

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
