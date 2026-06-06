import 'dotenv/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { test, expect } from 'playwright/test';

type ReportPayload = {
  reportType: string;
  title: string;
  subtitle?: string;
  generatedAt?: string;
  meta?: Array<{ label: string; value: unknown }>;
  sections: Array<{
    title: string;
    description?: string;
    meta?: Array<{ label: string; value: unknown }>;
    columns?: Array<{ key: string; label: string }>;
    rows?: Record<string, unknown>[];
    notes?: string[];
  }>;
};

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const qaPassword = 'Teste@1234!';
const runId = `${Date.now()}`;
const qaEmail = `prd-layout-report-pdf-${runId}@teste.com`;

let adminClient: SupabaseClient | null = null;
let qaUserId: string | null = null;

const createAdminClient = () => {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase URL/service role key ausentes para smoke de PDFs de relatorios.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

const signInQaUser = async () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL/anon key ausentes para smoke de PDFs de relatorios.');
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  const { data, error } = await userClient.auth.signInWithPassword({
    email: qaEmail,
    password: qaPassword,
  });

  if (error || !data.session?.access_token) {
    throw error || new Error('Sessao ausente para smoke de PDFs de relatorios.');
  }

  return { userClient, accessToken: data.session.access_token };
};

const requestReportPdf = async (payload: ReportPayload, accessToken: string) => {
  const response = await fetch(`${supabaseUrl}/functions/v1/generate-rdo-pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/pdf',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      reportType: payload.reportType,
      report: payload,
    }),
  });
  const body = await response.arrayBuffer();
  return { response, body };
};

const reportPayloads: ReportPayload[] = [
  {
    reportType: 'FINANCEIRO',
    title: 'Relatorio Financeiro Consolidado',
    subtitle: 'Custos e aprovacao financeira por obra',
    generatedAt: '2026-05-27T09:00:00.000Z',
    meta: [
      { label: 'Obra', value: 'Obra QA PDF Generico' },
      { label: 'Periodo', value: 'Maio/2026' },
      { label: 'Total de lancamentos', value: 4 },
    ],
    sections: [
      {
        title: 'Informacoes Basicas',
        meta: [
          { label: 'Total despesas', value: 'R$ 42.350,90' },
          { label: 'Total aprovado', value: 'R$ 31.250,40' },
          { label: 'Total pendente', value: 'R$ 11.100,50' },
        ],
      },
      {
        title: 'Lancamentos Financeiros',
        columns: [
          { key: 'obra', label: 'Obra' },
          { key: 'periodo', label: 'Periodo' },
          { key: 'categoria', label: 'Categoria' },
          { key: 'lancamentos', label: 'Lancamentos' },
          { key: 'totalDespesas', label: 'Total Despesas' },
          { key: 'totalAprovado', label: 'Total Aprovado' },
          { key: 'totalPendente', label: 'Total Pendente' },
        ],
        rows: [
          {
            obra: 'Obra QA PDF Generico',
            periodo: '2026-05',
            categoria: 'Material',
            lancamentos: 2,
            totalDespesas: 'R$ 22.100,00',
            totalAprovado: 'R$ 18.000,00',
            totalPendente: 'R$ 4.100,00',
          },
          {
            obra: 'Obra QA PDF Generico',
            periodo: '2026-05',
            categoria: 'Mao de Obra',
            lancamentos: 2,
            totalDespesas: 'R$ 20.250,90',
            totalAprovado: 'R$ 13.250,40',
            totalPendente: 'R$ 7.000,50',
          },
        ],
      },
      { title: 'Observacoes Gerais', notes: ['Relatorio financeiro com valores longos e centavos preservados.'] },
    ],
  },
  {
    reportType: 'CRONOGRAMA',
    title: 'Relatorio de Cronograma vs Realizado',
    subtitle: 'Comparativo entre planejamento e execucao',
    generatedAt: '2026-05-27T09:05:00.000Z',
    sections: [
      {
        title: 'Indicadores',
        meta: [
          { label: 'Atividades avaliadas', value: 3 },
          { label: 'Percentual medio realizado', value: '78%' },
          { label: 'Desvio medio', value: '2 dias' },
        ],
      },
      {
        title: 'Cronograma',
        columns: [
          { key: 'obra', label: 'Obra' },
          { key: 'atividade', label: 'Atividade' },
          { key: 'dataPlanejada', label: 'Data Planejada' },
          { key: 'dataRealizada', label: 'Data Realizada' },
          { key: 'qtdPrevista', label: 'Qtd Prevista' },
          { key: 'qtdRealizada', label: 'Qtd Realizada' },
          { key: 'percentual', label: '% Realizado' },
          { key: 'situacao', label: 'Situacao' },
        ],
        rows: [
          {
            obra: 'Obra QA PDF Generico',
            atividade: 'Concretagem da laje superior com descricao extensa para quebra de linha',
            dataPlanejada: '2026-05-21',
            dataRealizada: '2026-05-23',
            qtdPrevista: '120 m2',
            qtdRealizada: '95 m2',
            percentual: '79%',
            situacao: 'Em andamento com pequeno desvio',
          },
        ],
      },
    ],
  },
  {
    reportType: 'DESPESAS',
    title: 'Relatorio de Despesas',
    subtitle: 'Controle financeiro e aprovacao de despesas',
    generatedAt: '2026-05-27T09:10:00.000Z',
    sections: [
      {
        title: 'Indicadores Financeiros',
        meta: [
          { label: 'Quantidade', value: 3 },
          { label: 'Total geral', value: 'R$ 8.742,37' },
          { label: 'Status', value: 'Todos' },
        ],
      },
      {
        title: 'Despesas',
        columns: [
          { key: 'data', label: 'Data' },
          { key: 'nota', label: 'Nota Fiscal' },
          { key: 'fornecedor', label: 'Fornecedor' },
          { key: 'categoria', label: 'Categoria' },
          { key: 'valor', label: 'Valor' },
          { key: 'status', label: 'Status' },
        ],
        rows: [
          {
            data: '27/05/2026',
            nota: 'NF-000123456789',
            fornecedor: 'Fornecedor QA com nome empresarial muito longo Ltda',
            categoria: 'Material',
            valor: 'R$ 5.420,12',
            status: 'Approved',
          },
          {
            data: '27/05/2026',
            nota: 'NF-000987654321',
            fornecedor: 'Prestador QA Engenharia',
            categoria: 'Servicos',
            valor: 'R$ 3.322,25',
            status: 'Pending Manager',
          },
        ],
      },
      { title: 'Observacoes Gerais', notes: ['Relatorio de despesas com fornecedores e notas longas.'] },
    ],
  },
  {
    reportType: 'OBRA',
    title: 'Relatorio da Obra',
    subtitle: 'Obra QA PDF Generico',
    generatedAt: '2026-05-27T09:15:00.000Z',
    meta: [
      { label: 'Status', value: 'ACTIVE' },
      { label: 'Progresso', value: '67%' },
      { label: 'Responsavel', value: 'Engenheiro QA' },
    ],
    sections: [
      {
        title: 'Informacoes Basicas',
        meta: [
          { label: 'Cliente', value: 'Cliente QA' },
          { label: 'Localizacao', value: 'Rua de teste com endereco completo, 1234, Salvador - BA' },
          { label: 'Orcamento', value: 'R$ 950.000,00' },
        ],
      },
      {
        title: 'RDOs Vinculados',
        columns: [
          { key: 'data', label: 'Data' },
          { key: 'status', label: 'Status' },
          { key: 'clima', label: 'Clima' },
          { key: 'atividades', label: 'Atividades' },
          { key: 'equipamentos', label: 'Equipamentos' },
        ],
        rows: [
          {
            data: '27/05/2026',
            status: 'APPROVED',
            clima: 'Ensolarado',
            atividades: 8,
            equipamentos: 3,
          },
        ],
      },
      {
        title: 'Financeiro',
        meta: [
          { label: 'Orcamento total', value: 'R$ 950.000,00' },
          { label: 'Valor executado', value: 'R$ 636.500,00' },
          { label: 'Saldo restante', value: 'R$ 313.500,00' },
        ],
      },
    ],
  },
];

test.describe.configure({ mode: 'serial' });
test.setTimeout(120000);

test.beforeAll(async () => {
  adminClient = createAdminClient();
  const { data, error } = await adminClient.auth.admin.createUser({
    email: qaEmail,
    password: qaPassword,
    email_confirm: true,
    user_metadata: {
      name: 'QA PDFs Relatorios',
      terms_accepted_at: new Date().toISOString(),
    },
  });
  if (error) throw error;
  qaUserId = data.user.id;

  await adminClient.from('profiles').upsert({
    id: qaUserId,
    name: 'QA PDFs Relatorios',
    email: qaEmail,
    has_seen_onboarding: true,
    updated_at: new Date().toISOString(),
  } as never);
});

test.afterAll(async () => {
  if (!adminClient || !qaUserId) return;
  await adminClient.from('profiles').delete().eq('id', qaUserId);
  await adminClient.auth.admin.deleteUser(qaUserId);
});

test('Edge Function gera PDFs genericos de relatorios com payloads completos', async () => {
  const { userClient, accessToken } = await signInQaUser();

  try {
    for (const payload of reportPayloads) {
      const { response, body } = await requestReportPdf(payload, accessToken);
      const errorText = response.ok ? '' : new TextDecoder().decode(body).slice(0, 1000);
      const filename = response.headers.get('content-disposition') || '';

      expect(response.status, `${payload.reportType} deve retornar 200: ${errorText}`).toBe(200);
      expect(response.headers.get('content-type'), `${payload.reportType} deve retornar PDF`).toContain('application/pdf');
      expect(filename, `${payload.reportType} deve retornar filename .PDF`).toMatch(/RELATORIO_[A-Z0-9_]+_2026-05-27\.PDF/i);
      expect(filename, `${payload.reportType} nao pode conter NaN no filename`).not.toContain('NaN');
      expect(body.byteLength, `${payload.reportType} deve ter corpo PDF real`).toBeGreaterThan(1000);
    }
  } finally {
    await userClient.auth.signOut();
  }
});
