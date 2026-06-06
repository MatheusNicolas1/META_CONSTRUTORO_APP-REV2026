import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { test, expect, type Page } from 'playwright/test';

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:5173';
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const qaPassword = 'Teste@1234!';
const runId = `${Date.now()}`;
const validatePdfFromUI = process.env.PRD_LAYOUT_VALIDATE_PDF === '1';
const adminEmail = `prd-layout-admin-${runId}@teste.com`;
const collaboratorEmail = `prd-layout-colab-${runId}@teste.com`;
const orgName = `QA Convite RDO ${runId}`;
const obraName = `Obra QA Convite RDO ${runId}`;
const activityName = `Atividade QA RDO Colaborador ${runId}`;
const collaboratorName = `Colaborador QA ${runId}`;

const viewports = [
  { width: 390, height: 844, name: 'mobile-390' },
  { width: 1440, height: 900, name: 'desktop-1440' },
];

let adminClient: SupabaseClient | null = null;
let adminUserId: string | null = null;
let collaboratorUserId: string | null = null;
let orgId: string | null = null;
let obraId: string | null = null;
const createdRdoIds: string[] = [];
const createdEquipeIds: string[] = [];
let registeredEquipeName: string | null = null;

const createAdminClient = () => {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase URL/service role key ausentes para smoke de convite/RDO.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

const fetchRdoPdfAsUser = async (rdoId: string, email: string) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL/anon key ausentes para validar PDF autenticado.');
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  const { data: signInData, error: signInError } = await userClient.auth.signInWithPassword({
    email,
    password: qaPassword,
  });
  if (signInError || !signInData.session?.access_token) {
    throw signInError || new Error('Sessao ausente ao autenticar para validar PDF.');
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/generate-rdo-pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/pdf',
      Authorization: `Bearer ${signInData.session.access_token}`,
    },
    body: JSON.stringify({ rdoId }),
  });
  const buffer = await response.arrayBuffer();
  await userClient.auth.signOut();
  return { response, buffer };
};

const clearSession = async (page: Page) => {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
};

const login = async (page: Page, email: string) => {
  await clearSession(page);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('Digite seu e-mail ou celular').fill(email);
  await page.getByPlaceholder('Digite sua senha').fill(qaPassword);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.waitForURL(`${baseUrl}/app/dashboard`, { timeout: 25000 });
};

const selectClimate = async (page: Page) => {
  const climateTrigger = page.locator('button[role="combobox"]').filter({
    hasText: /Selecione o clima|Ensolarado|Nublado|Chuvoso/i,
  }).first();

  await climateTrigger.click();

  const sunnyOption = page.getByRole('option', { name: /Ensolarado/ });
  try {
    await sunnyOption.click({ timeout: 5000 });
  } catch {
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
  }

  await expect(climateTrigger).toContainText(/Ensolarado/, { timeout: 5000 });
};

const expectNoDocumentOverflow = async (page: Page, label: string) => {
  const metrics = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    htmlScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    text: document.body.innerText.slice(0, 1000),
  }));

  expect(
    Math.max(metrics.htmlScrollWidth, metrics.bodyScrollWidth),
    `${label} overflowed: ${JSON.stringify(metrics)}`
  ).toBeLessThanOrEqual(metrics.viewportWidth + 2);
};

const relevantConsoleErrors = (entries: string[]) =>
  entries.filter((entry) =>
    !entry.includes('favicon') &&
    !(entry.includes('TypeError: Failed to fetch') && entry.includes('@supabase_supabase-js'))
  );

const createAuthUser = async (client: SupabaseClient, email: string, name: string) => {
  const { data, error } = await client.auth.admin.createUser({
    email,
    password: qaPassword,
    email_confirm: true,
    user_metadata: {
      name,
      terms_accepted_at: new Date().toISOString(),
    },
  });

  if (error) throw error;
  return data.user.id;
};

const ensureProfile = async (client: SupabaseClient, userId: string, email: string, name: string) => {
  const { error: profileError } = await client.from('profiles').upsert({
    id: userId,
    name,
    email,
    plan_type: 'enterprise',
    has_seen_onboarding: true,
    updated_at: new Date().toISOString(),
  } as never);
  if (profileError) throw profileError;

  const { error: settingsError } = await client.from('user_settings').upsert({
    user_id: userId,
    theme: 'light',
  } as never, { onConflict: 'user_id' });
  if (settingsError) throw settingsError;
};

