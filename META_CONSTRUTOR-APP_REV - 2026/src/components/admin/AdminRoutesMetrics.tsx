import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Route, Users, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import AdminMetricCard from "./AdminMetricCard";
import { matchesAdminTextFilter, useAdminFilters } from "./AdminFilters";
import AdminRouteConversionTable from "./AdminRouteConversionTable";
import type { AdminRouteConversionRow } from "./adminRouteConversionUtils";

const formatDate = (value?: string | null) => {
  if (!value) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
};

type RouteFilterMode = "all" | "public" | "authenticated";

const PUBLIC_ROUTE_PREFIXES = [
  "/home",
  "/preco",
  "/checkout",
  "/criar-conta",
  "/contato",
  "/sobre",
  "/blog",
  "/central-ajuda",
  "/documentacao",
];

const isPublicRoute = (route: string): boolean =>
  PUBLIC_ROUTE_PREFIXES.some((prefix) => route.startsWith(prefix) || route === prefix);

const isAuthenticatedRoute = (route: string): boolean =>
  route.startsWith("/app");

const classifyRoute = (route: string): "public" | "authenticated" | "other" => {
  if (isPublicRoute(route)) return "public";
  if (isAuthenticatedRoute(route)) return "authenticated";
  return "other";
};

const filterModeLabels: Record<RouteFilterMode, string> = {
  all: "Todas",
  public: "Públicas",
  authenticated: "Autenticadas",
};

const AdminRoutesMetrics = () => {
  const { filters, sinceDate } = useAdminFilters();
  const [routeFilterMode, setRouteFilterMode] = useState<RouteFilterMode>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-routes-metrics", filters.period],
    queryFn: async () => {
      let query = supabase
        .from("admin_route_metrics_view")
        .select("event_date, route, total_views, unique_users, first_seen_at, last_seen_at")
        .order("event_date", { ascending: false })
        .limit(500);

      if (sinceDate) {
        query = query.gte("event_date", sinceDate.slice(0, 10));
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
  });

  const { data: routeErrors } = useQuery({
    queryKey: ["admin-routes-errors", filters.period],
    queryFn: async () => {
      let query = supabase
        .from("analytics_events")
        .select("route, id", { count: "exact", head: false })
        .or("success.eq.false,error.not.isnull")
        .not("route", "is", null);

      if (sinceDate) {
        query = query.gte("created_at", sinceDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group errors by route client-side
      const errorMap = new Map<string, number>();
      (data || []).forEach((item) => {
        const route = item.route || "unknown";
        errorMap.set(route, (errorMap.get(route) || 0) + 1);
      });

      return errorMap;
    },
  });

  const routes = useMemo(() => {
    const byRoute = new Map<string, AdminRouteConversionRow>();

    (data || [])
      .filter((item) => matchesAdminTextFilter(item.route, filters.route))
      .forEach((item) => {
        const key = item.route || "unknown";
        const current = byRoute.get(key) || { route: key, views: 0, users: 0, lastSeen: null };
        current.views += Number(item.total_views || 0);
        current.users += Number(item.unique_users || 0);
        if (!current.lastSeen || (item.last_seen_at && item.last_seen_at > current.lastSeen)) {
          current.lastSeen = item.last_seen_at;
        }
        byRoute.set(key, current);
      });

    let arr = Array.from(byRoute.values());

    // Apply route type filter
    if (routeFilterMode === "public") {
      arr = arr.filter((r) => isPublicRoute(r.route));
    } else if (routeFilterMode === "authenticated") {
      arr = arr.filter((r) => isAuthenticatedRoute(r.route));
    }

    return arr.sort((a, b) => b.views - a.views);
  }, [data, filters.route, routeFilterMode]);

  const enrichedRoutes = useMemo(() => {
    return routes.map((route) => ({
      ...route,
      errors: routeErrors?.get(route.route) || 0,
    }));
  }, [routes, routeErrors]);

  if (isLoading) {
    return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  }

  const totalViews = routes.reduce((sum, item) => sum + item.views, 0);
  const totalUsers = routes.reduce((sum, item) => sum + item.users, 0);
  const totalErrors = Array.from(routeErrors?.values() || []).reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Rotas e navegacao</h2>
        <p className="text-sm text-muted-foreground">
          Rotas consolidadas por `admin_route_metrics_view` com separacao entre publicas e autenticadas.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "public", "authenticated"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setRouteFilterMode(mode)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              routeFilterMode === mode
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {filterModeLabels[mode]}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <AdminMetricCard
          title="Rotas distintas"
          value={routes.length}
          icon={Route}
          source="admin_route_metrics_view"
        />
        <AdminMetricCard
          title="Visualizacoes"
          value={totalViews.toLocaleString("pt-BR")}
          icon={Route}
          tone="purple"
          source="admin_route_metrics_view"
        />
        <AdminMetricCard
          title="Usuarios por rota"
          value={totalUsers.toLocaleString("pt-BR")}
          icon={Users}
          tone="green"
          source="admin_route_metrics_view"
        />
        <AdminMetricCard
          title="Erros em rotas"
          value={totalErrors.toLocaleString("pt-BR")}
          icon={AlertTriangle}
          tone={totalErrors > 0 ? "amber" : "green"}
          source="analytics_events"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {routeFilterMode === "public" ? "Rotas públicas mais acessadas"
              : routeFilterMode === "authenticated" ? "Rotas autenticadas mais acessadas"
              : "Rotas mais acessadas"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {enrichedRoutes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {routeFilterMode === "public"
                ? "Nenhuma rota pública encontrada no período."
                : routeFilterMode === "authenticated"
                  ? "Nenhuma rota autenticada encontrada no período."
                  : "Nenhuma rota encontrada no período."}
            </p>
          ) : (
            <AdminRouteConversionTable
              rows={enrichedRoutes.slice(0, 12)}
              formatDate={formatDate}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRoutesMetrics;
