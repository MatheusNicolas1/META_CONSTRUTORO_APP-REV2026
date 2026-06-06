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
const adminEmail = `prd-usuario-ciclo5b-admin-${runId}@teste.com`;
const collaboratorEmail = `prd-usuario-ciclo5b-colab-${runId}@teste.com`;
const orgId = randomUUID();
const obraId = randomUUID();
const checklistTitle = `Checklist Manual PRD ${runId}`;
const editedChecklistTitle = `${checklistTitle} Editado`;
const checklistDescription = `Checklist manual criado no ciclo complementar ${runId}`;
const editedChecklistDescription = `Descricao editada no ciclo complementar ${runId}`;
const obraName = `Obra Checklist Manual PRD ${runId}`;
const adminName = 'Admin PRD Usuario Ciclo 5B';
const collaboratorName = 'Colaborador PRD Usuario Ciclo 5B';
const itemOneTitle = `Item nao conforme PRD ${runId}`;
const itemTwoTitle = `Item nao aplicavel PRD ${runId}`;

let adminUserId = null;
let collaboratorUserId = null;
let checklistId = null;

const evidence = {
  runId,
  device: deviceName,
  viewport: `${viewportWidth}x${viewportHeight}`,
  adminUser: adminEmail,
  collaboratorUser: collaboratorEmail,
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
  adminUserId = await createUser(adminEmail, adminName, 'Administrador');
  collaboratorUserId = await createUser(collaboratorEmail, collaboratorName, 'Colaborador');
  await removeAutoCreatedOrgs([adminUserId, collaboratorUserId]);

  await admin.from('orgs').insert({
    id: orgId,
    name: `QA PRD Checklist Complementar ${runId}`,
    slug: `qa-prd-checklist-complementar-${runId}`,
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
      metadata: { source: 'prd-usuario-ciclo5b', runId },
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
    });
  }

  const { error: obraInsertError } = await admin.from('obras').insert({
    id: obraId,
    nome: obraName,
    cliente: `Cliente Checklist Manual ${runId}`,
    localizacao: 'Rua PRD Checklist Manual, 123',
    responsavel: 'QA Checklist Manual',
    tipo: 'Residencial',
    data_inicio: new Date().toISOString().split('T')[0],
    previsao_termino: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    status: 'ACTIVE',
    user_id: adminUserId,
    org_id: orgId,
    progresso: 0,
    deleted_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (obraInsertError) throw obraInsertError;

  const signed = await anon.auth.signInWithPassword({ email: adminEmail, password });
  if (signed.error) throw signed.error;
  const visibleObras = await anon
    .from('obras')
    .select('id')
    .eq('id', obraId)
    .maybeSingle();
  await anon.auth.signOut().catch(() => {});
  if (visibleObras.error || !visibleObras.data?.id) {
    throw visibleObras.error || new Error('Obra seedada nao ficou visivel pela RLS');
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
      if (!lastOptions.length) lastOptions = [`retry: ${error.message}`];
      await page.waitForTimeout(1000);
    }
  }

  throw new Error(`${label} nao apareceu no select. options=${JSON.stringify(lastOptions)} texto=${lastBodyText.slice(0, 1200)}`);
}

function selectTriggerByLabel(container, labelText) {
  return container
    .locator(`label:has-text("${labelText}")`)
    .locator('xpath=..')
    .locator('button[role="combobox"],button')
    .first();
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
  await page.waitForURL(`${baseUrl}/app/dashboard`, { timeout: 30000 });
}

async function waitForChecklistByTitle(title) {
  let lastError = null;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const result = await admin
      .from('checklists')
      .select('id, titulo, descricao, categoria, status, obra_id, responsavel_id, template_id, signature_data, signed_at, checklist_items(id, titulo, status, observacoes)')
      .eq('org_id', orgId)
      .eq('titulo', title)
      .maybeSingle();

    if (result.error) lastError = result.error;
    if (result.data?.id) return result.data;
    await sleep(1000);
  }

  throw lastError || new Error(`Checklist nao encontrado: ${title}`);
}

