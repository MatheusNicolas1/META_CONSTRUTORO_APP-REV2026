import { AlertCircle, ArrowDown, ArrowUp, Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AdminMetricCardDelta {
  value: number;
  label: string;
}

interface AdminMetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  source?: string;
  icon: LucideIcon;
  tone?: "blue" | "green" | "purple" | "amber" | "red";
  delta?: AdminMetricCardDelta;
  error?: string | null;
  loading?: boolean;
  period?: string;
}

const toneClass = {
  blue: "text-blue-500 bg-blue-500/10",
  green: "text-green-500 bg-green-500/10",
  purple: "text-purple-500 bg-purple-500/10",
  amber: "text-amber-500 bg-amber-500/10",
  red: "text-red-500 bg-red-500/10",
};

const AdminMetricCard = ({
  title,
  value,
  description,
  source,
  icon: Icon,
  tone = "blue",
  delta,
  error,
  loading,
  period,
}: AdminMetricCardProps) => {
  return (
    <Card className={error ? "border-red-400/60" : undefined}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <span className={`rounded-md p-2 ${toneClass[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Carregando...</span>
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {delta && (
              <div
                className={`mt-1 flex items-center gap-1 text-xs font-medium ${
                  delta.value >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {delta.value >= 0 ? (
                  <ArrowUp className="h-3 w-3" />
                ) : (
                  <ArrowDown className="h-3 w-3" />
                )}
                <span>
                  {Math.abs(delta.value).toFixed(1)}% {delta.label}
                </span>
              </div>
            )}
            {description && (
              <p className="mt-1 text-xs text-muted-foreground">{description}</p>
            )}
            {(source || period) && (
              <p className="mt-2 text-[11px] uppercase tracking-normal text-muted-foreground">
                {source && <span>Fonte: {source}</span>}
                {source && period && <span>{" · "}</span>}
                {period && <span>{period}</span>}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminMetricCard;
