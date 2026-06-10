import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const siteUrl = "https://www.metaconstrutor.app.br";
const defaultImage = `${siteUrl}/marketing/obras-reais/estrutura-metalica-aerea.jpg`;

const routes = [
  {
    path: "/",
    title: "Meta Construtor | Gestão de Obras para Engenheiros e Escritórios de Engenharia",
    description: "Gerencia obras, RDOs, equipes, contratos e documentação em uma plataforma desenvolvida para engenheiros, construtoras e escritórios de estruturas metálicas.",
    priorityType: "SoftwareApplication",
  },
  {
    path: "/preco",
    title: "Planos e preços | Meta Construtor",
    description: "Escolha o plano ideal para gerenciar obras, RDOs, equipes e documentos com o Meta Construtor.",
  },
  {
    path: "/sobre",
    title: "Sobre o Meta Construtor | Plataforma brasileira para obras",
    description: "Conheca a plataforma web brasileira para organizar obras, RDOs, checklists, documentos e rotinas de campo.",
  },
  {
    path: "/contato",
    title: "Contato | Fale com o Meta Construtor",
    description: "Fale com a equipe do Meta Construtor sobre suporte, demonstracao, planos, obras ou parcerias.",
    priorityType: "ContactPage",
  },
  {
    path: "/blog",
    title: "Blog Meta Construtor | Gestao de obras e RDO digital",
    description: "Artigos sobre gestao de obras, RDO digital, produtividade e tecnologia para construtoras.",
    priorityType: "Blog",
  },
  // ── V2 Pages ──
  {
    path: "/home2",
    title: "Meta Construtor 2 | Gestão de Obras Moderna e Inteligente",
    description: "Conheça a nova versão do Meta Construtor com hero cinematográfico, galeria de obras e depoimentos em vídeo.",
    priorityType: "SoftwareApplication",
  },
  {
    path: "/preco2",
    title: "Planos e Preços 2 | Meta Construtor",
    description: "Planos Grátis, Profissional (R$79/mês) e Enterprise (R$299/mês). Economize 20% no plano anual.",
  },
  {
    path: "/sobre2",
    title: "Sobre o Meta Construtor 2 | Quem somos e nossa história",
    description: "Conheça a história, valores e equipe do Meta Construtor. Mais de 1.500 obras gerenciadas.",
  },
  {
    path: "/contato2",
    title: "Contato 2 | Fale com o Meta Construtor",
    description: "Entre em contato com a equipe do Meta Construtor 2. WhatsApp, e-mail e formulário.",
    priorityType: "ContactPage",
  },
  {
    path: "/blog2",
    title: "Blog Meta Construtor 2 | Conteúdo para sua obra",
    description: "Artigos sobre RDO digital, checklists, relatórios financeiros e gestão de obras.",
    priorityType: "Blog",
  },
  {
    path: "/blog/page/2",
    title: "Pagina 2 - Blog Meta Construtor | Gestao de obras",
    description: "Mais artigos sobre gestao de obras, RDO digital e produtividade - pagina 2.",
    priorityType: "Blog",
  },
  {
    path: "/blog/page/3",
    title: "Pagina 3 - Blog Meta Construtor | Gestao de obras",
    description: "Continue lendo sobre gestao de obras, RDO digital e tecnologia - pagina 3.",
    priorityType: "Blog",
  },
  {
    path: "/blog/page/4",
    title: "Pagina 4 - Blog Meta Construtor | Gestao de obras",
    description: "Mais conteudos sobre obras, RDO e constucao civil - pagina 4.",
    priorityType: "Blog",
  },
  {
    path: "/blog/page/5",
    title: "Pagina 5 - Blog Meta Construtor | Gestao de obras",
    description: "Artigos sobre gestao de obras e RDO digital - pagina 5.",
    priorityType: "Blog",
  },
  {
    path: "/blog/page/6",
    title: "Pagina 6 - Blog Meta Construtor | Gestao de obras",
    description: "Ultimos artigos do blog do Meta Construtor - pagina 6.",
    priorityType: "Blog",
  },
  {
    path: "/blog/o-que-e-rdo",
    title: "O que e um RDO? Entenda o relatorio diario de obra",
    description: "Entenda o que e RDO na construcao civil, para que serve e quais campos registrar no relatorio diario de obra.",
    priorityType: "Article",
    faqs: [
      {
        question: "O que e um RDO?",
        answer: "RDO e o Relatorio Diario de Obra, usado para registrar diariamente atividades, equipe, clima, materiais, ocorrencias, fotos e pendencias de uma obra.",
      },
      {
        question: "RDO e obrigatorio?",
        answer: "A obrigatoriedade depende do contrato, do tipo de obra e das exigencias tecnicas ou de gestao. Mesmo quando nao e exigido formalmente, o RDO e uma boa pratica para rastreabilidade.",
      },
      {
        question: "Qual a diferenca entre RDO e diario de obra?",
        answer: "Na pratica, os termos costumam ser usados para registros parecidos. RDO destaca o relatorio diario; diario de obra pode ser usado de forma mais ampla para o historico continuo da obra.",
      },
    ],
  },
  {
    path: "/blog/o-que-e-rdos",
    title: "O que e RDOs? Entenda o plural da sigla RDO",
    description: "RDOs e o plural de RDO. Entenda quando usar a sigla, como organizar varios relatorios diarios de obra e evitar confusao.",
    priorityType: "Article",
    faqs: [
      {
        question: "O que e RDOS?",
        answer: "RDOS, geralmente escrito como RDOs, e o plural de RDO. No contexto de obras, significa varios Relatorios Diarios de Obra.",
      },
      {
        question: "RDOs e diferente de RDO?",
        answer: "Nao no conceito principal. RDO e um relatorio; RDOs sao varios relatorios ou uma colecao de registros diarios.",
      },
      {
        question: "Como procurar RDOs antigos?",
        answer: "O ideal e buscar por obra, data, responsavel, status, ocorrencia ou anexo. Em planilhas e pastas soltas, essa busca costuma ser mais lenta.",
      },
    ],
  },
  {
    path: "/blog/rdo-na-policia",
    title: "O que significa RDO na policia?",
    description: "Na policia, RDO costuma significar Registro Digital de Ocorrencia. Entenda a diferenca para o RDO de obras.",
    priorityType: "Article",
    faqs: [
      {
        question: "O que significa RDO na policia?",
        answer: "No contexto policial, RDO costuma significar Registro Digital de Ocorrencia, ligado ao registro digital de boletins e ocorrencias.",
      },
      {
        question: "RDO da policia e o mesmo que RDO de obra?",
        answer: "Nao. RDO da policia esta ligado a ocorrencia policial. RDO de obra e o Relatorio Diario de Obra usado na construcao civil.",
      },
      {
        question: "Onde consultar RDO policial?",
        answer: "Para informacoes policiais, procure os canais oficiais da Policia Civil ou da Secretaria de Seguranca Publica do seu estado.",
      },
    ],
  },
  {
    path: "/blog/rdo-de-empresa",
    title: "O que e um RDO de empresa?",
    description: "Entenda o que e RDO de empresa, como ele registra a rotina operacional e por que construtoras usam esse controle.",
    priorityType: "Article",
    faqs: [
      {
        question: "O que e um RDO de empresa?",
        answer: "E um relatorio diario usado pela empresa para registrar rotina, atividades, equipe, ocorrencias, evidencias e pendencias de uma operacao ou obra.",
      },
      {
        question: "Toda empresa precisa de RDO?",
        answer: "Nem toda empresa usa esse nome, mas operacoes com campo, obra, equipe externa ou servicos recorrentes costumam se beneficiar de algum registro diario padronizado.",
      },
      {
        question: "RDO ajuda no controle de custo?",
        answer: "Sim, quando registra equipe, equipamentos, retrabalho, paradas, materiais e ocorrencias que impactam prazo ou produtividade.",
      },
    ],
  },
  {
    path: "/blog/como-estruturar-rdo",
    title: "Como estruturar um RDO util para campo, engenharia e cliente",
    description: "Veja como organizar RDO digital com clima, equipe, atividades, fotos, pendencias e aprovacao para reduzir retrabalho na obra.",
    priorityType: "Article",
  },
  {
    path: "/blog/documentos-por-obra",
    title: "Quais documentos precisam estar ligados a cada obra",
    description: "Entenda como organizar documentos de obra por rotina, responsabilidade e finalidade para facilitar consulta, auditoria e entrega.",
    priorityType: "Article",
  },
  {
    path: "/blog/checklist-qualidade-obra",
    title: "Quando usar checklist, ocorrencia, atividade ou anexo",
    description: "Aprenda a separar checklist, ocorrencia, atividade e anexo na gestao de obras para melhorar qualidade, rastreabilidade e decisao.",
    priorityType: "Article",
  },
  {
    path: "/blog/rdo-como-prova-tecnica",
    title: "RDO como prova técnica: use o relatório diário de obra para mediação e faturamento",
    description: "Aprenda como o RDO pode ser usado como prova técnica para medir avanço, liberar faturamento e comprovar serviço executado em construtoras de pequeno e médio porte.",
    priorityType: "Article",
  },
  {
    path: "/blog/erros-comuns-preenchimento-rdo",
    title: "Erros comuns no preenchimento de RDO (e como evitar)",
    description: "Veja os erros mais frequentes no preenchimento de RDO — relatório genérico, foto sem contexto, campo vazio, registro atrasado — e aprenda a corrigir cada um na sua obra.",
    priorityType: "Article",
  },
  {
    path: "/blog/dados-rdo-relatorio-gerencial",
    title: "Dados de RDO viram relatório gerencial: o que o dono da construtora precisa ver",
    description: "Saiba como consolidar RDOs por semana em um relatório executivo com indicadores de produtividade, adesão e avanço físico — feito para o dono da construtora.",
    priorityType: "Article",
  },
  {
    path: "/blog/rdo-e-fotografia-de-obra",
    title: "RDO e fotografia de obra: como provar o que foi executado?",
    description: "Guia prático de evidência visual na obra: o que fotografar, quantas fotos, como nomear e como vincular cada imagem ao RDO.",
    priorityType: "Article",
  },
  {
    path: "/blog/rdo-obras-publicas-vs-privadas",
    title: "RDO em obras públicas vs. obras privadas: qual a diferença?",
    description: "Obras públicas têm mais exigência documental, fiscalização dedicada e diário de obra contratual. Entenda como adequar o RDO para cada tipo de contrato.",
    priorityType: "Article",
  },
  {
    path: "/blog/checklist-mais-rdo",
    title: "Checklist + RDO: a combinação que reduz retrabalho na obra",
    description: "Saiba como transformar checklist de qualidade em anexo do RDO e documentar a verificação de cada etapa construtiva.",
    priorityType: "Article",
  },
  {
    path: "/blog/diario-de-obra-digital",
    title: "Diário de Obra Digital: O fim da caderneta e do Excel na construção civil",
    description: "O diário de obra digital está substituindo caderneta física e planilhas de Excel na construção civil. Veja as funcionalidades essenciais e como adotar.",
    priorityType: "Article",
  },
  {
    path: "/blog/rdo-online-guia-completo",
    title: "RDO Online: Guia completo para fazer o relatório diário de obra pela internet",
    description: "Aprenda como fazer RDO online, quais campos usar, vantagens do digital sobre o papel e como escolher a melhor ferramenta para sua construtora de pequeno ou médio porte.",
    priorityType: "Article",
  },
  {
    path: "/blog/rdo-online-faturamento-contratos",
    title: "Como o RDO Online ajuda construtoras a faturar mais e discutir menos",
    description: "RDO bem preenchido é a base da medição e do faturamento na construção. Veja como o RDO online reduz glosas, acelera pagamentos e melhora o fluxo de caixa da construtora.",
    priorityType: "Article",
  },
  {
    path: "/blog/medicao-de-obra-guia-completo",
    title: "Medição de Obra: Guia completo para medir serviços na construção civil",
    description: "Guia completo sobre medição de obra na construção civil. Aprenda como medir serviços, quais documentos usar e como o RDO acelera o faturamento.",
    priorityType: "Article",
  },
  {
    path: "/blog/medicao-obras-publicas",
    title: "Medição de Obras Públicas: regras, prazos e documentação",
    description: "Entenda as regras, prazos e documentação exigidos na medição de obras públicas, incluindo a Lei 8.666 e a IN 05/2017.",
    priorityType: "Article",
  },
  {
    path: "/blog/controle-de-obra-planilha-ou-app",
    title: "Controle de Obra: planilha ou app? Qual a melhor opção para sua construtora",
    description: "Descubra as vantagens e desvantagens de usar planilhas ou aplicativos para controle de obra e veja qual solução atende melhor sua construtora.",
    priorityType: "Article",
  },
  {
    path: "/blog/fiscal-de-obra-o-que-faz",
    title: "Fiscal de Obra: o que faz, salário, como se tornar",
    description: "Descubra o que faz um fiscal de obra, qual o salário médio, quais são as principais responsabilidades e como se tornar um profissional na área.",
    priorityType: "Article",
  },
  {
    path: "/blog/seguranca-do-trabalho-obra-civil-nr18",
    title: "Segurança do Trabalho na Construção Civil: guia completo NR-18 em 2026",
    description: "Guia completo sobre segurança do trabalho na construção civil com foco na NR-18. Entenda as obrigações legais, os equipamentos de proteção, os documentos obrigatórios e como implementar um programa de segurança eficaz no canteiro de obras em 2026.",
    priorityType: "Article",
  },
  {
    path: "/blog/relatorio-fotografico-de-obra-modelo",
    title: "Relatório Fotográfico de Obra: modelo grátis e guia completo para fazer o seu",
    description: "Guia completo sobre relatório fotográfico de obra: como fazer, o que incluir, modelo grátis para download e dicas de fotografia de canteiro de obras para construtoras, engenheiros e fiscais.",
    priorityType: "Article",
  },
  {
    path: "/blog/app-gestao-de-obras-2026",
    title: "App de Gestão de Obras: os 5 melhores aplicativos para construtoras em 2026",
    description: "Descubra os melhores aplicativos para gestão de obras em 2026. Compare funcionalidades, preços e benefícios de cada ferramenta para sua construtora.",
    priorityType: "Article",
  },
  {
    path: "/blog/gestao-construtoras-pequeno-porte",
    title: "Gestão para Construtoras de Pequeno Porte: como organizar sem gastar muito",
    description: "Aprenda como organizar sua construtora de pequeno porte com processos simples, ferramentas acessíveis e estratégias práticas de gestão de obras que não exigem grandes investimentos.",
    priorityType: "Article",
  },
  {
    path: "/blog/almoxarifado-de-obra-organizacao",
    title: "Almoxarifado de Obra: como organizar, controlar estoque e reduzir perdas",
    description: "Guia prático para organizar o almoxarifado de obra, controlar entrada e saída de materiais, reduzir perdas por desvio e vencimento, e integrar o almoxarifado com o resto da gestão da construção civil.",
    priorityType: "Article",
  },
  {
    path: "/blog/cronograma-de-obra-caixa-economica",
    title: "Cronograma de Obra para Caixa Econômica: como elaborar passo a passo",
    description: "Guia completo para elaborar o cronograma físico-financeiro de obra exigido pela Caixa Econômica Federal no financiamento habitacional. Modelos, etapas, prazos e dicas para aprovação.",
    priorityType: "Article",
  },
  {
    path: "/blog/orcamento-de-obra-passo-a-passo",
    title: "Orçamento de Obra: Guia Completo com Exemplos Práticos | Meta Construtor",
    description: "Aprenda a fazer orçamento de obra do zero com exemplos práticos, planilha gratuita, composição de custos e dicas para evitar estouro. Guia completo para engenheiros e construtores.",
    priorityType: "Article",
  },
  {
    path: "/blog/diario-de-obra-app-online",
    title: "Diário de Obra Online: Como Fazer Digital Gratuito em 2026",
    description: "Aprenda como fazer diário de obra online grátis em 2026. Guia completo com app digital para RDO, fotos, assinaturas e relatórios automáticos para engenheiros e construtores.",
    priorityType: "Article",
  },
  {
    path: "/blog/planejamento-de-obra-passo-a-passo",
    title: "Planejamento de Obra: Passo a Passo Completo do Início ao Fim | Meta Construtor",
    description: "Guia completo de planejamento de obra: etapas, cronograma, recursos, custos e riscos. Aprenda o passo a passo para planejar sua construção do zero com eficiência.",
    priorityType: "Article",
  },
  {
    path: "/blog/app-gestao-de-obras-gratuito",
    title: "App de Gestão de Obras Gratuito: Melhores Opções 2026 | Meta Construtor",
    description: "Descubra os melhores apps gratuitos de gestão de obras para construtoras em 2026. Compare funcionalidades gratuitas de RDO, medição e controle financeiro sem pagar nada.",
    priorityType: "Article",
  },
  {
    path: "/blog/custo-de-obra-por-m2-2026",
    title: "Custo de obra por m² em 2026: tabela completa atualizada",
    description: "Tabela atualizada de custo de obra por m² em 2026 com base no SINAPI, CUB e mercado. Veja quanto custa construir cada tipo de edificação e como controlar gastos na sua obra.",
    priorityType: "Article",
    faqs: [
      {
        question: "Qual é o custo médio do metro quadrado de construção em 2026?",
        answer: "O custo médio nacional para construção residencial padrão normal em 2026 é de R$ 2.100 a R$ 2.600/m², variando por região e padrão construtivo.",
      },
      {
        question: "O que está incluso no custo por m² do SINAPI?",
        answer: "O SINAPI inclui materiais, mão de obra com encargos sociais, equipamentos e despesas administrativas. Não inclui terreno, projetos, taxas de licença e BDI da construtora.",
      },
      {
        question: "Como calcular o BDI no orçamento de obra?",
        answer: "O BDI (Bonificação e Despesas Indiretas) é calculado sobre o custo direto da obra e varia de 20% a 30%, incluindo lucro, riscos, tributos e despesas indiretas da construtora.",
      },
      {
        question: "Construir casa própria fica mais barato que comprar pronta em 2026?",
        answer: "Construir costuma ser 15% a 25% mais barato que comprar pronto, desde que o terreno esteja pago e a obra seja gerenciada com controle de custos e planejamento adequados.",
      },
    ],
  },
  {
    path: "/blog/checklist-de-obra-modelo-pdf",
    title: "Checklist de Obra: modelo PDF gratuito para imprimir e usar no canteiro",
    description: "Baixe grátis um modelo de checklist de obra em PDF para imprimir. Guia completo com tipos de checklist, passo a passo de uso e dicas para não esquecer nenhuma etapa da construção civil.",
    priorityType: "Article",
  },
  {
    path: '/blog/seguranca-do-trabalho-canteiro-de-obras',
    title: 'Segurança do trabalho em canteiro de obras: guia completo NR-18',
    description: 'Guia completo sobre segurança do trabalho em canteiro de obras. Entenda a NR-18, EPIs obrigatórios, sinalização, análise de risco, treinamentos e como documentar tudo no RDO digital.',
    priorityType: 'Article',
  },
  {
    path: '/blog/documentos-obra-exigidos-prefeitura',
    title: 'Documentos de obra exigidos pela prefeitura: checklist completo 2026',
    description: 'Guia completo com a lista de documentos de obra exigidos pela prefeitura para aprovação de projeto, alvará, habite-se e licenças. Checklist atualizado 2026 para construtoras e engenheiros.',
    priorityType: 'Article',
  },
  {
    path: '/blog/apostila-para-obra',
    title: 'Apostila para obra: documentos e procedimentos essenciais',
    description: 'Guia completo sobre apostila de obra: o conjunto de documentos técnicos organizados para consulta no canteiro. Saiba quais documentos incluir, como organizar e os benefícios para fiscalização e auditoria.',
    priorityType: 'Article',
  },
  {
    path: '/blog/construcao-civil-tendencias-2026',
    title: 'Construção civil 2026: tendências, mercado e oportunidades para construtoras',
    description: 'As principais tendências da construção civil em 2026: mercado aquecido, digitalização de obras, novos materiais sustentáveis e oportunidades para construtoras de pequeno e médio porte.',
    priorityType: 'Article',
  },
  {
    path: '/blog/rdo-digital-como-prova-tecnica',
    title: 'RDO digital como prova técnica: validade jurídica e modelos para 2026',
    description: 'Entenda o valor jurídico do RDO digital como prova técnica em ações trabalhistas e contratuais. Guia completo com modelos, validade legal e dicas para 2026.',
    priorityType: 'Article',
  },
  {
    path: "/central-ajuda",
    title: "Central de ajuda | Meta Construtor",
    description: "Guias para organizar a primeira obra, entender RDO, documentos, usuarios e suporte no Meta Construtor.",
  },
  {
    path: "/documentacao",
    title: "Documentacao tecnica | Meta Construtor",
    description: "Documentacao operacional com limites reais de API, webhooks, Edge Functions e integracoes do Meta Construtor.",
    priorityType: "TechArticle",
  },
  {
    path: "/api",
    title: "API Meta Construtor | Integracoes para construtoras",
    description: "Estado real de Edge Functions, permissoes, APIs e integracoes tecnicas do Meta Construtor.",
    priorityType: "TechArticle",
  },
  {
    path: "/status",
    title: "Status da plataforma | Meta Construtor",
    description: "Status operacional do Meta Construtor sem metricas publicas ficticias.",
  },
  {
    path: "/atualizacoes",
    title: "Atualizacoes | Meta Construtor",
    description: "Atualizacoes verificaveis do Meta Construtor sobre produto, integracoes, paginas publicas e backend validado.",
  },
  {
    path: "/carreiras",
    title: "Carreiras | Meta Construtor",
    description: "Conheca o contexto de carreira no Meta Construtor e envie interesse profissional pelos canais oficiais.",
  },
  {
    path: "/legal/privacidade",
    title: "Politica de privacidade | Meta Construtor",
    description: "Saiba como o Meta Construtor coleta, usa, armazena e protege dados pessoais.",
  },
  {
    path: "/legal/termos",
    title: "Termos de uso | Meta Construtor",
    description: "Consulte os termos e condicoes de uso da plataforma Meta Construtor.",
  },
  {
    path: "/legal/cookies",
    title: "Politica de cookies | Meta Construtor",
    description: "Entenda como o Meta Construtor usa cookies e tecnologias similares.",
  },
  {
    path: "/legal/lgpd",
    title: "LGPD | Meta Construtor",
    description: "Informacoes sobre conformidade com a Lei Geral de Protecao de Dados no Meta Construtor.",
  },
];

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const createJsonLd = ({ path, title, description, priorityType = "WebPage", faqs }) => {
  const primary =
    priorityType === "Article"
      ? {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: title,
          description,
          datePublished: "2026-06-06",
          dateModified: "2026-06-06",
          author: {
            "@type": "Organization",
            name: "Meta Construtor",
          },
          publisher: {
            "@type": "Organization",
            name: "Meta Construtor",
          },
          mainEntityOfPage: `${siteUrl}${path}`,
        }
      : {
    "@context": "https://schema.org",
    "@type": priorityType,
    name: title,
    description,
    url: `${siteUrl}${path}`,
    isPartOf: {
      "@type": "WebSite",
      name: "Meta Construtor",
      url: siteUrl,
    },
  };

  const jsonLd = [];

  if (priorityType === "SoftwareApplication") {
    jsonLd.push(
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Meta Construtor",
        url: siteUrl,
        logo: `${siteUrl}/logo-meta-construtor.png`,
        sameAs: [siteUrl],
      },
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Meta Construtor",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web, Android, iOS",
        url: siteUrl,
        description,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "BRL",
          priceValidUntil: "2027-12-31",
          availability: "https://schema.org/InStock",
        },
      }
    );
  }

  jsonLd.push(
    primary,
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Início",
          item: `${siteUrl}/`,
        },
      ],
    },
  );

  if (faqs?.length) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    });
  }

  return jsonLd;
};

