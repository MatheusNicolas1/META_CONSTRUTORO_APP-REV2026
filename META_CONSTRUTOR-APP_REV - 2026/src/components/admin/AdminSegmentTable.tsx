import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  getAdminSegmentAverage,
  getAdminSegmentBarWidth,
  getAdminSegmentShare,
  type AdminSegmentTableRow,
} from "./adminSegmentUtils";

type AdminSegmentTableProps = {
  rows: AdminSegmentTableRow[];
  emptyLabel?: string;
};

const formatNumber = (value: number) => new Intl.NumberFormat("pt-BR").format(value);
const formatDecimal = (value: number) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value);
const formatPercent = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 }).format(value);

const AdminSegmentTable = ({
  rows,
  emptyLabel = "Sem usuarios segmentados no recorte atual.",
}: AdminSegmentTableProps) => {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  const totalUsers = rows.reduce((sum, row) => sum + row.users, 0);
  const maxUsers = Math.max(...rows.map((row) => row.users), 1);

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Segmento</TableHead>
            <TableHead className="text-right">Usuarios</TableHead>
            <TableHead className="text-right">Eventos</TableHead>
            <TableHead className="text-right">Rotas</TableHead>
            <TableHead className="text-right">Interacoes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.key}>
              <TableCell>
                <div className="min-w-[220px] space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{row.label}</p>
                      <p className="truncate text-xs text-muted-foreground">{row.description}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatPercent(getAdminSegmentShare(row.users, totalUsers))}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${getAdminSegmentBarWidth(row.users, maxUsers)}%` }}
                    />
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right font-medium">{formatNumber(row.users)}</TableCell>
              <TableCell className="text-right">
                <p>{formatNumber(row.totalEvents)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDecimal(getAdminSegmentAverage(row.totalEvents, row.users))}/usuario
                </p>
              </TableCell>
              <TableCell className="text-right">
                <p>{formatNumber(row.routeViews)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDecimal(getAdminSegmentAverage(row.routeViews, row.users))}/usuario
                </p>
              </TableCell>
              <TableCell className="text-right">
                <p>{formatNumber(row.interactions)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDecimal(getAdminSegmentAverage(row.interactions, row.users))}/usuario
                </p>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminSegmentTable;
