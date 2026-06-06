// erp-test-connection/index.ts
// Tests connection to the configured ERP system

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

    // Ensure the erp_config table exists
    const ensureSql = `
      CREATE TABLE IF NOT EXISTS integracao_erp_config (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL UNIQUE,
        provider TEXT NOT NULL DEFAULT 'custom',
        api_url TEXT NOT NULL,
        api_key TEXT,
        webhook_secret TEXT,
        sync_frequency TEXT DEFAULT 'daily',
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

    // Get ERP config
    const { data: config, error: configErr } = await adm
      .from("integracao_erp_config")
      .select("*")
      .eq("org_id", org_id)
      .single();

    if (configErr || !config) {
      return jsonResponse({
        success: false,
        message: "Nenhuma configuração de ERP encontrada para esta organização. Configure a integração primeiro.",
        latency_ms: 0,
      }, 200);
    }

    // Test the connection by making a request to the ERP API
    const startTime = Date.now();
    let success = false;
    let message = "";

    try {
      const erpResponse = await fetch(config.api_url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${config.api_key}`,
          "Content-Type": "application/json",
          "X-Org-Id": org_id,
        },
        signal: AbortSignal.timeout(10000),
      });

      const latency = Date.now() - startTime;

      if (erpResponse.ok) {
        success = true;
        message = `Conexão com ERP estabelecida com sucesso (${latency}ms)`;
      } else {
        message = `ERP respondeu com status ${erpResponse.status} (${latency}ms)`;
      }
    } catch (fetchErr) {
      const latency = Date.now() - startTime;
      const errMsg = fetchErr instanceof Error ? fetchErr.message : "Erro desconhecido";
      message = `Falha na conexão com ERP: ${errMsg} (${latency}ms)`;
    }

    return jsonResponse({
      success,
      message,
      latency_ms: Date.now() - startTime,
      config: {
        provider: config.provider,
        api_url: config.api_url ? config.api_url.replace(/\/?$/, "") + "/***" : null,
        active: config.active,
      },
    });
  } catch (err) {
    console.error("Erro em erp-test-connection", err);
    const message = err instanceof Error ? err.message : "Erro interno ao testar conexão ERP";
    return jsonResponse({ error: message }, 500);
  }
});
