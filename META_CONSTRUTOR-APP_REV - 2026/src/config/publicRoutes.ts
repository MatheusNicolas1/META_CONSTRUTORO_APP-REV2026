/**
 * Arquitetura de informação das páginas públicas (proposta PRD_ROTAS_PUBLICAS).
 *
 * Fonte única para menu, rodapé e mapa de rotas públicas. Benchmark: estrutura
 * do Canva PT-BR (menu por intenção, uma página por funcionalidade, modelos
 * grátis, central de aprendizado e rodapé denso), com a identidade do Meta
 * Construtor. Descrições citam apenas módulos que existem no app autenticado.
 *
 * Status:
 * - "ativa": rota já existe e segue indexável.
 * - "nova": rota proposta, ainda não criada.
 * - "consolidar": rota existente que deve sair do índice e ser redirecionada.
 */

export type PublicRouteStatus = "ativa" | "nova" | "consolidar";

export interface PublicRouteItem {
  label: string;
  path: string;
  description?: string;
  keyword?: string;
  status: PublicRouteStatus;
  note?: string;
}

export interface PublicNavGroup {
  title: string;
  items: PublicRouteItem[];
}

export interface PublicNavFeature {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  cta: PublicRouteItem;
}

export interface PublicNavMenu {
  id: string;
  label: string;
  groups: PublicNavGroup[];
  feature?: PublicNavFeature;
}

export interface PublicNavLink {
  id: string;
  label: string;
  item: PublicRouteItem;
}

export type PublicNavEntry = PublicNavMenu | PublicNavLink;

export const isNavMenu = (entry: PublicNavEntry): entry is PublicNavMenu => "groups" in entry;

// ─── Rotas ────────────────────────────────────────────────────

