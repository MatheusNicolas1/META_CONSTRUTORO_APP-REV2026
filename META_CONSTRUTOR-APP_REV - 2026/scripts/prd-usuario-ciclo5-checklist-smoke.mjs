import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

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
const email = `prd-usuario-ciclo5-${runId}@teste.com`;
const password = 'Teste@1234!';
const orgId = randomUUID();
const obraId = randomUUID();
const equipeId = randomUUID();
const obraName = `Obra Checklist PRD ${runId}`;
const equipeName = `Responsavel Checklist PRD ${runId}`;
const responsibleName = 'QA PRD Usuario Ciclo 5';
const checklistTitle = `Checklist PRD Usuario ${runId}`;
const checklistDescription = `Checklist criado pelo smoke PRD Usuario ${runId}`;
const observationText = `Observacao de item PRD Usuario ${runId}`;
const evidencePath = path.resolve('docs/evidence', `prd-usuario-checklist-evidencia-${runId}.png`);

let userId = null;
let checklistId = null;
let itemId = null;
let itemTitle = null;
let documentRows = [];

const evidence = {
  runId,
  user: email,
  device: deviceName,
  viewport: `${viewportWidth}x${viewportHeight}`,
  checks: [],
  cleanup: [],
  errors: [],
};

async function cleanup() {
  try {
    const docsResult = await admin
      .from('documentos')
      .select('id, url')
      .eq('org_id', orgId);
    const docs = [...documentRows, ...(docsResult.data || [])]
      .filter((doc, index, all) => doc?.id && all.findIndex((item) => item.id === doc.id) === index);

    if (docs.length) {
      const storagePaths = docs
        .map((doc) => doc.url)
        .filter(Boolean)
        .map((url) => {
          const marker = '/storage/v1/object/public/documentos/';
          if (url.includes(marker)) return decodeURIComponent(url.split(marker)[1]);
          return url;
        });
      if (storagePaths.length) await admin.storage.from('documentos').remove(storagePaths);
      await admin.from('documentos').delete().in('id', docs.map((doc) => doc.id));
      evidence.cleanup.push('documentos/storage');
    }

    if (checklistId) {
      await admin.from('checklist_items').delete().eq('checklist_id', checklistId);
      await admin.from('checklists').delete().eq('id', checklistId);
      evidence.cleanup.push('checklists/items');
    } else {
      const { data: checklists } = await admin.from('checklists').select('id').eq('org_id', orgId);
      const ids = (checklists || []).map((item) => item.id);
      if (ids.length) {
        await admin.from('checklist_items').delete().in('checklist_id', ids);
        await admin.from('checklists').delete().in('id', ids);
      }
      evidence.cleanup.push('checklists/items');
    }

    await admin.from('equipes').delete().eq('id', equipeId);
    evidence.cleanup.push('equipes');
    await admin.from('obras').delete().eq('id', obraId);
    evidence.cleanup.push('obras');
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

    await fs.rm(evidencePath, { force: true });
  } catch (error) {
    evidence.errors.push(`cleanup: ${error.message}`);
  }
}

async function chooseFirstCalendarDay(page) {
  const selectors = [
    'button.rdp-day:not([disabled])',
    '[role="grid"] button:not([disabled])',
    '.rdp-button:not([disabled])',
  ];

  for (const selector of selectors) {
    const locator = page.locator(selector);
    const count = await locator.count().catch(() => 0);
    if (count > 0) {
      await locator.nth(Math.min(1, count - 1)).click({ force: true });
      await page.keyboard.press('Escape').catch(() => {});
      return;
    }
  }

  throw new Error('Nao encontrou dia selecionavel no calendario');
}

async function selectOptionWithRetry(page, trigger, optionName, label, timeoutMs = 30000) {
  const startedAt = Date.now();
  let lastOptions = [];
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
      lastOptions = await page.locator('[role="option"]').allInnerTexts().catch(() => []);
      lastBodyText = await page.locator('body').innerText({ timeout: 2000 }).catch(() => '');
      if (lastOptions.length === 0) {
        lastOptions = [`trigger/option retry: ${error.message}`];
      }
      await page.waitForTimeout(1000);
    }
  }

  throw new Error(`${label} nao apareceu no select. options=${JSON.stringify(lastOptions)} texto=${lastBodyText.slice(0, 1200)}`);
}

