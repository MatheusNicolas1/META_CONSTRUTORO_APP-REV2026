import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.PRD_PRINTS_PASSWORD;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Supabase env ausente: SUPABASE_URL/VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sao obrigatorios.');
}

if (!password) {
  throw new Error('Defina PRD_PRINTS_PASSWORD apenas no ambiente de execucao.');
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const today = '2026-06-03';
const safeDir = path.resolve('docs/evidence/prd-prints-campanha-2026-06-03');
const orgSlug = 'prd-prints-campanha-2026-06-03';
const orgName = 'Meta Construtor Campanha PRD Prints';
const campaignPlanSlug = 'prd-prints-campaign';
const emailPrefix = 'campanha+prdprints';
const emailDomain = 'metaconstrutor.test';

const personas = [
  ['01', 'Presidente', 'Diretoria acompanhando indicadores'],
  ['02', 'Administrador', 'Operacao central da construtora'],
  ['03', 'Gerente', 'Gestor de obra residencial'],
  ['04', 'Gerente', 'Gestor de obra comercial'],
  ['05', 'Colaborador', 'Encarregado registrando RDO'],
  ['06', 'Colaborador', 'Tecnico de qualidade/checklist'],
  ['07', 'Administrador', 'Suprimentos/fornecedores'],
  ['08', 'Gerente', 'Controle de equipes/equipamentos'],
  ['09', 'Administrador', 'Financeiro/despesas'],
  ['10', 'Presidente', 'Revisao final e dashboard'],
].map(([number, role, persona]) => ({
  number,
  role,
  persona,
  email: `${emailPrefix}${number}@${emailDomain}`,
  name: `Campanha ${number} ${role}`,
}));

const obrasSeed = [
  ['Residencial Horizonte', 'Residencial', 'ACTIVE', 72, 'Alta'],
  ['Edificio Alameda', 'Comercial', 'ACTIVE', 48, 'Alta'],
  ['Reforma Clinica Norte', 'Institucional', 'ON_HOLD', 36, 'Alta'],
  ['Galpao Logistico Sul', 'Industrial', 'ACTIVE', 61, 'Baixa'],
  ['Condominio Jardim Azul', 'Residencial', 'DRAFT', 18, 'Baixa'],
  ['Loja Conceito Centro', 'Comercial', 'COMPLETED', 100, 'Baixa'],
];

const atividadeSeed = [
  ['Conferencia de fundacao', 'Estrutura', 'm2', 120, 'agendada', 'alta'],
  ['Instalacao hidraulica pavimento 2', 'Instalacoes', 'm', 86, 'em_andamento', 'media'],
  ['Checklist de seguranca da frente leste', 'Seguranca', 'un', 1, 'concluida', 'alta'],
  ['Recebimento de revestimentos', 'Suprimentos', 'cx', 42, 'agendada', 'media'],
  ['Fechamento de drywall', 'Acabamento', 'm2', 64, 'em_andamento', 'media'],
  ['Vistoria de entrega parcial', 'Qualidade', 'un', 1, 'concluida', 'alta'],
];

const checklistsSeed = [
  ['Qualidade da concretagem', 'Qualidade'],
  ['Seguranca diaria da equipe', 'Segurança'],
  ['Entrega de materiais', 'Equipamentos'],
  ['Limpeza e organizacao', 'Outros'],
  ['Documentacao da obra', 'Documentação'],
  ['Vistoria de acabamento', 'Qualidade'],
];

const fornecedoresSeed = [
  ['Concreto Forte Demo', 'Materiais', 'Marina Demo'],
  ['Eletrica Prime Demo', 'Servicos', 'Rafael Demo'],
  ['Hidraulica Sul Demo', 'Servicos', 'Livia Demo'],
  ['LocaMaquinas Demo', 'Equipamentos', 'Paulo Demo'],
  ['Acabamentos Alfa Demo', 'Materiais', 'Renata Demo'],
  ['Seguranca Obra Demo', 'EPI', 'Bruno Demo'],
];

const equipamentosSeed = [
  ['Betoneira 400L', 'Concretagem', 'Operacional'],
  ['Andaime Fachadeiro', 'Acesso', 'Operacional'],
  ['Compactador de Solo', 'Terraplenagem', 'Manutenção'],
  ['Serra Circular Bancada', 'Carpintaria', 'Operacional'],
  ['Guincho de Coluna', 'Transporte vertical', 'Operacional'],
  ['Nivel Laser Rotativo', 'Medicao', 'Parado'],
];

const equipesSeed = [
  ['Equipe Estrutura', 'Carpintaria'],
  ['Equipe Instalacoes', 'Eletrica e hidraulica'],
  ['Equipe Acabamento', 'Revestimentos'],
  ['Equipe Qualidade', 'Inspecao'],
  ['Equipe Seguranca', 'SST'],
  ['Equipe Suprimentos', 'Logistica'],
];

const expenseSeed = [
  ['Concreto usinado', 'Material', 8420],
  ['Locacao de andaimes', 'Equipamento', 3180],
  ['Mao de obra acabamento', 'Mão de Obra', 12600],
  ['EPIs semanais', 'Outros', 1480],
  ['Transporte de materiais', 'Frete', 950],
  ['Revisao de projeto executivo', 'Serviços', 2200],
];

async function maybeSingle(query) {
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data;
}

async function removeExistingCampaign() {
  const removeOrgData = async (orgIds) => {
    const ids = [...new Set((orgIds || []).filter(Boolean))];
    if (ids.length === 0) return;

    const { data: rdos } = await admin.from('rdos').select('id').in('org_id', ids);
    const rdoIds = (rdos || []).map((rdo) => rdo.id);
    if (rdoIds.length) {
      await admin.from('rdo_equipamentos').delete().in('rdo_id', rdoIds);
      await admin.from('rdo_equipes').delete().in('rdo_id', rdoIds);
      await admin.from('rdo_atividades').delete().in('rdo_id', rdoIds);
    }

    const { data: checklists } = await admin.from('checklists').select('id').in('org_id', ids);
    const checklistIds = (checklists || []).map((checklist) => checklist.id);
    if (checklistIds.length) {
      await admin.from('checklist_items').delete().in('checklist_id', checklistIds);
    }

    await admin.from('documentos').delete().in('org_id', ids);
    await admin.from('expenses').delete().in('org_id', ids);
    await admin.from('rdos').delete().in('org_id', ids);
    await admin.from('checklists').delete().in('org_id', ids);
    await admin.from('atividades').delete().in('org_id', ids);
    await admin.from('equipamentos').delete().in('org_id', ids);
    await admin.from('equipes').delete().in('org_id', ids);
    await admin.from('fornecedores').delete().in('org_id', ids);
    await admin.from('obras').delete().in('org_id', ids);
    await admin.from('org_credits').delete().in('org_id', ids);
    await admin.from('subscriptions').delete().in('org_id', ids);
    await admin.from('org_members').delete().in('org_id', ids);
    await admin.from('orgs').delete().in('id', ids);
  };

  const org = await maybeSingle(admin.from('orgs').select('id').eq('slug', orgSlug));
  if (org?.id) await removeOrgData([org.id]);

  const campaignEmails = new Set(personas.map((persona) => persona.email));
  const usersToDelete = [];
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    for (const user of data.users || []) {
      if (campaignEmails.has(user.email)) usersToDelete.push(user);
    }
    if (!data.users || data.users.length < 1000) break;
  }

  const userIds = usersToDelete.map((user) => user.id);
  if (userIds.length) {
    const { data: ownedOrgs } = await admin.from('orgs').select('id').in('owner_user_id', userIds);
    const { data: memberships } = await admin.from('org_members').select('org_id').in('user_id', userIds);
    await removeOrgData([
      ...(ownedOrgs || []).map((item) => item.id),
      ...(memberships || []).map((item) => item.org_id),
    ]);

    await admin.from('user_roles').delete().in('user_id', userIds);
    await admin.from('user_settings').delete().in('user_id', userIds);
    await admin.from('profiles').delete().in('id', userIds);
  }

  for (const user of usersToDelete) {
    await admin.auth.admin.deleteUser(user.id);
  }

  await admin.from('plans').delete().eq('slug', campaignPlanSlug);
}

