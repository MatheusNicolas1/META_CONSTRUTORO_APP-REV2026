import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Database,
  Radio,
  ServerCog,
  ShoppingCart,
  ShieldAlert,
  UserX,
} from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  buildHealthSummary,
  isHealthSectionOk,
  type AdminHealthCheck,
  type AdminHealthSection,
  type IngestionAgeAlert,
} from "./adminHealth";

const checkTableReadable = async (label: string, tableName: string): Promise<AdminHealthCheck> => {
  const { error } = await supabase
    .from(tableName as any)
    .select("id")
    .limit(1);

  return {
    label,
    ok: !error,
    message: error?.message || "Leitura concluida",
  };
};

const checkLatestAnalyticsEvent = async (): Promise<AdminHealthCheck> => {
  const { data, error } = await supabase
    .from("analytics_events")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    label: "Ultima ingestao de analytics",
    ok: !error,
    message: error
      ? error.message
      : data?.created_at
        ? new Intl.DateTimeFormat("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(data.created_at))
        : "Sem eventos recentes no recorte consultado",
  };
};

const checkEdgeHealth = async (): Promise<AdminHealthCheck> => {
  const { data, error } = await supabase.functions.invoke("health-check");
  const checks = data?.checks || {};
  const pending = typeof checks.stripe_events_pending === "number" ? checks.stripe_events_pending : null;
  const failures = typeof checks.stripe_events_errors === "number" ? checks.stripe_events_errors : null;

  return {
    label: "Edge Function health-check",
    ok: !error && data?.status === "ok",
    message: error
      ? error.message
      : `status ${data?.status || "desconhecido"}; fila Stripe ${pending ?? "n/d"}; erros Stripe ${failures ?? "n/d"}`,
  };
};

// --- New quality checks ---

const countErrorEvents = async (
  label: string,
  eventPattern: string,
  sinceDate: string,
): Promise<AdminHealthCheck> => {
  const { count, error } = await supabase
    .from("analytics_events")
    .select("id", { count: "exact", head: true })
    .ilike("event", eventPattern)
    .or("success.eq.false,error.not.isnull");

  return {
    label,
    ok: !error,
    message: error
      ? error.message
      : `${count ?? 0} evento(s) com erro`,
  };
};

const checkRLSErrors = async (): Promise<AdminHealthCheck> => {
  const { data, error } = await supabase
    .from("analytics_events")
    .select("id")
    .limit(1);

  return {
    label: "RLS / Permissao analytics_events",
    ok: !error,
    message: error ? error.message : "Acesso RLS OK",
  };
};

const checkEventFailureRate = async (sinceDate: string): Promise<AdminHealthCheck> => {
  const [totalResult, errorResult] = await Promise.all([
    supabase
      .from("analytics_events")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("analytics_events")
      .select("id", { count: "exact", head: true })
      .or("success.eq.false,error.not.isnull"),
  ]);

  const total = totalResult.count ?? 0;
  const errors = errorResult.count ?? 0;
  const rate = total > 0 ? (errors / total) * 100 : 0;

  return {
    label: "Taxa de falha de eventos",
    ok: rate < 5,
    message: total > 0
      ? `${errors}/${total} eventos com erro (${rate.toFixed(2)}%)`
      : "Sem eventos para calcular taxa",
  };
};

const getIngestionAge = (latestEventDate: string | null | undefined): IngestionAgeAlert => {
  if (!latestEventDate) return null;

  const now = Date.now();
  const eventTime = new Date(latestEventDate).getTime();
  const diffMinutes = (now - eventTime) / 60000;

  if (diffMinutes > 60) {
    return {
      label: "Ultima ingestao de analytics",
      minutes: Math.round(diffMinutes),
      message: `Ultimo evento ha ${Math.round(diffMinutes)} minutos`,
    };
  }

  return null;
};