export const routes = {
  home: { label: "Início", path: "/", keyword: "sistema de gestão de obras", status: "ativa" },

  // Produto — rotina de campo
  rdo: {
    label: "RDO digital",
    path: "/funcionalidades/rdo-digital",
    description: "Diário de obra com fotos, clima, efetivo e aprovação.",
    keyword: "rdo digital · diário de obra",
    status: "ativa",
  },
  checklist: {
    label: "Checklists de qualidade",
    path: "/funcionalidades/checklist-de-obra",
    description: "Inspeções com itens conformes, não conformes e PDF.",
    keyword: "checklist de obra",
    status: "ativa",
  },
  dds: {
    label: "DDS",
    path: "/funcionalidades/dds",
    description: "Diálogo Diário de Segurança com registro e indicadores.",
    keyword: "dds segurança do trabalho",
    status: "ativa",
  },
  ordemServico: {
    label: "Ordens de serviço",
    path: "/funcionalidades/ordem-de-servico",
    description: "OS com aprovação em etapas e histórico.",
    keyword: "ordem de serviço obra",
    status: "ativa",
  },

  // Produto — gestão da obra
  controleObras: {
    label: "Obras e atividades",
    path: "/funcionalidades/controle-de-obras",
    description: "Cadastro de obras, atividades, responsáveis e prazos.",
    keyword: "controle de obras",
    status: "ativa",
  },
  equipes: {
    label: "Equipes e equipamentos",
    path: "/funcionalidades/equipes-e-equipamentos",
    description: "Equipes, colaboradores e equipamentos por obra.",
    keyword: "gestão de equipes na construção civil",
    status: "ativa",
  },
  documentos: {
    label: "Documentos da obra",
    path: "/funcionalidades/documentos-de-obra",
    description: "Projetos, ART e laudos organizados por obra.",
    keyword: "documentos de obra",
    status: "ativa",
  },
  relatorios: {
    label: "Relatórios",
    path: "/funcionalidades/relatorios-de-obra",
    description: "Resumos e PDFs a partir dos registros de campo.",
    keyword: "relatório de obra",
    status: "ativa",
  },

  // Produto — financeiro e contratos
  medicao: {
    label: "Contratos e medições",
    path: "/funcionalidades/medicao-de-obra",
    description: "Medições com cálculo e fluxo de aprovação.",
    keyword: "medição de obra",
    status: "ativa",
  },
  fluxoCaixa: {
    label: "Fluxo de caixa e curva ABC",
    path: "/funcionalidades/fluxo-de-caixa-de-obra",
    description: "Entradas, saídas e curva ABC por obra.",
    keyword: "fluxo de caixa de obra",
    status: "ativa",
  },
  despesas: {
    label: "Despesas e fornecedores",
    path: "/funcionalidades/despesas-e-fornecedores",
    description: "Despesas lançadas por obra e cadastro de fornecedores.",
    keyword: "controle de despesas de obra",
    status: "ativa",
  },

  // Produto — cliente e integrações
  portalCliente: {
    label: "Portal do cliente",
    path: "/funcionalidades/portal-do-cliente",
    description: "O cliente acompanha a obra por um link seguro.",
    keyword: "portal do cliente construtora",
    status: "ativa",
  },
  erp: {
    label: "Integração com ERP",
    path: "/funcionalidades/integracao-erp",
    description: "Conexão por API com o ERP da empresa.",
    keyword: "integração com erp",
    status: "ativa",
  },
  api: {
    label: "API",
    path: "/api",
    description: "Edge Functions, permissões e integrações técnicas.",
    keyword: "api gestão de obras",
    status: "ativa",
  },

  // Soluções
  construtoras: {
    label: "Construtoras",
    path: "/solucoes/construtoras",
    description: "Padronize registros e relatórios entre as obras.",
    keyword: "software para construtora",
    status: "ativa",
  },
  engenheiros: {
    label: "Engenheiros e gestores de obra",
    path: "/solucoes/engenheiros",
    description: "Acompanhe o avanço diário sem planilha.",
    keyword: "app para engenheiro civil",
    status: "ativa",
  },
  diretoria: {
    label: "Donos e diretores",
    path: "/solucoes/diretoria",
    description: "Todas as obras e pendências em um só painel.",
    keyword: "controle de obras para diretoria",
    status: "ativa",
  },
  obrasPublicas: {
    label: "Obras públicas",
    path: "/solucoes/obras-publicas",
    description: "RDO e medição com a documentação que a fiscalização pede.",
    keyword: "rdo obras públicas",
    status: "ativa",
  },

  // Modelos grátis
  modelos: {
    label: "Modelos grátis",
    path: "/modelos",
    description: "Modelos prontos para a rotina da obra.",
    keyword: "modelos para obra",
    status: "ativa",
  },
  modeloRdo: {
    label: "Modelo de RDO em Excel",
    path: "/modelos/rdo-excel",
    description: "Planilha de diário de obra para começar hoje.",
    keyword: "modelo de rdo excel",
    status: "nova",
    note: "Substitui /captura depois que os leads forem salvos no Supabase.",
  },

  // Aprender
  blog: { label: "Blog", path: "/blog", description: "Guias sobre gestão de obras e RDO.", keyword: "blog gestão de obras", status: "ativa" },
  ajuda: { label: "Central de ajuda", path: "/central-ajuda", description: "Passo a passo dos principais fluxos.", status: "ativa" },
  documentacao: { label: "Documentação", path: "/documentacao", description: "Limites, webhooks e integrações.", status: "ativa" },
  atualizacoes: { label: "Atualizações", path: "/atualizacoes", description: "O que mudou no produto.", status: "ativa" },
  status: { label: "Status", path: "/status", description: "Situação operacional da plataforma.", status: "ativa" },
  guiaRdo: {
    label: "Guia completo do RDO online",
    path: "/blog/rdo-online-guia-completo",
    status: "ativa",
  },

  // Planos e conversão
  preco: { label: "Planos", path: "/preco", keyword: "preço software gestão de obras", status: "ativa" },
  criarConta: { label: "Criar conta grátis", path: "/criar-conta", status: "ativa" },
  login: { label: "Entrar", path: "/login", status: "ativa" },
  contato: { label: "Falar com vendas", path: "/contato", description: "Demonstração, planos e parcerias.", status: "ativa" },

  // Empresa e legal
  sobre: { label: "Sobre", path: "/sobre", status: "ativa" },
  contatoEmpresa: { label: "Contato", path: "/contato", status: "ativa" },
  carreiras: { label: "Carreiras", path: "/carreiras", status: "ativa" },
  privacidade: { label: "Privacidade", path: "/legal/privacidade", status: "ativa" },
  termos: { label: "Termos de uso", path: "/legal/termos", status: "ativa" },
  cookies: { label: "Cookies", path: "/legal/cookies", status: "ativa" },
  lgpd: { label: "LGPD", path: "/legal/lgpd", status: "ativa" },
} satisfies Record<string, PublicRouteItem>;

