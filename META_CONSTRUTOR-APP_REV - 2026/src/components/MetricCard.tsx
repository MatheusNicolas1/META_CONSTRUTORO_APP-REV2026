import { memo } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type MetricTone =
  | "primary"
  | "emerald"
  | "sky"
  | "amber"
  | "purple"
  | "red"
  | "blue"
  | null;

const toneClasses: Record<NonNullable<MetricTone>, string> = {
  primary: "bg-primary/10 text-primary",
  emerald: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  sky: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  amber: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  purple: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
  red: "bg-red-500/10 text-red-700 dark:text-red-300",
  blue: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
};

interface MetricCardProps {
  title: string;
  value: string;
  description?: string;
  icon: LucideIcon;
  tone?: MetricTone;
}

/**
 * Card de métrica unificado (Dashboard, Despesas, RDO, ...).
 * Padrão: ícone colorido à esquerda + título + valor + descrição opcional.
 * Microinterações: hover translate-y sutil + shadow.
 */
const MetricCard = memo(
  ({ title, value, description, icon: Icon, tone = "primary" }: MetricCardProps) => (
    <div className="flex items-center gap-4 rounded-2xl border border-border/70 bg-card px-4 py-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:bg-muted/35">
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
          toneClasses[tone]
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-muted-foreground">{title}</p>
        <p className="mt-1 text-2xl font-bold leading-none text-foreground">{value}</p>
        {description ? (
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </div>
  )
);

MetricCard.displayName = "MetricCard";

export default MetricCard;
