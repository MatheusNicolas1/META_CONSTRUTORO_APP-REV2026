import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Minus } from 'lucide-react';
import SEO from '@/components/SEO';
import { marketingPageSeo } from '@/config/seo';
import { blogArticlesPtBR } from '@/content/blogArticles.pt-BR';
import { featureBySlug, solutionBySlug } from '@/content/marketingPages';
import type { MarketingFeature } from '@/content/marketingPages';
import MarketingShell from '@/components/public/MarketingShell';
import { Breadcrumb, CONTAINER, CtaButtons, FinalCta, RelatedArticles } from '@/components/public/MarketingBlocks';
import NotFound from '@/pages/NotFound';

export default function SolutionPage() {
  const { slug = '' } = useParams();
  const solution = solutionBySlug(slug);

  const features = useMemo(
    () => (solution ? solution.features.map(featureBySlug).filter((item): item is MarketingFeature => Boolean(item)) : []),
    [solution]
  );

  const articles = useMemo(
    () =>
      solution?.articleSlugs
        ? blogArticlesPtBR.filter((article) => solution.articleSlugs?.includes(article.slug))
        : [],
    [solution]
  );

  if (!solution) return <NotFound />;

  return (
    <div className="min-h-screen bg-white font-sans text-neutral-900 antialiased">
      <SEO {...marketingPageSeo(solution.path, solution.seoTitle, solution.seoDescription)} />
      <MarketingShell offsetHeader>
        <main>
          <section className="border-b border-neutral-200 bg-neutral-50">
            <div className={`${CONTAINER} max-w-7xl py-12 md:py-16`}>
              <div className="max-w-3xl">
                <Breadcrumb items={[{ label: 'Início', to: '/' }, { label: 'Soluções' }]} />
                <h1 className="mt-5 text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1.08] tracking-tight">{solution.title}</h1>
                <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-neutral-600">{solution.lead}</p>
                <div className="mt-8">
                  <CtaButtons analyticsLabel={`solucao-${solution.slug}`} />
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className={`${CONTAINER} grid gap-8 py-14 md:py-20 lg:grid-cols-12`}>
              <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl lg:col-span-4">O que costuma travar</h2>
              <ul className="divide-y divide-neutral-200 lg:col-span-8">
                {solution.pains.map((pain) => (
                  <li key={pain} className="flex gap-3 py-4 first:pt-0">
                    <Minus className="mt-1 h-5 w-5 shrink-0 text-neutral-400" aria-hidden="true" />
                    <span className="text-lg leading-relaxed text-neutral-800">{pain}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="border-t border-neutral-200 bg-neutral-50">
            <div className={`${CONTAINER} py-14 md:py-20`}>
              <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">Como o Meta Construtor organiza</h2>
              <ul className="mt-8 divide-y divide-neutral-200 border-y border-neutral-200">
                {features.map((feature) => (
                  <li key={feature.slug}>
                    <Link to={feature.path} className="group grid gap-1 py-5 md:grid-cols-12 md:items-baseline md:gap-6">
                      <span className="text-sm text-neutral-500 md:col-span-3">{feature.group}</span>
                      <span className="md:col-span-8">
                        <span className="block font-semibold text-neutral-900 transition-colors group-hover:text-orange-700">
                          {feature.title}
                        </span>
                        <span className="mt-1 block max-w-[75ch] text-sm leading-relaxed text-neutral-600">{feature.lead}</span>
                      </span>
                      <ArrowRight
                        className="hidden h-5 w-5 text-neutral-400 transition-colors group-hover:text-orange-700 md:col-span-1 md:block md:justify-self-end"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <RelatedArticles title="Para ler no blog" articles={articles} />
          <FinalCta
            title="Teste com uma obra de verdade"
            text="O plano Grátis permite cadastrar uma obra e registrar até 7 RDOs por mês, sem cartão de crédito."
            analyticsLabel={`solucao-${solution.slug}-final`}
          />
        </main>
      </MarketingShell>
    </div>
  );
}
