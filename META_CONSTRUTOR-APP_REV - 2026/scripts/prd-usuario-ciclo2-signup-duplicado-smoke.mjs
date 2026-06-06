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

const runId = `${Date.now()}-${randomUUID().slice(0, 8)}`;
const duplicateEmail = `prd-usuario-signup-duplicado-${runId}@teste.com`;
const password = 'Teste@1234!';
const phoneSuffix = runId.replace(/\D/g, '').slice(-4).padStart(4, '0');
const genericError = 'Não foi possível concluir o cadastro. Verifique os dados e tente novamente.';

let userId = null;

const evidence = {
  runId,
  device: deviceName,
  viewport: `${viewportWidth}x${viewportHeight}`,
  duplicateEmail,
  checks: [],
  cleanup: [],
  errors: [],
};

async function cleanup() {
  try {
    if (!userId) return;
    await admin.from('org_members').delete().eq('user_id', userId);
    await admin.from('user_roles').delete().eq('user_id', userId);
    await admin.from('user_settings').delete().eq('user_id', userId);
    await admin.from('profiles').delete().eq('id', userId);
    await admin.auth.admin.deleteUser(userId);
    evidence.cleanup.push('auth.users/profiles/settings/roles/memberships');
  } catch (error) {
    evidence.errors.push(`cleanup: ${error.message}`);
  }
}

async function seedDuplicateUser() {
  const created = await admin.auth.admin.createUser({
    email: duplicateEmail,
    password,
    email_confirm: true,
    user_metadata: { name: 'Usuario Duplicado PRD' },
  });
  if (created.error) throw created.error;

  userId = created.data.user.id;
  const { error: profileError } = await admin.from('profiles').upsert({
    id: userId,
    name: 'Usuario Duplicado PRD',
    email: duplicateEmail,
    phone: `(71) 99999-${phoneSuffix}`,
    company: 'Empresa Duplicado PRD',
    plan_type: 'free',
    has_seen_onboarding: false,
    updated_at: new Date().toISOString(),
  });
  if (profileError) throw profileError;
  evidence.checks.push('usuario duplicado seedado em auth.users e profiles');
}

async function completeSignup(page) {
  await page.goto(`${baseUrl}/criar-conta`, { waitUntil: 'domcontentloaded' });
  await page.locator('input[name="name"]').waitFor({ state: 'visible', timeout: 30000 });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('input[name="name"]').waitFor({ state: 'visible', timeout: 30000 });

  await page.locator('input[name="name"]').fill(`Usuario Tentativa ${runId}`);
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();

  await page.locator('input[name="email"]').fill(duplicateEmail);
  await page.locator('input[name="phone"]').fill('(71) 98888-7777');
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();

  await page.locator('input[name="password"]').fill(password);
  await page.locator('input[name="confirmPassword"]').fill(password);
  await page.locator('input[name="terms"]').check({ force: true });
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();

  await page.getByText(genericError).waitFor({ state: 'visible', timeout: 30000 });
  if (page.url().includes('/app')) {
    throw new Error(`Cadastro duplicado redirecionou para area autenticada: ${page.url()}`);
  }
  evidence.checks.push('cadastro duplicado exibiu erro generico e nao autenticou');
}

async function validateBackend() {
  const { data, error } = await admin
    .from('profiles')
    .select('id,email')
    .eq('email', duplicateEmail);

  if (error) throw error;
  if ((data || []).length !== 1 || data[0].id !== userId) {
    throw new Error(`Perfil duplicado criado indevidamente: ${JSON.stringify(data)}`);
  }
  evidence.checks.push('backend manteve apenas o perfil original para o email duplicado');
}

async function main() {
  let browser;
  try {
    await seedDuplicateUser();
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: viewportWidth, height: viewportHeight } });
    page.on('console', (message) => {
      if (message.type() === 'error') {
        evidence.errors.push(`console:${message.text()}`);
      }
    });
    page.on('pageerror', (error) => evidence.errors.push(`pageerror:${error.message}`));

    await completeSignup(page);
    await validateBackend();
  } finally {
    if (browser) await browser.close();
    await cleanup();
  }

  console.log(JSON.stringify(evidence, null, 2));

  const blockingErrors = evidence.errors.filter((error) => !/Failed to load resource|AuthApiError/.test(error));
  if (blockingErrors.length) {
    throw new Error(`Erros bloqueantes: ${blockingErrors.join(' | ')}`);
  }
}

main().catch((error) => {
  evidence.errors.push(error.message);
  console.error(JSON.stringify(evidence, null, 2));
  process.exit(1);
});
