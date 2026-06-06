import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Activity, ClipboardList, RefreshCw, ShieldCheck } from "lucide-react";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AuditLog = {
  id: string;
  action: string;
  admin_id: string | null;
  target_user_id: string | null;
  details: unknown;
  created_at: string;
};

type UserActivity = {
  id: string;
  user_id: string;
  event_name: string;
  event_data: unknown;
  created_at: string | null;
};

type SecurityOverview = {
  auditLogs: AuditLog[];
  activityEvents: UserActivity[];
  auditCount24h: number;
  activityCount24h: number;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
};

const renderDetails = (value: unknown) => {
  if (!value) return "-";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return "Detalhes indisponiveis";
  }
};

const Seguranca = () => {
  const since24h = useMemo(() => {
    const date = new Date();
    date.setHours(date.getHours() - 24);
    return date.toISOString();
  }, []);

  const { data, error, isLoading, refetch, isFetching } = useQuery<SecurityOverview>({
    queryKey: ["security-overview", since24h],
    queryFn: async () => {
      const [auditLogsRes, auditCountRes, activityEventsRes, activityCountRes] = await Promise.all([
        supabase
          .from("admin_audit_logs")
          .select("id, action, admin_id, target_user_id, details, created_at")
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("admin_audit_logs")
          .select("id", { count: "exact", head: true })
          .gte("created_at", since24h),
        supabase
          .from("user_activity")
          .select("id, user_id, event_name, event_data, created_at")
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("user_activity")
          .select("id", { count: "exact", head: true })
          .gte("created_at", since24h),
      ]);

      if (auditLogsRes.error) throw auditLogsRes.error;
      if (auditCountRes.error) throw auditCountRes.error;
      if (activityEventsRes.error) throw activityEventsRes.error;
      if (activityCountRes.error) throw activityCountRes.error;

      return {
        auditLogs: (auditLogsRes.data || []) as AuditLog[],
        activityEvents: (activityEventsRes.data || []) as UserActivity[],
        auditCount24h: auditCountRes.count || 0,
        activityCount24h: activityCountRes.count || 0,
      };
    },
  });

  const uniqueEventCount = useMemo(() => {
    return new Set((data?.activityEvents || []).map((event) => event.event_name)).size;
  }, [data?.activityEvents]);

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      <SEO title="Seguranca | Meta Construtor" description="Auditoria e atividade recente de seguranca." canonical={window.location.href} />

      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Seguranca</h1>
            <p className="text-sm text-muted-foreground">
              Auditoria administrativa e eventos recentes registrados no Supabase.
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {isFetching ? "Atualizando..." : "Atualizar"}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Falha ao carregar dados reais</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : "Nao foi possivel consultar auditoria e atividade."}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Acoes administrativas</CardTitle>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.auditCount24h ?? 0}</div>
              <p className="text-xs text-muted-foreground">registradas nas ultimas 24h</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eventos de usuario</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.activityCount24h ?? 0}</div>
              <p className="text-xs text-muted-foreground">eventos nas ultimas 24h</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tipos recentes</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueEventCount}</div>
              <p className="text-xs text-muted-foreground">tipos de evento nos ultimos registros</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Auditoria administrativa</CardTitle>
            <CardDescription>Ultimas acoes gravadas em `admin_audit_logs`.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Acao</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Alvo</TableHead>
                  <TableHead>Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.auditLogs || []).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{formatDateTime(log.created_at)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.action}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{log.admin_id || "-"}</TableCell>
                    <TableCell className="font-mono text-xs">{log.target_user_id || "-"}</TableCell>
                    <TableCell className="max-w-[320px] truncate text-xs text-muted-foreground">
                      {renderDetails(log.details)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {(data?.auditLogs || []).length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhum log administrativo encontrado.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atividade recente</CardTitle>
            <CardDescription>Ultimos eventos gravados em `user_activity`.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Dados</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.activityEvents || []).map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{formatDateTime(event.created_at)}</TableCell>
                    <TableCell>
                      <Badge>{event.event_name}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{event.user_id}</TableCell>
                    <TableCell className="max-w-[360px] truncate text-xs text-muted-foreground">
                      {renderDetails(event.event_data)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {(data?.activityEvents || []).length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhum evento de usuario encontrado.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Seguranca;
