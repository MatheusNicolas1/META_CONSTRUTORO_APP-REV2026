import { blogArticles } from "@/content/blogArticles";

export type JsonLd = Record<string, unknown>;

export interface SeoConfig {
  title: string;
  description: string;
  path: string;
  canonical: string;
  robots?: string;
  image?: string;
  type?: "website" | "article";
  jsonLd?: JsonLd | JsonLd[];
}

export const SITE_URL = "https://www.metaconstrutor.app.br";
export const SITE_NAME = "Meta Construtor";
export const LOGO_IMAGE = `${SITE_URL}/logo-meta-construtor.png`;
export const DEFAULT_OG_IMAGE = `${SITE_URL}/marketing/obras-reais/estrutura-metalica-aerea.jpg`;

export const absoluteUrl = (path = "/") => {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

const organizationJsonLd: JsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: LOGO_IMAGE,
  sameAs: [SITE_URL],
};

const softwareJsonLd: JsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE_NAME,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: SITE_URL,
  description:
    "Plataforma web para gestao de obras, RDO digital, checklists, equipes, documentos e relatorios para construtoras.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "BRL",
    availability: "https://schema.org/InStock",
  },
};

const breadcrumbJsonLd = (items: Array<{ name: string; path: string }>): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
});

const webPageJsonLd = (name: string, path: string, description: string, type = "WebPage"): JsonLd => ({
  "@context": "https://schema.org",
  "@type": type,
  name,
  description,
  url: absoluteUrl(path),
  isPartOf: {
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
  },
});

const faqJsonLd = (questions: Array<{ question: string; answer: string }>): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: questions.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
});

const page = (
  path: string,
  title: string,
  description: string,
  extraJsonLd: JsonLd | JsonLd[] = [],
  robots = "index,follow"
): SeoConfig => {
  const jsonLd = [
    webPageJsonLd(title, path, description),
    breadcrumbJsonLd([
      { name: "Inicio", path: "/home" },
      { name: title.replace(` | ${SITE_NAME}`, ""), path },
    ]),
    ...(Array.isArray(extraJsonLd) ? extraJsonLd : [extraJsonLd]),
  ].filter(Boolean);

  return {
    title,
    description,
    path,
    canonical: absoluteUrl(path),
    robots,
    image: DEFAULT_OG_IMAGE,
    type: "website",
    jsonLd,
  };
};

const articlePage = (article: (typeof blogArticles)[number]): SeoConfig => ({
  title: article.seoTitle,
  description: article.description,
  path: article.path,
  canonical: absoluteUrl(article.path),
  robots: "index,follow",
  image: DEFAULT_OG_IMAGE,
  type: "article",
  jsonLd: [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      description: article.description,
      articleSection: article.category,
      keywords: article.keywords.join(", "),
      datePublished: article.publishedAt,
      dateModified: article.updatedAt,
      mainEntityOfPage: absoluteUrl(article.path),
      author: {
        "@type": "Organization",
        name: SITE_NAME,
      },
      publisher: {
        "@type": "Organization",
        name: SITE_NAME,
        logo: {
          "@type": "ImageObject",
          url: LOGO_IMAGE,
        },
      },
    },
    breadcrumbJsonLd([
      { name: "Inicio", path: "/home" },
      { name: "Blog", path: "/blog" },
      { name: article.title, path: article.path },
    ]),
    faqJsonLd(article.faq),
  ],
});

export const seoBlogArticles = Object.fromEntries(
  blogArticles.map((article) => [article.slug, articlePage(article)])
) as Record<string, SeoConfig>;

