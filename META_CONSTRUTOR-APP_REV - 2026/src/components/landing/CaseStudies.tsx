import { ArrowRight, Building2, ClipboardCheck, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { usePricingNavigation } from "@/hooks/usePricingNavigation";

const cases = [
  {
    title: "Construtora residencial",
    context: "RDO manual, fotos espalhadas e cobranca recorrente por status da obra.",
    adjustment: "Registros diarios, documentos e pendencias foram reunidos por obra.",
    result: "A equipe passou a consultar uma fonte unica antes de tomar decisoes de campo.",
    icon: Building2,
  },
  {
    title: "Engenharia comercial",
    context: "Atividades dependiam de mensagens soltas entre escritorio, mestre de obras e cliente.",
    adjustment: "Checklists, responsaveis e prazos foram padronizados dentro da rotina.",
    result: "As reunioes ficaram mais objetivas, com pendencias visiveis e historico rastreavel.",
    icon: ClipboardCheck,
  },
  {
    title: "Obra industrial",
    context: "Documentos tecnicos e evidencias de execucao eram localizados com atraso.",
    adjustment: "Arquivos, fotos e RDOs passaram a ficar conectados ao andamento da obra.",
    result: "A gestao reduziu idas e voltas para validar informacoes basicas.",
    icon: FileText,
  },
];

const CaseStudies = () => {
  const navigate = useNavigate();
  const { navigateToFreePlan } = usePricingNavigation();

  return (
    <section className="bg-muted/30 px-2 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl md:mb-14">
          <h2 className="text-2xl font-semibold leading-tight text-foreground sm:text-3xl md:text-4xl">
            Como a plataforma entra na rotina da construtora
          </h2>
          <p className="mt-4 max-w-[64ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
            Tres cenarios comuns de obra mostram onde o Meta Construtor reduz ruido operacional e melhora rastreabilidade.
          </p>
        </div>

        <div className="grid bg-background p-2 lg:grid-cols-3">
          {cases.map((item) => {
            const Icon = item.icon;

            return (
              <article key={item.title} className="border-b border-border p-5 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0 sm:p-6">
                <div className="mb-5 flex h-11 w-8 items-center text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-semibold leading-snug text-foreground">{item.title}</h3>

                <div className="mt-5 space-y-4">
                  <div>
                    <div className="text-sm font-semibold text-foreground">Antes</div>
                    <p className="mt-1 max-w-[58ch] text-sm leading-relaxed text-muted-foreground">{item.context}</p>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">Ajuste</div>
                    <p className="mt-1 max-w-[58ch] text-sm leading-relaxed text-muted-foreground">{item.adjustment}</p>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">Depois</div>
                    <p className="mt-1 max-w-[58ch] text-sm leading-relaxed text-muted-foreground">{item.result}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Button
            size="lg"
            className="w-full bg-primary py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90 sm:w-auto"
            onClick={navigateToFreePlan}
          >
            Comecar gratuitamente
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full py-3 text-base font-semibold sm:w-auto"
            onClick={() => navigate("/contato")}
          >
            Falar com vendas
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CaseStudies;
