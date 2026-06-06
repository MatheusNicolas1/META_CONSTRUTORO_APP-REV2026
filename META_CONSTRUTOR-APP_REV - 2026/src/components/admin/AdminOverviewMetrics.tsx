import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, MousePointerClick, Route, UserPlus, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import AdminMetricCard from "./AdminMetricCard";
import { matchesAdminArrayFilter, matchesAdminTextFilter, useAdminFilters } from "./AdminFilters";
import AdminFunnel from "./AdminFunnel";

const formatNumber = (value: number) => new Intl.NumberFormat("pt-BR").format(value);

const AdminOverviewMetrics = () => {
  const { filters, sinceDate } = useAdminFilters();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview-metrics", filters.period],
    queryFn: async () => {
      let funnelQuery = supabase
        .from("admin_funnel_daily_view")
        .select("event_date, route_views, active_users, signups, checkout_events, subscription_events, interactions")
        .order("event_date", { ascending: false })
        .limit(90);

      if (sinceDate) {
        funnelQuery = funnelQuery.gte("event_date", sinceDate.slice(0, 10));
      }

      const [funnelRes, segmentsRes, routesRes] = await Promise.all([
        funnelQuery,
        supabase
          .from("admin_user_segments_view")
          .select("activity_segment, plan_type, roles, total_events, route_views, interactions"),
        supabase
          .from("admin_route_metrics_view")
          .select("route, total_views, unique_users")
          .order("event_date", { ascending: false })
          .limit(500),
      ]);

      if (funnelRes.error) throw funnelRes.error;
      if (segmentsRes.error) throw segmentsRes.error;
      if (routesRes.error) throw routesRes.error;

      return {
        funnel: funnelRes.data || [],
        segments: segmentsRes.data || [],
        routes: routesRes.data || [],
      };
    },
  });

  const metrics = useMemo(() => {
    const funnel = data?.funnel || [];
    const segments = (data?.segments || []).filter(
      (item) =>
        matchesAdminTextFilter(item.plan_type, filters.plan) &&
        matchesAdminArrayFilter(item.roles, filters.role)
    );
    const routes = (data?.routes || []).filter((item) => matchesAdminTextFilter(item.route, filters.route));

    const totals = funnel.reduce(
      (acc, day) => ({
        routeViews: acc.routeViews + Number(day.route_views || 0),
        activeUsers: Math.max(acc.activeUsers, Number(day.active_users || 0)),
        signups: acc.signups + Number(day.signups || 0),
        checkout: acc.checkout + Number(day.checkout_events || 0),
        subscriptions: acc.subscriptions + Number(day.subscription_events || 0),
        interactions: acc.interactions + Number(day.interactions || 0),
      }),
      { routeViews: 0, activeUsers: 0, signups: 0, checkout: 0, subscriptions: 0, interactions: 0 }
    );

    const totalUsers = segments.length;
    const active7d = segments.filter((item) => item.activity_segment === "active_7d").length;
    const totalRoutes = new Set(routes.map((item) => item.route).filter(Boolean)).size;

    return {
      ...totals,
      totalUsers,
      active7d,
      totalRoutes,
    };
  }, [data, filters.plan, filters.role, filters.route]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  const funnelSteps = [
    { label: "Rotas vistas", value: metrics.routeViews, source: "admin_funnel_daily_view.route_views" },
    { label: "Usuarios ativos", value: metrics.activeUsers, source: "admin_funnel_daily_view.active_users" },
    { label: "Cadastros", value: metrics.signups, source: "admin_funnel_daily_view.signups" },
    { label: "Checkout", value: metrics.checkout, source: "admin_funnel_daily_view.checkout_events" },
    { label: "Assinaturas", value: metrics.subscriptions, source: "admin_funnel_daily_view.subscription_events" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Visao geral de usuarios e uso</h2>
        <p className="text-sm text-muted-foreground">
          Leitura consolidada das novas views administrativas, focada em uso do app e funil.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <AdminMetricCard title="Usuarios monitorados" value={formatNumber(metrics.totalUsers)} icon={Users} source="admin_user_segments_view" />
        <AdminMetricCard title="Ativos 7 dias" value={formatNumber(metrics.active7d)} icon={Activity} tone="green" source="admin_user_segments_view" />
        <AdminMetricCard title="Rotas vistas" value={formatNumber(metrics.routeViews)} icon={Route} tone="purple" source="admin_funnel_daily_view" />
        <AdminMetricCard title="Interacoes" value={formatNumber(metrics.interactions)} icon={MousePointerClick} tone="amber" source="admin_funnel_daily_view" />
        <AdminMetricCard title="Cadastros capturados" value={formatNumber(metrics.signups)} icon={UserPlus} tone="blue" source="admin_funnel_daily_view" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Funil principal</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminFunnel steps={funnelSteps} formatValue={formatNumber} />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOverviewMetrics;
