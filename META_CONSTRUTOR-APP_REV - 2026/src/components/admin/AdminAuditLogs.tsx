import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import AdminMetricCard from "./AdminMetricCard";
import { useAdminFilters } from "./AdminFilters";

const AdminAuditLogs = () => {
  const { filters, sinceDate } = useAdminFilters();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-audit-logs", filters.period],
    queryFn: async () => {
      let query = supabase
        .from("admin_audit_logs")
        .select("id, action, admin_id, target_user_id, details, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

      if (sinceDate) {
        query = query.gte("created_at", sinceDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
  });

  const { data: topAdmins, isLoading: loadingAdmins } = useQuery({
    queryKey: ["admin-audit-logs-top-admins", filters.period],
    queryFn: async () => {
      let query = supabase
        .from("admin_audit_logs")
        .select("admin_id, count:admin_id.count()")
        .order("count", { ascending: false })
        .limit(10);

      if (sinceDate) {
        query = query.gte("created_at", sinceDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  }

  const last24h = (data || []).filter((log) => {
    return new Date(log.created_at).getTime() >= Date.now() - 24 * 60 * 60 * 1000;
  }).length;

  const distinctAdminIds = new Set((data || []).map((log) => log.admin_id));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Auditoria</h2>
        <p className="text-sm text-muted-foreground">Acoes administrativas registradas em `admin_audit_logs`.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <AdminMetricCard title="Eventos recentes" value={(data || []).length} icon={ShieldCheck} source="admin_audit_logs" />
        <AdminMetricCard title="Ultimas 24h" value={last24h} icon={ShieldCheck} tone="green" source="admin_audit_logs" />
        <AdminMetricCard title="Admins ativos" value={distinctAdminIds.size} icon={Users} source="admin_audit_logs" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ultimas acoes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data || []).slice(0, 12).map((log) => (
              <div key={log.id} className="rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{log.action}</Badge>
                    <span className="font-medium truncate max-w-[180px]">{log.admin_id || "sistema"}</span>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleString("pt-BR")}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  admin: {log.admin_id || "sistema"} &middot; alvo: {log.target_user_id || "nao informado"}
                </p>
              </div>
            ))}
            {(data || []).length === 0 && <p className="text-sm text-muted-foreground">Nenhum evento administrativo encontrado.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Admins mais ativos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingAdmins ? (
              <div className="flex justify-center py-4"><LoadingSpinner /></div>
            ) : (topAdmins || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum admin ativo no periodo.</p>
            ) : (
              (topAdmins || []).map((item, index) => (
                <div key={item.admin_id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                      {index + 1}
                    </span>
                    <span className="truncate font-mono text-xs">{item.admin_id}</span>
                  </div>
                  <Badge variant="secondary">{item.count} acoes</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAuditLogs;
