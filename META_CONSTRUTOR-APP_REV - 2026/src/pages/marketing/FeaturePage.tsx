import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import SEO from '@/components/SEO';
import { marketingPageSeo } from '@/config/seo';
import { blogTopics } from '@/config/publicRoutes';
import { blogArticlesPtBR } from '@/content/blogArticles.pt-BR';
import { featureBySlug, marketingFeatures } from '@/content/marketingPages';
import MarketingShell from '@/components/public/MarketingShell';
import DemoVideo from '@/components/public/DemoVideo';
import { Breadcrumb, CONTAINER, CtaButtons, FaqList, FinalCta, RelatedArticles } from '@/components/public/MarketingBlocks';
import NotFound from '@/pages/NotFound';

export default function FeaturePage() {
  const { slug = '' } = useParams();
  const feature = featureBySlug(slug);

  const related = useMemo(
    () => (feature ? marketingFeatures.filter((item) => item.group === feature.group && item.slug !== feature.slug) : []),
    [feature]
  );

  const articles = useMemo(() => {
    if (!feature) return [];
    const topic = blogTopics.find((item) => item.hub.path === feature.path);
    if (!topic) return [];
    return blogArticlesPtBR.filter((article) => topic.categories.includes(article.category)).slice(0, 4);
  }, [feature]);

  if (!feature) return <NotFound />;

  const hasMedia = Boolean(feature.video || feature.image);

  return (
    <div className="min-h-screen bg-white font-sans text-neutral-900 antialiased">
      <SEO {...marketingPageSeo(feature.path, feature.seoTitle, feature.seoDescription, feature.faqs)} />
      <MarketingShell offsetHeader>
        <main>
          {/* Abertura */}
          <section className="border-b border-neutral-200 bg-neutral-50">
            <div className={`${CONTAINER} grid gap-10 py-12 md:py-16 ${hasMedia ? 'lg:grid-cols-12 lg:items-center' : ''}`}>
              <div className={hasMedia ? 'lg:col-span-6' : 'max-w-3xl'}>
                <Breadcrumb items={[{ label: 'Início', to: '/' }, { label: 'Funcionalidades' }, { label: feature.group }]} />
                <h1 className="mt-5 text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1.08] tracking-tight">{feature.title}</h1>
                <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-neutral-600">{feature.lead}</p>
                {feature.note && <p className="mt-4 max-w-[60ch] text-sm text-neutral-600">{feature.note}</p>}
                <div className="mt-8">
                  <CtaButtons analyticsLabel={`feature-${feature.slug}`} />
                </div>
              </div>
              {hasMedia && (
                <div className="lg:col-span-6">
                  {feature.video ? (
                    <DemoVideo src={feature.video.src} poster={feature.video.poster} label={feature.video.label} />
                  ) : (
                    feature.image && (
                      <img
                        src={feature.image.src}
                        alt={feature.image.alt}
                        width={1440}
                        height={900}
                        className="block h-auto w-full rounded-2xl border border-neutral-200 bg-white shadow-sm"
                        fetchPriority="high"
                        decoding="async"
                      />
                    )
                  )}
                </div>
              )}
            </div>
          </section>

          {/* O que dá para fazer */}
          <section>
            <div className={`${CONTAINER} grid gap-8 py-14 md:py-20 lg:grid-cols-12`}>
              <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl lg:col-span-4">O que você faz no Meta Construtor</h2>
              <ul className="divide-y divide-neutral-200 lg:col-span-8">
                {feature.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-3 py-4 first:pt-0">
                    <Check className="mt-1 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                    <span className="text-lg leading-relaxed text-neutral-800">{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Mesma área */}
          {related.length > 0 && (
            <section className="border-t border-neutral-200 bg-neutral-50">
              <div className={`${CONTAINER} py-14 md:py-20`}>
                <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">Também em {feature.group.toLowerCase()}</h2>
                <ul className="mt-8 grid gap-x-10 gap-y-2 md:grid-cols-2">
                  {related.map((item) => (
                    <li key={item.slug}>
                      <Link to={item.path} className="group block rounded-xl px-3 py-3 -mx-3 transition-colors hover:bg-white">
                        <span className="font-semibold text-neutral-900 transition-colors group-hover:text-orange-700">
                          {item.title}
                        </span>
                        <span className="mt-1 block text-sm leading-relaxed text-neutral-600">{item.lead}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          <RelatedArticles title="Para ler no blog" articles={articles} />
          <FaqList faqs={feature.faqs} />
          <FinalCta
            title="Comece pelo plano grátis"
            text="Crie a conta, cadastre a primeira obra e teste a rotina com a sua equipe. Sem cartão de crédito."
            analyticsLabel={`feature-${feature.slug}-final`}
          />
        </main>
      </MarketingShell>
    </div>
  );
}