const r = routes;

// ─── Menu principal ───────────────────────────────────────────

export const publicNav: PublicNavEntry[] = [
  {
    id: "produto",
    label: "Produto",
    groups: [
      { title: "Rotina de campo", items: [r.rdo, r.checklist, r.dds, r.ordemServico] },
      { title: "Gestão da obra", items: [r.controleObras, r.equipes, r.documentos, r.relatorios] },
      { title: "Financeiro e integrações", items: [r.medicao, r.fluxoCaixa, r.portalCliente, r.erp] },
    ],
    feature: {
      eyebrow: "Mais usado",
      title: "RDO digital",
      description: "Registre o dia da obra no celular e aprove no escritório.",
      image: "/marketing/prd-prints-2026-06-04-15-rdo-visualizacao-desktop.webp",
      imageAlt: "Tela de visualização de RDO no Meta Construtor",
      cta: r.rdo,
    },
  },
  {
    id: "solucoes",
    label: "Soluções",
    groups: [
      { title: "Por empresa", items: [r.construtoras, r.obrasPublicas] },
      { title: "Por função", items: [r.engenheiros, r.diretoria] },
    ],
    feature: {
      eyebrow: "Modelos grátis",
      title: "Modelos para a rotina da obra",
      description: "Estrutura de RDO, checklist e relatório fotográfico para copiar e adaptar.",
      image: "/marketing/prd-prints-2026-06-04-05-rdo-lista-desktop.webp",
      imageAlt: "Lista de RDOs no Meta Construtor",
      cta: r.modelos,
    },
  },
  { id: "modelos", label: "Modelos grátis", item: r.modelos },
  {
    id: "aprender",
    label: "Aprender",
    groups: [
      { title: "Conteúdo", items: [r.blog, r.atualizacoes] },
      { title: "Suporte", items: [r.ajuda, r.documentacao, r.api, r.status] },
    ],
    feature: {
      eyebrow: "Guia",
      title: "RDO online: guia completo",
      description: "O que registrar, quem assina e como usar o RDO como prova técnica.",
      image: "/marketing/prd-prints-2026-06-04-12-relatorios-resumo-desktop.webp",
      imageAlt: "Resumo de relatórios no Meta Construtor",
      cta: r.guiaRdo,
    },
  },
  { id: "planos", label: "Planos", item: r.preco },
];

// ─── Rodapé ───────────────────────────────────────────────────

export const publicFooter: PublicNavGroup[] = [
  { title: "Produto", items: [r.rdo, r.checklist, r.controleObras, r.medicao, r.relatorios, r.preco] },
  { title: "Soluções", items: [r.construtoras, r.engenheiros, r.diretoria, r.obrasPublicas] },
  { title: "Modelos e conteúdo", items: [r.modelos, r.blog, r.atualizacoes] },
  { title: "Suporte", items: [r.ajuda, r.documentacao, r.api, r.status] },
  { title: "Empresa", items: [r.sobre, r.contatoEmpresa, r.carreiras] },
];

export const publicLegal: PublicRouteItem[] = [r.privacidade, r.termos, r.cookies, r.lgpd];

// ─── Consolidação ─────────────────────────────────────────────

