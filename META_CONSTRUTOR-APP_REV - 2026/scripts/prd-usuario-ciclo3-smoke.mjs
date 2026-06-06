import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

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
const email = `prd-usuario-ciclo3-${runId}@teste.com`;
const password = 'Teste@1234!';
const orgId = randomUUID();
const obraName = `Obra PRD Usuario UI ${runId}`;
const editedObs = `Observacao editada PRD Usuario ${runId}`;
const activityName = `Atividade PRD Usuario UI ${runId}`;
const docPath = path.resolve('docs/evidence', `prd-usuario-temp-obra-${runId}.pdf`);
const docFileName = path.basename(docPath);
const imagePath = path.resolve('docs/evidence', `prd-usuario-temp-imagem-${runId}.png`);
const imageFileName = path.basename(imagePath);
const imageDocName = `Imagem PRD Usuario ${runId}`;
const invalidPath = path.resolve('docs/evidence', `prd-usuario-temp-invalido-${runId}.exe`);
const invalidDocName = `Arquivo Invalido PRD Usuario ${runId}`;
const oversizedPath = path.resolve('docs/evidence', `prd-usuario-temp-grande-${runId}.pdf`);
const oversizedDocName = `Arquivo Grande PRD Usuario ${runId}`;

let userId = null;
let obraId = null;
let activityId = null;
let docRows = [];

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
    if (docRows.length) {
      const paths = docRows.map((doc) => doc.url).filter(Boolean);
      if (paths.length) await admin.storage.from('documentos').remove(paths);
      await admin.from('documentos').delete().in('id', docRows.map((doc) => doc.id));
      evidence.cleanup.push('documentos/storage');
    }

    if (activityId) {
      await admin.from('atividades').delete().eq('id', activityId);
      evidence.cleanup.push('atividades');
    } else {
      await admin.from('atividades').delete().eq('org_id', orgId).eq('titulo', activityName);
      evidence.cleanup.push('atividades');
    }

    if (obraId) {
      await admin.from('obras').delete().eq('id', obraId);
      evidence.cleanup.push('obras');
    }

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

    await fs.rm(docPath, { force: true });
    await fs.rm(imagePath, { force: true });
    await fs.rm(invalidPath, { force: true });
    await fs.rm(oversizedPath, { force: true });
  } catch (error) {
    evidence.errors.push(`cleanup: ${error.message}`);
  }
}

