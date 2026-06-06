import {
  getAdminRouteBarWidth,
  getAdminRouteShare,
  getAdminRouteViewsPerUser,
  type AdminRouteConversionRow,
} from "./adminRouteConversionUtils";

type AdminRouteConversionTableProps = {
  rows: AdminRouteConversionRow[];
  formatDate: (value?: string | null) => string;
  emptyLabel?: string;
};

const formatNumber = (value: number) => new Intl.NumberFormat("pt-BR").format(value);
const formatDecimal = (value: number) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value);
const formatPercent = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 }).format(value);

const AdminRouteConversionTable = ({
  rows,
  formatDate,
  emptyLabel = "Sem rotas capturadas ainda.",
}: AdminRouteConversionTableProps) => {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  const totalViews = rows.reduce((sum, row) => sum + row.views, 0);
  const maxViews = Math.max(...rows.map((row) => row.views), 1);

  return (
    <div className="divide-y rounded-md border">
      {rows.map((row) => (
        <div key={row.route} className="grid gap-3 p-3 text-sm lg:grid-cols-[minmax(0,1.6fr)_110px_110px_120px] lg:items-center">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="truncate font-medium" title={row.route}>{row.route}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{formatPercent(getAdminRouteShare(row.views, totalViews))}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-primary" style={{ width: `${getAdminRouteBarWidth(row.views, maxViews)}%` }} />
            </div>
          </div>
          <div>
            <p className="font-medium">{formatNumber(row.views)}</p>
            <p className="text-xs text-muted-foreground">views</p>
          </div>
          <div>
            <p className="font-medium">{formatNumber(row.users)}</p>
            <p className="text-xs text-muted-foreground">{formatDecimal(getAdminRouteViewsPerUser(row.views, row.users))} views/usuario</p>
          </div>
          <div>
            <p className="font-medium">{formatDate(row.lastSeen)}</p>
            <p className="text-xs text-muted-foreground">ultimo evento</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminRouteConversionTable;
