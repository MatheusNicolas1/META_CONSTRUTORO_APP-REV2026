import { Building, Clock, FileSearch, ShieldCheck } from "lucide-react";

const metrics = [
  {
    icon: Building,
    title: "Obras com contexto",
    description: "Acompanhamento por obra, responsaveis e registros operacionais vinculados.",
  },
  {
    icon: FileSearch,
    title: "Historico consultavel",
    description: "RDOs, checklists e documentos podem ser revisitados a partir dos dados persistidos.",
  },
  {
    icon: Clock,
    title: "Rotina menos manual",
    description: "PDFs e relatorios reduzem remontagem de informacoes ja registradas no app.",
  },
  {
    icon: ShieldCheck,
    title: "Base para auditoria",
    description: "Permissoes, logs e rastreabilidade ajudam a manter controle sobre a operacao.",
  },
];

const ImpactMetrics = () => {
  return (
    <section className="overflow-x-hidden border-y border-border bg-muted/30 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-2xl font-semibold leading-tight text-foreground sm:text-3xl md:text-4xl">
            Impacto explicado sem metricas inventadas
          </h2>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Enquanto nao houver relatorio publico auditavel de clientes e resultados, esta pagina
            descreve beneficios operacionais verificaveis no funcionamento do produto.
          </p>
        </div>

        <div className="grid grid-cols-1 divide-y divide-border border-y border-border p-4 md:grid-cols-2 md:divide-x md:divide-y-0 lg:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <article key={metric.title} className="px-3 py-6 md:px-6">
                <Icon className="mb-5 h-6 w-6 text-primary" />
                <h3 className="text-lg font-semibold leading-snug text-foreground">{metric.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{metric.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ImpactMetrics;