async function insertOrThrow(table, rows, options = {}) {
  const { data, error } = await admin.from(table).insert(rows).select(options.select || '*');
  if (error) throw new Error(`${table}: ${error.message}`);
  return data;
}

async function upsertOrThrow(table, rows, options = {}) {
  const { data, error } = await admin
    .from(table)
    .upsert(rows, { onConflict: options.onConflict || 'id' })
    .select(options.select || '*');
  if (error) throw new Error(`${table}: ${error.message}`);
  return data;
}

async function main() {
  await fs.mkdir(safeDir, { recursive: true });
  await removeExistingCampaign();

  const users = [];
  for (const persona of personas) {
    const { data, error } = await admin.auth.admin.createUser({
      email: persona.email,
      password,
      email_confirm: true,
      user_metadata: {
        name: persona.name,
        source: 'PRD_PRINTS',
        persona: persona.persona,
      },
    });
    if (error) throw new Error(`auth ${persona.email}: ${error.message}`);
    users.push({ ...persona, id: data.user.id });
  }

  const reviewer = users.find((user) => user.number === '10');
  const owner = users.find((user) => user.number === '01');

  await upsertOrThrow('profiles', users.map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    phone: null,
    company: orgName,
    company_address: 'Endereco demonstrativo de campanha',
    cpf_cnpj: null,
    bio: user.persona,
    position: user.role,
    plan_type: 'premium',
    subscription_status: 'active',
    terms_accepted_at: new Date().toISOString(),
    is_public: false,
    has_seen_onboarding: true,
  })));

  await upsertOrThrow('user_roles', users.map((user) => ({
    user_id: user.id,
    role: user.role,
  })), { onConflict: 'user_id' });

  const [org] = await insertOrThrow('orgs', [{
    name: orgName,
    slug: orgSlug,
    owner_user_id: owner.id,
  }]);

  const [selectedPlan] = await insertOrThrow('plans', [{
    slug: campaignPlanSlug,
    name: 'PRD PRINTS CAMPANHA',
    description: 'Plano tecnico oculto para seed visual de campanha PRD_PRINTS.',
    display_order: 999,
    is_active: false,
    is_popular: false,
    max_users: 20,
    max_obras: 20,
    monthly_rdos: 200,
    monthly_price_cents: null,
    yearly_price_cents: null,
    features: ['campanha', 'prd_prints'],
  }]);

  await insertOrThrow('subscriptions', [{
    org_id: org.id,
    plan_id: selectedPlan.id,
    status: 'active',
    billing_cycle: 'monthly',
    current_period_start: new Date().toISOString(),
    current_period_end: '2026-12-31T23:59:59.000Z',
    metadata: {
      source: 'PRD_PRINTS',
      external_billing: false,
    },
  }]);

  await upsertOrThrow('org_credits', [{
    org_id: org.id,
    plan_type: selectedPlan.slug,
    rdo_credits_balance: 500,
  }], { onConflict: 'org_id' });

  await insertOrThrow('org_members', users.map((user) => ({
    org_id: org.id,
    user_id: user.id,
    role: user.role,
    status: 'active',
    joined_at: new Date().toISOString(),
  })));

  const obras = await insertOrThrow('obras', obrasSeed.map(([nome, tipo, status, progresso, prioridade], index) => ({
    nome,
    cliente: `Cliente demonstrativo ${index + 1}`,
    localizacao: `Cidade Demo ${index + 1}`,
    responsavel: users[index % users.length].name,
    tipo,
    status,
    progresso,
    prioridade,
    categoria: tipo,
    area: `${(index + 1) * 240} m2`,
    data_inicio: `2026-0${(index % 5) + 1}-10`,
    previsao_termino: `2026-${String((index % 5) + 7).padStart(2, '0')}-20`,
    descricao: `Obra demonstrativa para campanha publicitaria do Meta Construtor.`,
    observacoes: `Registro seguro PRD_PRINTS ${today}.`,
    org_id: org.id,
    user_id: reviewer.id,
    is_public: false,
  })));

  const atividades = await insertOrThrow('atividades', obras.flatMap((obra, obraIndex) =>
    atividadeSeed.map(([titulo, categoria, unidade, quantidade, status, prioridade], index) => ({
      titulo: `${titulo} - ${obra.nome}`,
      descricao: `Atividade demonstrativa ${index + 1} vinculada a ${obra.nome}.`,
      data: `2026-06-${String(index + 4).padStart(2, '0')}`,
      hora: `${String(8 + index).padStart(2, '0')}:00`,
      status,
      prioridade,
      categoria,
      unidade_medida: unidade,
      quantidade_prevista: quantidade,
      responsavel: users[(obraIndex + index) % users.length].name,
      obra_id: obra.id,
      org_id: org.id,
      user_id: reviewer.id,
      notificado: false,
    }))
  ));

  const equipes = await insertOrThrow('equipes', equipesSeed.map(([nome, funcao], index) => ({
    nome,
    funcao,
    email: null,
    telefone: null,
    ativo: true,
    org_id: org.id,
    user_id: reviewer.id,
  })));

  const equipamentos = await insertOrThrow('equipamentos', equipamentosSeed.map(([nome, categoria, status]) => ({
    nome,
    categoria,
    status,
    observacoes: `Equipamento demonstrativo PRD_PRINTS.`,
    org_id: org.id,
    user_id: reviewer.id,
  })));

  const fornecedores = await insertOrThrow('fornecedores', fornecedoresSeed.map(([nome, categoria, contato]) => ({
    nome,
    categoria,
    contato,
    email: null,
    telefone: null,
    cnpj: null,
    endereco: null,
    observacoes: 'Fornecedor demonstrativo sem dados reais.',
    ativo: true,
    org_id: org.id,
    user_id: reviewer.id,
  })));

  const rdos = await insertOrThrow('rdos', obras.map((obra, index) => ({
    obra_id: obra.id,
    data: `2026-06-${String(index + 3).padStart(2, '0')}`,
    periodo: index % 2 === 0 ? 'Integral' : 'Manhã',
    clima: ['Ensolarado', 'Nublado', 'Chuva leve'][index % 3],
    equipe_ociosa: index === 2,
    tempo_ocioso: index === 2 ? 2 : null,
    observacoes: `RDO demonstrativo com atividades, equipe e equipamentos para campanha.`,
    detalhes: {
      fonte: 'PRD_PRINTS',
      acidentes: false,
      materiaisFalta: index === 3,
      estoqueMateriais: 'Controlado',
    },
    status: index < 2 ? 'APPROVED' : 'DRAFT',
    aprovado_por_id: index < 2 ? owner.id : null,
    data_aprovacao: index < 2 ? new Date().toISOString() : null,
    criado_por_id: reviewer.id,
    org_id: org.id,
  })));

  await insertOrThrow('rdo_atividades', rdos.flatMap((rdo, rdoIndex) =>
    atividadeSeed.slice(0, 3).map(([titulo, categoria, unidade, quantidade], index) => ({
      rdo_id: rdo.id,
      nome: titulo,
      categoria,
      quantidade,
      unidade_medida: unidade,
      percentual_concluido: [35, 65, 100][index],
      status: index === 2 ? 'Concluída' : 'Em Andamento',
      observacoes: `Evolucao registrada no RDO ${rdoIndex + 1}.`,
      is_extra: false,
    }))
  ));

  await insertOrThrow('rdo_equipes', rdos.flatMap((rdo, index) => [
    {
      rdo_id: rdo.id,
      equipe_id: equipes[index % equipes.length].id,
      horas_trabalho: 8,
      presente: true,
      horas_ociosas: 0,
    },
  ]));

  await insertOrThrow('rdo_equipamentos', rdos.flatMap((rdo, index) => [
    {
      rdo_id: rdo.id,
      equipamento_id: equipamentos[index % equipamentos.length].id,
      horas_uso: 6,
      status: index === 2 ? 'Manutenção' : 'Operacional',
      observacoes: 'Uso demonstrativo registrado.',
      causou_ociosidade: false,
      horas_parada: 0,
    },
  ]));

  const checklists = await insertOrThrow('checklists', checklistsSeed.map(([titulo, categoria], index) => ({
    titulo,
    categoria,
    descricao: `Checklist demonstrativo de ${categoria.toLowerCase()}.`,
    obra_id: obras[index % obras.length].id,
    responsavel_id: users[(index + 2) % users.length].id,
    org_id: org.id,
    status: index < 3 ? 'Concluído' : 'Em Andamento',
    progresso_completo: index < 3 ? 5 : 3,
    progresso_total: 5,
    started_at: new Date().toISOString(),
    completed_at: index < 3 ? new Date().toISOString() : null,
    data_vencimento: `2026-07-${String(index + 8).padStart(2, '0')}`,
  })));

  await insertOrThrow('checklist_items', checklists.flatMap((checklist, checklistIndex) =>
    ['Planejado', 'Executado', 'Fotografado', 'Conferido', 'Aprovado'].map((titulo, index) => ({
      checklist_id: checklist.id,
      titulo: `${titulo} - item ${index + 1}`,
      descricao: `Item demonstrativo do checklist ${checklistIndex + 1}.`,
      prioridade: index < 2 ? 'Alta' : 'Baixa',
      status: checklistIndex < 3 || index < 3 ? 'Concluído' : 'Em andamento',
      obrigatorio: true,
      requer_anexo: index === 2,
      observacoes: index < 3 ? 'Validado na rotina demonstrativa.' : null,
      completed_at: checklistIndex < 3 || index < 3 ? new Date().toISOString() : null,
      completed_by: checklistIndex < 3 || index < 3 ? reviewer.id : null,
    }))
  ));

  const docs = await insertOrThrow('documentos', [
    ['Contrato demonstrativo', 'PDF', 'contratos/demo-contrato.pdf', 'Contratos'],
    ['ART demonstrativa', 'PDF', 'documentos/demo-art.pdf', 'Documentacao'],
    ['Projeto executivo', 'PDF', 'projetos/demo-projeto.pdf', 'Projetos'],
    ['Foto de obra', 'PNG', 'fotos/demo-obra.png', 'Fotos'],
    ['Nota fiscal demonstrativa', 'PDF', 'notas/demo-nota.pdf', 'Financeiro'],
    ['Laudo de vistoria', 'PDF', 'laudos/demo-laudo.pdf', 'Qualidade'],
  ].map(([nome, tipo, url, categoria], index) => ({
    nome,
    tipo,
    url,
    categoria,
    descricao: 'Documento demonstrativo sem arquivo sensivel real.',
    tamanho: 240000 + index * 10000,
    obra_id: obras[index % obras.length].id,
    org_id: org.id,
    uploaded_by: reviewer.id,
  })));

  const expenses = await insertOrThrow('expenses', expenseSeed.map(([label, category, amount], index) => ({
    amount,
    approval_status: index < 3 ? 'Approved' : 'Pending Manager',
    cost_category: category,
    date_of_expense: `2026-06-${String(index + 6).padStart(2, '0')}`,
    invoice_number: `DEMO-${today.replaceAll('-', '')}-${index + 1}`,
    notes: `${label} - despesa demonstrativa sem documento fiscal real.`,
    obra_id: obras[index % obras.length].id,
    org_id: org.id,
    supplier_name: fornecedores[index % fornecedores.length].nome,
    user_submitting_id: reviewer.id,
  })));

  const summary = {
    generated_at: new Date().toISOString(),
    environment: supabaseUrl.includes('supabase.co') ? 'supabase remoto configurado no .env' : 'supabase local',
    org: { id: org.id, slug: orgSlug, name: orgName },
    plan: { slug: selectedPlan.slug, max_users: selectedPlan.max_users, max_obras: selectedPlan.max_obras },
    login_email: reviewer.email,
    counts: {
      users: users.length,
      obras: obras.length,
      atividades: atividades.length,
      rdos: rdos.length,
      rdo_atividades: rdos.length * 3,
      checklists: checklists.length,
      checklist_items: checklists.length * 5,
      documentos: docs.length,
      equipes: equipes.length,
      equipamentos: equipamentos.length,
      fornecedores: fornecedores.length,
      expenses: expenses.length,
    },
    safety: {
      password_recorded: false,
      real_customer_data: false,
      external_integrations_called: false,
    },
  };

  await fs.writeFile(
    path.join(safeDir, 'seed-summary.json'),
    `${JSON.stringify(summary, null, 2)}\n`,
    'utf8'
  );

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
