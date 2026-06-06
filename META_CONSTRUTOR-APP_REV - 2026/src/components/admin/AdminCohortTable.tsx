import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAdminCohortRate, type AdminCohortTableRow } from "./adminCohortUtils";

type AdminCohortTableProps = {
  rows: AdminCohortTableRow[];
  emptyLabel?: string;
};

const formatNumber = (value: number) => new Intl.NumberFormat("pt-BR").format(value);
const formatPercent = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 }).format(value);

const AdminCohortTable = ({
  rows,
  emptyLabel = "Sem cohort de usuarios no recorte atual.",
}: AdminCohortTableProps) => {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cohort</TableHead>
            <TableHead className="text-right">Usuarios</TableHead>
            <TableHead className="text-right">D1</TableHead>
            <TableHead className="text-right">D7</TableHead>
            <TableHead className="text-right">D30</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.key}>
              <TableCell>
                <div className="min-w-[180px]">
                  <p className="truncate font-medium">{row.label}</p>
                  <p className="text-xs text-muted-foreground">Agrupado por plano</p>
                </div>
              </TableCell>
              <TableCell className="text-right font-medium">{formatNumber(row.users)}</TableCell>
              <TableCell className="text-right">
                <p>{formatPercent(getAdminCohortRate(row.retainedD1, row.users))}</p>
                <p className="text-xs text-muted-foreground">{formatNumber(row.retainedD1)} retidos</p>
              </TableCell>
              <TableCell className="text-right">
                <p>{formatPercent(getAdminCohortRate(row.retainedD7, row.users))}</p>
                <p className="text-xs text-muted-foreground">{formatNumber(row.retainedD7)} retidos</p>
              </TableCell>
              <TableCell className="text-right">
                <p>{formatPercent(getAdminCohortRate(row.retainedD30, row.users))}</p>
                <p className="text-xs text-muted-foreground">{formatNumber(row.retainedD30)} retidos</p>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminCohortTable;
