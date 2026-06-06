import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import { randomUUID } from 'node:crypto';

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:5173';
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Supabase env ausente');
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const anon = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const runId = Date.now();
const password = 'Teste@1234!';
const orgId = randomUUID();
const planId = randomUUID();
const userEmail = `prd-usuario-ciclo3-atividades-${runId}@teste.com`;
const userName = `QA Atividades PRD ${runId}`;
const obraAId = randomUUID();
const obraBId = randomUUID();
const today = new Date().toISOString().slice(0, 10);
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

const names = {
  obraA: `Obra Atividades A ${runId}`,
  obraB: `Obra Atividades B ${runId}`,
  target: `Atividade Busca Alvo ${runId}`,
  categoryDecoy: `Atividade Categoria Decoy ${runId}`,
  statusDecoy: `Atividade Status Decoy ${runId}`,
  noResponsibleDecoy: `Atividade Sem Responsavel ${runId}`,
  futureDecoy: `Atividade Futura ${runId}`,
  apiDelete: `Atividade Excluir API ${runId}`,
  pcDelete: `Atividade Excluir PC ${runId}`,
  tabletDelete: `Atividade Excluir Tablet ${runId}`,
  mobileDelete: `Atividade Excluir Mobile ${runId}`,
};

let userId = null;
const activityIds = [];

