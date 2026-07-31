import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Search, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import SEO from '@/components/SEO';
import { seoPages } from '@/config/seo';
import { loadBlogArticles, normalizeBlogLang } from '@/content/blogArticles';
import LandingNavigation from '@/components/landing/LandingNavigation';
import FooterSection from '@/components/landing/FooterSection';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ARTICLES_PER_PAGE, getPageFromSlug, getPaginationRange } from '@/utils/blogUtils';
import type { BlogArticle } from '@/content/blogArticles';

// Popularidade simulada — substituir por dados reais do GA4/Supabase futuramente
function getPopularSlugs(): string[] {
  try {
    const stored = localStorage.getItem('blog_views');
    if (!stored) return [];
    const views: Record<string, number> = JSON.parse(stored);
    return Object.entries(views)
      .sort(([, a], [, b]) => b - a)
      .map(([slug]) => slug);
  } catch {
    return [];
  }
}

function getArticlePopularity(slug: string): number {
  try {
    const stored = localStorage.getItem('blog_views');
    if (!stored) return 0;
    const views: Record<string, number> = JSON.parse(stored);
    return views[slug] ?? 0;
  } catch {
    return 0;
  }
}

const Blog = () => {
  const { num } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const currentPage = getPageFromSlug(num);
  const currentLang = useMemo(() => normalizeBlogLang(i18n.language), [i18n.language]);

  const [searchQuery, setSearchQuery] = useState('');
  const [allArticles, setAllArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);

  // Carrega artigos conforme o idioma
  useEffect(() => {
    async function load() {
      setLoading(true);
      const lang = normalizeBlogLang(i18n.language || 'pt-BR');
      const { [lang]: articles } = await loadBlogArticles(lang);
      
      // Ordena: populares primeiro, depois por data
      const popular = getPopularSlugs();
      const sorted = [...articles].sort((a, b) => {
        const viewsA = getArticlePopularity(a.slug);
        const viewsB = getArticlePopularity(b.slug);
        if (viewsA > 0 || viewsB > 0) return viewsB - viewsA;
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      });
      
      setAllArticles(sorted);
      setLoading(false);
    }
    load();
  }, [i18n.language]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return allArticles;
    const q = searchQuery.toLowerCase().trim();
    return allArticles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.keywords.some((k) => k.toLowerCase().includes(q))
    );
  }, [allArticles, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ARTICLES_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedArticles = useMemo(
    () => filtered.slice((safePage - 1) * ARTICLES_PER_PAGE, safePage * ARTICLES_PER_PAGE),
    [filtered, safePage]
  );

  const totalArticles = allArticles.length;

  const goToPage = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages) return;
      if (page === 1) {
        navigate('/blog');
      } else {
        navigate(`/blog/page/${page}`);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [navigate, totalPages]
  );

  const popularSlugs = useMemo(() => getPopularSlugs(), []);
  const top3Popular = popularSlugs.slice(0, 3);

  // Se a página atual excede o total, redireciona
  if (!loading && currentPage !== safePage && num) {
    navigate(safePage === 1 ? '/blog' : `/blog/page/${safePage}`, { replace: true });
  }

  return (
    <div className="force-light-blog">
      <SEO {...seoPages.blog} />
      <LandingNavigation />

      <main className="min-h-screen bg-background pt-28">
        {/* Hero */}
        <section className="border-b border-border bg-[#fbfaf7] px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <p className="mb-4 inline-flex rounded-full border border-[#e8d9cc] bg-background px-3 py-1.5 text-sm font-medium text-primary">
              Blog — {totalArticles} artigos
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              Conteúdo prático sobre RDO, documentos e rotina de obra.
            </h1>
            <p className="mt-6 max-w-[64ch] text-base leading-8 text-muted-foreground md:text-lg">
              Guias diretos para equipes que querem padronizar registros, reduzir retrabalho
              e tornar a informação de campo mais fácil de consultar.
            </p>

            {/* Barra de busca */}
            <div className="relative mt-8 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar artigos..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value && currentPage !== 1) {
                    navigate('/blog', { replace: true });
                  }
                }}
                className="h-11 border-border bg-background pl-10 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
              />
            </div>
          </div>
        </section>

        {/* Lista de artigos */}
        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="border border-border bg-background p-5">
                    <div className="mb-2 h-4 w-24 animate-pulse rounded bg-muted" />
                    <div className="mb-2 h-6 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : searchQuery && (
              <p className="mb-6 text-sm text-muted-foreground">
                {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} &quot;{searchQuery}&quot;
              </p>
            )}

            {!loading && paginatedArticles.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <Search className="mb-4 h-12 w-12 text-muted-foreground/40" />
                <h2 className="text-xl font-semibold text-foreground">Nenhum artigo encontrado</h2>
                <p className="mt-2 text-muted-foreground">
                  Tente buscar por outro termo.
                </p>
                <Button
                  variant="outline"
                  className="mt-6"
                  onClick={() => setSearchQuery('')}
                >
                  Limpar busca
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {paginatedArticles.map((article) => {
                    const views = getArticlePopularity(article.slug);
                    const isPopular = top3Popular.includes(article.slug);

                    return (
                      <Link
                        key={article.slug}
                        to={article.path}
                        className={`group block border border-border bg-background p-5 transition-all hover:border-primary/40 hover:shadow-sm ${
                          isPopular && !searchQuery
                            ? 'border-l-4 border-l-amber-500'
                            : ''
                        }`}
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-medium text-primary">
                                {article.category} — {article.readingTime}
                              </p>
                              {isPopular && !searchQuery && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                                  <TrendingUp className="h-3 w-3" />
                                  Mais lido
                                </span>
                              )}
                            </div>
                            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                              {article.title}
                            </h2>
                            <p className="mt-3 max-w-[64ch] text-sm leading-7 text-muted-foreground line-clamp-2">
                              {article.description}
                            </p>
                            {views > 0 && !searchQuery && (
                              <p className="mt-1 text-xs text-muted-foreground/60">
                                {views} leitura{views !== 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                          <span className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-primary">
                            Ler artigo
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Paginação */}
                {totalPages > 1 && (
                  <nav className="mt-10 flex items-center justify-center gap-1" aria-label="Paginação do blog">
                    <button
                      onClick={() => goToPage(safePage - 1)}
                      disabled={safePage <= 1}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label="Página anterior"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    {getPaginationRange(safePage, totalPages).map((item, i) =>
                      item === '...' ? (
                        <span key={`ellipsis-${i}`} className="flex h-10 w-10 items-center justify-center text-muted-foreground">
                          ...
                        </span>
                      ) : (
                        <button
                          key={item}
                          onClick={() => goToPage(item)}
                          className={`inline-flex h-10 w-10 items-center justify-center rounded-md border text-sm font-medium transition-colors ${
                            item === safePage
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border text-foreground hover:bg-accent'
                          }`}
                          aria-label={`Página ${item}`}
                          aria-current={item === safePage ? 'page' : undefined}
                        >
                          {item}
                        </button>
                      )
                    )}

                    <button
                      onClick={() => goToPage(safePage + 1)}
                      disabled={safePage >= totalPages}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label="Próxima página"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                )}

                {/* Status de página */}
                {totalPages > 1 && (
                  <p className="mt-4 text-center text-xs text-muted-foreground">
                    Página {safePage} de {totalPages} — {filtered.length} artigo{filtered.length !== 1 ? 's' : ''}
                  </p>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      <FooterSection />
    </div>
  );
};

export default Blog;
