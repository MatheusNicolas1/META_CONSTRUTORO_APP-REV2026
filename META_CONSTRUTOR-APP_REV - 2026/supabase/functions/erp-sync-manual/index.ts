// erp-sync-manual/index.ts
// Triggers a manual ERP sync

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
    const { org_id, entidades, direction } = body as {
      org_id: string;
      entidades: string[];
      direction: "export" | "import";
    };

    if (!org_id || !entidades || !Array.isArray(entidades) || entidades.length === 0) {
      return jsonResponse({ error: "org_id e entidades são obrigatórios" }, 400);
    }

    if (!direction || !["export", "import"].includes(direction)) {
      return jsonResponse({ error: "direction deve ser 'export' ou 'import'" }, 400);
    }

    // Ensure sync log table exists
    const ensureSql = `
      CREATE TABLE IF NOT EXISTS erp_sync_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        sync_type TEXT NOT NULL DEFAULT 'manual',
        entidades TEXT[],
        direction TEXT NOT NULL,
        status TEXT DEFAULT 'iniciado',
        resultado JSONB,
        iniciado_em TIMESTAMPTZ DEFAULT NOW(),
        concluido_em TIMESTAMPTZ,
        error_message TEXT
      );

      CREATE TABLE IF NOT EXISTS erp_sync_queue (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        entidade TEXT NOT NULL,
        action TEXT NOT NULL,
        payload JSONB,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        processed_at TIMESTAMPTZ
      );
    `;

    try {
      await adm.rpc("exec_sql", { query_text: ensureSql });
    } catch {
      console.warn("Could not ensure ERP sync tables");
    }

    // Create sync log entry
    const { data: syncLog, error: logErr } = await adm
      .from("erp_sync_log")
      .insert({
        org_id,
        sync_type: "manual",
        entidades,
        direction,
        status: "iniciado",
        iniciado_em: new Date().toISOString(),
      })
      .select()
      .single();

    if (logErr) throw logErr;

    const syncId = syncLog?.id || crypto.randomUUID();

    // Enqueue items for each entity
    const queueInserts = entidades.map((entidade) => ({
      org_id,
      entidade,
      action: direction === "export" ? "send_to_erp" : "receive_from_erp",
      payload: { entidade, direction },
      status: "pending",
    }));

    try {
      await adm.from("erp_sync_queue").insert(queueInserts);
    } catch (qErr) {
      console.warn("Could not enqueue sync items (erp_sync_queue table may not exist):", qErr);
    }

    return jsonResponse({
      sync_id: syncId,
      status: "iniciado",
      entidades,
      direction,
      queue_size: entidades.length,
    });
  } catch (err) {
    console.error("Erro em erp-sync-manual", err);
    const message = err instanceof Error ? err.message : "Erro interno ao iniciar sincronização ERP manual";
    return jsonResponse({ error: message }, 500);
  }
});
