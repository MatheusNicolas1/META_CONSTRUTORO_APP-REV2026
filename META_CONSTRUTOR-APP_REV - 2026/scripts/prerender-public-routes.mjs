import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const siteUrl = "https://www.metaconstrutor.app.br";
const defaultImage = `${siteUrl}/marketing/obras-reais/estrutura-metalica-aerea.jpg`;

const routes = [
  {
    path: "/home",
    title: "Meta Construtor | Sistema de gestao de obras e RDO digital",
    description: "Controle obras, RDOs, equipes, documentos e relatorios em uma plataforma web simples para construtoras.",
    priorityType: "SoftwareApplication",
  },
  {
    path: "/preco",
    title: "Planos e precos | Meta Construtor",
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
  {
    path: "/blog/o-que-e-rdo",
    title: "O que e um RDO? Relatorio diario de obra | Meta Construtor",
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
    title: "O que e RDOs? Plural de RDO explicado | Meta Construtor",
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
    title: "O que significa RDO na policia? | Meta Construtor",
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
    title: "O que e um RDO de empresa? | Meta Construtor",
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
    title: "Como estruturar RDO util | Meta Construtor",
    description: "Veja como organizar RDO digital com clima, equipe, atividades, fotos, pendencias e aprovacao para reduzir retrabalho na obra.",
    priorityType: "Article",
  },
  {
    path: "/blog/documentos-por-obra",
    title: "Documentos por obra | Meta Construtor",
    description: "Entenda como organizar documentos de obra por rotina, responsabilidade e finalidade para facilitar consulta, auditoria e entrega.",
    priorityType: "Article",
  },
  {
    path: "/blog/checklist-qualidade-obra",
    title: "Checklist de qualidade na obra | Meta Construtor",
    description: "Aprenda a separar checklist, ocorrencia, atividade e anexo na gestao de obras para melhorar qualidade, rastreabilidade e decisao.",
    priorityType: "Article",
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

  const jsonLd = [
    primary,
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Inicio",
        item: `${siteUrl}/home`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: title.replace(" | Meta Construtor", ""),
        item: `${siteUrl}${path}`,
      },
    ],
  },
  ];

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
