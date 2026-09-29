import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import SEO from '@/components/SEO';
import { seoPages } from '@/config/seo';
import PublicMegaNav from '@/components/public/PublicMegaNav';
import PublicSiteFooter from '@/components/public/PublicSiteFooter';
import { RouteStatusBadge } from '@/components/public/RouteStatusBadge';
import { blogArticlesPtBR } from '@/content/blogArticles.pt-BR';
import {
  blogDuplicates,
  blogTopics,
  routes,
  routesToConsolidate,
  type PublicRouteItem,
} from '@/config/publicRoutes';

const r = routes;

// Tabelas viram lista empilhada no celular (sem rolagem lateral) e tabela a partir de md.
const TABLE_WRAP = 'overflow-hidden rounded-2xl border border-neutral-200 bg-white md:overflow-x-auto';
const TABLE = 'w-full text-left text-sm md:min-w-[680px]';
const THEAD = 'hidden border-b border-neutral-200 text-neutral-500 md:table-header-group';
const TH = 'px-4 py-3 font-medium';
const TBODY = 'block divide-y divide-neutral-100 md:table-row-group';
const TR = 'block px-4 py-3 align-top md:table-row md:p-0';
const TD = 'block py-0.5 md:table-cell md:px-4 md:py-3';

const routeGroups: Array<{ title: string; items: Array<PublicRouteItem & { group?: string }> }> = [
  {
    title: 'Produto',
    items: [
      ...[r.rdo, r.checklist, r.dds, r.ordemServico].map((item) => ({ ...item, group: 'Rotina de campo' })),
      ...[r.controleObras, r.equipes, r.documentos, r.relatorios].map((item) => ({ ...item, group: 'Gestão da obra' })),
      ...[r.medicao, r.fluxoCaixa, r.despesas, r.portalCliente, r.erp, r.api].map((item) => ({
        ...item,
        group: 'Financeiro e integrações',
      })),
    ],
  },
  { title: 'Soluções', items: [r.construtoras, r.obrasPublicas, r.engenheiros, r.diretoria] },
  { title: 'Modelos grátis', items: [r.modelos, r.modeloRdo] },
  { title: 'Aprender e suporte', items: [r.blog, r.ajuda, r.documentacao, r.atualizacoes, r.status] },
  { title: 'Conversão', items: [r.home, r.preco, r.criarConta, r.contato] },
  { title: 'Empresa e legal', items: [r.sobre, r.carreiras, r.privacidade, r.termos, r.cookies, r.lgpd] },
];

const principles = [
  {
    title: 'Menu por intenção',
    text: 'Produto responde "o que dá para fazer", Soluções "é para mim?", Modelos grátis "por onde começo", Aprender "como faço" e Planos "quanto custa".',
  },
  {
    title: 'Uma página por funcionalidade',
    text: 'Cada módulo que já existe no app ganha uma URL própria em /funcionalidades, para disputar buscas específicas como "rdo digital" e "medição de obra".',
  },
  {
    title: 'Conteúdo que leva ao produto',
    text: `Os ${blogArticlesPtBR.length} artigos do blog passam a ser organizados em ${blogTopics.length} temas, e cada tema aponta para a página da funcionalidade correspondente.`,
  },
  {
    title: 'Rodapé como mapa do site',
    text: 'Cinco colunas de links internos ajudam o visitante e o Google a encontrar as páginas novas sem poluir o menu.',
  },
];

