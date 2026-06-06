// erp-schedule-sync/index.ts
// Updates ERP sync scheduling configuration

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
    const { org_id, schedule } = body as {
      org_id: string;
      schedule: {
        frequency: "daily" | "hourly" | "weekly";
        time?: string;
        day_of_week?: number;
        entidades?: string[];
      };
    };

    if (!org_id || typeof org_id !== "string") {
      return jsonResponse({ error: "org_id é obrigatório" }, 400);
    }

    if (!schedule || !schedule.frequency) {
      return jsonResponse({ error: "schedule.frequency é obrigatório (daily, hourly, weekly)" }, 400);
    }

    const validFrequencies = ["daily", "hourly", "weekly"];
    if (!validFrequencies.includes(schedule.frequency)) {
      return jsonResponse({ error: "Frequência inválida. Use: daily, hourly, ou weekly" }, 400);
    }

    // Ensure ERP config table exists
    const ensureSql = `
      CREATE TABLE IF NOT EXISTS integracao_erp_config (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL UNIQUE,
        provider TEXT NOT NULL DEFAULT 'custom',
        api_url TEXT,
        api_key TEXT,
        webhook_secret TEXT,
        sync_frequency TEXT DEFAULT 'daily',
        sync_time TEXT DEFAULT '02:00',
        sync_day_of_week INTEGER DEFAULT 1,
        entidades TEXT[] DEFAULT ARRAY['clientes', 'produtos', 'notas'],
        last_sync_at TIMESTAMPTZ,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    try {
      await adm.rpc("exec_sql", { query_text: ensureSql });
    } catch {
      console.warn("Could not ensure integracao_erp_config table");
    }

    // Check if config exists for this org
    const { data: existingConfig } = await adm
      .from("integracao_erp_config")
      .select("id")
      .eq("org_id", org_id)
      .maybeSingle();

    const updateData: Record<string, unknown> = {
      sync_frequency: schedule.frequency,
      sync_time: schedule.time || "02:00",
      sync_day_of_week: schedule.day_of_week ?? 1,
      updated_at: new Date().toISOString(),
    };

    if (schedule.entidades && Array.isArray(schedule.entidades) && schedule.entidades.length > 0) {
      updateData.entidades = schedule.entidades;
    }

    if (existingConfig) {
      const { error: updateErr } = await adm
        .from("integracao_erp_config")
        .update(updateData)
        .eq("org_id", org_id);

      if (updateErr) throw updateErr;
    } else {
      const insertData = {
        org_id,
        provider: "custom",
        api_url: null,
        api_key: null,
        ...updateData,
        active: true,
      };
      const { error: insertErr } = await adm
        .from("integracao_erp_config")
        .insert(insertData);
      if (insertErr) throw insertErr;
    }

    return jsonResponse({
      status: "scheduled",
      org_id,
      schedule: {
        frequency: schedule.frequency,
        time: schedule.time || "02:00",
        day_of_week: schedule.day_of_week ?? 1,
        entidades: schedule.entidades || existingConfig?.entidades || ["clientes", "produtos", "notas"],
      },
    });
  } catch (err) {
    console.error("Erro em erp-schedule-sync", err);
    const message = err instanceof Error ? err.message : "Erro interno ao agendar sincronização ERP";
    return jsonResponse({ error: message }, 500);
  }
});
