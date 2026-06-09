import { ArrowRight, ClipboardCheck, FileText, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";

const heroPoints = [
  { icon: FileText, label: "RDO digital" },
  { icon: ClipboardCheck, label: "Checklist de rotina" },
  { icon: ShieldCheck, label: "Historico auditavel" },
];

export function HeroSectionNew() {
  const navigate = useNavigate();

  return (
    <main className="relative min-h-[calc(100svh-1rem)] bg-[#0b1623] p-2 text-white">
      <div className="absolute inset-x-0 bottom-0 h-24 bg-[#0b1623]/40" />

      <div className="relative mx-auto grid min-h-[calc(100svh-1rem)] max-w-7xl items-center gap-10 px-4 pb-14 pt-28 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <section className="max-w-2xl">
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
            Meta Construtor organiza obra, RDO e documentos em uma rotina clara.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
            RDOs, checklists, documentos e responsabilidades ficam conectados por obra,
            sem depender de prints soltos ou promessas de automacao que ainda nao existem.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="h-12 px-6 py-3 text-base" onClick={() => navigate("/preco")}>
              Comecar pelo plano gratuito
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 border-white/20 bg-white/5 px-6 py-3 text-base text-white hover:bg-white/10"
              onClick={() => navigate("/contato")}
            >
              Falar com atendimento
            </Button>
          </div>
        </section>

        <section aria-label="Fluxo principal do produto" className="bg-[#101f31] p-5">
          <figure className="mb-5 overflow-hidden">
            <img
              src="/marketing/obras-reais/estrutura-metalica-aerea.jpg"
              alt="Vista aerea de estrutura metalica em obra, usada como exemplo de canteiro acompanhado por registros digitais"
              className="h-48 w-full object-cover sm:h-56"
              loading="eager"
              fetchPriority="high"
            />
          </figure>

          <div>
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-white/10 px-2 py-4">
              <div>
                <h2 className="mt-1 text-xl font-semibold">Registro, revisao e consulta</h2>
              </div>
              <Logo size="md" className="text-neutral-300 brightness-150" />
            </div>

            <div className="grid gap-3">
              {heroPoints.map((point, index) => {
                const Icon = point.icon;

                return (
                  <div key={point.label} className="flex items-center gap-3 border-t border-white/10 px-2 py-4 first:border-t-0">
                    <div className="flex h-10 w-10 items-center justify-center text-[#ff7a4f]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{point.label}</p>
                      <p className="text-xs text-slate-400">Etapa {index + 1} do fluxo operacional</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
