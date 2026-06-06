import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import SEO from '@/components/SEO';
import { seoPages } from '@/config/seo';
import { useMarketingSurface } from '@/hooks/useMarketingSurface';

const updates = [
  {
    type: 'Produto',
    title: 'Rotina de obra mais verificavel',
    description: 'Evolucoes recentes priorizam RDO, checklist, documentos e registros consultaveis.',
    items: [
      'PDFs e relatorios ligados a dados persistidos',
      'Checklists e RDOs com fluxo operacional mais claro',
      'Documentacao publica alinhada aos limites atuais',
    ],
  },
  {
    type: 'Integracoes',
    title: 'Contratos tecnicos mais honestos',
    description: 'Fluxos sem backend real permanecem bloqueados ou sinalizados como indisponiveis.',
    items: [
      'Webhooks nao retornam sucesso ficticio sem provedor ativo',
      'SDK publico nao e anunciado nesta versao',
      'Edge Functions reais sao tratadas por fluxo especifico',
    ],
  },
  {
    type: 'Marketing',
    title: 'Paginas publicas mais objetivas',
    description: 'Conteudo publico foi revisado para reduzir promessas infladas e melhorar indexacao.',
    items: [
      'Blog, ajuda, documentacao e API com conteudo mais verificavel',
      'Paginas legais com leitura controlada',
      'Paginas institucionais sem depoimentos ou vagas ficticias',
    ],
  },
];

const futureItems = [
  'App movel nativo somente quando houver contrato e roadmap publico validado.',
  'Relatorios avancados sem promessa de IA ate haver backend validado.',
  'Integracao com ERPs comunicada apenas quando existir fluxo real testavel.',
];

const Atualizacoes = () => {
  useMarketingSurface();

  return (
    <>
      <SEO {...seoPages.atualizacoes} />

      <main className="min-h-screen bg-background p-2">
        <section className="border-b border-border bg-muted/30 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold text-foreground">Atualizacoes verificaveis do produto</h1>
            <p className="mx-auto mt-4 max-w-[64ch] text-lg leading-8 text-muted-foreground">
              Registro publico das frentes que afetam RDO, documentos, checklists, integracoes
              e paginas de apoio, sem versoes ficticias ou promessas sem backend validado.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Frentes recentes</h2>
          <div className="mt-6 divide-y divide-border border-y border-border p-4">
            {updates.map((update) => (
              <article key={update.title} className="px-4 py-8">
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-border px-3 py-1.5 text-sm font-medium text-primary">
                    {update.type}
                  </span>
                  <h3 className="text-xl font-semibold text-foreground">{update.title}</h3>
                </div>
                <p className="max-w-[64ch] text-sm leading-7 text-muted-foreground">{update.description}</p>
                <ul className="mt-5 space-y-2">
                  {update.items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                      <span className="text-sm leading-7 text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="border-y border-border p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">Em avaliacao</h2>
            </div>
            <p className="mt-4 max-w-[64ch] text-sm leading-7 text-muted-foreground">
              Proximas funcionalidades devem ser comunicadas com cautela ate haver contrato tecnico
              e validacao de produto.
            </p>
            <ul className="mt-5 space-y-2">
              {futureItems.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                  <span className="text-sm leading-7 text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </>
  );
};

export default Atualizacoes;
