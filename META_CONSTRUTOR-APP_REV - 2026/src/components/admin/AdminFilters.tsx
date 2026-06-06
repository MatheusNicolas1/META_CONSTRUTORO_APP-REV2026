/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { Filter, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type AdminPeriod = "7d" | "30d" | "90d" | "all";

export type AdminFiltersState = {
  period: AdminPeriod;
  plan: string;
  role: string;
  campaign: string;
  source: string;
  route: string;
  org: string;
};

type AdminFiltersContextValue = {
  filters: AdminFiltersState;
  setFilter: <K extends keyof AdminFiltersState>(key: K, value: AdminFiltersState[K]) => void;
  resetFilters: () => void;
  sinceDate: string | null;
};

const defaultFilters: AdminFiltersState = {
  period: "30d",
  plan: "",
  role: "",
  campaign: "",
  source: "",
  route: "",
  org: "",
};

const AdminFiltersContext = createContext<AdminFiltersContextValue | null>(null);

const periodOptions: Array<{ value: AdminPeriod; label: string }> = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
  { value: "all", label: "Todo periodo" },
];

const periodToDays: Record<Exclude<AdminPeriod, "all">, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

const normalize = (value: unknown) => String(value || "").trim().toLowerCase();

export const getAdminSinceDate = (period: AdminPeriod) => {
  if (period === "all") return null;
  const date = new Date();
  date.setDate(date.getDate() - periodToDays[period]);
  return date.toISOString();
};

export const matchesAdminTextFilter = (value: unknown, filter: string) => {
  const normalizedFilter = normalize(filter);
  if (!normalizedFilter) return true;
  return normalize(value).includes(normalizedFilter);
};

export const matchesAdminArrayFilter = (value: unknown, filter: string) => {
  const normalizedFilter = normalize(filter);
  if (!normalizedFilter) return true;
  if (Array.isArray(value)) {
    return value.some((item) => normalize(item).includes(normalizedFilter));
  }
  return normalize(value).includes(normalizedFilter);
};

export const AdminFiltersProvider = ({ children }: { children: ReactNode }) => {
  const [filters, setFilters] = useState<AdminFiltersState>(defaultFilters);
  const sinceDate = useMemo(() => getAdminSinceDate(filters.period), [filters.period]);

  const value = useMemo<AdminFiltersContextValue>(
    () => ({
      filters,
      sinceDate,
      setFilter: (key, nextValue) => {
        setFilters((current) => ({ ...current, [key]: nextValue }));
      },
      resetFilters: () => setFilters(defaultFilters),
    }),
    [filters, sinceDate]
  );

  return <AdminFiltersContext.Provider value={value}>{children}</AdminFiltersContext.Provider>;
};

export const useAdminFilters = () => {
  const context = useContext(AdminFiltersContext);
  if (!context) {
    throw new Error("useAdminFilters must be used inside AdminFiltersProvider");
  }
  return context;
};

const FilterInput = ({
  id,
  label,
  value,
  placeholder,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) => (
  <div className="min-w-0 space-y-1.5">
    <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
      {label}
    </Label>
    <Input
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-9 text-sm"
    />
  </div>
);

export const AdminFiltersBar = () => {
  const { filters, setFilter, resetFilters } = useAdminFilters();

  return (
    <Card className="border-dashed">
      <CardContent className="p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Filter className="h-4 w-4 text-primary" />
            Filtros globais
          </div>
          <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Limpar
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <div className="min-w-0 space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Periodo</Label>
            <Select value={filters.period} onValueChange={(value) => setFilter("period", value as AdminPeriod)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Periodo" />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <FilterInput id="admin-filter-plan" label="Plano" value={filters.plan} placeholder="basic, pro..." onChange={(value) => setFilter("plan", value)} />
          <FilterInput id="admin-filter-role" label="Role" value={filters.role} placeholder="admin, member..." onChange={(value) => setFilter("role", value)} />
          <FilterInput id="admin-filter-campaign" label="Campanha" value={filters.campaign} placeholder="utm_campaign" onChange={(value) => setFilter("campaign", value)} />
          <FilterInput id="admin-filter-source" label="Origem" value={filters.source} placeholder="google, meta..." onChange={(value) => setFilter("source", value)} />
          <FilterInput id="admin-filter-route" label="Rota" value={filters.route} placeholder="/app/..." onChange={(value) => setFilter("route", value)} />
          <FilterInput id="admin-filter-org" label="Org" value={filters.org} placeholder="nome, slug ou id" onChange={(value) => setFilter("org", value)} />
        </div>
      </CardContent>
    </Card>
  );
};