export const routesToConsolidate: Array<PublicRouteItem & { target: string }> = [
  { label: "Home V2", path: "/home2", status: "consolidar", target: "/", note: "Duplica a home; tirar do sitemap e redirecionar (301) após escolher o layout." },
  { label: "Preço V2", path: "/preco2", status: "consolidar", target: "/preco", note: "Duplica /preco." },
  { label: "Blog V2", path: "/blog2", status: "consolidar", target: "/blog", note: "Duplica /blog." },
  { label: "Contato V2", path: "/contato2", status: "consolidar", target: "/contato", note: "Duplica /contato." },
  { label: "Sobre V2", path: "/sobre2", status: "consolidar", target: "/sobre", note: "Duplica /sobre." },
  { label: "Captura", path: "/captura", status: "consolidar", target: "/modelos/rdo-excel", note: "Tem SEO indexável configurado, mas não tem rota (abre 404) e guarda leads só no navegador." },
  { label: "/home", path: "/home", status: "consolidar", target: "/", note: "Links internos devem apontar direto para /." },
];

// ─── Blog: temas (normaliza as categorias atuais) ─────────────

export interface BlogTopic {
  label: string;
  path: string;
  categories: string[];
  hub: PublicRouteItem;
}

/** Categorias do blog agrupadas em temas, cada um ligado à página de produto correspondente. */
export const blogTopics: BlogTopic[] = [
  { label: "RDO e diário de obra", path: "/blog/tema/rdo-e-diario-de-obra", categories: ["RDO digital", "Significados de RDO"], hub: r.rdo },
  { label: "Gestão e planejamento", path: "/blog/tema/gestao-e-planejamento", categories: ["Gestão de obras", "Gestão de Obras", "Gestao de obras", "Gestão executiva", "Planejamento"], hub: r.controleObras },
  { label: "Orçamento e financeiro", path: "/blog/tema/orcamento-e-financeiro", categories: ["Orçamento", "Faturamento", "Financiamento e Caixa"], hub: r.fluxoCaixa },
  { label: "Medição e contratos", path: "/blog/tema/medicao-e-contratos", categories: ["Medição de obra"], hub: r.medicao },
  { label: "Qualidade e documentos", path: "/blog/tema/qualidade-e-documentos", categories: ["Checklists", "Documentos", "Documentação de Obras"], hub: r.checklist },
  { label: "Segurança do trabalho", path: "/blog/tema/seguranca-do-trabalho", categories: ["Segurança do Trabalho", "Segurança do trabalho"], hub: r.dds },
  { label: "Tendências", path: "/blog/tema/tendencias", categories: ["Sustentabilidade"], hub: r.blog },
];

/**
 * Candidatos a consolidação: pares de artigos que disputam a mesma busca.
 * Sugestão: manter o primeiro e redirecionar (301) o segundo — confirmar com
 * cliques e impressões do Search Console antes de aplicar.
 */
export const blogDuplicates: Array<[keep: string, merge: string]> = [
  ["o-que-e-rdo", "o-que-e-rdos"],
  ["rdo-online-guia-completo", "diario-de-obra-digital"],
  ["diario-de-obra-online-gratis-melhores-opcoes-2026", "diario-de-obra-app-gratis"],
  ["app-gestao-de-obras-2026", "software-gestao-obras-2026"],
  ["relatorio-fotografico-de-obra", "relatorio-fotografico-de-obra-modelo"],
  ["medicao-de-obra-guia-completo", "medicao-de-obra-para-pagamento-como-fazer-guia"],
  ["gestao-de-obras-publicas-licitacoes", "gestao-de-obras-publicas-lei-licitacoes"],
  ["gestao-de-contratos-construcao-civil", "gestao-contratos-obra-digital"],
  ["planejamento-de-obra-passo-a-passo", "planejamento-de-obra-como-fazer"],
  ["orcamento-de-obra-com-ia", "inteligencia-artificial-orcamento-obra"],
  ["curso-gestao-de-obras-online", "curso-gestao-de-obras-online-melhorar-carreira"],
  ["dissidio-construcao-civil-2026", "convencao-coletiva-construcao-civil-2026-salarios"],
  ["bim-na-construcao-civil", "bim-na-gestao-de-obras"],
  ["construcao-modular-industrializada-brasil", "obra-industrializada-construcao-seco-brasil"],
];