const removeAutoCreatedOrgs = async (client: SupabaseClient, userIds: string[]) => {
  const { data: memberships, error } = await client
    .from('org_members')
    .select('org_id')
    .in('user_id', userIds);
  if (error) throw error;

  const autoOrgIds = [...new Set((memberships || []).map((membership: any) => membership.org_id).filter(Boolean))];
  await client.from('org_members').delete().in('user_id', userIds);

  if (autoOrgIds.length === 0) return;
  await client.from('subscriptions').delete().in('org_id', autoOrgIds);
  await client.from('org_credits').delete().in('org_id', autoOrgIds);
  await client.from('orgs').delete().in('id', autoOrgIds);
};

test.describe.configure({ mode: 'serial' });
test.setTimeout(120000);

test.beforeAll(async () => {
  adminClient = createAdminClient();

  adminUserId = await createAuthUser(adminClient, adminEmail, 'Admin QA Convite');
  collaboratorUserId = await createAuthUser(adminClient, collaboratorEmail, collaboratorName);
  await ensureProfile(adminClient, adminUserId, adminEmail, 'Admin QA Convite');
  await ensureProfile(adminClient, collaboratorUserId, collaboratorEmail, collaboratorName);
  await removeAutoCreatedOrgs(adminClient, [adminUserId, collaboratorUserId]);

  orgId = randomUUID();
  const today = new Date().toISOString().split('T')[0];
  const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  const { error: orgError } = await adminClient.from('orgs').insert({
    id: orgId,
    name: orgName,
    slug: `qa-convite-rdo-${runId}`,
    owner_user_id: adminUserId,
  } as never);
  if (orgError) throw orgError;

  const { error: creditsError } = await adminClient.from('org_credits').upsert({
    org_id: orgId,
    plan_type: 'enterprise',
    rdo_credits_balance: 999,
  } as never, { onConflict: 'org_id' });
  if (creditsError) throw creditsError;

  const { error: adminMemberError } = await adminClient.from('org_members').insert({
    org_id: orgId,
    user_id: adminUserId,
    role: 'Administrador',
    status: 'active',
    joined_at: new Date().toISOString(),
  } as never);
  if (adminMemberError) throw adminMemberError;

  const { error: rolesError } = await adminClient.from('user_roles').upsert([
    { user_id: adminUserId, role: 'Administrador' },
    { user_id: collaboratorUserId, role: 'Colaborador' },
  ] as never, { onConflict: 'user_id' });
  if (rolesError) throw rolesError;

  const { data: obra, error: obraError } = await adminClient
    .from('obras')
    .insert({
      nome: obraName,
      cliente: 'Cliente QA Convite',
      localizacao: 'Rua QA Convite, 100',
      responsavel: 'Admin QA Convite',
      tipo: 'Residencial',
      data_inicio: today,
      previsao_termino: nextMonth,
      observacoes: 'Obra temporaria para fluxo colaborador cria RDO.',
      user_id: adminUserId,
      org_id: orgId,
      progresso: 10,
      status: 'ACTIVE',
    } as never)
    .select('id')
    .single();
  if (obraError) throw obraError;
  obraId = obra.id as string;

  const { data: qaPlan, error: planError } = await adminClient
    .from('plans')
    .select('id, slug')
    .eq('is_active', true)
    .gte('max_users', 2)
    .order('max_users', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (planError) throw planError;
  if (!qaPlan?.id) throw new Error('Nenhum plano ativo com pelo menos 2 usuarios encontrado para o smoke de convite/RDO.');

  const { error: subscriptionError } = await adminClient.from('subscriptions').insert({
    org_id: orgId,
    plan_id: qaPlan.id,
    status: 'active',
    billing_cycle: 'monthly',
    metadata: { source: 'prd-layout-invite-rdo-smoke', runId },
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
  } as never);
  if (subscriptionError) throw subscriptionError;

  const { error: collaboratorMemberError } = await adminClient.from('org_members').insert({
    org_id: orgId,
    user_id: collaboratorUserId,
    role: 'Colaborador',
    status: 'active',
    invited_by: adminUserId,
    invited_at: new Date().toISOString(),
    joined_at: new Date().toISOString(),
  } as never);
  if (collaboratorMemberError) throw collaboratorMemberError;

  const { error: activityError } = await adminClient.from('atividades').insert({
    user_id: collaboratorUserId,
    org_id: orgId,
    obra_id: obraId,
    titulo: activityName,
    data: today,
    hora: '08:00',
    status: 'agendada',
    prioridade: 'media',
    categoria: 'Execucao',
    unidade_medida: 'm2',
    quantidade_prevista: 12,
  } as never);
  if (activityError) throw activityError;
});

test.afterAll(async () => {
  if (!adminClient) return;

  if (createdRdoIds.length > 0) {
    await adminClient.from('rdo_atividades').delete().in('rdo_id', createdRdoIds);
    await adminClient.from('rdo_equipes').delete().in('rdo_id', createdRdoIds);
    await adminClient.from('documentos').delete().in('rdo_id', createdRdoIds);
    await adminClient.from('rdos').delete().in('id', createdRdoIds);
  }
  if (createdEquipeIds.length > 0) {
    await adminClient.from('equipes').delete().in('id', createdEquipeIds);
  }
  if (obraId) {
    await adminClient.from('atividades').delete().eq('obra_id', obraId);
    await adminClient.from('obras').delete().eq('id', obraId);
  }
  if (orgId) {
    await adminClient.from('subscriptions').delete().eq('org_id', orgId);
    await adminClient.from('org_credits').delete().eq('org_id', orgId);
    await adminClient.from('org_members').delete().eq('org_id', orgId);
    await adminClient.from('orgs').delete().eq('id', orgId);
  }
  for (const userId of [adminUserId, collaboratorUserId].filter(Boolean) as string[]) {
    await adminClient.from('user_roles').delete().eq('user_id', userId);
    await adminClient.from('user_settings').delete().eq('user_id', userId);
    await adminClient.from('profiles').delete().eq('id', userId);
    await adminClient.auth.admin.deleteUser(userId);
  }
});

for (const viewport of viewports) {
  test.describe(`PRD_LAYOUT convite/RDO ${viewport.name}`, () => {
    test.use({ viewport, acceptDownloads: true });

    test('admin cadastra colaborador existente, colaborador cria RDO e admin valida', async ({ page }) => {
      test.skip(!adminClient || !orgId || !obraId || !collaboratorUserId, 'Dados de QA nao preparados.');

      const consoleErrors: string[] = [];
      const failedResponses: string[] = [];
      const observation = `RDO criado por colaborador convidado ${viewport.name} ${runId}`;
      const equipeName = `${collaboratorName} ${viewport.name}`;
      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });
      page.on('response', (response) => {
        if (response.status() >= 400) {
          failedResponses.push(`${response.status()} ${response.url()}`);
        }
      });

      await page.route('**/functions/v1/accept-invite', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, activated: 0, memberships: [] }),
        });
      });

      await login(page, adminEmail);

      let inviteRequestBody: any = null;
      await page.route('**/functions/v1/invite-member', async (route) => {
        inviteRequestBody = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            email_sent: true,
            status: 'invited',
            member: {
              id: `mock-member-${viewport.name}`,
              role: 'Colaborador',
              status: 'invited',
            },
          }),
        });
      });

      await page.goto(`${baseUrl}/app/configuracoes`, { waitUntil: 'domcontentloaded' });
      await page.getByRole('tab', { name: /Usu.r/i }).click();
      await expect(page.getByRole('heading', { name: /Convidar colaborador/i })).toBeVisible({ timeout: 15000 });
      await expectNoDocumentOverflow(page, `configuracoes convite email admin ${viewport.name}`);
      await page.locator('#invite-name').fill(collaboratorName);
      await page.locator('#invite-email').fill(collaboratorEmail);
      await page.getByRole('button', { name: /Enviar convite/i }).click();
      await expect(page.getByText(/Convite enviado por e-mail/i)).toBeVisible({ timeout: 15000 });
      expect(inviteRequestBody).toMatchObject({
        org_id: orgId,
        email: collaboratorEmail,
        name: collaboratorName,
        role: 'Colaborador',
        create_team_member: true,
      });

      await page.unroute('**/functions/v1/invite-member');

      await page.goto(`${baseUrl}/app/equipes`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: /Gest.o de Equipes/i })).toBeVisible({ timeout: 15000 });
      await expectNoDocumentOverflow(page, `equipes admin ${viewport.name}`);

      if (!registeredEquipeName) {
        await page.getByRole('button', { name: /Novo Colaborador|Adicionar/ }).click();
        await page.getByPlaceholder('Nome do colaborador').fill(equipeName);
        await page.getByPlaceholder('Digite ou selecione uma fun').fill('Servente');
        await page.getByPlaceholder('(11) 99999-9999').fill('(11) 98888-7777');
        await page.getByPlaceholder('email@exemplo.com').fill(collaboratorEmail);
        await page.getByRole('button', { name: 'Cadastrar', exact: true }).click();
        await expect(page.getByText(equipeName)).toBeVisible({ timeout: 15000 });
        registeredEquipeName = equipeName;

        const { data: equipe } = await adminClient!
          .from('equipes')
          .select('id')
          .eq('org_id', orgId!)
          .eq('email', collaboratorEmail)
          .eq('nome', equipeName)
          .maybeSingle();
        if (equipe?.id) createdEquipeIds.push(equipe.id as string);
      } else {
        await page.getByPlaceholder(/Buscar por nome/i).fill(registeredEquipeName);
        await expect(page.getByText(registeredEquipeName)).toBeVisible({ timeout: 15000 });
      }

      await login(page, collaboratorEmail);
      await page.goto(`${baseUrl}/app/rdo/novo`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: /Novo Relat.rio Di.rio de Obra/i })).toBeVisible({ timeout: 15000 });
      await expectNoDocumentOverflow(page, `novo RDO colaborador antes do preenchimento ${viewport.name}`);

      await page.getByRole('combobox', { name: /Obra/ }).click();
      await page.getByRole('option', { name: obraName }).click();
      await selectClimate(page);

      await page.getByText('Adicionar atividade do cronograma').click();
      await page.getByRole('option', { name: new RegExp(activityName) }).click();
      await page
        .getByPlaceholder(/Registre aqui observa/i)
        .fill(observation);
      await expectNoDocumentOverflow(page, `novo RDO colaborador preenchido ${viewport.name}`);

      await page.getByRole('button', { name: /Finalizar/ }).click();
      await page.waitForURL(`${baseUrl}/app/rdo`, { timeout: 25000 });

      const { data: rdo, error: rdoError } = await adminClient!
        .from('rdos')
        .select('id, criado_por_id, org_id, observacoes, status')
        .eq('org_id', orgId!)
        .eq('criado_por_id', collaboratorUserId!)
        .eq('observacoes', observation)
        .maybeSingle();

      expect(rdoError).toBeNull();
      expect(rdo?.id, 'RDO deve ser persistido com o usuario colaborador como criador').toBeTruthy();
      expect(rdo?.status).toBe('DRAFT');
      createdRdoIds.push(rdo!.id as string);

      await login(page, adminEmail);
      await page.goto(`${baseUrl}/app/rdo/${rdo!.id}/visualizar`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByText(obraName).first()).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(observation)).toBeVisible();
      await expect(page.getByRole('button', { name: /Aprovar RDO/ })).toBeVisible();
      await expectNoDocumentOverflow(page, `visualizacao RDO admin ${viewport.name}`);

      if (viewport.name === 'mobile-390') {
        page.once('dialog', async (dialog) => {
          expect(dialog.message()).toContain('Aprovar este RDO?');
          await dialog.accept();
        });
        await page.getByRole('button', { name: /Aprovar RDO/ }).click();
        await expect(page.getByText(/RDO aprovado/i).first()).toBeVisible({ timeout: 15000 });

        await expect
          .poll(
            async () => {
              const { data } = await adminClient!
                .from('rdos')
                .select('status, approved_by, approved_at, aprovado_por_id, data_aprovacao')
                .eq('id', rdo!.id)
                .single();
              return data;
            },
            { timeout: 15000, message: 'RDO aprovado deve persistir status e aprovador no banco' }
          )
          .toMatchObject({
            status: 'APPROVED',
            approved_by: adminUserId,
            aprovado_por_id: adminUserId,
          });

        await page.reload({ waitUntil: 'domcontentloaded' });
        let emailRequestBody: any = null;
        await page.route('**/functions/v1/send-email-rdo', async (route) => {
          emailRequestBody = route.request().postDataJSON();
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, sent: true }),
          });
        });

        await page.getByRole('button', { name: /Enviar por E-mail/i }).click();
        const emailDialog = page.getByRole('dialog', { name: /Enviar RDO por e-mail/i });
        await expect(emailDialog).toBeVisible({ timeout: 15000 });
        await page.getByPlaceholder(/cliente@empresa.com/i).fill(`cliente-${runId}@teste.com; gestor-${runId}@teste.com`);
        await page.getByPlaceholder(/Mensagem para acompanhar/i).fill(`Envio QA sem provedor real ${viewport.name}`);
        const dialogMetrics = await emailDialog.evaluate((element) => {
          const rect = element.getBoundingClientRect();
          return {
            top: rect.top,
            bottom: rect.bottom,
            left: rect.left,
            right: rect.right,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
          };
        });
        expect(dialogMetrics.left, `dialog de e-mail nao deve sair pela esquerda: ${JSON.stringify(dialogMetrics)}`).toBeGreaterThanOrEqual(0);
        expect(dialogMetrics.right, `dialog de e-mail nao deve sair pela direita: ${JSON.stringify(dialogMetrics)}`).toBeLessThanOrEqual(dialogMetrics.viewportWidth + 1);
        expect(dialogMetrics.bottom, `dialog de e-mail deve caber verticalmente: ${JSON.stringify(dialogMetrics)}`).toBeLessThanOrEqual(dialogMetrics.viewportHeight + 1);
        await emailDialog.getByRole('button', { name: /^Enviar$/ }).click();
        await expect(page.getByText(/RDO enviado por e-mail/i)).toBeVisible({ timeout: 15000 });
        expect(emailRequestBody).toMatchObject({
          rdo_id: rdo!.id,
          emails: [`cliente-${runId}@teste.com`, `gestor-${runId}@teste.com`],
          motivo: `Envio QA sem provedor real ${viewport.name}`,
        });
        await page.unroute('**/functions/v1/send-email-rdo');

        if (validatePdfFromUI) {
          const [pdfResponse] = await Promise.all([
            page.waitForResponse(
              (response) =>
                response.url().includes('/functions/v1/generate-rdo-pdf') &&
                response.request().method() === 'POST',
              { timeout: 60000 }
            ),
            page.getByRole('button', { name: /Baixar PDF/ }).click(),
          ]);
          expect(
            pdfResponse.status(),
            `generate-rdo-pdf deve responder 200 pela UI: ${pdfResponse.url()}`
          ).toBe(200);
          expect(pdfResponse.headers()['content-type']).toContain('application/pdf');
          expect(pdfResponse.headers()['content-disposition']).toMatch(/\.PDF|\.pdf/);
          await expect(page.getByText(/PDF gerado com sucesso/i)).toBeVisible({ timeout: 15000 });

          const { response: directPdfResponse, buffer: directPdfBuffer } = await fetchRdoPdfAsUser(rdo!.id as string, adminEmail);
          const directPdfText = directPdfResponse.ok ? '' : new TextDecoder().decode(directPdfBuffer).slice(0, 1000);
          expect(
            directPdfResponse.status,
            `generate-rdo-pdf deve responder 200 em chamada autenticada direta: ${directPdfText}`
          ).toBe(200);
          expect(directPdfResponse.headers.get('content-type')).toContain('application/pdf');
          expect(directPdfResponse.headers.get('content-disposition')).toMatch(/\.PDF|\.pdf/);
          expect(directPdfBuffer.byteLength, 'PDF gerado deve ter conteudo real').toBeGreaterThan(1000);
        }
      } else {
        const rejectionReason = `Rejeicao QA PRD_LAYOUT ${viewport.name} ${runId}`;
        await page.getByRole('button', { name: /Rejeitar RDO/ }).click();
        await expect(page.getByRole('dialog', { name: /Rejeitar RDO/ })).toBeVisible();
        await page.getByPlaceholder(/Descreva o motivo/i).fill(rejectionReason);
        await page.getByRole('button', { name: /Confirmar Rejei/i }).click();
        await expect(page.getByText(/RDO rejeitado/i).first()).toBeVisible({ timeout: 15000 });

        await expect
          .poll(
            async () => {
              const { data } = await adminClient!
                .from('rdos')
                .select('status, approved_by, approved_at, rejection_reason, aprovado_por_id, data_aprovacao, motivo_rejeicao')
                .eq('id', rdo!.id)
                .single();
              return data;
            },
            { timeout: 15000, message: 'RDO rejeitado deve persistir status, aprovador e motivo no banco' }
          )
          .toMatchObject({
            status: 'REJECTED',
            approved_by: adminUserId,
            rejection_reason: rejectionReason,
            aprovado_por_id: adminUserId,
            motivo_rejeicao: rejectionReason,
          });
      }

      expect(
        relevantConsoleErrors(consoleErrors).slice(0, 5),
        `console errors in convite/RDO flow ${viewport.name}; failed responses: ${failedResponses.slice(0, 5).join(' | ')}`
      ).toEqual([]);
    });
  });
}
