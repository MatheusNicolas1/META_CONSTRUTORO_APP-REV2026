import { Badge } from "@/components/ui/badge";
import {
  getAdminRiskLabel,
  getAdminRiskReason,
  getAdminRiskSuggestedAction,
  getAdminRiskTone,
  type AdminRiskListItem,
} from "./adminRiskUtils";

type AdminRiskListProps = {
  items: AdminRiskListItem[];
  formatDate: (value?: string | null) => string;
  emptyLabel?: string;
};

const AdminRiskList = ({
  items,
  formatDate,
  emptyLabel = "Nenhum usuario em risco no recorte atual.",
}: AdminRiskListProps) => {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="divide-y rounded-md border">
      {items.map((item) => (
        <div key={item.user_id || `${item.org_label}-${item.last_event_at}`} className="grid gap-3 p-3 text-sm lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <p className="truncate font-medium">{item.user_id || "usuario sem id"}</p>
            <p className="truncate text-xs text-muted-foreground">{item.org_label || "Sem org vinculada"}</p>
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs text-muted-foreground">Plano {item.plan_type || "nao informado"}</p>
            <p className="truncate text-xs text-muted-foreground">{formatDate(item.last_event_at)}</p>
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{getAdminRiskReason(item)}</p>
            <p className="truncate text-xs text-muted-foreground">{getAdminRiskSuggestedAction(item)}</p>
          </div>
          <div className="flex items-center justify-between gap-3 lg:justify-end">
            <p className="text-xs text-muted-foreground">
              {Number(item.total_events || 0).toLocaleString("pt-BR")} eventos
            </p>
            <Badge variant={getAdminRiskTone(item.risk_level) as any}>
              {getAdminRiskLabel(item.risk_level)}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminRiskList;