async function removeAutoCreatedOrgs(userIds) {
  const { data: memberships, error } = await admin
    .from('org_members')
    .select('org_id')
    .in('user_id', userIds);

  if (error) throw error;

  const autoOrgIds = [...new Set((memberships || []).map((membership) => membership.org_id).filter(Boolean))];
  await admin.from('org_members').delete().in('user_id', userIds);

  if (autoOrgIds.length === 0) return;
  await admin.from('subscriptions').delete().in('org_id', autoOrgIds);
  await admin.from('org_credits').delete().in('org_id', autoOrgIds);
  await admin.from('orgs').delete().in('id', autoOrgIds);
}

async function waitForChecklist() {
  let lastError = null;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const result = await admin
      .from('checklists')
      .select('id, titulo, descricao, categoria, status, obra_id, responsavel_id, org_id, checklist_items(id, titulo, status, observacoes, requer_anexo)')
      .eq('org_id', orgId)
      .eq('titulo', checklistTitle)
      .maybeSingle();

    if (result.error) lastError = result.error;
    if (result.data?.id) return result.data;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw lastError || new Error('Checklist nao persistiu');
}

async function waitForItemUpdate(expected) {
  let lastError = null;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const result = await admin
      .from('checklist_items')
      .select('id, status, observacoes')
      .eq('id', itemId)
      .maybeSingle();

    if (result.error) lastError = result.error;
    const item = result.data;
    if (
      item?.id &&
      (!expected.status || item.status === expected.status) &&
      (!expected.observacoes || item.observacoes === expected.observacoes)
    ) {
      return item;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw lastError || new Error(`Item nao atualizou: ${JSON.stringify(expected)}`);
}

async function waitForAttachment() {
  let lastError = null;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const result = await admin
      .from('documentos')
      .select('id, nome, url, checklist_item_id, org_id')
      .eq('org_id', orgId)
      .eq('checklist_item_id', itemId)
      .maybeSingle();

    if (result.error) lastError = result.error;
    if (result.data?.id) return result.data;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw lastError || new Error('Evidencia do checklist nao persistiu');
}

async function main() {
  await fs.writeFile(
    evidencePath,
    Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lb2q8QAAAABJRU5ErkJggg==', 'base64'),
  );

  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: 'QA PRD Usuario Ciclo 5' },
  });
  if (created.error) throw created.error;
  userId = created.data.user.id;

  await admin.from('profiles').upsert({
    id: userId,
    name: responsibleName,
    email,
    plan_type: 'enterprise',
    has_seen_onboarding: true,
    updated_at: new Date().toISOString(),
  });
  await admin.from('user_settings').upsert({ user_id: userId, theme: 'light' }, { onConflict: 'user_id' });
  await admin.from('user_roles').upsert({ user_id: userId, role: 'Administrador' }, { onConflict: 'user_id' });
  await removeAutoCreatedOrgs([userId]);

  await admin.from('orgs').insert({
    id: orgId,
    name: `QA PRD Checklist ${runId}`,
    slug: `qa-prd-checklist-${runId}`,
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

  const { data: plan } = await admin
    .from('plans')
    .select('id')
    .eq('is_active', true)
    .gte('max_obras', 1)
    .limit(1)
    .maybeSingle();

  if (plan?.id) {
    await admin.from('subscriptions').insert({
      org_id: orgId,
      plan_id: plan.id,
      status: 'active',
      billing_cycle: 'monthly',
      metadata: { source: 'prd-usuario-ciclo5', runId },
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
    });
  }

  const { error: obraInsertError } = await admin.from('obras').insert({
    id: obraId,
    nome: obraName,
    cliente: `Cliente Checklist ${runId}`,
    localizacao: 'Rua PRD Checklist, 123',
    responsavel: 'QA Checklist',
    tipo: 'Residencial',
    data_inicio: new Date().toISOString().split('T')[0],
    previsao_termino: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    status: 'ACTIVE',
    user_id: userId,
    org_id: orgId,
    progresso: 0,
    deleted_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (obraInsertError) throw obraInsertError;

  const { data: seededObra, error: seededObraError } = await admin
    .from('obras')
    .select('id, nome, org_id, user_id, deleted_at')
    .eq('id', obraId)
    .is('deleted_at', null)
    .maybeSingle();
  if (seededObraError || !seededObra?.id) {
    throw seededObraError || new Error('Seed da obra nao ficou visivel para filtro deleted_at null');
  }

  const signed = await anon.auth.signInWithPassword({ email, password });
  if (signed.error) throw signed.error;
  const userVisibleObras = await anon
    .from('obras')
    .select('id, nome, org_id, user_id')
    .or(`org_id.eq.${orgId},user_id.eq.${userId}`)
    .is('deleted_at', null);
  await anon.auth.signOut().catch(() => {});
  if (userVisibleObras.error || !userVisibleObras.data?.some((obra) => obra.id === obraId)) {
    throw userVisibleObras.error || new Error(`Obra nao visivel via RLS para usuario autenticado: ${JSON.stringify(userVisibleObras.data || [])}`);
  }

  await admin.from('equipes').insert({
    id: equipeId,
    nome: equipeName,
    funcao: 'Responsavel QA',
    email,
    telefone: '(71) 98888-0000',
    ativo: true,
    user_id: userId,
    org_id: orgId,
  });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: viewportWidth, height: viewportHeight },
    acceptDownloads: true,
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const failedResponses = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(`${page.url()} :: ${message.text()}`);
  });
  page.on('response', (response) => {
    if (response.status() >= 500) failedResponses.push(`${response.status()} ${response.url()}`);
  });
  await page.route('**/functions/v1/accept-invite', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, activated: 0, memberships: [] }),
  }));

  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('Digite seu e-mail ou celular').fill(email);
  await page.getByPlaceholder('Digite sua senha').fill(password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  try {
    await page.waitForURL(`${baseUrl}/app/dashboard`, { timeout: 30000 });
  } catch (error) {
    const bodyText = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
    throw new Error(`Login nao redirecionou. url=${page.url()} texto=${bodyText.slice(0, 1200)} console=${JSON.stringify(consoleErrors.slice(-5))}`);
  }
  evidence.checks.push('login autenticado para ciclo de checklists');

  await page.goto(`${baseUrl}/app/checklist`, { waitUntil: 'domcontentloaded' });
  await page.getByText(/Responsaveis|Responsáveis/).waitFor({ state: 'visible', timeout: 30000 });
  await page.getByRole('button', { name: /Novo Checklist|Adicionar/ }).click();
  const dialog = page.getByRole('dialog').filter({ hasText: /Criar Novo Checklist/ });
  await dialog.locator('#title').fill(checklistTitle);
  const formComboboxes = dialog.locator('button[role="combobox"]');
  await selectOptionWithRetry(
    page,
    formComboboxes.nth(0),
    /Seguran/,
    'Categoria',
  );
  await selectOptionWithRetry(
    page,
    formComboboxes.nth(1),
    obraName,
    'Obra',
  );
  await selectOptionWithRetry(
    page,
    formComboboxes.nth(2),
    new RegExp(responsibleName),
    'Responsavel',
  );
  await dialog.getByRole('button', { name: /Selecione a data/ }).click({ force: true });
  await chooseFirstCalendarDay(page);
  await dialog.locator('#description').fill(checklistDescription);
  await dialog.getByRole('button', { name: /Template/ }).click();
  await dialog.getByRole('button', { name: /Usar Template/ }).first().click();
  await dialog.locator('input[value*="Verificar EPIs"]').waitFor({ state: 'visible', timeout: 15000 });
  const createChecklistButton = dialog.getByRole('button', { name: /Criar Checklist/ });
  for (let attempt = 0; attempt < 10; attempt += 1) {
    if (await createChecklistButton.isEnabled().catch(() => false)) break;
    await page.waitForTimeout(1000);
  }
  if (!(await createChecklistButton.isEnabled().catch(() => false))) {
    const comboTexts = await formComboboxes.allInnerTexts().catch(() => []);
    const dateButtons = await dialog.getByRole('button').allInnerTexts().catch(() => []);
    const bodyText = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
    throw new Error(`Botao Criar Checklist permaneceu desabilitado. combos=${JSON.stringify(comboTexts)} buttons=${JSON.stringify(dateButtons)} texto=${bodyText.slice(0, 1600)}`);
  }
  await createChecklistButton.click();

  let checklist;
  try {
    checklist = await waitForChecklist();
  } catch (error) {
    const rows = await admin.from('checklists').select('id, titulo, org_id, responsavel_id').eq('org_id', orgId);
    const bodyText = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
    throw new Error(`Checklist nao persistiu apos submit. rows=${JSON.stringify(rows.data || [])} body=${bodyText.slice(0, 1600)} console=${JSON.stringify(consoleErrors.slice(-8))}`);
  }
  checklistId = checklist.id;
  if (checklist.obra_id !== obraId) throw new Error(`Checklist nao vinculou obra correta: ${JSON.stringify(checklist)}`);
  if (!Array.isArray(checklist.checklist_items) || checklist.checklist_items.length < 3) {
    throw new Error(`Template nao criou itens suficientes: ${JSON.stringify(checklist.checklist_items)}`);
  }
  const targetItem = checklist.checklist_items.find((item) => item.titulo?.includes('Verificar EPIs')) || checklist.checklist_items[0];
  itemId = targetItem.id;
  itemTitle = targetItem.titulo;
  evidence.checks.push('checklist criado por template e vinculado a obra no backend');

  await page.getByText(checklistTitle).waitFor({ state: 'visible', timeout: 20000 });
  await page.getByPlaceholder(/Buscar checklists/i).fill(checklistTitle);
  await page.getByText(checklistTitle).waitFor({ state: 'visible', timeout: 15000 });
  evidence.checks.push('listagem e filtro textual encontraram checklist criado');

  await page.getByRole('button', { name: /Visualizar/ }).first().click();
  await page.waitForURL(new RegExp(`/app/checklist/${checklistId}$`), { timeout: 20000 });
  await page.getByRole('heading', { name: /Itens do Checklist/ }).waitFor({ state: 'visible', timeout: 15000 });
  evidence.checks.push('detalhe do checklist abriu pela rota dinamica');

  const itemCard = page.locator('.print-no-break').filter({ hasText: itemTitle }).first();
  await itemCard.getByRole('checkbox').first().click({ force: true });
  await waitForItemUpdate({ status: 'Concluído' });
  evidence.checks.push('item de checklist marcado como concluido persistiu no backend');

  const firstObservation = itemCard.locator('textarea').first();
  await firstObservation.fill(observationText);
  await firstObservation.press('Tab');
  await firstObservation.evaluate((element) => element.blur()).catch(() => {});
  await page.getByText(/Observa[cç][aã]o atualizada|Salvo/).first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  await waitForItemUpdate({ status: 'Concluído', observacoes: observationText });
  evidence.checks.push('observacao de item persistiu no backend');

  await itemCard.locator('input[type="file"]').first().setInputFiles(evidencePath);
  const attachment = await waitForAttachment();
  documentRows = [attachment];
  await page.getByText(/Salvo/).first().waitFor({ state: 'visible', timeout: 20000 });
  evidence.checks.push('evidencia/anexo de item persistiu em documentos');

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    (text) => Array.from(document.querySelectorAll('textarea')).some((element) => element.value === text),
    observationText,
    { timeout: 20000 },
  );
  await page.getByText(/Salvo/).first().waitFor({ state: 'visible', timeout: 20000 });
  evidence.checks.push('reload preservou item, observacao e anexo do checklist');

  evidence.consoleErrors = consoleErrors
    .filter((entry) => !entry.includes('favicon') && !entry.includes('Failed to load resource: the server responded with a status of 400'))
    .slice(0, 10);
  evidence.failedResponses = failedResponses.slice(0, 10);

  await browser.close();

  if (evidence.consoleErrors.length || evidence.failedResponses.length) {
    throw new Error(`Erros de console/rede: ${JSON.stringify({
      consoleErrors: evidence.consoleErrors,
      failedResponses: evidence.failedResponses,
    })}`);
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