const evidence = {
  prd: 'PRD_USUARIO.md',
  cycle: 'Ciclo 3 - Atividades',
  runId,
  baseUrl,
  user: userEmail,
  orgId,
  checks: [],
  devices: [],
  gaps: [],
  cleanup: [],
  errors: [],
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function cleanup() {
  try {
    if (activityIds.length) {
      await admin.from('atividades').delete().in('id', activityIds);
      evidence.cleanup.push('atividades');
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

    if (userId) {
      await admin.from('user_roles').delete().eq('user_id', userId);
      await admin.from('user_settings').delete().eq('user_id', userId);
      await admin.from('profiles').delete().eq('id', userId);
      await admin.auth.admin.deleteUser(userId);
      evidence.cleanup.push('user/profile/settings/roles');
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
  const autoOrgIds = [...new Set((memberships || []).map((row) => row.org_id).filter(Boolean))];
  await admin.from('org_members').delete().in('user_id', userIds);
  if (!autoOrgIds.length) return;
  await admin.from('subscriptions').delete().in('org_id', autoOrgIds);
  await admin.from('org_credits').delete().in('org_id', autoOrgIds);
  await admin.from('orgs').delete().in('id', autoOrgIds);
}

async function seedData() {
  const created = await admin.auth.admin.createUser({
    email: userEmail,
    password,
    email_confirm: true,
    user_metadata: { name: userName },
  });
  if (created.error) throw created.error;
  userId = created.data.user.id;

  await admin.from('profiles').upsert({
    id: userId,
    name: userName,
    email: userEmail,
    plan_type: 'enterprise',
    has_seen_onboarding: true,
    updated_at: new Date().toISOString(),
  });
  await admin.from('user_settings').upsert({ user_id: userId, theme: 'light' }, { onConflict: 'user_id' });
  await admin.from('user_roles').upsert({ user_id: userId, role: 'Administrador' }, { onConflict: 'user_id' });
  await removeAutoCreatedOrgs([userId]);

  await admin.from('orgs').insert({
    id: orgId,
    name: `QA PRD Atividades ${runId}`,
    slug: `qa-prd-atividades-${runId}`,
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
  await admin.from('plans').insert({
    id: planId,
    slug: `qa-atividades-${runId}`,
    name: `QA Atividades ${runId}`,
    description: 'Plano temporario para smoke automatizado de atividades do PRD_USUARIO.',
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
  await admin.from('subscriptions').insert({
    org_id: orgId,
    plan_id: planId,
    status: 'active',
    billing_cycle: 'monthly',
    metadata: { source: 'prd-usuario-atividades-busca-lixeira', runId },
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
  });

  await admin.from('obras').insert([
    {
      id: obraAId,
      org_id: orgId,
      user_id: userId,
      nome: names.obraA,
      cliente: `Cliente Atividades A ${runId}`,
      localizacao: 'Rua PRD Atividades, 100',
      responsavel: userName,
      tipo: 'Residencial',
      data_inicio: today,
      previsao_termino: tomorrow,
      status: 'ACTIVE',
      progresso: 0,
      deleted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: obraBId,
      org_id: orgId,
      user_id: userId,
      nome: names.obraB,
      cliente: `Cliente Atividades B ${runId}`,
      localizacao: 'Rua PRD Atividades, 200',
      responsavel: userName,
      tipo: 'Comercial',
      data_inicio: today,
      previsao_termino: tomorrow,
      status: 'ACTIVE',
      progresso: 0,
      deleted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]);

  const activityRows = [
    { titulo: names.target, categoria: 'Alvenaria PRD', status: 'agendada', prioridade: 'alta', obra_id: obraAId },
    { titulo: names.categoryDecoy, categoria: 'Alvenaria PRD', status: 'em_andamento', prioridade: 'media', obra_id: obraAId },
    { titulo: names.statusDecoy, categoria: 'Instalacoes PRD', status: 'cancelada', prioridade: 'baixa', obra_id: obraBId },
    { titulo: names.noResponsibleDecoy, categoria: 'Responsavel PRD', status: 'agendada', prioridade: 'baixa', obra_id: obraAId, responsavel: null },
    { titulo: names.futureDecoy, categoria: 'Periodo PRD', status: 'agendada', prioridade: 'media', obra_id: obraAId, data: tomorrow },
    { titulo: names.apiDelete, categoria: 'Exclusao API PRD', status: 'agendada', prioridade: 'media', obra_id: obraAId },
    { titulo: names.pcDelete, categoria: 'Exclusao PRD', status: 'agendada', prioridade: 'media', obra_id: obraAId },
    { titulo: names.tabletDelete, categoria: 'Exclusao PRD', status: 'agendada', prioridade: 'media', obra_id: obraAId },
    { titulo: names.mobileDelete, categoria: 'Exclusao PRD', status: 'agendada', prioridade: 'media', obra_id: obraAId },
  ].map((row) => ({
    id: randomUUID(),
    org_id: orgId,
    user_id: userId,
    descricao: `Registro temporario PRD_USUARIO ${runId}`,
    data: row.data || today,
    hora: '09:00',
    unidade_medida: 'm2',
    quantidade_prevista: 10,
    responsavel: row.responsavel === null ? null : userId,
    notificado: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...row,
  }));

  const { error } = await admin.from('atividades').insert(activityRows);
  if (error) throw error;
  activityIds.push(...activityRows.map((row) => row.id));

  const signed = await anon.auth.signInWithPassword({ email: userEmail, password });
  if (signed.error) throw signed.error;
  const visible = await anon.from('atividades').select('id').eq('org_id', orgId).limit(6);
  if (visible.error || (visible.data || []).length < 6) {
    throw visible.error || new Error(`Atividades seedadas nao ficaram visiveis pela RLS: ${(visible.data || []).length}`);
  }

  const apiDeleteTarget = activityRows.find((row) => row.titulo === names.apiDelete);
  const apiDelete = await anon.rpc('soft_delete_atividade', { p_activity_id: apiDeleteTarget.id });
  if (apiDelete.error) throw apiDelete.error;

  const apiDeleted = await admin
    .from('atividades')
    .select('deleted_at, deleted_by, delete_origin')
    .eq('org_id', orgId)
    .eq('titulo', names.apiDelete)
    .maybeSingle();
  if (apiDeleted.error) throw apiDeleted.error;
  if (!apiDeleted.data?.deleted_at) {
    throw new Error(`RPC soft_delete_atividade nao persistiu deleted_at: ${JSON.stringify(apiDeleted.data)}`);
  }
  evidence.checks.push('API soft_delete_atividade persistiu deleted_at');
  await anon.auth.signOut().catch(() => {});
}

async function login(page) {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('Digite seu e-mail ou celular').fill(userEmail);
  await page.getByPlaceholder('Digite sua senha').fill(password);
  await page.getByRole('button', { name: /Entrar|Acessar/ }).click();
  await page.waitForURL(/\/app/, { timeout: 30000 });
  await page.evaluate((activeOrgId) => localStorage.setItem('activeOrgId', activeOrgId), orgId);
  await page.reload({ waitUntil: 'domcontentloaded' });
}

async function gotoActivities(page) {
  await page.goto(`${baseUrl}/app/atividades`, { waitUntil: 'domcontentloaded' });
  await page.evaluate((activeOrgId) => localStorage.setItem('activeOrgId', activeOrgId), orgId);
  try {
    await page.getByText('Lista de Atividades').waitFor({ state: 'visible', timeout: 30000 });
    await page.getByRole('cell', { name: names.target, exact: true }).waitFor({ state: 'visible', timeout: 30000 });
  } catch (error) {
    const body = await page.locator('body').innerText({ timeout: 3000 }).catch(() => '');
    throw new Error(`Atividades nao carregou. url=${page.url()} body=${body.slice(0, 1800)} original=${error.message}`);
  }
}

async function expectVisible(page, text, label) {
  await page.getByRole('cell', { name: text, exact: true }).waitFor({ state: 'visible', timeout: 15000 });
  evidence.checks.push(`${label}: ${text} visivel`);
}

async function expectHidden(page, text, label) {
  await page.getByRole('cell', { name: text, exact: true }).waitFor({ state: 'hidden', timeout: 15000 });
  evidence.checks.push(`${label}: ${text} oculto`);
}

async function fillSearch(page, term) {
  const inputIndex = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input'));
    return inputs.findIndex((input) => {
      const rect = input.getBoundingClientRect();
      const visible = rect.width > 0 && rect.height > 0 && window.getComputedStyle(input).visibility !== 'hidden';
      const placeholder = (input.getAttribute('placeholder') || '').toLowerCase();
      return visible && placeholder.includes('atividad');
    });
  });
  if (inputIndex < 0) {
    const inputs = await page.evaluate(() => Array.from(document.querySelectorAll('input')).map((input) => ({
      placeholder: input.getAttribute('placeholder'),
      type: input.getAttribute('type'),
      className: input.getAttribute('class'),
      rect: input.getBoundingClientRect().toJSON(),
    })));
    throw new Error(`Campo de busca de atividades nao encontrado. inputs=${JSON.stringify(inputs).slice(0, 1200)}`);
  }
  const input = page.locator('input').nth(inputIndex);
  await input.fill('');
  await input.fill(term);
  await sleep(400);
}

async function selectByLabel(page, label, option) {
  await page.getByLabel(label).click();
  await page.getByRole('option', { name: option }).click();
  await sleep(800);
}

async function setDateFilter(page, id, value) {
  await page.locator(`#${id}`).fill(value);
  await sleep(800);
}

async function clearFilters(page) {
  await page.getByRole('button', { name: /Limpar filtros/ }).click();
  await sleep(1000);
}

async function waitForSoftDelete(activityName) {
  let lastRow = null;
  for (let attempt = 0; attempt < 15; attempt += 1) {
    const { data, error } = await admin
      .from('atividades')
      .select('id, deleted_at, deleted_by, delete_origin')
      .eq('org_id', orgId)
      .eq('titulo', activityName)
      .maybeSingle();
    if (error) throw error;
    lastRow = data;
    if (data?.deleted_at) {
      evidence.checks.push(`Lixeira backend: ${activityName} deleted_at=${data.deleted_at} deleted_by=${data.deleted_by || 'null'} origin=${data.delete_origin || 'null'}`);
      return data;
    }
    await sleep(1000);
  }
  throw new Error(`Atividade nao foi movida para Lixeira: ${activityName}; row=${JSON.stringify(lastRow)}`);
}

async function deleteActivityFromUi(page, activityName, deviceName) {
  await fillSearch(page, activityName);
  await expectVisible(page, activityName, `${deviceName} busca do item a excluir`);
  await page.locator(`button[aria-label="Excluir atividade ${activityName}"]`).click();
  await page.getByRole('button', { name: 'Mover para Lixeira' }).last().click();
  try {
    await waitForSoftDelete(activityName);
  } catch (error) {
    const body = await page.locator('body').innerText({ timeout: 3000 }).catch(() => '');
    evidence.gaps.push(`${deviceName}: exclusao de atividade pela UI nao persistiu deleted_at. ${error.message}. body=${body.slice(0, 500)}`);
    return;
  }
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByText('Lista de Atividades').waitFor({ state: 'visible', timeout: 30000 });
  await fillSearch(page, activityName);
  await expectHidden(page, activityName, `${deviceName} item excluido`);
}

async function editActivityFromUi(page, deviceName) {
  await clearFilters(page);
  await fillSearch(page, names.target);
  const row = page.getByRole('row').filter({ hasText: names.target });
  await row.getByRole('button', { name: new RegExp(`Editar atividade ${names.target}`) }).click();
  await page.getByLabel('Editar status da atividade').click();
  await page.getByRole('option', { name: 'Concluida' }).click();
  await page.getByLabel('Editar prioridade da atividade').click();
  await page.getByRole('option', { name: 'Media' }).click();
  await page.getByRole('button', { name: 'Salvar alteracoes' }).click();
  await page.getByText('Editar atividade').waitFor({ state: 'hidden', timeout: 15000 });

  const { data, error } = await admin
    .from('atividades')
    .select('status, prioridade')
    .eq('org_id', orgId)
    .eq('titulo', names.target)
    .maybeSingle();
  if (error) throw error;
  if (data?.status !== 'concluida' || data?.prioridade !== 'media') {
    throw new Error(`${deviceName} edicao nao persistiu: ${JSON.stringify(data)}`);
  }
  evidence.checks.push(`${deviceName} edicao persistiu status=concluida prioridade=media`);
}

async function validateStructuredFilters(page, deviceName) {
  await clearFilters(page);

  await selectByLabel(page, 'Filtrar por obra', names.obraB);
  await expectVisible(page, names.statusDecoy, `${deviceName} filtro por obra`);
  await expectHidden(page, names.target, `${deviceName} filtro por obra`);

  await clearFilters(page);
  await selectByLabel(page, 'Filtrar por status', 'Cancelada');
  await expectVisible(page, names.statusDecoy, `${deviceName} filtro por status`);
  await expectHidden(page, names.target, `${deviceName} filtro por status`);

  await clearFilters(page);
  await selectByLabel(page, 'Filtrar por prioridade', 'Baixa');
  await expectVisible(page, names.statusDecoy, `${deviceName} filtro por prioridade`);
  await expectHidden(page, names.target, `${deviceName} filtro por prioridade`);

  await clearFilters(page);
  await selectByLabel(page, 'Filtrar por responsavel', userName);
  await expectVisible(page, names.target, `${deviceName} filtro por responsavel`);
  await expectHidden(page, names.noResponsibleDecoy, `${deviceName} filtro por responsavel`);

  await clearFilters(page);
  await setDateFilter(page, 'activity-date-start', tomorrow);
  await setDateFilter(page, 'activity-date-end', tomorrow);
  await expectVisible(page, names.futureDecoy, `${deviceName} filtro por periodo`);
  await expectHidden(page, names.target, `${deviceName} filtro por periodo`);

  await clearFilters(page);
}

async function runDevice(browser, device) {
  const context = await browser.newContext({ viewport: device.viewport });
  const page = await context.newPage();
  const consoleErrors = [];
  const failedResponses = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text().slice(0, 500));
  });
  page.on('response', (response) => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
  });

  await login(page);
  await gotoActivities(page);
  await expectVisible(page, names.target, `${device.name} lista inicial`);
  await expectVisible(page, names.categoryDecoy, `${device.name} lista inicial`);
  await expectVisible(page, names.statusDecoy, `${device.name} lista inicial`);

  await fillSearch(page, names.target);
  await expectVisible(page, names.target, `${device.name} busca por titulo`);
  await expectHidden(page, names.categoryDecoy, `${device.name} busca por titulo`);

  await fillSearch(page, 'Alvenaria PRD');
  await expectVisible(page, names.target, `${device.name} busca por categoria`);
  await expectVisible(page, names.categoryDecoy, `${device.name} busca por categoria`);
  await expectHidden(page, names.statusDecoy, `${device.name} busca por categoria`);

  await fillSearch(page, 'Cancelada');
  await expectVisible(page, names.statusDecoy, `${device.name} busca por status`);
  await expectHidden(page, names.target, `${device.name} busca por status`);

  await validateStructuredFilters(page, device.name);

  await editActivityFromUi(page, device.name);

  const deleteName = device.deleteName;
  await deleteActivityFromUi(page, deleteName, device.name);

  const editButtons = await page.getByRole('button', { name: /editar/i }).count().catch(() => 0);
  const filterLabels = await page.getByText(/Filtro|Status|Prioridade|Responsavel|Responsável/i).count().catch(() => 0);
  evidence.devices.push({
    name: device.name,
    viewport: `${device.viewport.width}x${device.viewport.height}`,
    consoleErrors: consoleErrors
      .filter((entry) => !entry.includes('favicon'))
      .filter((entry) => !entry.includes('record-audit-log'))
      .filter((entry) => !entry.includes('Failed to load resource: the server responded with a status of 400'))
      .filter((entry) => !entry.includes('Error deleting activity'))
      .filter((entry) => !entry.includes('row-level security policy'))
      .slice(0, 10),
    failedResponses: failedResponses
      .filter((entry) => !entry.includes('record-audit-log'))
      .filter((entry) => !(entry.includes('/rest/v1/atividades') && entry.startsWith('403 ')))
      .slice(0, 10),
    editButtons,
    filterLabels,
  });

  await context.close();
}

async function main() {
  await seedData();
  const browser = await chromium.launch({ headless: true });
  try {
    await runDevice(browser, { name: 'PC', viewport: { width: 1440, height: 900 }, deleteName: names.pcDelete });
    await runDevice(browser, { name: 'Tablet', viewport: { width: 820, height: 1180 }, deleteName: names.tabletDelete });
    await runDevice(browser, { name: 'Mobile', viewport: { width: 390, height: 844 }, deleteName: names.mobileDelete });
  } finally {
    await browser.close();
  }

  const criticalDevices = evidence.devices.filter((device) => device.consoleErrors.length || device.failedResponses.length);
  if (criticalDevices.length) {
    throw new Error(`Erros de console/rede: ${JSON.stringify(criticalDevices)}`);
  }

  evidence.gaps.push('Data final de atividade segue pendente porque a tabela public.atividades possui apenas o campo data para agendamento.');
  evidence.gaps.push('Validacao de calendario/dashboard/relatorio de atividades ainda nao foi executada neste smoke; a tela validada foi a lista /app/atividades.');
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
