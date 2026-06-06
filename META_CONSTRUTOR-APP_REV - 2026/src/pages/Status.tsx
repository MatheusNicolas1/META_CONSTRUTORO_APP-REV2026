import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import SEO from '@/components/SEO';
import { seoPages } from '@/config/seo';
import { useMarketingSurface } from '@/hooks/useMarketingSurface';

const services = [
  { name: 'Aplicacao web', status: 'Operacional', note: 'Validada por build e rotas publicas.', icon: CheckCircle },
  { name: 'Autenticacao', status: 'Monitorado no app', note: 'Fluxo depende do Supabase Auth configurado.', icon: Clock },
  { name: 'Banco de dados', status: 'Monitorado no app', note: 'Persistencia operacional via Supabase.', icon: Clock },
  { name: 'Edge Functions', status: 'Monitorado por fluxo', note: 'Funcoes reais sao validadas por fluxo especifico.', icon: Clock },
  { name: 'Webhooks de integracao', status: 'Limitado', note: 'Mantidos bloqueados quando nao ha backend real ativo.', icon: AlertCircle },
];

const Status = () => {
  useMarketingSurface();

  return (
    <>
      <SEO {...seoPages.status} />

      <main className="min-h-screen bg-background p-2">
        <section className="border-b border-border bg-muted/30 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 px-1 text-primary">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Status publico sem metricas ficticias</span>
            </div>
            <h1 className="text-4xl font-bold text-foreground">Status operacional do Meta Construtor</h1>
            <p className="mx-auto mt-4 max-w-[64ch] text-lg leading-8 text-muted-foreground">
              Acompanhe o que pode ser comunicado publicamente hoje. Uptime, latencia e incidentes
              numericos so entram aqui quando houver monitoramento externo auditavel.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Resumo atual</h2>
          <div className="mt-6 grid divide-y divide-border border-y border-border p-4 md:grid-cols-3 md:divide-x md:divide-y-0">
            {[
              ['Metricas publicas de uptime', 'Nao publicadas'],
              ['Incidentes ativos', 'Sem feed publico'],
              ['Integracoes sem backend', 'Bloqueadas'],
            ].map(([label, value]) => (
              <article key={label} className="px-3 py-6 md:px-6">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Status por servico</h2>
          <div className="mt-6 divide-y divide-border border-y border-border p-4">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <article key={service.name} className="grid gap-3 px-4 py-5 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="flex items-start gap-3">
                    <Icon className="mt-0.5 h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-medium text-foreground">{service.name}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{service.note}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {service.status}
                  </span>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </>
  );
};

export default Status;
