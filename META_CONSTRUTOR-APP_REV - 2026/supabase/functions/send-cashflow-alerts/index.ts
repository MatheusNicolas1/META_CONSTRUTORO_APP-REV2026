// send-cashflow-alerts/index.ts
// Sends alerts for cashflow ABC deviations

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const corsHeaders = getCorsHeaders();

const createAdminClient = () =>
  createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adm = createAdminClient();
    const body = await req.json().catch(() => ({}));
    const { org_id } = body as { org_id: string };

    if (!org_id || typeof org_id !== "string") {
      return jsonResponse({ error: "org_id é obrigatório" }, 400);
    }

    // Buscar logs com status = 'alerta'
    const { data: alertLogs, error: alertErr } = await adm
      .from("curva_abc_log")
      .select("*")
      .eq("org_id", org_id)
      .eq("status", "alerta")
      .order("generated_at", { ascending: false });

    if (alertErr) throw alertErr;

    if (!alertLogs || alertLogs.length === 0) {
      return jsonResponse({ alerts_enviados: 0, alerts: [] });
    }

    // Try to create notifications in notifications table
    // If table doesn't exist, log to console
    let notificationsTableExists = true;
    try {
      const { error: testErr } = await adm.from("notifications").select("id").limit(1);
      if (testErr && testErr.code === "42P01") {
        notificationsTableExists = false;
      }
    } catch {
      notificationsTableExists = false;
    }

    const alerts: Array<unknown> = [];

    for (const log of alertLogs) {
      const alertBody = {
        type: "curva_abc_desvio",
        org_id: log.org_id,
        obra_id: log.obra_id,
        competencia: log.competencia,
        desvio_percentual: log.desvio_percentual,
        limite_alerta_percentual: log.limite_alerta_percentual,
        message: `Desvio de ${log.desvio_percentual}% detectado na Curva ABC da obra ${log.obra_id} para competência ${log.competencia}`,
        created_at: new Date().toISOString(),
      };

      alerts.push(alertBody);

      if (notificationsTableExists) {
        await adm.from("notifications").insert({
          org_id: log.org_id,
          type: "curva_abc_desvio",
          title: "Alerta de Desvio - Curva ABC",
          message: alertBody.message,
          metadata: {
            obra_id: log.obra_id,
            competencia: log.competencia,
            desvio_percentual: log.desvio_percentual,
          },
          created_at: new Date().toISOString(),
        }).maybeSingle();
      }
    }

    if (!notificationsTableExists) {
      console.log("Tabela 'notifications' não encontrada. Alertas registrados no console:", alerts);
    }

    return jsonResponse({
      alerts_enviados: alerts.length,
      alerts,
    });
  } catch (err) {
    console.error("Erro em send-cashflow-alerts", err);
    const message = err instanceof Error ? err.message : "Erro interno ao enviar alertas de fluxo de caixa";
    return jsonResponse({ error: message }, 500);
  }
});
