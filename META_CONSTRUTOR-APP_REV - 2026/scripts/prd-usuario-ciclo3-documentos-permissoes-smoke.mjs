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

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  throw new Error('Supabase env ausente');
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const runId = `${Date.now()}-${randomUUID().slice(0, 8)}`;
const password = 'Teste@1234!';
const orgAId = randomUUID();
const orgBId = randomUUID();
const adminAEmail = `prd-doc-admin-a-${runId}@teste.com`;
const colabAEmail = `prd-doc-colab-a-${runId}@teste.com`;
const outsiderEmail = `prd-doc-admin-b-${runId}@teste.com`;
const docAName = `DOC PRD ORG A ${runId}`;
const docBName = `DOC PRD ORG B ${runId}`;

let adminAId = null;
let colabAId = null;
let outsiderId = null;
let docAId = null;
let docBId = null;
let browser = null;

const evidence = {
  runId,
  device: deviceName,
  viewport: `${viewportWidth}x${viewportHeight}`,
  baseUrl,
  orgs: { orgAId, orgBId },
  checks: [],
  cleanup: [],
  errors: [],
};

async function cleanup() {
  try {
    await admin.from('documentos').delete().in('id', [docAId, docBId].filter(Boolean));
    evidence.cleanup.push('documentos');
    await admin.from('org_members').delete().in('org_id', [orgAId, orgBId]);
    evidence.cleanup.push('org_members');
    await admin.from('org_credits').delete().in('org_id', [orgAId, orgBId]);
    evidence.cleanup.push('org_credits');
    await admin.from('subscriptions').delete().in('org_id', [orgAId, orgBId]);
    evidence.cleanup.push('subscriptions');
    await admin.from('orgs').delete().in('id', [orgAId, orgBId]);
    evidence.cleanup.push('orgs');

    const userIds = [adminAId, colabAId, outsiderId].filter(Boolean);
    if (userIds.length) {
      await admin.from('user_roles').delete().in('user_id', userIds);
      await admin.from('user_settings').delete().in('user_id', userIds);
      await admin.from('profiles').delete().in('id', userIds);
      for (const userId of userIds) {
        await admin.auth.admin.deleteUser(userId);
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
  if (!autoOrgIds.length) return;

  await admin.from('org_members').delete().in('user_id', userIds);
  await admin.from('org_credits').delete().in('org_id', autoOrgIds);
  await admin.from('subscriptions').delete().in('org_id', autoOrgIds);
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
    phone: '',
    company: '',
    plan_type: 'enterprise',
    has_seen_onboarding: true,
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
  adminAId = await createUser(adminAEmail, 'Admin Doc Org A', 'Administrador');
  colabAId = await createUser(colabAEmail, 'Colab Doc Org A', 'Colaborador');
  outsiderId = await createUser(outsiderEmail, 'Admin Doc Org B', 'Administrador');

  await removeAutoCreatedOrgs([adminAId, colabAId, outsiderId]);

  const orgInsert = await admin.from('orgs').insert([
    { id: orgAId, name: `PRD Docs A ${runId}`, slug: `prd-docs-a-${runId}`, owner_user_id: adminAId },
    { id: orgBId, name: `PRD Docs B ${runId}`, slug: `prd-docs-b-${runId}`, owner_user_id: outsiderId },
  ]);
  if (orgInsert.error) throw orgInsert.error;

  const creditUpsert = await admin.from('org_credits').upsert([
    { org_id: orgAId, plan_type: 'enterprise', rdo_credits_balance: 999 },
    { org_id: orgBId, plan_type: 'enterprise', rdo_credits_balance: 999 },
  ], { onConflict: 'org_id' });
  if (creditUpsert.error) throw creditUpsert.error;

  const businessPlan = await admin
    .from('plans')
    .select('id')
    .eq('slug', 'business')
    .eq('is_active', true)
    .single();
  if (businessPlan.error) throw businessPlan.error;

  const subscriptionInsert = await admin.from('subscriptions').insert([
    { org_id: orgAId, plan_id: businessPlan.data.id, status: 'active', current_period_start: new Date().toISOString() },
    { org_id: orgBId, plan_id: businessPlan.data.id, status: 'active', current_period_start: new Date().toISOString() },
  ]);
  if (subscriptionInsert.error) throw subscriptionInsert.error;

  const memberInsert = await admin.from('org_members').insert([
    { org_id: orgAId, user_id: adminAId, role: 'Administrador', status: 'active', joined_at: new Date().toISOString() },
    { org_id: orgAId, user_id: colabAId, role: 'Colaborador', status: 'active', joined_at: new Date().toISOString() },
    { org_id: orgBId, user_id: outsiderId, role: 'Administrador', status: 'active', joined_at: new Date().toISOString() },
  ]);
  if (memberInsert.error) throw memberInsert.error;

  const inserted = await admin.from('documentos').insert([
    {
      nome: docAName,
      tipo: 'pdf',
      categoria: 'Projeto',
      tamanho: 128,
      url: `prd/${runId}/org-a.pdf`,
      uploaded_by: adminAId,
      org_id: orgAId,
      descricao: 'Documento org A',
    },
    {
      nome: docBName,
      tipo: 'pdf',
      categoria: 'Projeto',
      tamanho: 128,
      url: `prd/${runId}/org-b.pdf`,
      uploaded_by: outsiderId,
      org_id: orgBId,
      descricao: 'Documento org B',
    },
  ]).select('id,nome,org_id');

  if (inserted.error) throw inserted.error;
  docAId = inserted.data.find((doc) => doc.nome === docAName)?.id;
  docBId = inserted.data.find((doc) => doc.nome === docBName)?.id;
  evidence.checks.push('seed criou usuarios, organizacoes e documentos isolados');
}

async function signInClient(email) {
  const client = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return client;
}

async function validateRls() {
  const adminAClient = await signInClient(adminAEmail);
  const colabAClient = await signInClient(colabAEmail);
  const outsiderClient = await signInClient(outsiderEmail);
  const anonClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const adminRead = await adminAClient.from('documentos').select('id,nome,org_id').eq('org_id', orgAId).eq('id', docAId);
  if (adminRead.error || adminRead.data.length !== 1) {
    const membership = await adminAClient.rpc('is_org_member', { p_org_id: orgAId });
    throw new Error(`Admin org A nao leu doc A: ${adminRead.error?.message}; is_org_member=${membership.data}; rpc_error=${membership.error?.message}`);
  }

  const colabRead = await colabAClient.from('documentos').select('id,nome,org_id').eq('org_id', orgAId).eq('id', docAId);
  if (colabRead.error || colabRead.data.length !== 1) {
    const membership = await colabAClient.rpc('is_org_member', { p_org_id: orgAId });
    throw new Error(`Colaborador org A nao leu doc A: ${colabRead.error?.message}; is_org_member=${membership.data}; rpc_error=${membership.error?.message}`);
  }

  const outsiderRead = await outsiderClient.from('documentos').select('id,nome,org_id').eq('id', docAId);
  if (outsiderRead.error) throw outsiderRead.error;
  if (outsiderRead.data.length !== 0) throw new Error('Usuario de outra org leu documento da org A');

  const anonRead = await anonClient.from('documentos').select('id,nome,org_id').eq('id', docAId);
  if (anonRead.error && !/permission denied/i.test(anonRead.error.message)) throw anonRead.error;
  if (!anonRead.error && anonRead.data.length !== 0) throw new Error('Anonimo leu documento autenticado');

  const outsiderUpdate = await outsiderClient
    .from('documentos')
    .update({ nome: `${docAName} VAZOU` })
    .eq('id', docAId)
    .select('id');
  if (!outsiderUpdate.error && outsiderUpdate.data.length > 0) {
    throw new Error('Usuario de outra org atualizou documento da org A');
  }

  const colabInsert = await colabAClient.from('documentos').insert({
    nome: `DOC PRD COLAB ${runId}`,
    tipo: 'pdf',
    categoria: 'Projeto',
    tamanho: 64,
    url: `prd/${runId}/colab.pdf`,
    uploaded_by: colabAId,
    org_id: orgAId,
    descricao: 'Documento criado por colaborador no mesmo org',
  }).select('id').single();
  if (colabInsert.error) throw colabInsert.error;
  await admin.from('documentos').delete().eq('id', colabInsert.data.id);

  evidence.checks.push('RLS permitiu leitura/escrita por membro da org e bloqueou anonimo/outra org');
}

async function login(page, email, orgId) {
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

async function validateUi() {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: viewportWidth, height: viewportHeight } });
  page.on('console', (message) => {
    if (message.type() === 'error') evidence.errors.push(`console:${message.text()}`);
  });
  page.on('pageerror', (error) => evidence.errors.push(`pageerror:${error.message}`));

  await login(page, adminAEmail, orgAId);
  await page.goto(`${baseUrl}/app/documentos`, { waitUntil: 'domcontentloaded' });
  await page.getByText(docAName).waitFor({ state: 'visible', timeout: 30000 });
  if (await page.getByText(docBName).count()) {
    throw new Error('UI admin org A exibiu documento da org B');
  }
  await page.getByRole('button', { name: /Novo Documento/i }).waitFor({ state: 'visible', timeout: 15000 });
  evidence.checks.push('UI admin org A exibiu apenas documento da propria organizacao');

  await login(page, outsiderEmail, orgAId);
  await page.goto(`${baseUrl}/app/documentos`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  if (await page.getByText(docAName).count()) {
    throw new Error('UI usuario org B exibiu documento da org A mesmo forçando activeOrgId');
  }
  evidence.checks.push('UI usuario de outra organizacao nao exibiu documento da org A');
}

async function main() {
  try {
    await seedData();
    await validateRls();
    await validateUi();
  } finally {
    if (browser) await browser.close();
    await cleanup();
  }

  console.log(JSON.stringify(evidence, null, 2));

  const blockingErrors = evidence.errors.filter((error) => !/Failed to load resource/.test(error));
  if (blockingErrors.length) {
    throw new Error(`Erros bloqueantes: ${blockingErrors.join(' | ')}`);
  }
}

main().catch((error) => {
  evidence.errors.push(error.message);
  console.error(JSON.stringify(evidence, null, 2));
  process.exit(1);
});