const seoBlock = (route) => {
  const canonical = `${siteUrl}${route.path}`;
  const jsonLd = createJsonLd(route)
    .map((entry) => `<script type="application/ld+json">${JSON.stringify(entry)}</script>`)
    .join("\n  ");

  return `  <title>${escapeHtml(route.title)}</title>
  <meta name="description" content="${escapeHtml(route.description)}" />
  <meta name="robots" content="index,follow" />
  <link rel="canonical" href="${canonical}" />
  <meta property="og:site_name" content="Meta Construtor" />
  <meta property="og:title" content="${escapeHtml(route.title)}" />
  <meta property="og:description" content="${escapeHtml(route.description)}" />
  <meta property="og:type" content="${route.priorityType === "Article" ? "article" : "website"}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${defaultImage}" />
  <meta property="og:locale" content="pt_BR" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(route.title)}" />
  <meta name="twitter:description" content="${escapeHtml(route.description)}" />
  <meta name="twitter:image" content="${defaultImage}" />
  ${jsonLd}`;
};

const removeFallbackSeo = (html) =>
  html
    .replace(/  <title>[\s\S]*?<\/title>\r?\n/, "")
    .replace(/  <meta name="description"[\s\S]*?>\r?\n/, "")
    .replace(/  <meta name="robots"[\s\S]*?>\r?\n/g, "")
    .replace(/  <link rel="canonical"[\s\S]*?>\r?\n/g, "")
    .replace(/  <meta property="og:[\s\S]*?>\r?\n/g, "")
    .replace(/  <meta name="twitter:[\s\S]*?>\r?\n/g, "")
    .replace(/  <script type="application\/ld\+json">[\s\S]*?<\/script>\r?\n/g, "");

const templatePath = resolve("dist/index.html");
const template = readFileSync(templatePath, "utf8");
const cleanTemplate = removeFallbackSeo(template);

for (const route of routes) {
  const outputPath = resolve("dist", route.path.slice(1), "index.html");
  const html = cleanTemplate.replace("</head>", `${seoBlock(route)}\n</head>`);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, html);
}

console.log(`Prerendered ${routes.length} public route HTML files.`);
