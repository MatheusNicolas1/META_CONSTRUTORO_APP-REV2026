/**
 * Blog Articles — Shared Interface & Loader
 * 
 * Estrutura compartilhada para artigos de blog em múltiplos idiomas.
 * O loader detecta o idioma atual via i18n e carrega do arquivo correto.
 */

export interface BlogArticleImage {
  src: string;
  alt: string;
  caption?: string;
  credit?: string;
}

export interface BlogArticleSection {
  title: string;
  body: string;
  items?: string[];
  image?: BlogArticleImage;
}

export interface BlogArticleFAQ {
  question: string;
  answer: string;
}

export interface BlogArticle {
  slug: string;
  path: string;
  title: string;
  seoTitle: string;
  description: string;
  category: string;
  intent: string;
  readingTime: string;
  summary: string;
  publishedAt: string;
  updatedAt: string;
  keywords: string[];
  takeaways: string[];
  sections: BlogArticleSection[];
  faq: BlogArticleFAQ[];
  cta: {
    title: string;
    description: string;
    label: string;
    href: string;
  };
}

// Mapa de idiomas suportados para os artigos do blog
export const BLOG_LANGUAGES = [
  { code: 'pt-BR', label: 'Português (Brasil)' },
  { code: 'pt-PT', label: 'Português (Portugal)' },
  { code: 'en-US', label: 'English' },
  { code: 'es-ES', label: 'Español' },
] as const;

// Normaliza o código de idioma para o formato usado nos arquivos
export function normalizeBlogLang(language: string): string {
  if (!language) return 'pt-BR';
  // Mapeia códigos parciais (ex: 'pt', 'en', 'es') para completos
  const map: Record<string, string> = {
    'pt': 'pt-BR',
    'pt-br': 'pt-BR',
    'pt-pt': 'pt-PT',
    'en': 'en-US',
    'en-us': 'en-US',
    'es': 'es-ES',
    'es-es': 'es-ES',
  };
  return map[language.toLowerCase()] || language;
}

// Verifica se um idioma tem suporte a artigos traduzidos
export function isBlogLanguageSupported(language: string): boolean {
  const normalized = normalizeBlogLang(language);
  return BLOG_LANGUAGES.some(l => l.code === normalized);
}

/**
 * Carrega os artigos para o idioma especificado.
 * Fallback para pt-BR se o idioma não tiver artigos traduzidos.
 */
export async function loadBlogArticles(language?: string): Promise<Record<string, BlogArticle[]>> {
  const lang = normalizeBlogLang(language || navigator?.language || 'pt-BR');
  
  let articles: BlogArticle[] = [];
  
  try {
    switch (lang) {
      case 'pt-BR': {
        const { blogArticlesPtBR } = await import('./blogArticles.pt-BR');
        articles = blogArticlesPtBR;
        break;
      }
      case 'pt-PT': {
        const { blogArticlesPtPT } = await import('./blogArticles.pt-PT');
        articles = blogArticlesPtPT;
        break;
      }
      case 'en-US': {
        const { blogArticlesEnUS } = await import('./blogArticles.en-US');
        articles = blogArticlesEnUS;
        break;
      }
      case 'es-ES': {
        const { blogArticlesEsES } = await import('./blogArticles.es-ES');
        articles = blogArticlesEsES;
        break;
      }
      default: {
        const { blogArticlesPtBR } = await import('./blogArticles.pt-BR');
        articles = blogArticlesPtBR;
      }
    }
  } catch {
    // Fallback seguro para pt-BR se o arquivo não existir
    const { blogArticlesPtBR } = await import('./blogArticles.pt-BR');
    articles = blogArticlesPtBR;
  }
  
  return { [lang]: articles };
}

/**
 * Busca um artigo específico pelo slug no idioma atual.
 */
export async function getBlogArticleI18n(
  slug?: string,
  language?: string
): Promise<BlogArticle | undefined> {
  if (!slug) return undefined;
  
  const lang = normalizeBlogLang(language || navigator?.language || 'pt-BR');
  const { [lang]: articles } = await loadBlogArticles(lang);
  
  return articles?.find((article) => article.slug === slug);
}

// Função síncrona para compatibilidade com código existente
// Retorna undefined se o artigo não estiver no idioma solicitado
export function getBlogArticleFallback(slug?: string): BlogArticle | undefined {
  // Este módulo agora é apenas interface — o loader principal é o i18n
  // Esta função existe para compatibilidade com código que importa direto
  return undefined;
}

/**
 * Retorna o path correto para o artigo considerando o idioma.
 * Alias: mantém URLs sem prefixo de idioma para compatibilidade.
 */
export function getArticlePath(slug: string, language?: string): string {
  const lang = normalizeBlogLang(language || navigator?.language || 'pt-BR');
  // Para pt-BR, mantém o path original /blog/<slug>
  // Para outros idiomas, futuramente pode ser /<lang>/blog/<slug>
  if (lang === 'pt-BR') return `/blog/${slug}`;
  return `/blog/${slug}`; // Por enquanto mantém mesmo path, o conteúdo muda
}
