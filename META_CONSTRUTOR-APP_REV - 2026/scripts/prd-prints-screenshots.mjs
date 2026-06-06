import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:5173';
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.PRD_PRINTS_PASSWORD;
const safeDir = path.resolve('docs/evidence/prd-prints-campanha-2026-06-03');
const seedSummaryPath = path.join(safeDir, 'seed-summary.json');
const captureDate = process.env.PRD_PRINTS_CAPTURE_DATE || '2026-06-04';

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Supabase env ausente para screenshots.');
}

if (!password) {
  throw new Error('Defina PRD_PRINTS_PASSWORD apenas no ambiente de execucao.');
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const viewports = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 820, height: 1180 },
  mobile: { width: 390, height: 844 },
};

const desktopRoutes = [
  ['obras-lista', '/app/obras', 'Obras com grid/lista preenchida'],
  ['obra-detalhe', null, 'Detalhe da primeira obra demonstrativa'],
  ['atividades-lista', '/app/atividades', 'Atividades demonstrativas preenchidas'],
  ['rdo-lista', '/app/rdo', 'RDOs recentes preenchidos'],
  ['checklist-lista', '/app/checklist', 'Checklists com progresso visual'],
  ['documentos-lista', '/app/documentos', 'Biblioteca de documentos demonstrativos'],
  ['equipes-lista', '/app/equipes', 'Equipes demonstrativas'],
  ['equipamentos-lista', '/app/equipamentos', 'Equipamentos com status variados'],
  ['fornecedores-lista', '/app/fornecedores', 'Fornecedores demonstrativos'],
  ['despesas-lista', '/app/despesas', 'Despesas demonstrativas'],
  ['relatorios-resumo', '/app/relatorios', 'Relatorios com dados persistidos'],
  ['integracoes-status', '/app/integracoes', 'Estados honestos de integracoes'],
];

const responsiveRoutes = [
  ['dashboard-tablet', '/app/dashboard', 'Dashboard em tablet'],
  ['obras-tablet', '/app/obras', 'Obras em tablet'],
  ['checklist-tablet', '/app/checklist', 'Checklist em tablet'],
  ['rdo-mobile', '/app/rdo', 'RDO em mobile'],
  ['obras-mobile', '/app/obras', 'Obras em mobile'],
  ['atividade-mobile', '/app/atividades', 'Atividades em mobile'],
];

const supportRoutes = [
  ['perfil-conta', '/app/perfil', 'Perfil da conta demonstrativa'],
  ['configuracoes', '/app/configuracoes', 'Configuracoes da organizacao demonstrativa'],
  ['notificacoes', '/app/notificacoes', 'Notificacoes e filtros da conta demonstrativa'],
  ['faq', '/app/faq', 'FAQ autenticado de apoio'],
  ['feedback', '/app/feedback', 'Formulario de feedback autenticado'],
];

function screenshotName(index, slug, device) {
  return `prd-prints-${captureDate}-${String(index).padStart(2, '0')}-${slug}-${device}.png`;
}

async function updateReviewerPassword(email) {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  const user = (data.users || []).find((item) => item.email === email);
  if (!user) throw new Error(`Usuario de screenshot nao encontrado: ${email}`);

  const { error: updateError } = await admin.auth.admin.updateUserById(user.id, { password });
  if (updateError) throw updateError;
  return user.id;
}

async function dismissTransientUi(page) {
  await page.keyboard.press('Escape').catch(() => {});
  const closeButtons = page.locator('button[aria-label*="Close"], button[aria-label*="Fechar"]');
  const count = await closeButtons.count().catch(() => 0);
  for (let index = 0; index < Math.min(count, 3); index += 1) {
    await closeButtons.nth(index).click({ timeout: 500 }).catch(() => {});
  }
}

async function gotoStable(page, route) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {});
  await page.waitForTimeout(1800);
  await dismissTransientUi(page);
}

async function capture(page, index, slug, device, route, note, screenshots, consoleErrors) {
  const errorsBefore = consoleErrors.length;
  if (route) await gotoStable(page, route);
  const file = screenshotName(index, slug, device);
  const fullPath = path.join(safeDir, file);
  await page.screenshot({ path: fullPath, fullPage: false });
  const newErrors = consoleErrors.length - errorsBefore;
  screenshots.push({
    index,
    file,
    route: route || page.url().replace(baseUrl, ''),
    device,
    viewport: `${page.viewportSize().width}x${page.viewportSize().height}`,
    account: 'campanha+prdprints10@metaconstrutor.test',
    status: newErrors ? 'needs_review' : 'captured',
    notes: note,
  });
}

async function captureNewActivityModal(page, index, screenshots, consoleErrors) {
  await gotoStable(page, '/app/atividades');
  await page.getByRole('button', { name: /Nova Atividade|Adicionar/i }).first().click();
  await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForTimeout(1000);
  await capture(
    page,
    index,
    'atividade-nova-modal',
    'desktop',
    null,
    'Modal de nova atividade com campos relevantes',
    screenshots,
    consoleErrors
  );
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(500);
}

