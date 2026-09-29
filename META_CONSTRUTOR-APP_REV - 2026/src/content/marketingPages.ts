/**
 * Conteúdo das páginas públicas de funcionalidades, soluções e modelos (PRD_ROTAS_PUBLICAS).
 *
 * Regra: descrever apenas o que existe no app autenticado (rotas /app/*, hooks e Edge Functions
 * conferidos em 2026-09-29). Nada de métricas, depoimentos ou promessas sem fonte.
 *
 * `path`, `seoTitle` e `seoDescription` ficam cada um em uma linha com aspas simples: os scripts
 * de sitemap e prerender leem estes campos por regex (mesmo padrão de blogArticles.pt-BR.ts).
 */

export interface MarketingFaq {
  question: string;
  answer: string;
}

export interface MarketingMedia {
  image?: { src: string; alt: string };
  video?: { src: string; poster: string; label: string };
}

export interface MarketingFeature extends MarketingMedia {
  slug: string;
  path: string;
  seoTitle: string;
  seoDescription: string;
  group: 'Rotina de campo' | 'Gestão da obra' | 'Financeiro e integrações';
  title: string;
  lead: string;
  bullets: string[];
  note?: string;
  faqs: MarketingFaq[];
}

export interface MarketingSolution {
  slug: string;
  path: string;
  seoTitle: string;
  seoDescription: string;
  title: string;
  lead: string;
  pains: string[];
  features: string[];
  articleSlugs?: string[];
}

const print = (name: string) => `/marketing/prd-prints-2026-06-04-${name}.webp`;

