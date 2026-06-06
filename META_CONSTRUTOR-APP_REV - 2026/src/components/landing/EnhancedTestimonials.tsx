import { CheckCircle2, MessageSquareText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePricingNavigation } from "@/hooks/usePricingNavigation";

const proofPoints = [
  {
    icon: CheckCircle2,
    title: "Adocao por rotina simples",
    text: "A equipe comeca pelo registro diario, depois conecta documentos, checklists e relatorios.",
  },
  {
    icon: MessageSquareText,
    title: "Menos dependencia de conversas soltas",
    text: "Pendencias e evidencias deixam de ficar dispersas em grupos e passam a ter contexto de obra.",
  },
  {
    icon: ShieldCheck,
    title: "Base preparada para auditoria",
    text: "Historico, responsaveis e anexos ficam organizados para consulta posterior.",
  },
];

const EnhancedTestimonials = () => {
  const { navigateToFreePlan } = usePricingNavigation();

  return (
    <section className="bg-[#f8f6f2] px-2 py-16 md:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
        <div>
          <h2 className="text-2xl font-semibold leading-tight text-foreground sm:text-3xl md:text-4xl">
            Prova operacional sem promessas infladas
          </h2>
          <p className="mt-4 max-w-[62ch] text-base leading-8 text-muted-foreground">
            A home passa a explicar onde a plataforma cria valor no dia a dia da construtora,
            sem depender de depoimentos ficticios ou metricas sem fonte publica.
          </p>
          <Button
            size="lg"
            className="mt-8 w-full bg-primary py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90 sm:w-auto"
            onClick={navigateToFreePlan}
          >
            Comecar pelo plano gratuito
          </Button>
        </div>

        <div className="grid bg-background p-2 sm:grid-cols-3">
          {proofPoints.map((point) => {
            const Icon = point.icon;

            return (
              <article key={point.title} className="border-b border-[#ded4ca] p-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
                <div className="mb-4 flex h-10 w-8 items-center text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="text-base font-semibold leading-snug text-foreground">{point.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{point.text}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default EnhancedTestimonials;
