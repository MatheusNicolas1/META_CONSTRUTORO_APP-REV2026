import { Headphones, Mail, ShieldCheck, Users } from 'lucide-react';

const teamSignals = [
  {
    icon: Users,
    title: 'Produto e operacao',
    description: 'O trabalho combina experiencia de campo, suporte a construtoras e desenvolvimento de software.',
  },
  {
    icon: ShieldCheck,
    title: 'Responsabilidade com dados',
    description: 'A plataforma prioriza acesso por organizacao, permissoes e politicas publicas claras.',
  },
  {
    icon: Headphones,
    title: 'Atendimento direto',
    description: 'Demandas comerciais e de suporte entram pelos canais oficiais de contato.',
  },
  {
    icon: Mail,
    title: 'Canal institucional',
    description: 'Informacoes especificas sobre equipe, parcerias ou imprensa devem ser solicitadas diretamente.',
  },
];

const TeamSection = () => {
  return (
    <section className="overflow-x-hidden py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-2xl font-semibold leading-tight text-foreground sm:text-3xl md:text-4xl">
            Quem sustenta a operacao
          </h2>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Esta pagina nao inventa nomes, cargos ou fotos. O foco publico e explicar como a
            operacao atende construtoras e protege informacoes de obra.
          </p>
        </div>

        <div className="grid divide-y divide-border border-y border-border p-4 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          {teamSignals.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="px-3 py-6 sm:px-6">
                <Icon className="mb-4 h-6 w-6 text-primary" />
                <h3 className="text-lg font-semibold leading-snug text-foreground">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
