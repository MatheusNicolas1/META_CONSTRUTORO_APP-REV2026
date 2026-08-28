import { useInView, useMotionValue, useMotionValueEvent, useSpring } from "framer-motion";
import { type ComponentPropsWithoutRef, useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

/**
 * NumberTicker — anima um número contando de 0 (ou do alvo) até o valor final.
 * Adaptado do componente "Number Ticker" (Magic UI / Dillion Verma) do 21st.dev
 * (https://21st.dev/@dillionverma/components/number-ticker) para o design system
 * do projeto: usa os tokens shadcn/ui (text-foreground) e locale pt-BR por padrão.
 *
 * Uso:
 *   <NumberTicker value={resumo.total_rdos} />
 *   <NumberTicker value={5.67} decimalPlaces={2} />
 */
interface NumberTickerProps extends ComponentPropsWithoutRef<"span"> {
  /** Valor final exibido ao fim da animação. */
  value: number;
  /** Sentido da contagem: "up" (0 → value) ou "down" (value → 0). */
  direction?: "up" | "down";
  /** Atraso antes de iniciar a animação, em segundos. */
  delay?: number;
  /** Casas decimais exibidas. */
  decimalPlaces?: number;
  /** Locale usado na formatação do número (padrão pt-BR). */
  locale?: string;
}

export function NumberTicker({
  value,
  direction = "up",
  delay = 0,
  className,
  decimalPlaces = 0,
  locale = "pt-BR",
  ...props
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(direction === "down" ? value : 0);
  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 100,
  });
  const isInView = useInView(ref, { once: true, margin: "0px" });

  useEffect(() => {
    if (isInView) {
      const timeoutId = setTimeout(() => {
        motionValue.set(direction === "down" ? 0 : value);
      }, delay * 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [motionValue, isInView, delay, value, direction]);

  useMotionValueEvent(springValue, "change", (latest) => {
    if (ref.current) {
      ref.current.textContent = Intl.NumberFormat(locale, {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      }).format(Number(latest.toFixed(decimalPlaces)));
    }
  });

  return (
    <span
      ref={ref}
      className={cn("inline-block tabular-nums text-foreground", className)}
      {...props}
    />
  );
}
