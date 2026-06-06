import { BookOpen, Code, Layers, Webhook } from 'lucide-react';
import SEO from '@/components/SEO';
import { seoPages } from '@/config/seo';
import { useMarketingSurface } from '@/hooks/useMarketingSurface';

const edgeFunctions = [
  'create-checkout-session',
  'create-portal-session',
  'generate-rdo-pdf',
  'generate-checklist-pdf',
  'send-checklist-email',
  'approve-rdo',
  'record-audit-log',
  'suspend-user',
];

const overview = [
  {
    icon: BookOpen,
    title: 'Modelo de uso',
    description:
      'O uso principal acontece pelo app autenticado. Operacoes de obra, RDO, checklist e documentos exigem sessao e organizacao ativa.',
  },
  {
    icon: Layers,
    title: 'APIs publicas',
    description:
      'Nao ha SDK publico ou REST API externa publicada nesta versao. Integracoes tecnicas devem usar fluxos autenticados ja implementados.',
  },
  {
    icon: Webhook,
    title: 'Webhooks',
    description:
      'Webhooks sem backend real permanecem bloqueados. Cadastro, teste ou disparo nao devem retornar sucesso ficticio.',
  },
  {
    icon: Code,
    title: 'SDK publico',
    description:
      'Nenhum pacote SDK publico e anunciado nesta versao. Exemplos de chaves genericas e endpoints externos foram removidos.',
  },
];

const Documentacao = () => {
  useMarketingSurface();

  return (
    <>
      <SEO {...seoPages.documentacao} />

      <main className="min-h-screen bg-background p-2">
        <section className="border-b border-border bg-muted/30 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold text-foreground">Documentacao tecnica com limites claros</h1>
            <p className="mx-auto mt-4 max-w-[64ch] text-lg leading-8 text-muted-foreground">
              Entenda quais fluxos existem no app, quais funcoes dependem de autenticacao e quais
              integracoes ainda nao possuem contrato publico liberado.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Como interpretar esta documentacao
          </h2>
          <div className="mt-6 grid divide-y divide-border border-y border-border p-4 md:grid-cols-2 md:divide-x md:divide-y-0 lg:grid-cols-4">
            {overview.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="px-3 py-6 md:px-6">
                  <Icon className="mb-4 h-6 w-6 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Edge Functions conhecidas
          </h2>
          <p className="mt-4 max-w-[64ch] text-sm leading-7 text-muted-foreground">
            Funcoes conhecidas no contrato do app. A disponibilidade final depende da configuracao
            do Supabase e da validacao por fluxo especifico.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {edgeFunctions.map((name) => (
              <code key={name} className="rounded-md border border-border bg-muted px-3 py-2 text-sm">
                {name}
              </code>
            ))}
          </div>
        </section>
      </main>
    </>
  );
};

export default Documentacao;
