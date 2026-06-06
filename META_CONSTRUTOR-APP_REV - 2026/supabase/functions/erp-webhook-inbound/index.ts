// erp-webhook-inbound/index.ts
// Public webhook endpoint to receive data from external ERP systems
// Validates using HMAC or token-based authentication

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

async function validateHmac(
  payload: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature) return false;
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const msgData = encoder.encode(payload);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const mac = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
    const expectedSig = Array.from(new Uint8Array(mac))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return expectedSig === signature;
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adm = createAdminClient();
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);

    // Extract token or HMAC from headers
    const token = req.headers.get("X-Webhook-Token") || req.headers.get("Authorization")?.replace("Bearer ", "");
    const hmacSignature = req.headers.get("X-Hmac-Signature");
    const orgIdHeader = req.headers.get("X-Org-Id");

    if (!orgIdHeader) {
      return jsonResponse({ error: "Header X-Org-Id é obrigatório" }, 400);
    }

    // Get org's ERP config for validation
    const { data: config, error: configErr } = await adm
      .from("integracao_erp_config")
      .select("api_key, webhook_secret")
      .eq("org_id", orgIdHeader)
      .single();

    if (configErr) {
      return jsonResponse({ error: "Organização não configurada para integração ERP" }, 403);
    }

    // Validate: either token matches api_key, or HMAC matches webhook_secret
    let validated = false;

    if (token && config.api_key && token === config.api_key) {
      validated = true;
    }

    if (!validated && hmacSignature && config.webhook_secret) {
      validated = await validateHmac(rawBody, hmacSignature, config.webhook_secret);
    }

    if (!validated) {
      return jsonResponse({ error: "Autenticação do webhook inválida" }, 401);
    }

    // Process received data
    const { entidade, dados } = body as {
      entidade?: string;
      dados?: Array<Record<string, unknown>>;
    };

    if (!entidade || !dados || !Array.isArray(dados)) {
      return jsonResponse({ error: "Payload deve conter entidade e dados (array)" }, 400);
    }

    // Log the received data
    const targetTable = `erp_data_${entidade}`;
    const ensureSql = `
      CREATE TABLE IF NOT EXISTS erp_webhook_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id TEXT NOT NULL,
        entidade TEXT NOT NULL,
        direction TEXT DEFAULT 'inbound',
        itens_recebidos INTEGER DEFAULT 0,
        payload_preview JSONB,
        received_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    try {
      await adm.rpc("exec_sql", { query_text: ensureSql });
    } catch {
      console.warn("Could not ensure webhook log table");
    }

    // Log the webhook reception
    try {
      await adm.from("erp_webhook_log").insert({
        org_id: orgIdHeader,
        entidade,
        direction: "inbound",
        itens_recebidos: dados.length,
        payload_preview: dados.slice(0, 3),
      });
    } catch {
      console.log("Webhook received:", { org_id: orgIdHeader, entidade, count: dados.length });
    }

    // Store data in appropriate table
    const storedTable = `erp_${entidade}`;
    try {
      const insertsForTable = dados.map((item) => ({
        org_id: orgIdHeader,
        entidade,
        dados_originais: item,
        recebido_em: new Date().toISOString(),
      }));

      const ensureDataSql = `
        CREATE TABLE IF NOT EXISTS ${storedTable} (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          org_id TEXT,
          entidade TEXT,
          dados_originais JSONB,
          recebido_em TIMESTAMPTZ DEFAULT NOW()
        );
      `;
      await adm.rpc("exec_sql", { query_text: ensureDataSql });

      await adm.from(storedTable).insert(insertsForTable);
    } catch (storeErr) {
      console.warn(`Could not store in ${storedTable}:`, storeErr);
    }

    return jsonResponse({
      received: true,
      itens_processados: dados.length,
      entidade,
      org_id: orgIdHeader,
    });
  } catch (err) {
    console.error("Erro em erp-webhook-inbound", err);
    const message = err instanceof Error ? err.message : "Erro interno ao processar webhook ERP";
    return jsonResponse({ error: message }, 500);
  }
});