export const seoPages = {
  home: page(
    "/home",
    "Meta Construtor | Sistema de gestao de obras e RDO digital",
    "Controle obras, RDOs, equipes, documentos e relatorios em uma plataforma web simples para construtoras.",
    [
      organizationJsonLd,
      softwareJsonLd,
      faqJsonLd([
        {
          question: "O que e o Meta Construtor?",
          answer:
            "O Meta Construtor e uma plataforma web para gestao de obras, RDO digital, checklists, equipes, documentos e relatorios.",
        },
        {
          question: "Para quem o Meta Construtor foi criado?",
          answer:
            "A plataforma foi criada para construtoras, engenheiros, gestores de obras e equipes que precisam organizar a operacao da obra em um unico lugar.",
        },
      ]),
    ]
  ),
  preco: page(
    "/preco",
    "Planos e precos | Meta Construtor",
    "Escolha o plano ideal para gerenciar obras, RDOs, equipes e documentos com o Meta Construtor.",
    [
      softwareJsonLd,
      faqJsonLd([
        {
          question: "Existe plano gratuito?",
          answer: "Sim. O Meta Construtor oferece um plano gratuito para comecar a organizar a gestao de obras.",
        },
        {
          question: "Posso mudar de plano depois?",
          answer: "Sim. Os planos foram pensados para acompanhar o crescimento da construtora.",
        },
      ]),
    ]
  ),
  sobre: page(
    "/sobre",
    "Sobre o Meta Construtor | Plataforma brasileira para obras",
    "Conheca a plataforma web brasileira para organizar obras, RDOs, checklists, documentos e rotinas de campo.",
    [organizationJsonLd]
  ),
  contato: page(
    "/contato",
    "Contato | Fale com o Meta Construtor",
    "Fale com a equipe do Meta Construtor sobre suporte, demonstracao, planos, obras ou parcerias.",
    [organizationJsonLd, webPageJsonLd("Contato Meta Construtor", "/contato", "Canais oficiais para falar com o Meta Construtor.", "ContactPage")]
  ),
  blog: page(
    "/blog",
    "Blog Meta Construtor | Gestao de obras e RDO digital",
    "Artigos sobre gestao de obras, RDO digital, produtividade e tecnologia para construtoras.",
    [webPageJsonLd("Blog Meta Construtor", "/blog", "Conteudos educativos sobre gestao de obras e tecnologia para construtoras.", "Blog")]
  ),
  centralAjuda: page(
    "/central-ajuda",
    "Central de ajuda | Meta Construtor",
    "Guias para organizar a primeira obra, entender RDO, documentos, usuarios e suporte no Meta Construtor.",
    [faqJsonLd([{ question: "Onde encontro ajuda para usar a plataforma?", answer: "A central de ajuda reune guias, categorias e respostas sobre os principais fluxos do Meta Construtor." }])]
  ),
  documentacao: page(
    "/documentacao",
    "Documentacao tecnica | Meta Construtor",
    "Documentacao operacional com limites reais de API, webhooks, Edge Functions e integracoes do Meta Construtor.",
    [webPageJsonLd("Documentacao tecnica Meta Construtor", "/documentacao", "Guias tecnicos para integracoes e API.", "TechArticle")]
  ),
  api: page(
    "/api",
    "API Meta Construtor | Integracoes para construtoras",
    "Estado real de Edge Functions, permissoes, APIs e integracoes tecnicas do Meta Construtor.",
    [webPageJsonLd("API Meta Construtor", "/api", "Pagina tecnica e comercial sobre integracoes do Meta Construtor.", "TechArticle")]
  ),
  status: page(
    "/status",
    "Status da plataforma | Meta Construtor",
    "Status operacional do Meta Construtor sem metricas publicas ficticias."
  ),
  atualizacoes: page(
    "/atualizacoes",
    "Atualizacoes | Meta Construtor",
    "Atualizacoes verificaveis do Meta Construtor sobre produto, integracoes, paginas publicas e backend validado."
  ),
  carreiras: page(
    "/carreiras",
    "Carreiras | Meta Construtor",
    "Conheca o contexto de carreira no Meta Construtor e envie interesse profissional pelos canais oficiais.",
    [organizationJsonLd]
  ),
  privacidade: page(
    "/legal/privacidade",
    "Politica de privacidade | Meta Construtor",
    "Saiba como o Meta Construtor coleta, usa, armazena e protege dados pessoais."
  ),
  termos: page(
    "/legal/termos",
    "Termos de uso | Meta Construtor",
    "Consulte os termos e condicoes de uso da plataforma Meta Construtor."
  ),
  cookies: page(
    "/legal/cookies",
    "Politica de cookies | Meta Construtor",
    "Entenda como o Meta Construtor usa cookies e tecnologias similares."
  ),
  lgpd: page(
    "/legal/lgpd",
    "LGPD | Meta Construtor",
    "Informacoes sobre conformidade com a Lei Geral de Protecao de Dados no Meta Construtor."
  ),
  login: page(
    "/login",
    "Login | Meta Construtor",
    "Acesse sua conta no Meta Construtor.",
    [],
    "noindex,nofollow"
  ),
  criarConta: page(
    "/criar-conta",
    "Criar conta | Meta Construtor",
    "Crie sua conta no Meta Construtor e comece a organizar suas obras.",
    [],
    "noindex,follow"
  ),
  checkout: page(
    "/checkout",
    "Finalizar assinatura | Meta Construtor",
    "Checkout seguro para assinatura do Meta Construtor.",
    [],
    "noindex,nofollow"
  ),
} satisfies Record<string, SeoConfig>;

export const publicIndexablePages = [
  seoPages.home,
  seoPages.preco,
  seoPages.sobre,
  seoPages.contato,
  seoPages.blog,
  seoPages.centralAjuda,
  seoPages.documentacao,
  seoPages.api,
  seoPages.status,
  seoPages.atualizacoes,
  seoPages.carreiras,
  seoPages.privacidade,
  seoPages.termos,
  seoPages.cookies,
  seoPages.lgpd,
  ...Object.values(seoBlogArticles),
];
