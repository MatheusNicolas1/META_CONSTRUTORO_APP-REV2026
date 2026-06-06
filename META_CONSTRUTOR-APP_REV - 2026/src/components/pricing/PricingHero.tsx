import React from "react";
import { CheckCircle2 } from "lucide-react";

const points = ["Sem fidelidade", "Plano gratuito", "Evolucao por necessidade"];

export function PricingHero() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-[#fbfaf7] px-2 pb-12 pt-24 md:pb-20 md:pt-32">
      <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="text-xs font-semibold uppercase leading-none text-primary">
            Precos
          </div>

          <h1 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl md:text-5xl lg:text-6xl">
            Planos simples para grandes obras.
          </h1>

          <p className="mx-auto max-w-[64ch] text-base leading-8 text-muted-foreground sm:text-lg">
            Comece pelo plano gratuito, valide a rotina da equipe e evolua quando a obra exigir
            mais controle.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 pt-4 sm:gap-x-8">
            {points.map((point) => (
              <div key={point} className="flex items-center gap-2 text-xs font-medium uppercase leading-none text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