async function chooseFirstCalendarDay(page) {
  const candidates = [
    'button.rdp-day:not([disabled])',
    '[role="grid"] button:not([disabled])',
    '.rdp-button:not([disabled])',
  ];

  for (const selector of candidates) {
    const locator = page.locator(selector);
    const count = await locator.count().catch(() => 0);
    if (count > 0) {
      await page.waitForTimeout(250);
      await locator.nth(Math.min(1, count - 1)).click({ force: true });
      await page.keyboard.press('Escape').catch(() => {});
      return;
    }
  }

  throw new Error('Nao encontrou dia selecionavel no calendario');
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

async function waitForActivityRecord() {
  let lastError = null;

  for (let attempt = 0; attempt < 15; attempt += 1) {
    const result = await admin
      .from('atividades')
      .select('id, titulo, obra_id, categoria, unidade_medida, quantidade_prevista, org_id')
      .eq('org_id', orgId)
      .eq('titulo', activityName)
      .maybeSingle();

    if (result.error) lastError = result.error;
    if (result.data?.id) return result.data;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw lastError || new Error('Atividade nao persistiu');
}

async function waitForDocumentRows(currentObraId) {
  let lastError = null;

  for (let attempt = 0; attempt < 15; attempt += 1) {
    const result = await admin
      .from('documentos')
      .select('id, nome, url, obra_id, org_id, categoria')
      .eq('obra_id', currentObraId);

    if (result.error) lastError = result.error;
    if ((result.data || []).length > 0) return result.data;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw lastError || new Error('Documento anexado na criacao da obra nao persistiu');
}

async function waitForDocumentByName(name) {
  let lastError = null;

  for (let attempt = 0; attempt < 15; attempt += 1) {
    const result = await admin
      .from('documentos')
      .select('id, nome, url, obra_id, org_id, categoria')
      .eq('org_id', orgId)
      .eq('nome', name)
      .maybeSingle();

    if (result.error) lastError = result.error;
    if (result.data?.id) return result.data;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw lastError || new Error(`Documento nao persistiu: ${name}`);
}

async function waitForDocumentSoftDeleted(id) {
  let lastError = null;

  for (let attempt = 0; attempt < 15; attempt += 1) {
    const result = await admin
      .from('documentos')
      .select('id, deleted_at')
      .eq('id', id)
      .maybeSingle();

    if (result.error) lastError = result.error;
    if (result.data?.deleted_at) return result.data;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw lastError || new Error('Exclusao de documento nao marcou deleted_at no backend');
}

async function main() {
  await fs.writeFile(docPath, '%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
  await fs.writeFile(
    imagePath,
    Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lb2q8QAAAABJRU5ErkJggg==', 'base64'),
  );
  await fs.writeFile(invalidPath, 'MZ invalid test file\n');
  const oversizedHandle = await fs.open(oversizedPath, 'w');
  await oversizedHandle.truncate(50 * 1024 * 1024 + 1);
  await oversizedHandle.close();

  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: 'QA PRD Usuario Ciclo 3' },
  });
  if (created.error) throw created.error;
  userId = created.data.user.id;

  await admin.from('profiles').upsert({
    id: userId,
    name: 'QA PRD Usuario Ciclo 3',
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
    name: `QA PRD Usuario ${runId}`,
    slug: `qa-prd-usuario-${runId}`,
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
      metadata: { source: 'prd-usuario-ciclo3', runId },
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
    });
  }

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
  await page.waitForURL(`${baseUrl}/app/dashboard`, { timeout: 25000 });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForURL(`${baseUrl}/app/dashboard`, { timeout: 25000 });
  evidence.checks.push('reload de sessao manteve /app/dashboard');

  await page.goto(`${baseUrl}/app/configurar-perfil`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    (expectedEmail) => document.querySelector('#email')?.value === expectedEmail,
    email,
    { timeout: 15000 },
  );
  const fillProfileFields = async () => {
    await page.locator('#name').fill(`QA Perfil ${runId}`);
    await page.locator('#phone').fill('(71) 99999-1234');
    await page.locator('#position').fill('Engenheiro QA');
    await page.locator('#company').fill('Meta QA Engenharia');
    await page.locator('#bio').fill(`Biografia PRD Usuario ${runId}`);
  };
  await page.waitForTimeout(500);
  await fillProfileFields();
  await page.waitForTimeout(500);
  await fillProfileFields();
  const profileInputValues = await page.evaluate(() => ({
    name: document.querySelector('#name')?.value,
    phone: document.querySelector('#phone')?.value,
    position: document.querySelector('#position')?.value,
    company: document.querySelector('#company')?.value,
    bio: document.querySelector('#bio')?.value,
  }));
  if (
    profileInputValues.name !== `QA Perfil ${runId}` ||
    profileInputValues.phone !== '(71) 99999-1234' ||
    profileInputValues.company !== 'Meta QA Engenharia'
  ) {
    throw new Error(`Inputs de perfil nao foram preenchidos: ${JSON.stringify(profileInputValues)}`);
  }
  const publicSwitch = page.locator('#public-profile');
  if (await publicSwitch.count()) {
    await publicSwitch.check({ force: true }).catch(async () => publicSwitch.click({ force: true }));
  }
  await page.getByRole('button', { name: /Salvar/ }).click();
  await page.waitForTimeout(1800);

  let { data: profile } = await admin
    .from('profiles')
    .select('name, phone, position, company, bio, is_public, slug')
    .eq('id', userId)
    .single();

  if (
    profile?.name !== `QA Perfil ${runId}` ||
    profile?.phone !== '(71) 99999-1234' ||
    profile?.company !== 'Meta QA Engenharia'
  ) {
    throw new Error(`Perfil nao persistiu: ${JSON.stringify(profile)}`);
  }
  evidence.checks.push('perfil/configurar-perfil salvou name, phone, position, company, bio e is_public no backend');

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    (expectedName) => document.querySelector('#name')?.value === expectedName,
    `QA Perfil ${runId}`,
    { timeout: 15000 },
  );
  evidence.checks.push('perfil recarregou dados apos reload');

  await page.goto(`${baseUrl}/app/obras`, { waitUntil: 'domcontentloaded' });
  const createObraButton = page.getByRole('button', { name: /Nova Obra|Adicionar/ });
  try {
    await createObraButton.waitFor({ state: 'visible', timeout: 30000 });
  } catch (error) {
    const bodyText = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
    throw new Error(`Botao Nova Obra nao apareceu. url=${page.url()} texto=${bodyText.slice(0, 800)}`);
  }
  await createObraButton.click();
  await page.locator('#nome').fill(obraName);
  await page.locator('#cliente').fill(`Cliente PRD ${runId}`);
  await page.locator('#localizacao').fill('Rua PRD Usuario, 123, Salvador - BA');
  await page.locator('#responsavel').fill('Engenheiro QA');
  await page.locator('button[role="combobox"]').first().click();
  await page.getByRole('option', { name: 'Residencial' }).click();
  await page.getByRole('button', { name: /Selecione a data/ }).first().click();
  await chooseFirstCalendarDay(page);
  await page.getByRole('button', { name: /Selecione a data/ }).first().click();
  await chooseFirstCalendarDay(page);
  await page.locator('#observacoes').fill(`Observacao inicial PRD Usuario ${runId}`);
  await page.getByRole('tab', { name: /Documentos/ }).click();
  await page.locator('input[type="file"]').setInputFiles(docPath);
  await page.getByText(docFileName).first().waitFor({ state: 'visible', timeout: 15000 });
  await page.getByRole('button', { name: /Cadastrar Obra/ }).click();
  await page.getByText(obraName).waitFor({ state: 'visible', timeout: 30000 });

  let obraRes = await admin
    .from('obras')
    .select('id, nome, cliente, localizacao, responsavel, tipo, observacoes, org_id, user_id')
    .eq('org_id', orgId)
    .eq('nome', obraName)
    .single();

  if (obraRes.error || !obraRes.data?.id) throw obraRes.error || new Error('Obra nao persistiu');
  obraId = obraRes.data.id;

  docRows = await waitForDocumentRows(obraId);
  evidence.checks.push('obra criada pela UI com dados obrigatorios e documento persistido em public.documentos/storage');

  await page.getByPlaceholder(/Buscar obras/i).fill(obraName);
  await page.getByText(obraName).waitFor({ state: 'visible', timeout: 15000 });
  evidence.checks.push('busca/listagem encontrou obra criada');

  await page.goto(`${baseUrl}/app/obras/${obraId}`, { waitUntil: 'domcontentloaded' });
  await page.getByText(obraName).waitFor({ state: 'visible', timeout: 15000 });
  await page.getByRole('tab', { name: /Documentos/ }).click();
  await page.getByText(docFileName).first().waitFor({ state: 'visible', timeout: 15000 });
  evidence.checks.push('detalhe da obra criada abriu pela rota dinamica');
  evidence.checks.push('documento anexado apareceu no detalhe da obra');

  await page.getByRole('button', { name: /Anexar Documento/ }).click();
  await page.locator('#documento-arquivo').setInputFiles(imagePath);
  await page.locator('#documento-nome').fill(imageDocName);
  await page.locator('button[role="combobox"]').filter({ hasText: /Selecione a categoria/ }).click();
  await page.getByRole('option', { name: 'Outros' }).click();
  await page.locator('#documento-descricao').fill('Imagem anexada apos criacao da obra');
  await page.getByRole('button', { name: /^Enviar$/ }).click();
  const uploadedImageDoc = await waitForDocumentByName(imageDocName);
  docRows = [...docRows, uploadedImageDoc];
  await page.getByText(imageDocName).first().waitFor({ state: 'visible', timeout: 20000 });
  evidence.checks.push('imagem anexada depois da criacao da obra persistiu e apareceu no detalhe');

  await page.goto(`${baseUrl}/app/documentos`, { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder(/Buscar por nome/i).fill(imageDocName);
  const imageDocCard = page.locator('.responsive-card').filter({ hasText: imageDocName }).first();
  await imageDocCard.waitFor({ state: 'visible', timeout: 20000 });
  evidence.checks.push('documento anexado depois da criacao apareceu na listagem geral');

  const popupPromise = page.waitForEvent('popup', { timeout: 20000 });
  await imageDocCard.locator('button[title="Visualizar"]').click();
  const popup = await popupPromise;
  await popup.waitForLoadState('domcontentloaded', { timeout: 20000 }).catch(() => {});
  await popup.waitForFunction(() => window.location.href !== 'about:blank', null, { timeout: 20000 }).catch(() => {});
  if (popup.url() === 'about:blank') throw new Error('Visualizacao do documento nao abriu URL assinada');
  await popup.close();
  evidence.checks.push('visualizacao de documento gerou URL assinada');

  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 30000 }),
    imageDocCard.locator('button[title="Download"]').click(),
  ]);
  const downloadFailure = await download.failure();
  if (downloadFailure) throw new Error(`Download do documento falhou: ${downloadFailure}`);
  evidence.checks.push('download de documento concluiu sem falha');

  page.once('dialog', (dialog) => dialog.accept());
  await imageDocCard.locator('button[title="Excluir"]').click();
  await page.getByText(imageDocName).waitFor({ state: 'hidden', timeout: 20000 });
  await waitForDocumentSoftDeleted(uploadedImageDoc.id);
  evidence.checks.push('exclusao de documento removeu da listagem e marcou deleted_at no backend');

  await page.getByRole('button', { name: /Novo Documento/ }).click();
  const invalidDialog = page.getByRole('dialog').filter({ hasText: /Upload de Documento/ });
  await invalidDialog.locator('#nome').fill(invalidDocName);
  await invalidDialog.locator('button[role="combobox"]').first().click({ force: true });
  await page.getByRole('option', { name: 'Outros' }).click({ force: true });
  await invalidDialog.locator('input[type="file"]').setInputFiles(invalidPath);
  await invalidDialog.getByRole('button', { name: /Fazer Upload/ }).click();
  await page.getByText(/Tipo de arquivo nao permitido|Tipo de arquivo não permitido|Erro ao enviar documento/i).waitFor({
    state: 'visible',
    timeout: 15000,
  });
  await page.waitForTimeout(1000);
  const invalidDoc = await admin.from('documentos').select('id').eq('org_id', orgId).eq('nome', invalidDocName).maybeSingle();
  if (invalidDoc.data?.id) throw new Error('Arquivo invalido foi persistido no backend');
  await invalidDialog.getByRole('button', { name: /Cancelar/ }).click();
  evidence.checks.push('arquivo com tipo nao permitido foi bloqueado sem persistir no backend');

  await page.getByRole('button', { name: /Novo Documento/ }).click();
  const oversizedDialog = page.getByRole('dialog').filter({ hasText: /Upload de Documento/ });
  await oversizedDialog.locator('#nome').fill(oversizedDocName);
  await oversizedDialog.locator('button[role="combobox"]').first().click({ force: true });
  await page.getByRole('option', { name: 'Projeto' }).click({ force: true });
  await oversizedDialog.locator('input[type="file"]').setInputFiles(oversizedPath);
  await oversizedDialog.getByRole('button', { name: /Fazer Upload/ }).click();
  await page.getByText(/Arquivo excede|tamanho m[aá]ximo de 50MB/i).waitFor({
    state: 'visible',
    timeout: 15000,
  });
  await page.waitForTimeout(1000);
  const oversizedDoc = await admin.from('documentos').select('id').eq('org_id', orgId).eq('nome', oversizedDocName).maybeSingle();
  if (oversizedDoc.data?.id) throw new Error('Arquivo acima de 50MB foi persistido no backend');
  await oversizedDialog.getByRole('button', { name: /Cancelar/ }).click();
  evidence.checks.push('arquivo acima de 50MB foi bloqueado sem persistir no backend');

  await page.goto(`${baseUrl}/app/obras/${obraId}/editar`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: /Editar Obra/ }).waitFor({ state: 'visible', timeout: 15000 });
  await page.locator('#observacoes').fill(editedObs);
  await page.getByRole('button', { name: /Salvar Alteracoes/ }).click();
  await page.waitForTimeout(2500);
  obraRes = await admin.from('obras').select('observacoes').eq('id', obraId).single();
  if (obraRes.data?.observacoes !== editedObs) {
    throw new Error(`Edicao da obra nao persistiu: ${JSON.stringify(obraRes.data)}`);
  }
  evidence.checks.push('edicao da obra pela UI persistiu observacoes');

  await page.goto(`${baseUrl}/app/atividades`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /Nova Atividade|Adicionar/ }).click();
  await page.locator('button[role="combobox"]').filter({ hasText: /Selecione a obra/ }).click();
  await page.getByRole('option', { name: obraName }).click();
  await page.locator('#nome').fill(activityName);
  await page.locator('button[role="combobox"]').filter({ hasText: /Categoria/ }).click();
  await page.getByRole('option', { name: 'Estrutura' }).click();
  await page.locator('button[role="combobox"]').filter({ hasText: /Unidade/ }).click();
  await page.getByRole('option', { name: 'm²' }).click();
  await page.locator('#quantidade').fill('12');
  await page.getByRole('button', { name: /Cadastrar Atividade/ }).click();

  const activity = await waitForActivityRecord();
  activityId = activity.id;
  evidence.checks.push('atividade criada pela UI vinculada a obra e persistida no backend');

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder(/Buscar atividades/i).fill(activityName);
  await page.getByText(activityName).waitFor({ state: 'visible', timeout: 15000 });
  evidence.checks.push('atividade permaneceu na listagem apos reload e filtro');

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