const AdminHealthMetrics = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-health-metrics"],
    queryFn: async () => {
      const [
        profiles,
        orgs,
        userActivity,
        userInteractions,
        analyticsEvents,
        latestAnalytics,
        auditLogs,
        edgeHealth,
        checkoutErrors,
        authErrors,
        rlsCheck,
        failureRate,
      ] = await Promise.all([
        checkTableReadable("Profiles", "profiles"),
        checkTableReadable("Organizacoes", "orgs"),
        checkTableReadable("User activity", "user_activity"),
        checkTableReadable("User interactions", "user_interactions"),
        checkTableReadable("Analytics events", "analytics_events"),
        checkLatestAnalyticsEvent(),
        checkTableReadable("Auditoria administrativa", "admin_audit_logs"),
        checkEdgeHealth(),
        countErrorEvents("Erros em billing", "billing.%", ""),
        countErrorEvents("Erros em auth", "auth.%", ""),
        checkRLSErrors(),
        checkEventFailureRate(""),
      ]);

      const ingestionAlert = getIngestionAge(latestAnalytics.message !== "Sem eventos recentes no recorte consultado" ? latestAnalytics.message : null);

      const sections: AdminHealthSection[] = [
        {
          title: "Produto",
          description: "Leituras basicas que sustentam usuarios e organizacoes.",
          checks: [profiles, orgs],
        },
        {
          title: "Tracking",
          description: "Persistencia e ingestao de eventos de uso e marketing.",
          checks: [userActivity, userInteractions, analyticsEvents, latestAnalytics, rlsCheck],
        },
        {
          title: "Qualidade",
          description: "Eventos com erro em billing, autenticacao e taxa de falha geral.",
          checks: [checkoutErrors, authErrors, failureRate],
        },
        {
          title: "Operacao",
          description: "Sinais de Edge Functions, fila de pagamento e auditoria.",
          checks: [edgeHealth, auditLogs],
        },
      ];

      return {
        sections,
        summary: buildHealthSummary(sections),
        lastChecked: new Date().toISOString(),
        ingestionAlert,
      };
    },
    refetchInterval: 300000,
    staleTime: 60000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  const sections = data?.sections || [];
  const summary = data?.summary || { totalChecks: 0, failedChecks: 0, status: "attention" };
  const ingestionAlert = data?.ingestionAlert;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Saude do Admin</h2>
        <p className="text-sm text-muted-foreground">
          Checks reais de produto, tracking, qualidade e operacao. Nao ha uptime estimado ou inventado.
        </p>
      </div>

      {/* Ingestion age alert */}
      {ingestionAlert && (
        <Card className="border-amber-400/60 bg-amber-50/50 dark:bg-amber-950/10">
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Atencao: ultima ingestao ha mais de 1 hora
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {ingestionAlert.message}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resumo</CardTitle>
            {summary.failedChecks === 0 && !ingestionAlert ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.status === "operational" && !ingestionAlert ? "Operacional" : "Atencao"}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {summary.totalChecks - summary.failedChecks}/{summary.totalChecks} checks saudaveis
            </p>
            {ingestionAlert && (
              <p className="mt-1 text-xs text-amber-600 font-medium">
                Ingestao atrasada ({ingestionAlert.minutes} min)
              </p>
            )}
          </CardContent>
        </Card>

        {sections.map((section) => {
          const ok = isHealthSectionOk(section);
          const Icon = section.title === "Produto" ? Database
            : section.title === "Tracking" ? Radio
            : section.title === "Qualidade" ? ShieldAlert
            : ServerCog;
          return (
            <Card key={section.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{section.title}</CardTitle>
                {ok ? <Icon className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-amber-500" />}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ok ? "Ok" : "Atencao"}</div>
                <p className="mt-1 text-xs text-muted-foreground">{section.checks.length} checks</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Checks verificados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {sections.map((section) => (
            <div key={section.title} className="space-y-2">
              <div>
                <h3 className="font-medium text-foreground">{section.title}</h3>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </div>
              <div className="divide-y rounded-md border">
                {section.checks.map((check) => (
                  <div key={`${section.title}-${check.label}`} className="grid gap-2 p-3 sm:grid-cols-[180px_1fr_auto] sm:items-center">
                    <p className="font-medium text-sm">{check.label}</p>
                    <p className="text-sm text-muted-foreground">{check.message}</p>
                    <span className={check.ok ? "text-sm font-medium text-green-600" : "text-sm font-medium text-amber-600"}>
                      {check.ok ? "OK" : "Atencao"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Ultima verificacao: {new Date(data?.lastChecked || Date.now()).toLocaleTimeString("pt-BR")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminHealthMetrics;
