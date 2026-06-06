import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle, Clock, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import AdminMetricCard from "./AdminMetricCard";
import { matchesAdminArrayFilter, matchesAdminTextFilter, useAdminFilters } from "./AdminFilters";
import AdminRiskList from "./AdminRiskList";
import { getAdminRiskPriority, type AdminRiskListItem } from "./adminRiskUtils";
import AdminSegmentTable from "./AdminSegmentTable";
import type { AdminSegmentTableRow } from "./adminSegmentUtils";
import AdminCohortTable from "./AdminCohortTable";
import { buildAdminPlanCohortRows } from "./adminCohortUtils";

const formatDate = (value?: string | null) => {
  if (!value) return "sem uso";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
};

const segmentLabels: Record<string, Pick<AdminSegmentTableRow, "label" | "description">> = {
  active_7d: { label: "Ativos 7 dias", description: "Usuarios com uso recente e maior propensao de retencao" },
  active_30d: { label: "Ativos 30 dias", description: "Usuarios com atividade no ciclo mensal" },
  inactive: { label: "Inativos", description: "Usuarios sem evento nos ultimos 30 dias" },
  no_activity: { label: "Sem atividade", description: "Cadastros sem atividade registrada" },
};

const AdminRetentionMetrics = () => {
  const { filters } = useAdminFilters();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-retention-metrics"],
    queryFn: async () => {
      const [segmentsRes, riskRes, membersRes] = await Promise.all([
        supabase
          .from("admin_user_segments_view")
          .select("user_id, plan_type, roles, activity_segment, first_event_at, last_event_at, total_events, route_views, interactions")
          .limit(500),
        supabase
          .from("admin_churn_risk_view")
          .select("user_id, plan_type, roles, activity_segment, last_event_at, total_events, risk_level")
          .order("risk_level", { ascending: true })
          .limit(100),
        supabase
          .from("org_members")
          .select("user_id, org_id, role, status, orgs(name, slug)")
          .limit(3000),
      ]);

      if (segmentsRes.error) throw segmentsRes.error;
      if (riskRes.error) throw riskRes.error;
      if (membersRes.error) throw membersRes.error;

      const orgByUser = new Map<string, string>();
      (membersRes.data || []).forEach((member: any) => {
        if (!member.user_id || orgByUser.has(member.user_id)) return;
        const org = Array.isArray(member.orgs) ? member.orgs[0] : member.orgs;
        orgByUser.set(member.user_id, org?.name || org?.slug || member.org_id || "Org sem nome");
      });

      const risk = (riskRes.data || [])
        .map((item: any): AdminRiskListItem => ({
          user_id: item.user_id,
          org_label: item.user_id ? orgByUser.get(item.user_id) : null,
          plan_type: item.plan_type,
          roles: item.roles,
          activity_segment: item.activity_segment,
          risk_level: item.risk_level,
          last_event_at: item.last_event_at,
          total_events: item.total_events,
        }))
        .sort((a, b) => getAdminRiskPriority(a.risk_level) - getAdminRiskPriority(b.risk_level));

      return {
        segments: segmentsRes.data || [],
        risk,
      };
    },
  });

  const summary = useMemo(() => {
    const counts = { active_7d: 0, active_30d: 0, inactive: 0, no_activity: 0 };
    const segmentRows = new Map<string, AdminSegmentTableRow>();
    const filtered = (data?.segments || []).filter(
      (item) =>
        matchesAdminTextFilter(item.plan_type, filters.plan) &&
        matchesAdminArrayFilter(item.roles, filters.role)
    );

    filtered.forEach((item) => {
      const key = (item.activity_segment || "no_activity") as keyof typeof counts;
      counts[key] = (counts[key] || 0) + 1;
      const labels = segmentLabels[key] || { label: key, description: "Segmento calculado por atividade" };
      const current = segmentRows.get(key) || {
        key,
        label: labels.label,
        description: labels.description,
        users: 0,
        totalEvents: 0,
        routeViews: 0,
        interactions: 0,
      };
      current.users += 1;
      current.totalEvents += Number(item.total_events || 0);
      current.routeViews += Number(item.route_views || 0);
      current.interactions += Number(item.interactions || 0);
      segmentRows.set(key, current);
    });
    const risk = (data?.risk || [])
      .filter(
        (item) =>
          matchesAdminTextFilter(item.plan_type, filters.plan) &&
          matchesAdminArrayFilter(item.roles, filters.role)
      )
      .slice(0, 8);
    return {
      counts,
      risk,
      cohortRows: buildAdminPlanCohortRows(filtered),
      segmentRows: Array.from(segmentRows.values()).sort((a, b) => b.users - a.users),
    };
  }, [data, filters.plan, filters.role]);

  if (isLoading) {
    return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Retencao e risco</h2>
        <p className="text-sm text-muted-foreground">
          Segmentos calculados por ultima atividade, sem expor dados pessoais nos eventos.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <AdminMetricCard title="Ativos 7 dias" value={summary.counts.active_7d} icon={Activity} tone="green" source="admin_user_segments_view" />
        <AdminMetricCard title="Ativos 30 dias" value={summary.counts.active_30d} icon={Clock} source="admin_user_segments_view" />
        <AdminMetricCard title="Inativos" value={summary.counts.inactive} icon={AlertTriangle} tone="amber" source="admin_user_segments_view" />
        <AdminMetricCard title="Sem atividade" value={summary.counts.no_activity} icon={Users} tone="red" source="admin_user_segments_view" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tabela de segmentos</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminSegmentTable rows={summary.segmentRows} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cohorts por plano</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminCohortTable rows={summary.cohortRows} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios em risco</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminRiskList items={summary.risk} formatDate={formatDate} />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRetentionMetrics;
