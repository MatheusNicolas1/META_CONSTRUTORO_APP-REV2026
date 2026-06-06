import { Briefcase, Mail, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SEO from '@/components/SEO';
import { seoPages } from '@/config/seo';
import { useMarketingSurface } from '@/hooks/useMarketingSurface';

const culturePoints = [
  {
    icon: Users,
    title: 'Produto ligado a obra real',
    description: 'Trabalhamos em fluxos de RDO, documentos, equipes, checklists e rotina operacional.',
  },
  {
    icon: Briefcase,
    title: 'Time em formacao',
    description: 'A pagina registra interesse profissional sem anunciar vagas que nao estejam abertas.',
  },
  {
    icon: MapPin,
    title: 'Atuacao remota e Bahia',
    description: 'O atendimento e a operacao sao digitais, com contexto local em Salvador e clientes no Brasil.',
  },
  {
    icon: Mail,
    title: 'Contato direto',
    description: 'Candidaturas espontaneas devem seguir pelos canais oficiais de contato.',
  },
];

const Carreiras = () => {
  useMarketingSurface();

  return (
    <>
      <SEO {...seoPages.carreiras} />

      <main className="min-h-screen bg-background p-2">
        <section className="border-b border-border bg-muted/30 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-bold text-foreground md:text-5xl">
              Trabalhe em produto para rotina real de obra
            </h1>
            <p className="mx-auto mt-6 max-w-[64ch] text-lg leading-8 text-muted-foreground">
              O Meta Construtor organiza RDO, documentos, equipes e checklists para construtoras.
              Esta pagina registra o contexto do time sem anunciar vagas que ainda nao estao abertas.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 divide-y divide-border border-y border-border p-4 md:grid-cols-2 md:divide-x md:divide-y-0 lg:grid-cols-4">
            {culturePoints.map((point) => {
              const Icon = point.icon;
              return (
                <article key={point.title} className="px-3 py-6 md:px-6">
                  <Icon className="mb-4 h-6 w-6 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">{point.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {point.description}
                  </p>
                </article>
              );
            })}
          </div>

          <section className="mx-auto mt-16 max-w-2xl border-t border-border px-4 pb-2 pt-8">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Vagas abertas
            </h2>
            <p className="mt-4 max-w-[64ch] text-base leading-8 text-muted-foreground">
              No momento, esta pagina nao lista vagas especificas. Quando houver posicoes
              abertas, os cargos, requisitos, modelo de trabalho e etapas do processo seletivo
              serao publicados aqui.
            </p>
            <p className="mt-4 max-w-[64ch] text-base leading-8 text-muted-foreground">
              Para apresentar interesse profissional, envie uma mensagem pelo canal de contato
              com area de atuacao, experiencia e portfolio quando aplicavel.
            </p>
            <Button className="mt-6" asChild>
              <a href="/contato">Enviar interesse</a>
            </Button>
          </section>
        </section>
      </main>
    </>
  );
};

export default Carreiras;
