import { BookOpen, FileQuestion, MessageCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SEO from '@/components/SEO';
import { seoPages } from '@/config/seo';
import { useMarketingSurface } from '@/hooks/useMarketingSurface';

const helpTopics = [
  {
    icon: BookOpen,
    title: 'Primeiros passos',
    description: 'Organizacao inicial, cadastro da empresa, acesso de usuarios e estrutura basica de obras.',
  },
  {
    icon: FileQuestion,
    title: 'Rotina de obra',
    description: 'Orientacoes sobre RDO, checklists, documentos, equipes e acompanhamento operacional.',
  },
  {
    icon: ShieldCheck,
    title: 'Conta e seguranca',
    description: 'Permissoes, privacidade, LGPD, acesso por organizacao e boas praticas de uso.',
  },
  {
    icon: MessageCircle,
    title: 'Atendimento',
    description: 'Caminhos para falar com suporte, vendas ou parcerias quando a duvida exigir contato humano.',
  },
];

const practicalLinks = [
  'Como organizar a primeira obra no Meta Construtor',
  'Quando usar RDO, checklist e documentos',
  'Como convidar usuarios e definir responsabilidades',
  'Onde consultar termos, privacidade, cookies e LGPD',
];

const CentralAjuda = () => {
  useMarketingSurface();

  return (
    <>
      <SEO {...seoPages.centralAjuda} />

      <main className="min-h-screen bg-background p-2">
        <section className="border-b border-border bg-muted/30 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-bold text-foreground md:text-5xl">
              Ajuda para organizar obra, RDO e acesso
            </h1>
            <p className="mx-auto mt-6 max-w-[64ch] text-lg leading-8 text-muted-foreground">
              Consulte orientacoes para preparar a primeira obra, entender os registros de campo
              e acionar atendimento quando a rotina exigir suporte humano.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 divide-y divide-border border-y border-border p-4 md:grid-cols-2 md:divide-x md:divide-y-0 lg:grid-cols-4">
            {helpTopics.map((topic) => {
              const Icon = topic.icon;
              return (
                <article key={topic.title} className="px-3 py-6 md:px-6">
                  <Icon className="mb-4 h-6 w-6 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">{topic.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {topic.description}
                  </p>
                </article>
              );
            })}
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-10 md:grid-cols-[1fr_0.8fr]">
            <section>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Leituras recomendadas
              </h2>
              <div className="mt-5 divide-y divide-border border-y border-border px-3 py-2">
                {practicalLinks.map((item) => (
                  <p key={item} className="px-1 py-4 text-sm leading-7 text-muted-foreground">
                    {item}
                  </p>
                ))}
              </div>
            </section>

            <aside className="border-t border-border p-4 md:border-l md:border-t-0 md:pl-8">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Precisa falar com alguem?
              </h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Use a pagina de contato para suporte, vendas, demonstracoes e parcerias. Evitamos
                prometer chat ou ticket publico quando o canal depender de configuracao operacional.
              </p>
              <Button className="mt-6" asChild>
                <a href="/contato">Ir para contato</a>
              </Button>
            </aside>
          </div>
        </section>
      </main>
    </>
  );
};

export default CentralAjuda;