export const marketingFeatures: MarketingFeature[] = [
  {
    slug: 'rdo-digital',
    path: '/funcionalidades/rdo-digital',
    seoTitle: 'RDO digital: diário de obra online | Meta Construtor',
    seoDescription: 'Registre o diário de obra com fotos, clima, equipes e ocorrências e aprove o RDO no escritório. Plano grátis com 7 RDOs por mês.',
    group: 'Rotina de campo',
    title: 'RDO digital: o diário de obra registrado no campo e aprovado no escritório',
    lead: 'A equipe preenche o relatório diário de obra no celular ou no computador. O responsável revisa e aprova ou devolve com o motivo, e tudo fica guardado por obra e por data.',
    bullets: [
      'Registro do dia com atividades, equipes, equipamentos, clima e observações.',
      'Fotos anexadas ao RDO de cada dia.',
      'Fluxo de aprovação: rascunho, enviado, aprovado ou rejeitado.',
      'Envio por e-mail do RDO aprovado e diário agrupado por dia e por nicho.',
    ],
    image: { src: print('15-rdo-visualizacao-desktop'), alt: 'Tela de visualização de um RDO no Meta Construtor' },
    video: { src: '/videos/rdo-digital.mp4', poster: '/videos/rdo-digital.jpg', label: 'Demonstração do RDO digital com telas reais do Meta Construtor' },
    faqs: [
      {
        question: 'O RDO digital substitui o diário de obra em papel?',
        answer: 'Ele organiza as mesmas informações do diário em papel (atividades, efetivo, clima, ocorrências e fotos) com data, autor e histórico de aprovação. Confira no contrato se há exigência de formato específico.',
      },
      {
        question: 'Quantos RDOs posso criar no plano grátis?',
        answer: 'O plano Grátis inclui 7 RDOs por mês. Nos planos pagos o RDO não tem esse limite mensal.',
      },
    ],
  },
  {
    slug: 'checklist-de-obra',
    path: '/funcionalidades/checklist-de-obra',
    seoTitle: 'Checklist de obra digital | Meta Construtor',
    seoDescription: 'Checklists de qualidade vinculados à obra, com itens conformes, não conformes, anexos, aprovação e PDF para enviar por e-mail.',
    group: 'Rotina de campo',
    title: 'Checklists de qualidade para inspecionar a obra',
    lead: 'Monte o checklist a partir de um modelo ou do zero, vincule à obra e registre cada item na hora da inspeção.',
    bullets: [
      'Itens marcados como conforme, não conforme ou não aplicável.',
      'Observações e anexos em cada item.',
      'Finalização, aprovação, reabertura ou reprovação do checklist.',
      'PDF do checklist e envio por e-mail.',
    ],
    image: { src: print('16-checklist-detalhe-desktop'), alt: 'Detalhe de um checklist de qualidade no Meta Construtor' },
    video: { src: '/videos/checklist-de-obra.mp4', poster: '/videos/checklist-de-obra.jpg', label: 'Demonstração dos checklists com telas reais do Meta Construtor' },
    faqs: [
      {
        question: 'Preciso criar o checklist do zero?',
        answer: 'Não. Você pode partir de um modelo pronto ou criar do zero, sempre vinculado a uma obra.',
      },
      {
        question: 'O checklist gera relatório?',
        answer: 'Sim. O checklist finalizado pode ser exportado em PDF e enviado por e-mail.',
      },
    ],
  },
  {
    slug: 'dds',
    path: '/funcionalidades/dds',
    seoTitle: 'DDS digital: Diálogo Diário de Segurança | Meta Construtor',
    seoDescription: 'Registre o Diálogo Diário de Segurança com tema, riscos, normas e participantes, e acompanhe os indicadores mensais de DDS.',
    group: 'Rotina de campo',
    title: 'DDS: registre o Diálogo Diário de Segurança da obra',
    lead: 'Anote o tema, os riscos discutidos, as normas de referência e quem participou de cada DDS, e acompanhe os indicadores do mês.',
    bullets: [
      'Tema, riscos abordados e normas de referência, como NR-18 e NR-35.',
      'Lista de participantes com cargo.',
      'Pontos discutidos e observações do diálogo.',
      'Indicadores mensais de DDS.',
    ],
    faqs: [
      {
        question: 'O que é DDS?',
        answer: 'O Diálogo Diário de Segurança é uma conversa curta antes do início das atividades sobre os riscos e cuidados do trabalho do dia.',
      },
      {
        question: 'Quais normas posso citar no registro?',
        answer: 'O campo de normas é livre: informe as referências usadas no diálogo, como NR-18, NR-35 ou NR-6.',
      },
    ],
  },
  {
    slug: 'ordem-de-servico',
    path: '/funcionalidades/ordem-de-servico',
    seoTitle: 'Ordem de serviço de obra | Meta Construtor',
    seoDescription: 'Crie ordens de serviço por obra com prazo, prioridade e responsável, e acompanhe cada OS do início à conclusão.',
    group: 'Rotina de campo',
    title: 'Ordens de serviço com responsável, prazo e status',
    lead: 'Crie ordens de serviço vinculadas à obra, defina prioridade, prazo e responsável, e acompanhe cada OS até a conclusão.',
    bullets: [
      'Título, descrição, prazo e prioridade, de baixa a crítica.',
      'Responsável definido em cada OS.',
      'Status: pendente, em andamento, concluída, bloqueada ou cancelada.',
      'Aprovação da OS registrada no histórico.',
    ],
    faqs: [
      {
        question: 'Consigo ver as OS de uma obra específica?',
        answer: 'Sim. As ordens de serviço ficam vinculadas à obra e podem ser filtradas por ela.',
      },
    ],
  },
  {
    slug: 'controle-de-obras',
    path: '/funcionalidades/controle-de-obras',
    seoTitle: 'Controle de obras online | Meta Construtor',
    seoDescription: 'Cadastre obras com documentos, distribua atividades com responsável e prazo e filtre por obra, status, prioridade e período.',
    group: 'Gestão da obra',
    title: 'Controle de obras e atividades em um só lugar',
    lead: 'Cadastre cada obra com seus dados e anexos, distribua as atividades com responsável, prioridade e prazo, e acompanhe o andamento.',
    bullets: [
      'Cadastro de obras com anexos e busca.',
      'Atividades com categoria, unidade, quantidade, responsável e prazo.',
      'Filtros por obra, status, prioridade, responsável e período.',
      'Obras excluídas ficam na Lixeira por 30 dias antes da exclusão definitiva.',
    ],
    image: { src: print('02-obras-lista-desktop'), alt: 'Lista de obras no Meta Construtor' },
    video: { src: '/videos/controle-de-obras.mp4', poster: '/videos/controle-de-obras.jpg', label: 'Demonstração do controle de obras com telas reais do Meta Construtor' },
    faqs: [
      {
        question: 'Posso anexar documentos ao cadastrar a obra?',
        answer: 'Sim. Os arquivos anexados no cadastro ficam vinculados à obra e aparecem na área de documentos.',
      },
    ],
  },
  {
    slug: 'equipes-e-equipamentos',
    path: '/funcionalidades/equipes-e-equipamentos',
    seoTitle: 'Equipes e equipamentos de obra | Meta Construtor',
    seoDescription: 'Cadastre equipes, colaboradores e equipamentos e informe no RDO quem e o que trabalhou em cada dia da obra.',
    group: 'Gestão da obra',
    title: 'Equipes, colaboradores e equipamentos organizados',
    lead: 'Cadastre equipes, colaboradores e equipamentos uma vez e use esses dados no RDO de cada dia.',
    bullets: [
      'Cadastro de equipes e colaboradores.',
      'Cadastro de equipamentos.',
      'Equipes e equipamentos informados no RDO do dia.',
      'Acesso por papel: presidente, administrador, gerente e colaborador.',
    ],
    image: { src: print('08-equipes-lista-desktop'), alt: 'Lista de equipes no Meta Construtor' },
    faqs: [
      {
        question: 'Cada colaborador tem o próprio acesso?',
        answer: 'Sim. Cada usuário entra com a própria conta, e o que ele pode ver e editar depende do papel definido pela empresa.',
      },
    ],
  },
  {
    slug: 'documentos-de-obra',
    path: '/funcionalidades/documentos-de-obra',
    seoTitle: 'Documentos de obra organizados | Meta Construtor',
    seoDescription: 'Guarde projetos, ART, laudos e fotos vinculados à obra, com visualização e download no navegador e acesso isolado por empresa.',
    group: 'Gestão da obra',
    title: 'Documentos da obra guardados e fáceis de encontrar',
    lead: 'Envie projetos, ART, laudos e imagens vinculados à obra e encontre tudo pelo navegador, sem depender de e-mail ou pendrive.',
    bullets: [
      'Envio de PDF e imagens vinculados à obra.',
      'Visualização e download no navegador.',
      'Bloqueio de extensões de arquivo não permitidas.',
      'Arquivos isolados por empresa.',
    ],
    image: { src: print('07-documentos-lista-desktop'), alt: 'Lista de documentos de obra no Meta Construtor' },
    video: { src: '/videos/documentos-de-obra.mp4', poster: '/videos/documentos-de-obra.jpg', label: 'Demonstração da área de documentos com telas reais do Meta Construtor' },
    faqs: [
      {
        question: 'Quem pode ver os documentos da obra?',
        answer: 'Somente usuários da sua empresa. Os arquivos de uma organização não ficam visíveis para outra.',
      },
    ],
  },
  {
    slug: 'relatorios-de-obra',
    path: '/funcionalidades/relatorios-de-obra',
    seoTitle: 'Relatórios de obra a partir do RDO | Meta Construtor',
    seoDescription: 'Relatórios de obra montados com os registros de campo: resumos por obra, resumo diário do RDO e exportação em PDF.',
    group: 'Gestão da obra',
    title: 'Relatórios de obra montados a partir dos registros de campo',
    lead: 'Os relatórios usam o que a equipe já registrou no RDO, nas atividades e nos checklists, sem montar planilha no fim do mês.',
    bullets: [
      'Resumo por obra com base nos registros de campo.',
      'Resumo diário do RDO, por nicho ou geral.',
      'Exportação em PDF.',
      'Painel com obras, pendências e atividades recentes.',
    ],
    image: { src: print('12-relatorios-resumo-desktop'), alt: 'Central de relatórios no Meta Construtor' },
    video: { src: '/videos/relatorios-de-obra.mp4', poster: '/videos/relatorios-de-obra.jpg', label: 'Demonstração dos relatórios com telas reais do Meta Construtor' },
    faqs: [
      {
        question: 'Preciso digitar os dados de novo para gerar o relatório?',
        answer: 'Não. O relatório usa os registros já feitos no RDO, nas atividades e nos checklists da obra.',
      },
    ],
  },
  {
    slug: 'medicao-de-obra',
    path: '/funcionalidades/medicao-de-obra',
    seoTitle: 'Medição de obra e contratos | Meta Construtor',
    seoDescription: 'Contratos por obra com itens e aditivos, medições com cálculo automático, boletins de medição e fluxo de aprovação.',
    group: 'Financeiro e integrações',
    title: 'Contratos e medições de obra com cálculo e aprovação',
    lead: 'Cadastre o contrato com seus itens, registre o que foi executado em cada medição e aprove o boletim com histórico.',
    bullets: [
      'Contratos por obra com itens e aditivos.',
      'Medições com itens medidos e cálculo automático.',
      'Boletins de medição.',
      'Fluxo de aprovação da medição.',
    ],
    faqs: [
      {
        question: 'A medição é calculada automaticamente?',
        answer: 'Sim. Ao informar os itens medidos, o valor da medição é calculado a partir dos itens do contrato.',
      },
    ],
  },
  {
    slug: 'fluxo-de-caixa-de-obra',
    path: '/funcionalidades/fluxo-de-caixa-de-obra',
    seoTitle: 'Fluxo de caixa de obra e curva ABC | Meta Construtor',
    seoDescription: 'Compare previsto e realizado de entradas e saídas por obra, consolide o fluxo de caixa e use a curva ABC para priorizar custos.',
    group: 'Financeiro e integrações',
    title: 'Fluxo de caixa da obra e curva ABC',
    lead: 'Acompanhe o previsto e o realizado de cada obra e veja quais itens concentram a maior parte do custo.',
    bullets: [
      'Previsão e realizado de entradas e saídas por obra.',
      'Consolidação do fluxo de caixa.',
      'Curva ABC para priorizar os maiores custos.',
      'Cálculo da receita da obra.',
    ],
    faqs: [
      {
        question: 'O que é curva ABC na obra?',
        answer: 'É a classificação dos itens de custo pelo peso no total: poucos itens (classe A) costumam concentrar a maior parte do valor e merecem mais atenção.',
      },
    ],
  },
  {
    slug: 'despesas-e-fornecedores',
    path: '/funcionalidades/despesas-e-fornecedores',
    seoTitle: 'Controle de despesas de obra | Meta Construtor',
    seoDescription: 'Lance as despesas de cada obra e mantenha o cadastro de fornecedores no mesmo sistema do RDO e dos documentos.',
    group: 'Financeiro e integrações',
    title: 'Despesas da obra e cadastro de fornecedores',
    lead: 'Lance as despesas por obra e mantenha os fornecedores cadastrados no mesmo lugar dos registros de campo.',
    bullets: [
      'Lançamento de despesas por obra.',
      'Cadastro de fornecedores.',
      'Consulta das despesas lançadas em cada obra.',
    ],
    image: { src: print('11-despesas-lista-desktop'), alt: 'Lista de despesas no Meta Construtor' },
    faqs: [
      {
        question: 'Consigo ver as despesas de uma obra específica?',
        answer: 'Sim. Cada despesa é lançada vinculada a uma obra.',
      },
    ],
  },
  {
    slug: 'portal-do-cliente',
    path: '/funcionalidades/portal-do-cliente',
    seoTitle: 'Portal do cliente para construtoras | Meta Construtor',
    seoDescription: 'Dê ao seu cliente um acesso próprio para acompanhar as obras vinculadas a ele, com cadastro e recuperação de senha no portal.',
    group: 'Financeiro e integrações',
    title: 'Portal do cliente: acesso próprio para acompanhar a obra',
    lead: 'Libere para cada cliente um link de acesso às obras vinculadas a ele, sem dar acesso ao sistema interno da empresa.',
    bullets: [
      'Link de acesso exclusivo por cliente.',
      'Cadastro do cliente pelo próprio portal.',
      'Vínculo do cliente às obras que ele pode acompanhar.',
      'Recuperação de senha no portal.',
    ],
    faqs: [
      {
        question: 'O cliente vê todas as obras da empresa?',
        answer: 'Não. Ele acessa apenas as obras vinculadas ao cadastro dele.',
      },
    ],
  },
  {
    slug: 'integracao-erp',
    path: '/funcionalidades/integracao-erp',
    seoTitle: 'Integração com ERP por API | Meta Construtor',
    seoDescription: 'Conecte o Meta Construtor à API do ERP da empresa e sincronize dados de forma manual ou agendada, com teste de conexão e histórico.',
    group: 'Financeiro e integrações',
    title: 'Integração com ERP para não digitar a mesma informação duas vezes',
    lead: 'Conecte a API do ERP da empresa e sincronize os dados com o Meta Construtor, sob demanda ou em horários agendados.',
    bullets: [
      'Conexão por API com o ERP da empresa (endereço e credenciais do seu sistema).',
      'Teste de conexão antes de ativar a integração.',
      'Sincronização manual ou agendada, por tipo de dado, com fila e histórico.',
      'Configuração restrita a presidente e administrador.',
    ],
    note: 'Disponível no plano Master. O ERP precisa oferecer uma API compatível; fale com a gente para avaliar o seu sistema.',
    image: { src: print('13-integracoes-status-desktop'), alt: 'Tela de integrações no Meta Construtor' },
    faqs: [
      {
        question: 'Em qual plano está a integração com ERP?',
        answer: 'A integração com ERP faz parte do plano Master.',
      },
      {
        question: 'Funciona com qualquer ERP?',
        answer: 'Funciona com sistemas que ofereçam uma API compatível. Fale com a equipe para avaliar o ERP da sua empresa antes de contratar.',
      },
    ],
  },
];

