import { Calendar, Globe, Rocket, Users } from 'lucide-react';

const milestones = [
  {
    year: '2022',
    title: 'Inicio do projeto',
    description: 'Mapeamento das principais dores de registro, acompanhamento e documentacao em obras.',
    icon: Calendar,
  },
  {
    year: '2023',
    title: 'Primeiros pilotos',
    description: 'Validacao de fluxos com foco em RDO, documentos, equipe e rotina operacional.',
    icon: Users,
  },
  {
    year: '2024',
    title: 'Plataforma web',
    description: 'Organizacao do produto como plataforma web para gestao de obras e registros.',
    icon: Rocket,
  },
  {
    year: '2025',
    title: 'Maturidade operacional',
    description: 'Evolucao de funcoes, relatorios, permissoes e contratos tecnicos validados.',
    icon: Globe,
  },
];

const TimelineSection = () => {
  return (
    <section className="overflow-x-hidden bg-muted/30 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-2xl font-semibold leading-tight text-foreground sm:text-3xl md:text-4xl">
            Nossa historia
          </h2>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Uma linha do tempo simples sobre a evolucao do produto para a rotina da construcao civil.
          </p>
        </div>

        <div className="grid divide-y divide-border border-y border-border p-4 md:grid-cols-4 md:divide-x md:divide-y-0">
          {milestones.map((milestone) => {
            const Icon = milestone.icon;
            return (
              <article key={milestone.year} className="px-3 py-6 md:px-6">
                <div className="mb-4 flex items-center gap-3">
                  <Icon className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold text-primary">{milestone.year}</span>
                </div>
                <h3 className="text-lg font-semibold leading-snug text-foreground">{milestone.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{milestone.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TimelineSection;
