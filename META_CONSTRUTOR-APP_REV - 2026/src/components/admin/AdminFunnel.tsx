import {
  getAdminFunnelConversion,
  getAdminFunnelMaxValue,
  getAdminFunnelWidth,
  type AdminFunnelStep,
} from "./adminFunnelUtils";

type AdminFunnelProps = {
  steps: AdminFunnelStep[];
  formatValue?: (value: number) => string;
  emptyLabel?: string;
};

const defaultFormatValue = (value: number) => new Intl.NumberFormat("pt-BR").format(value);
const formatPercent = (value: number | null) =>
  value === null ? "n/d" : new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 }).format(value);

const AdminFunnel = ({
  steps,
  formatValue = defaultFormatValue,
  emptyLabel = "Sem eventos de funil no recorte atual.",
}: AdminFunnelProps) => {
  const maxStep = getAdminFunnelMaxValue(steps);
  const hasData = steps.some((step) => Number(step.value || 0) > 0);

  if (!hasData) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const previous = index > 0 ? steps[index - 1] : null;
        const conversion = previous ? getAdminFunnelConversion(step.value, previous.value) : null;

        return (
          <div key={step.label} className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0">
                <span className="font-medium">{step.label}</span>
                {step.source && <p className="truncate text-xs text-muted-foreground">{step.source}</p>}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-muted-foreground">{formatValue(step.value)}</p>
                {previous && <p className="text-xs text-muted-foreground">{formatPercent(conversion)} da etapa anterior</p>}
              </div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${getAdminFunnelWidth(step.value, maxStep)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AdminFunnel;
