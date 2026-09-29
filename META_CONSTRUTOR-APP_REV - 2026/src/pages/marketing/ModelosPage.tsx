import { useMemo } from 'react';
import SEO from '@/components/SEO';
import { marketingPageSeo } from '@/config/seo';
import { blogArticlesPtBR } from '@/content/blogArticles.pt-BR';
import { marketingTemplates } from '@/content/marketingPages';
import MarketingShell from '@/components/public/MarketingShell';
import { Breadcrumb, CONTAINER, FinalCta, RelatedArticles } from '@/components/public/MarketingBlocks';

export default function ModelosPage() {
  const articles = useMemo(
    () =>
      marketingTemplates.articleSlugs
        .map((slug) => blogArticlesPtBR.find((article) => article.slug === slug))
        .filter((article): article is (typeof blogArticlesPtBR)[number] => Boolean(article)),
    []
  );

  return (
    <div className="min-h-screen bg-white font-sans text-neutral-900 antialiased">
      <SEO {...marketingPageSeo(marketingTemplates.path, marketingTemplates.seoTitle, marketingTemplates.seoDescription)} />
      <MarketingShell offsetHeader>
        <main>
          <section className="border-b border-neutral-200 bg-neutral-50">
            <div className={`${CONTAINER} py-12 md:py-16`}>
              <div className="max-w-3xl">
                <Breadcrumb items={[{ label: 'Início', to: '/' }, { label: 'Modelos grátis' }]} />
                <h1 className="mt-5 text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1.08] tracking-tight">
                  Modelos para a rotina da obra
                </h1>
                <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-neutral-600">
                  Guias com a estrutura pronta de RDO, checklist e relatório fotográfico para copiar e adaptar à sua obra.
                  Quando quiser sair do papel, os mesmos registros funcionam dentro do Meta Construtor.
                </p>
              </div>
            </div>
          </section>

          <RelatedArticles title="Modelos disponíveis" articles={articles} />
          <FinalCta
            title="Use os modelos direto no sistema"
            text="No Meta Construtor, RDO e checklists já vêm estruturados e ficam guardados por obra."
            analyticsLabel="modelos-final"
          />
        </main>
      </MarketingShell>
    </div>
  );
}
