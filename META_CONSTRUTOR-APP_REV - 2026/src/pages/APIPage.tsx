import { Code2, Shield, Workflow, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import { seoPages } from "@/config/seo";
import { useMarketingSurface } from "@/hooks/useMarketingSurface";

const features = [
  {
    icon: Workflow,
    title: "Fluxos autenticados",
    description: "Operacoes acontecem pelo app e pelas Edge Functions configuradas para cada caso.",
  },
  {
    icon: Shield,
    title: "Permissoes por organizacao",
    description: "Acesso operacional depende de sessao, org ativa e papeis autorizados.",
  },
  {
    icon: Zap,
    title: "Backend real quando disponivel",
    description: "PDFs, checkout, auditoria e aprovacoes usam funcoes reais em vez de sucesso simulado.",
  },
  {
    icon: Code2,
    title: "SDK publico nao publicado",
    description: "A pagina nao anuncia pacote ou endpoint externo sem contrato implementado.",
  },
];

const APIPage = () => {
  const navigate = useNavigate();
  useMarketingSurface();

  return (
    <>
      <SEO {...seoPages.api} />

      <main className="min-h-screen bg-background p-2">
        <section className="border-b border-border bg-muted/30 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl text-center">
            <h1 className="mb-6 text-4xl font-bold text-foreground md:text-5xl">
              Integracoes tecnicas do Meta Construtor
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-xl text-muted-foreground">
              Veja o estado real de Edge Functions, permissoes e integracoes. REST API externa,
              SDK publico e chaves abertas nao sao anunciados nesta versao.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button size="lg" className="h-auto py-3" onClick={() => navigate("/documentacao")}>
                Ver documentacao
              </Button>
              <Button size="lg" variant="outline" className="h-auto py-3" onClick={() => navigate("/contato")}>
                Falar com atendimento
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-12 grid grid-cols-1 divide-y divide-border border-y border-border p-4 md:grid-cols-2 md:divide-x md:divide-y-0 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="px-3 py-6 md:px-6">
                  <Icon className="mb-4 h-6 w-6 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">{feature.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>

          <section className="max-w-[58ch] border-t border-border px-4 pb-2 pt-8">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Contrato publico atual
            </h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground">
              <p>
                O produto usa Supabase, rotas autenticadas e Edge Functions reais para operacoes
                especificas. Integracoes sem backend implementado devem permanecer bloqueadas ou
                sinalizadas como indisponiveis.
              </p>
              <p>
                Exemplos de SDK, endpoints externos, chaves genericas e latencia fixa foram
                removidos para evitar documentacao ou promessa comercial ficticia.
              </p>
            </div>
          </section>
        </section>
      </main>
    </>
  );
};

export default APIPage;