export default function DemoNavegacao() {
  const [showStatus, setShowStatus] = useState(false);

  const handlePending = (item: PublicRouteItem) => {
    toast('Rota proposta', {
      description: `${item.path} ainda não existe. Ela será criada depois da sua aprovação.`,
    });
  };

  const counts = useMemo(() => {
    const unique = new Map<string, PublicRouteItem>();
    routeGroups.forEach((group) => group.items.forEach((item) => unique.set(item.path, item)));
    const values = [...unique.values()];
    return {
      ativa: values.filter((item) => item.status === 'ativa').length,
      nova: values.filter((item) => item.status === 'nova').length,
      consolidar: routesToConsolidate.length,
    };
  }, []);

  const topics = useMemo(() => {
    const byCategory = new Map<string, number>();
    blogArticlesPtBR.forEach((article) => {
      byCategory.set(article.category, (byCategory.get(article.category) ?? 0) + 1);
    });
    const mapped = new Set(blogTopics.flatMap((topic) => topic.categories));
    const unmapped = [...byCategory.entries()].filter(([category]) => !mapped.has(category));
    return {
      list: blogTopics.map((topic) => ({
        ...topic,
        count: topic.categories.reduce((sum, category) => sum + (byCategory.get(category) ?? 0), 0),
      })),
      unmapped,
      categoryCount: byCategory.size,
    };
  }, []);

  const articleBySlug = useMemo(
    () => new Map(blogArticlesPtBR.map((article) => [article.slug, article])),
    []
  );

  return (
    <div className="min-h-screen bg-white font-sans text-neutral-900 antialiased">
      <SEO {...seoPages.demoNavegacao} />
      <PublicMegaNav onPendingRoute={handlePending} showStatus={showStatus} />

      <main className="pt-16">
        {/* Faixa de prévia */}
        <div className="border-b border-amber-200 bg-amber-50">
          <div className="container mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>
              <strong className="font-semibold">Prévia de homologação.</strong> Página fora do Google; nenhuma página
              publicada foi alterada.
            </p>
            <label className="inline-flex cursor-pointer items-center gap-2 font-medium">
              <input
                type="checkbox"
                checked={showStatus}
                onChange={(event) => setShowStatus(event.target.checked)}
                className="h-4 w-4 rounded border-amber-400 accent-orange-600"
              />
              Mostrar status das rotas no menu
            </label>
          </div>
        </div>

        {/* Abertura */}
        <section className="border-b border-neutral-200">
          <div className="container mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20">
            <p className="text-sm font-semibold uppercase tracking-wide text-orange-700">Arquitetura de informação</p>
            <h1 className="mt-3 max-w-3xl text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold leading-[1.08] tracking-tight">
              Menu por intenção e uma página para cada funcionalidade
            </h1>
            <p className="mt-5 max-w-[65ch] text-lg leading-relaxed text-neutral-600">
              Estrutura inspirada na organização do Canva, com as cores e o tom do Meta Construtor. Abra os menus acima
              para testar a navegação e veja abaixo o mapa completo de rotas.
            </p>

            <dl className="mt-10 grid max-w-2xl grid-cols-3 gap-6 border-t border-neutral-200 pt-6">
              {[
                { label: 'Rotas ativas', value: counts.ativa, status: 'ativa' as const },
                { label: 'Rotas novas', value: counts.nova, status: 'nova' as const },
                { label: 'A consolidar', value: counts.consolidar, status: 'consolidar' as const },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="flex items-center gap-2 text-sm text-neutral-600">
                    {stat.label}
                  </dt>
                  <dd className="mt-1 flex items-center gap-2 text-3xl font-bold tabular-nums">
                    {stat.value}
                    <RouteStatusBadge status={stat.status} />
                  </dd>
                </div>
              ))}
            </dl>

            <ol className="mt-14 grid gap-x-10 gap-y-8 md:grid-cols-2">
              {principles.map((principle, index) => (
                <li key={principle.title} className="border-t border-neutral-200 pt-5">
                  <p className="text-sm font-semibold tabular-nums text-orange-700">0{index + 1}</p>
                  <h2 className="mt-1 text-xl font-bold">{principle.title}</h2>
                  <p className="mt-2 max-w-[60ch] leading-relaxed text-neutral-600">{principle.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Mapa de rotas */}
        <section id="mapa" className="border-b border-neutral-200 bg-neutral-50">
          <div className="container mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20">
            <h2 className="text-3xl font-extrabold tracking-tight">Mapa de rotas públicas</h2>
            <p className="mt-3 max-w-[65ch] text-neutral-600">
              URLs curtas, em português, sem acento e com a palavra-chave principal. Rotas ativas mantêm o endereço atual
              para não perder o ranqueamento.
            </p>

            <div className="mt-10 space-y-10">
              {routeGroups.map((group) => (
                <div key={group.title}>
                  <h3 className="text-lg font-bold">{group.title}</h3>
                  <div className={`mt-3 ${TABLE_WRAP}`}>
                    <table className={TABLE}>
                      <thead className={THEAD}>
                        <tr>
                          <th scope="col" className={TH}>Página</th>
                          <th scope="col" className={TH}>URL</th>
                          <th scope="col" className={TH}>Palavra-chave principal</th>
                          <th scope="col" className={TH}>Status</th>
                        </tr>
                      </thead>
                      <tbody className={TBODY}>
                        {group.items.map((item) => (
                          <tr key={item.path + item.label} className={TR}>
                            <td className={TD}>
                              <span className="font-semibold text-neutral-900">{item.label}</span>
                              {'group' in item && item.group && (
                                <span className="block text-xs text-neutral-500">{item.group}</span>
                              )}
                              {item.note && <span className="mt-1 block text-xs text-amber-800">{item.note}</span>}
                            </td>
                            <td className={`${TD} break-all font-mono text-[13px] text-neutral-700`}>{item.path}</td>
                            <td className={`${TD} text-neutral-600`}>
                              <span className="text-neutral-500 md:hidden">Busca: </span>
                              {item.keyword ?? '—'}
                            </td>
                            <td className={`${TD} pt-2 md:pt-3`}>
                              <RouteStatusBadge status={item.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Consolidação */}
        <section id="consolidar" className="border-b border-neutral-200">
          <div className="container mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20">
            <h2 className="text-3xl font-extrabold tracking-tight">Rotas a consolidar</h2>
            <p className="mt-3 max-w-[65ch] text-neutral-600">
              Páginas que duplicam conteúdo ou não funcionam. Saem do índice e passam a redirecionar (301) para o destino.
            </p>
            <div className={`mt-8 ${TABLE_WRAP}`}>
              <table className={TABLE}>
                <thead className={`${THEAD} bg-neutral-50`}>
                  <tr>
                    <th scope="col" className={TH}>URL atual</th>
                    <th scope="col" className={TH}>Destino</th>
                    <th scope="col" className={TH}>Motivo</th>
                  </tr>
                </thead>
                <tbody className={TBODY}>
                  {routesToConsolidate.map((item) => (
                    <tr key={item.path} className={TR}>
                      <td className={`${TD} font-mono text-[13px] text-neutral-700`}>{item.path}</td>
                      <td className={`${TD} font-mono text-[13px] text-neutral-900`}>
                        <span className="font-sans text-neutral-500 md:hidden">Redireciona para </span>
                        {item.target}
                      </td>
                      <td className={`${TD} text-neutral-600`}>{item.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Blog */}
        <section id="blog" className="bg-neutral-50">
          <div className="container mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20">
            <h2 className="text-3xl font-extrabold tracking-tight">Blog organizado por temas</h2>
            <p className="mt-3 max-w-[65ch] text-neutral-600">
              Hoje o blog tem {blogArticlesPtBR.length} artigos em {topics.categoryCount} categorias, com nomes repetidos
              ("Gestão de obras", "Gestão de Obras", "Gestao de obras"). A proposta agrupa tudo em {blogTopics.length} temas,
              em /blog/tema/…, para não colidir com os endereços dos artigos.
            </p>

            <ul className="mt-8 divide-y divide-neutral-200 border-y border-neutral-200">
              {topics.list.map((topic) => (
                <li key={topic.path} className="grid gap-2 py-4 md:grid-cols-12 md:items-center">
                  <div className="md:col-span-4">
                    <p className="font-semibold">{topic.label}</p>
                    <p className="font-mono text-[13px] text-neutral-500">{topic.path}</p>
                  </div>
                  <p className="text-sm text-neutral-600 md:col-span-2">
                    <span className="font-semibold tabular-nums text-neutral-900">{topic.count}</span> artigos
                  </p>
                  <div className="text-sm text-neutral-600 md:col-span-6">
                    <p>
                      Leva para <span className="font-medium text-neutral-900">{topic.hub.label}</span>
                    </p>
                    <p className="break-all font-mono text-[13px] text-neutral-500">{topic.hub.path}</p>
                  </div>
                </li>
              ))}
            </ul>
            {topics.unmapped.length > 0 && (
              <p className="mt-3 text-sm text-amber-800">
                Categorias sem tema: {topics.unmapped.map(([category, count]) => `${category} (${count})`).join(', ')}
              </p>
            )}

            <h3 className="mt-14 text-xl font-bold">Artigos que disputam a mesma busca</h3>
            <p className="mt-2 max-w-[65ch] text-neutral-600">
              Candidatos a unificar. A decisão de qual manter deve usar cliques e impressões do Search Console.
            </p>
            <div className={`mt-6 ${TABLE_WRAP}`}>
              <table className={TABLE}>
                <thead className={THEAD}>
                  <tr>
                    <th scope="col" className={TH}>Manter</th>
                    <th scope="col" className={TH}>Unificar e redirecionar</th>
                  </tr>
                </thead>
                <tbody className={TBODY}>
                  {blogDuplicates.map(([keep, merge]) => (
                    <tr key={merge} className={TR}>
                      {[keep, merge].map((slug, index) => (
                        <td key={slug} className={`${TD} ${index === 1 ? 'mt-2 md:mt-0' : ''}`}>
                          <span className="block text-xs font-semibold uppercase tracking-wide text-neutral-500 md:hidden">
                            {index === 0 ? 'Manter' : 'Unificar e redirecionar'}
                          </span>
                          <span className="block text-neutral-900">{articleBySlug.get(slug)?.title ?? slug}</span>
                          <span className="block break-all font-mono text-[12px] text-neutral-500">/blog/{slug}</span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      <PublicSiteFooter onPendingRoute={handlePending} showStatus={showStatus} />
    </div>
  );
}
