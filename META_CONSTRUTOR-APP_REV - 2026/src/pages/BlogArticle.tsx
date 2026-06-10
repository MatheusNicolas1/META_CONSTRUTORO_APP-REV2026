import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Camera } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { NavigationSafety } from '@/utils/navigationSafety';
import SEO from '@/components/SEO';
import { getBlogArticle } from '@/content/blogArticles';
import { seoBlogArticles, seoPages } from '@/config/seo';
import LandingNavigation from '@/components/landing/LandingNavigation';
import FooterSection from '@/components/landing/FooterSection';
import { Button } from '@/components/ui/button';

// Track unique article views in localStorage for popularity sort
function trackArticleView(slug: string) {
  try {
    const key = 'blog_views';
    const stored = localStorage.getItem(key);
    const views: Record<string, number> = stored ? JSON.parse(stored) : {};
    views[slug] = (views[slug] || 0) + 1;
    localStorage.setItem(key, JSON.stringify(views));
  } catch {
    // localStorage may be unavailable
  }
}

const BlogArticle = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const article = getBlogArticle(slug);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (slug) trackArticleView(slug);
  }, [slug]);

  if (!article) {
    return (
      <div className="force-light-blog">
        <SEO {...seoPages.blog} robots="noindex,follow" />
        <LandingNavigation />
        <main className="min-h-screen bg-background px-4 pb-20 pt-32 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <button onClick={() => NavigationSafety.safeNavigate(navigate, '/blog')} className="inline-flex items-center gap-2 text-sm font-medium text-primary cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao blog
            </button>
            <h1 className="mt-8 text-4xl font-semibold tracking-tight text-foreground">
              Artigo nao encontrado
            </h1>
            <p className="mt-4 text-muted-foreground">
              O conteudo solicitado nao esta disponivel.
            </p>
          </div>
        </main>
        <FooterSection />
      </div>
    );
  }

  const seo = seoBlogArticles[article.slug] ?? seoPages.blog;

  return (
    <div className="force-light-blog">
      <SEO {...seo} />
      <LandingNavigation />

      <main className="min-h-screen bg-background pt-28">
        <article>
          <header className="border-b border-border bg-[#fbfaf7] px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl">
              <button onClick={() => NavigationSafety.safeNavigate(navigate, '/blog')} className="inline-flex items-center gap-2 text-sm font-medium text-primary cursor-pointer">
                <ArrowLeft className="h-4 w-4" />
                Blog
              </button>
              <p className="mt-8 text-sm font-semibold text-primary">
                {article.category} - {article.readingTime}
              </p>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                {article.title}
              </h1>
              <p className="mt-6 max-w-[64ch] text-base leading-8 text-muted-foreground md:text-lg">
                {article.summary}
              </p>
              <ul className="mt-6 flex max-w-[64ch] flex-wrap gap-2 text-sm text-muted-foreground">
                {article.keywords.slice(0, 4).map((keyword) => (
                  <li key={keyword} className="border border-border px-3 py-1">
                    {keyword}
                  </li>
                ))}
              </ul>
            </div>
          </header>

          <div className="px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_280px]">
              <div className="max-w-[64ch] space-y-10">
                {article.sections.map((section) => (
                  <section key={section.title}>
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                      {section.title}
                    </h2>
                    <p className="mt-4 text-base leading-8 text-muted-foreground">
                      {section.body}
                    </p>
                    {section.image ? (
                      <figure className="mt-6 overflow-hidden rounded-xl border border-border bg-white">
                        <img
                          src={section.image.src}
                          alt={section.image.alt}
                          className="w-full object-cover"
                          loading="lazy"
                        />
                        {(section.image.caption || section.image.credit) ? (
                          <figcaption className="flex items-center gap-2 border-t border-border bg-[#fbfaf7] px-4 py-3 text-xs text-muted-foreground">
                            <Camera className="h-3.5 w-3.5 shrink-0" />
                            {section.image.caption}
                            {section.image.caption && section.image.credit ? <span className="text-border">|</span> : null}
                            {section.image.credit ? <span>{section.image.credit}</span> : null}
                          </figcaption>
                        ) : null}
                      </figure>
                    ) : null}
                    {section.items ? (
                      <ul className="mt-5 space-y-3 text-base leading-8 text-muted-foreground">
                        {section.items.map((item) => (
                          <li key={item} className="flex gap-3">
                            <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </section>
                ))}

                <section>
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    Perguntas frequentes
                  </h2>
                  <div className="mt-5 divide-y divide-border border-y border-border">
                    {article.faq.map((item) => (
                      <div key={item.question} className="py-5">
                        <h3 className="text-lg font-semibold text-foreground">{item.question}</h3>
                        <p className="mt-2 text-base leading-8 text-muted-foreground">
                          {item.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <aside className="h-fit bg-[#fbfaf7] p-5">
                <h2 className="text-sm font-semibold text-foreground">Pontos principais</h2>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
                  {article.takeaways.map((item) => (
                    <li key={item} className="flex gap-2">
                      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </aside>
            </div>
          </div>

          <section className="bg-[#0b1623] px-4 py-12 text-white sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-5xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-3xl font-semibold">{article.cta.title}</h2>
                <p className="mt-3 max-w-[64ch] leading-8 text-slate-300">{article.cta.description}</p>
              </div>
              <Button asChild size="lg" className="h-12 shrink-0 px-6">
                <Link to={article.cta.href}>
                  {article.cta.label}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </section>
        </article>
      </main>

      <FooterSection />
    </div>
  );
};

export default BlogArticle;