function isTransientAuthConsoleEvent(message) {
  return (
    message.includes('TypeError: Failed to fetch') &&
    message.includes('SupabaseAuthClient._useSession')
  );
}

async function main() {
  await fs.mkdir(safeDir, { recursive: true });
  const seedSummary = JSON.parse(await fs.readFile(seedSummaryPath, 'utf8'));
  const email = seedSummary.login_email;
  await updateReviewerPassword(email);

  const { data: firstObra, error: firstObraError } = await admin
    .from('obras')
    .select('id')
    .eq('org_id', seedSummary.org.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (firstObraError) throw firstObraError;
  const firstObraRoute = firstObra?.id ? `/app/obras/${firstObra.id}` : '/app/obras';

  const { data: firstRdo, error: firstRdoError } = await admin
    .from('rdos')
    .select('id')
    .eq('org_id', seedSummary.org.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (firstRdoError) throw firstRdoError;
  const firstRdoRoute = firstRdo?.id ? `/app/rdo/${firstRdo.id}/visualizar` : '/app/rdo';

  const { data: firstChecklist, error: firstChecklistError } = await admin
    .from('checklists')
    .select('id')
    .eq('org_id', seedSummary.org.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (firstChecklistError) throw firstChecklistError;
  const firstChecklistRoute = firstChecklist?.id ? `/app/checklist/${firstChecklist.id}` : '/app/checklist';

  const screenshots = [];
  const consoleEvents = [];
  const transientConsoleEvents = [];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: viewports.desktop });
  const page = await context.newPage();
  page.on('console', (message) => {
    if (message.type() === 'error') {
      const event = { type: message.type(), text: message.text().slice(0, 500), url: page.url() };
      if (isTransientAuthConsoleEvent(event.text)) {
        transientConsoleEvents.push(event);
        return;
      }
      consoleEvents.push(event);
    }
  });
  page.on('pageerror', (error) => {
    consoleEvents.push({ type: 'pageerror', text: error.message.slice(0, 500), url: page.url() });
  });

  let index = 1;
  await gotoStable(page, `/login?email=${encodeURIComponent(email)}`);
  await capture(page, index++, 'login-limpo', 'desktop', null, 'Login limpo sem senha preenchida', screenshots, consoleEvents);

  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/app\/dashboard/, { timeout: 30000 });
  await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {});
  await page.waitForTimeout(2500);

  for (const [slug, configuredRoute, note] of desktopRoutes) {
    const route = slug === 'obra-detalhe' ? firstObraRoute : configuredRoute;
    await capture(page, index++, slug, 'desktop', route, note, screenshots, consoleEvents);
  }

  await captureNewActivityModal(page, index++, screenshots, consoleEvents);
  await capture(page, index++, 'rdo-visualizacao', 'desktop', firstRdoRoute, 'Visualizacao de RDO com atividades e evidencias', screenshots, consoleEvents);
  await capture(page, index++, 'checklist-detalhe', 'desktop', firstChecklistRoute, 'Detalhe de checklist com itens marcados', screenshots, consoleEvents);

  for (const [slug, route, note] of supportRoutes) {
    await capture(page, index++, slug, 'desktop', route, note, screenshots, consoleEvents);
  }

  await page.setViewportSize(viewports.tablet);
  for (const [slug, route, note] of responsiveRoutes.filter(([slug]) => slug.endsWith('tablet'))) {
    await capture(page, index++, slug.replace('-tablet', ''), 'tablet', route, note, screenshots, consoleEvents);
  }

  await page.setViewportSize(viewports.mobile);
  for (const [slug, route, note] of responsiveRoutes.filter(([slug]) => slug.endsWith('mobile'))) {
    await capture(page, index++, slug.replace('-mobile', ''), 'mobile', route, note, screenshots, consoleEvents);
  }

  await page.setViewportSize(viewports.desktop);
  await capture(
    page,
    index++,
    'dashboard-resumo-final',
    'desktop',
    '/app/dashboard',
    'Ultimo print obrigatorio: dashboard consolidado apos seed',
    screenshots,
    consoleEvents
  );

  await browser.close();

  const manifest = {
    prd: 'PRD_PRINTS.md',
    updated_at: new Date().toISOString(),
    status: consoleEvents.length ? 'captured_with_console_review' : 'captured',
    safe_folder: 'docs/evidence/prd-prints-campanha-2026-06-03/',
    seed_summary: 'seed-summary.json',
    screenshots,
    console_events: consoleEvents,
    transient_console_events: transientConsoleEvents,
    safety: {
      password_recorded: false,
      real_customer_data: false,
      external_integrations_called: false,
      final_screenshot: screenshots.at(-1)?.file,
    },
  };

  await fs.writeFile(path.join(safeDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({
    status: manifest.status,
    screenshots: screenshots.length,
    final_screenshot: manifest.safety.final_screenshot,
    console_events: consoleEvents.length,
  }, null, 2));
}

main().catch(async (error) => {
  console.error(error.message);
  process.exit(1);
});
