import { ArrowRight, BarChart3, CheckCircle2, ClipboardList, FileText, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const benefits = [
  {
    icon: ClipboardList,
    title: "Rotina padronizada",
    description: "RDO, checklist, atividade e documento seguem o mesmo criterio de registro em todas as obras.",
  },
  {
    icon: FileText,
    title: "Historico facil de auditar",
    description: "Fotos, anexos, responsaveis e datas ficam ligados ao contexto certo, sem busca manual em conversas.",
  },
  {
    icon: BarChart3,
    title: "Gestao com leitura objetiva",
    description: "Pendencias, progresso e proximas acoes aparecem em uma visao preparada para decisores.",
  },
  {
    icon: ShieldCheck,
    title: "Confianca operacional",
    description: "Permissoes, organizacao por obra e registros estruturados reduzem risco de informacao perdida.",
  },
];

const checklist = [
  "RDO digital com evidencias",
  "Checklists por tipo de rotina",
  "Documentos vinculados a obra",
  "Equipes e responsaveis visiveis",
  "Relatorios para acompanhamento",
  "Base organizada para suporte e auditoria",
];

const BenefitsSection = () => {
  const navigate = useNavigate();

  return (
    <section className="bg-background px-2 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold leading-tight text-foreground sm:text-3xl md:text-4xl">
              Por que construtoras usam o Meta Construtor
            </h2>
            <p className="mt-4 max-w-[64ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
              A plataforma organiza a rotina que costuma ficar espalhada entre planilhas, mensagens, fotos e arquivos.
            </p>

            <div className="mt-8 border-y border-border bg-muted/30 p-5">
              <div className="text-base font-semibold text-foreground">O ganho pratico</div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Menos tempo reconstruindo o que aconteceu na obra e mais clareza para decidir o que precisa ser feito agora.
              </p>
            </div>

            <figure className="mt-8 overflow-hidden border border-border bg-muted/30">
              <img
                src="/marketing/obras-reais/cobertura-metalica-canteiro.jpg"
                alt="Canteiro com cobertura metalica em execucao, exemplo de obra acompanhada por registros e evidencias"
                className="h-64 w-full object-cover"
                loading="lazy"
              />
            </figure>

            <Button
              size="lg"
              className="mt-8 w-full bg-primary py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90 sm:w-auto"
              onClick={() => navigate("/preco")}
            >
              Ver planos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-6">
            <div className="grid sm:grid-cols-2">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;

                return (
                  <article key={benefit.title} className="border-b border-border p-5 last:border-b-0 sm:border-r sm:even:border-r-0">
                    <div className="mb-4 flex h-10 w-8 items-center text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold leading-snug text-foreground">{benefit.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{benefit.description}</p>
                  </article>
                );
              })}
            </div>

            <div className="bg-muted/30 p-5 sm:p-6">
              <div className="text-lg font-semibold text-foreground">Incluido na rotina</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {checklist.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm leading-relaxed text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