export const marketingSolutions: MarketingSolution[] = [
  {
    slug: 'construtoras',
    path: '/solucoes/construtoras',
    seoTitle: 'Software para construtoras | Meta Construtor',
    seoDescription: 'Padronize RDO, checklists, documentos e medições de todas as obras da construtora em um só sistema. Comece grátis.',
    title: 'Software para construtoras: todas as obras no mesmo padrão',
    lead: 'Cada obra registra o dia, as inspeções e os documentos do mesmo jeito, e o escritório acompanha tudo sem juntar planilhas.',
    pains: [
      'Cada obra registra o dia de um jeito diferente.',
      'Documentos espalhados entre e-mail, WhatsApp e computador.',
      'Relatório montado à mão no fim do mês.',
    ],
    features: ['rdo-digital', 'checklist-de-obra', 'controle-de-obras', 'documentos-de-obra', 'medicao-de-obra'],
  },
  {
    slug: 'engenheiros',
    path: '/solucoes/engenheiros',
    seoTitle: 'App para engenheiros e gestores de obra | Meta Construtor',
    seoDescription: 'Receba o RDO do campo, aprove com histórico, acompanhe ordens de serviço e gere relatórios sem planilha. Para engenheiros civis.',
    title: 'Para engenheiros e gestores de obra',
    lead: 'Receba os registros do campo no mesmo dia, aprove com histórico e acompanhe as pendências de cada obra.',
    pains: [
      'Informação do campo chega tarde ou incompleta.',
      'Aprovação de RDO por mensagem, sem histórico.',
      'Pendências que se perdem entre uma visita e outra.',
    ],
    features: ['rdo-digital', 'checklist-de-obra', 'ordem-de-servico', 'relatorios-de-obra'],
  },
  {
    slug: 'diretoria',
    path: '/solucoes/diretoria',
    seoTitle: 'Controle de obras para donos e diretores | Meta Construtor',
    seoDescription: 'Veja o andamento, as medições e o fluxo de caixa de todas as obras sem depender de ligação ou planilha.',
    title: 'Para donos e diretores de construtora',
    lead: 'Acompanhe o andamento, as medições e o caixa das obras com base no que a equipe registrou, sem precisar ligar para cada engenheiro.',
    pains: [
      'Difícil saber o que aconteceu em cada obra sem ligar para o engenheiro.',
      'Custos e medições em planilhas separadas.',
      'Decisões tomadas sem o registro do campo.',
    ],
    features: ['relatorios-de-obra', 'fluxo-de-caixa-de-obra', 'medicao-de-obra', 'portal-do-cliente'],
  },
  {
    slug: 'obras-publicas',
    path: '/solucoes/obras-publicas',
    seoTitle: 'RDO e medição para obras públicas | Meta Construtor',
    seoDescription: 'Organize o diário de obra, as medições e os documentos que a fiscalização costuma pedir em obras públicas.',
    title: 'RDO e medição para obras públicas',
    lead: 'Mantenha em dia o diário de obra, as medições e os documentos que costumam ser cobrados pela fiscalização.',
    pains: [
      'O RDO é exigido em contrato e precisa estar em dia.',
      'A medição depende de registros confiáveis do que foi executado.',
      'Documentação cobrada em cada visita da fiscalização.',
    ],
    features: ['rdo-digital', 'medicao-de-obra', 'documentos-de-obra', 'dds'],
    articleSlugs: ['rdo-obras-publicas-vs-privadas', 'medicao-obras-publicas', 'fiscalizacao-de-obra-publica', 'rdo-digital-faturamento-obras-publicas'],
  },
];

/** Modelos: artigos do blog que trazem um modelo pronto para copiar. */
export const marketingTemplates = {
  path: '/modelos',
  seoTitle: 'Modelos para a rotina da obra | Meta Construtor',
  seoDescription: 'Modelos de checklist de obra, relatório fotográfico e estrutura de RDO para copiar e adaptar à sua obra.',
  articleSlugs: [
    'como-estruturar-rdo',
    'checklist-de-obra-modelo-pdf',
    'checklist-recebimento-obra-entrega-chaves',
    'relatorio-fotografico-de-obra-modelo',
    'relatorio-diario-de-obra-fotografico-modelo',
  ],
};

export const featureBySlug = (slug: string) => marketingFeatures.find((feature) => feature.slug === slug);
export const solutionBySlug = (slug: string) => marketingSolutions.find((solution) => solution.slug === slug);
