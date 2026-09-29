import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { routes } from '@/config/publicRoutes';
import type { MarketingFaq } from '@/content/marketingPages';
import type { BlogArticle } from '@/content/blogArticles';

/** Blocos reutilizados pelas páginas de funcionalidades, soluções e modelos. */

export const CONTAINER = 'container mx-auto max-w-7xl px-4 sm:px-6';

export function Breadcrumb({ items }: { items: Array<{ label: string; to?: string }> }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-neutral-500">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => (
          <li key={item.label} className="inline-flex items-center gap-1">
            {index > 0 && <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />}
            {item.to ? (
              <Link to={item.to} className="transition-colors hover:text-neutral-900">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-neutral-700">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function CtaButtons({ analyticsLabel }: { analyticsLabel: string }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Link
        to={routes.criarConta.path}
        data-analytics-label={`${analyticsLabel}-criar-conta`}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-orange px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-orange-hover"
      >
        Criar conta grátis <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
      <Link
        to={routes.contato.path}
        data-analytics-label={`${analyticsLabel}-vendas`}
        className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-6 py-3 text-sm font-medium text-neutral-800 transition-colors hover:border-neutral-400 hover:bg-neutral-50"
      >
        Falar com vendas
      </Link>
    </div>
  );
}

export function FaqList({ faqs }: { faqs: MarketingFaq[] }) {
  if (!faqs.length) return null;
  return (
    <section className="border-t border-neutral-200">
      <div className={`${CONTAINER} grid gap-8 py-14 md:py-20 lg:grid-cols-12`}>
        <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl lg:col-span-4">Perguntas frequentes</h2>
        <div className="divide-y divide-neutral-200 lg:col-span-8">
          {faqs.map((faq) => (
            <div key={faq.question} className="py-5 first:pt-0">
              <h3 className="text-lg font-semibold text-neutral-900">{faq.question}</h3>
              <p className="mt-2 max-w-[65ch] leading-relaxed text-neutral-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function RelatedArticles({ title, articles }: { title: string; articles: BlogArticle[] }) {
  if (!articles.length) return null;
  return (
    <section className="border-t border-neutral-200">
      <div className={`${CONTAINER} py-14 md:py-20`}>
        <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">{title}</h2>
        <ul className="mt-8 divide-y divide-neutral-200 border-y border-neutral-200">
          {articles.map((article) => (
            <li key={article.slug}>
              <Link to={article.path} className="group grid gap-1 py-5 md:grid-cols-12 md:items-baseline md:gap-6">
                <span className="text-sm text-neutral-500 md:col-span-2">{article.readingTime}</span>
                <span className="md:col-span-10">
                  <span className="block font-semibold text-neutral-900 transition-colors group-hover:text-orange-700">
                    {article.title}
                  </span>
                  <span className="mt-1 block max-w-[75ch] text-sm leading-relaxed text-neutral-600">{article.description}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function FinalCta({ title, text, analyticsLabel }: { title: string; text: string; analyticsLabel: string }) {
  return (
    <section className="bg-brand-orange-ghost">
      <div className={`${CONTAINER} flex flex-col gap-6 py-14 md:flex-row md:items-center md:justify-between md:py-16`}>
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-neutral-900 md:text-3xl">{title}</h2>
          <p className="mt-2 max-w-[60ch] text-neutral-700">{text}</p>
        </div>
        <CtaButtons analyticsLabel={analyticsLabel} />
      </div>
    </section>
  );
}