async function waitForChecklistStatus(expectedStatus) {
  let last = null;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const result = await admin
      .from('checklists')
      .select('id, status, signature_data, signed_at, data_aprovacao')
      .eq('id', checklistId)
      .maybeSingle();

    if (result.error) throw result.error;
    last = result.data;
    if (last?.status === expectedStatus) return last;
    await sleep(1000);
  }

  throw new Error(`Status esperado ${expectedStatus}, recebido ${JSON.stringify(last)}`);
}

async function waitForItemStatus(title, expectedStatus) {
  let last = null;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const result = await admin
      .from('checklist_items')
      .select('id, titulo, status')
      .eq('checklist_id', checklistId)
      .eq('titulo', title)
      .maybeSingle();

    if (result.error) throw result.error;
    last = result.data;
    if (last?.status === expectedStatus) return last;
    await sleep(1000);
  }

  throw new Error(`Item ${title} esperava ${expectedStatus}, recebeu ${JSON.stringify(last)}`);
}

async function main() {
  await seedData();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: viewportWidth, height: viewportHeight },
    acceptDownloads: true,
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const consoleMessages = [];
  const failedResponses = [];
  const supabaseRequests = [];
  const checklistResponses = [];
  const checklistItemResponses = [];
  let pdfRequestSeen = false;
  let approvalRequestSeen = false;

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(`${page.url()} :: ${message.text()}`);
    if (['debug', 'log', 'warning'].includes(message.type())) consoleMessages.push(`${message.type()} :: ${message.text()}`);
  });
  page.on('pageerror', (error) => {
    consoleErrors.push(`${page.url()} :: pageerror ${error.message}`);
  });
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('supabase.co') && !url.includes('/functions/v1/record-audit-log')) {
      supabaseRequests.push(`${request.method()} ${url}`);
    }
  });
  page.on('response', async (response) => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
    if (response.url().includes('/rest/v1/checklists')) {
      const body = await response.text().catch(() => '');
      checklistResponses.push(`${response.status()} ${response.url()} ${body.slice(0, 500)}`);
    }
    if (response.url().includes('/rest/v1/checklist_items')) {
      const body = await response.text().catch(() => '');
      checklistItemResponses.push(`${response.status()} ${response.url()} ${body.slice(0, 500)}`);
    }
  });

  await page.route('**/functions/v1/generate-checklist-pdf', (route) => {
    pdfRequestSeen = true;
    route.fulfill({
      status: 200,
      contentType: 'application/pdf',
      headers: {
        'content-disposition': 'attachment; filename="checklist-prd.pdf"',
      },
      body: Buffer.from('%PDF-1.4\n% PRD checklist smoke\n%%EOF'),
    });
  });
  await page.route('**/functions/v1/approve-checklist', async (route) => {
    approvalRequestSeen = true;
    const body = route.request().postDataJSON();
    const now = new Date().toISOString();
    const { error } = await admin
      .from('checklists')
      .update({
        aprovado_por_id: adminUserId,
        data_aprovacao: now,
        status: 'Concluído',
        completed_at: now,
        signature_name: body.signature?.signerName || adminName,
        signature_email: body.signature?.signerEmail || adminEmail,
        signature_data: body.signature?.signatureData || 'data:image/png;base64,prd',
        signed_at: body.signature?.signedAt || now,
        updated_at: now,
      })
      .eq('id', body.checklist_id);
    if (error) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: { message: error.message } }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  await login(page, adminEmail);
  await page.evaluate((activeOrgId) => localStorage.setItem('activeOrgId', activeOrgId), orgId);
  evidence.checks.push('login admin autenticado');

  await page.goto(`${baseUrl}/app/checklist`, { waitUntil: 'domcontentloaded' });
  await page.evaluate((activeOrgId) => localStorage.setItem('activeOrgId', activeOrgId), orgId);
  await page.getByText(/Responsaveis|Responsáveis/).waitFor({ state: 'visible', timeout: 30000 });
  await page.getByRole('button', { name: /Novo Checklist|Adicionar/ }).click();
  const dialog = page.getByRole('dialog').filter({ hasText: /Criar Novo Checklist/ });
  await dialog.locator('#title').fill(checklistTitle);
  await selectOptionWithRetry(page, dialog.getByLabel('Categoria do checklist'), 'Qualidade', 'Categoria');
  await selectOptionWithRetry(page, dialog.getByLabel('Obra do checklist'), obraName, 'Obra');
  evidence.checks.push('responsavel do checklist autopreenchido a partir dos membros da organizacao');
  const dateButton = page.locator('button').filter({ hasText: /Selecione a data/ }).last();
  if (!(await dateButton.isVisible({ timeout: 5000 }).catch(() => false))) {
    const buttons = await page.locator('button').allInnerTexts().catch(() => []);
    const bodyText = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
    throw new Error(`Botao de data nao localizado. buttons=${JSON.stringify(buttons)} texto=${bodyText.slice(0, 1600)}`);
  }
  await dateButton.click({ force: true });
  await chooseFirstCalendarDay(page);
  await dialog.locator('#description').fill(checklistDescription);
  await dialog.getByRole('button', { name: /Pr[oó]ximo: Template/ }).click();
  await dialog.getByRole('button', { name: /Pr[oó]ximo: Itens/ }).click();

  await dialog.locator('#item-title').fill(itemOneTitle);
  await dialog.locator('#item-description').fill('Item criado manualmente para status nao conforme.');
  await dialog.getByRole('button', { name: /Adicionar Item/ }).click();
  await dialog.locator('#item-title').fill(itemTwoTitle);
  await dialog.locator('#item-description').fill('Item criado manualmente para status nao aplicavel.');
  await dialog.getByRole('button', { name: /Adicionar Item/ }).click();
  const createChecklistButton = dialog.locator('button').filter({ hasText: /^Criar Checklist$/ }).last();
  const submitDiagnostics = await createChecklistButton.evaluate((button) => ({
    text: button.textContent,
    disabled: button.disabled,
    ariaDisabled: button.getAttribute('aria-disabled'),
    type: button.getAttribute('type'),
    className: button.getAttribute('class'),
  })).catch((error) => ({ error: error.message }));
  const dialogButtonsBeforeSubmit = await dialog.locator('button').evaluateAll((buttons) =>
    buttons.map((button) => ({
      text: button.textContent,
      disabled: button.disabled,
      ariaDisabled: button.getAttribute('aria-disabled'),
      role: button.getAttribute('role'),
    }))
  ).catch(() => []);
  if (await createChecklistButton.isDisabled().catch(() => false)) {
    await dialog.getByRole('button', { name: /Voltar/ }).click();
    await dialog.getByRole('button', { name: /Voltar/ }).click();
    const basicText = await dialog.innerText({ timeout: 5000 }).catch(() => '');
    throw new Error(`Botao Criar Checklist desabilitado antes do submit. basic=${basicText.slice(0, 1600)}`);
  }
  await createChecklistButton.click({ force: true });

  let createdChecklist;
  try {
    createdChecklist = await waitForChecklistByTitle(checklistTitle);
  } catch (error) {
    const rows = await admin.from('checklists').select('id, titulo, org_id, responsavel_id').eq('org_id', orgId);
    const bodyText = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
    throw new Error(`Checklist manual nao persistiu. rows=${JSON.stringify(rows.data || [])} submit=${JSON.stringify(submitDiagnostics)} buttons=${JSON.stringify(dialogButtonsBeforeSubmit)} body=${bodyText.slice(0, 1600)} console=${JSON.stringify(consoleErrors.slice(-8))} messages=${JSON.stringify(consoleMessages.slice(-8))} supabaseRequests=${JSON.stringify(supabaseRequests.slice(-20))} checklistResponses=${JSON.stringify(checklistResponses.slice(-8))} responses=${JSON.stringify(failedResponses.slice(-20))} original=${error.message}`);
  }
  checklistId = createdChecklist.id;
  if (createdChecklist.template_id) throw new Error('Checklist manual recebeu template_id inesperado');
  if (createdChecklist.checklist_items.length !== 2) {
    throw new Error(`Checklist manual deveria ter 2 itens: ${JSON.stringify(createdChecklist.checklist_items)}`);
  }
  evidence.checks.push('checklist do zero criado com dois itens manuais');

  await page.getByRole('heading', { name: checklistTitle }).waitFor({ state: 'visible', timeout: 20000 });
  await page.getByPlaceholder(/Buscar checklists/i).fill(checklistTitle);
  await page.getByRole('heading', { name: checklistTitle }).waitFor({ state: 'visible', timeout: 15000 });
  await selectOptionWithRetry(page, page.locator('button[role="combobox"]').filter({ hasText: /Todas|Qualidade/ }).first(), 'Qualidade', 'Filtro categoria');
  await page.getByRole('heading', { name: checklistTitle }).waitFor({ state: 'visible', timeout: 15000 });
  evidence.checks.push('busca textual e filtro de categoria encontraram checklist manual');

  await page.getByRole('button', { name: new RegExp(`Editar checklist ${checklistTitle}`) }).click();
  const editDialog = page.getByRole('dialog').filter({ hasText: /Editar Checklist/ });
  await editDialog.locator('#title').fill(editedChecklistTitle);
  await editDialog.locator('#description').fill(editedChecklistDescription);
  await editDialog.getByRole('button', { name: /Salvar Alteracoes/ }).click();
  const edited = await waitForChecklistByTitle(editedChecklistTitle);
  if (edited.descricao !== editedChecklistDescription) {
    throw new Error(`Edicao nao persistiu descricao: ${JSON.stringify(edited)}`);
  }
  evidence.checks.push('edicao de checklist aberto persistiu no backend');

  await page.getByPlaceholder(/Buscar checklists/i).fill(editedChecklistTitle);
  await page.getByRole('button', { name: /Visualizar/ }).first().click();
  await page.waitForURL(new RegExp(`/app/checklist/${checklistId}$`), { timeout: 20000 });
  await page.getByRole('heading', { name: /Itens do Checklist/ }).waitFor({ state: 'visible', timeout: 15000 });

  await selectOptionWithRetry(page, page.getByLabel(`Status do item ${itemOneTitle}`), 'Não conforme', 'Status nao conforme');
  try {
    await waitForItemStatus(itemOneTitle, 'Não conforme');
  } catch (error) {
    const bodyText = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
    throw new Error(`Status nao conforme nao persistiu. itemResponses=${JSON.stringify(checklistItemResponses.slice(-8))} failed=${JSON.stringify(failedResponses.slice(-12))} console=${JSON.stringify(consoleErrors.slice(-8))} body=${bodyText.slice(0, 1600)} original=${error.message}`);
  }
  await selectOptionWithRetry(page, page.getByLabel(`Status do item ${itemTwoTitle}`), 'Não aplicável', 'Status nao aplicavel');
  await waitForItemStatus(itemTwoTitle, 'Não aplicável');
  await page.getByText('100%').waitFor({ state: 'visible', timeout: 20000 });
  evidence.checks.push('status nao conforme e nao aplicavel persistiram e fecharam progresso');

  await page.getByRole('button', { name: /Finalizar Checklist/ }).click();
  await waitForChecklistStatus('Em Andamento');
  evidence.checks.push('finalizacao marcou checklist como Em Andamento/pronto para aprovacao');

  const downloadPromise = page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
  await page.getByRole('button', { name: /Exportar PDF/ }).click();
  await downloadPromise;
  if (!pdfRequestSeen) throw new Error('Exportacao PDF nao chamou generate-checklist-pdf');
  evidence.checks.push('exportacao PDF acionou funcao e iniciou download simulado');

  await page.getByRole('button', { name: /Assinar Digitalmente/ }).click();
  const signatureDialog = page.getByRole('dialog').filter({ hasText: /Assinatura Digital/ });
  await signatureDialog.locator('#signer-name').fill(adminName);
  const canvas = signatureDialog.locator('canvas').first();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas de assinatura sem bounding box');
  await page.mouse.move(box.x + 20, box.y + 30);
  await page.mouse.down();
  await page.mouse.move(box.x + 160, box.y + 80);
  await page.mouse.up();
  await signatureDialog.getByRole('button', { name: /Confirmar Assinatura/ }).click();
  const approved = await waitForChecklistStatus('Concluído');
  if (!approvalRequestSeen || !approved.signature_data || !approved.signed_at) {
    throw new Error(`Aprovacao nao persistiu assinatura: ${JSON.stringify(approved)}`);
  }
  evidence.checks.push('aprovacao com assinatura digital persistiu status concluido e assinatura');

  await page.getByRole('button', { name: /Reabrir/ }).click();
  const reopened = await waitForChecklistStatus('Rascunho');
  if (reopened.signature_data || reopened.signed_at) {
    throw new Error(`Reabertura nao limpou assinatura: ${JSON.stringify(reopened)}`);
  }
  evidence.checks.push('reabertura limpou assinatura e retornou checklist para rascunho');

  await page.getByRole('button', { name: /Finalizar Checklist/ }).click();
  await waitForChecklistStatus('Em Andamento');
  await page.getByRole('button', { name: /Reprovar/ }).click();
  await waitForChecklistStatus('Pendente');
  evidence.checks.push('reprovacao mudou checklist para pendente');

  await login(page, collaboratorEmail);
  await page.evaluate((activeOrgId) => localStorage.setItem('activeOrgId', activeOrgId), orgId);
  await page.goto(`${baseUrl}/app/checklist/${checklistId}`, { waitUntil: 'domcontentloaded' });
  await page.evaluate((activeOrgId) => localStorage.setItem('activeOrgId', activeOrgId), orgId);
  await page.reload({ waitUntil: 'domcontentloaded' });
  let collaboratorLoadedDetail = false;
  try {
    await page.getByRole('heading', { name: /Itens do Checklist/ }).waitFor({ state: 'visible', timeout: 20000 });
    collaboratorLoadedDetail = true;
  } catch (error) {
    const bodyText = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
    if (/Checklist n[aã]o encontrado/i.test(bodyText)) {
      evidence.checks.push('colaborador sem permissao nao acessou detalhe restrito do checklist');
    } else {
      throw new Error(`Colaborador nao abriu detalhe do checklist. url=${page.url()} body=${bodyText.slice(0, 1800)} original=${error.message}`);
    }
  }
  if (collaboratorLoadedDetail) {
    const restrictedActions = await page.getByRole('button', { name: /Assinar Digitalmente|Reprovar|Reabrir/ }).count();
    if (restrictedActions !== 0) {
      throw new Error(`Colaborador enxergou acoes restritas de aprovacao: ${restrictedActions}`);
    }
    evidence.checks.push('colaborador nao visualizou acoes restritas de aprovacao/reabertura');
  }

  const expectedCollaboratorBlock = evidence.checks.includes('colaborador sem permissao nao acessou detalhe restrito do checklist');
  evidence.consoleErrors = consoleErrors
    .filter((entry) => !entry.includes('favicon'))
    .filter((entry) => !entry.includes('record-audit-log'))
    .filter((entry) => !entry.includes('Failed to load resource: the server responded with a status of 400'))
    .filter((entry) => !(expectedCollaboratorBlock && entry.includes('Failed to load resource: the server responded with a status of 406')))
    .slice(0, 10);
  evidence.failedResponses = failedResponses
    .filter((entry) => !entry.includes('record-audit-log'))
    .filter((entry) => !(expectedCollaboratorBlock && entry.startsWith('406 ') && entry.includes('/rest/v1/checklists?')))
    .slice(0, 10);

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
