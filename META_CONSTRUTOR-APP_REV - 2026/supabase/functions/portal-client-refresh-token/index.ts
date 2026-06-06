// portal-client-refresh-token/index.ts
// Uso INTERNO: permite revogar ou regenerar token de acesso do portal.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const corsHeaders = getCorsHeaders();

const createAdminClient = () =>
  createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

const createUserClient = (authHeader: string) =>
  createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } }
  );

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const user = createUserClient(authHeader);
    const adm = createAdminClient();

    const {
      data: { user: authUser },
      error: authError,
    } = await user.auth.getUser();

    if (authError || !authUser) {
      return jsonResponse({ error: "Não autorizado" }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const action = (body.action as string) || "revoke";
    const clienteId = body.cliente_id as string | undefined;

    if (!clienteId || typeof clienteId !== "string") {
      return jsonResponse({ error: "cliente_id obrigatório" }, 400);
    }

    const { data: cliente, error: clienteErr } = await adm
      .from("clientes_portal")
      .select("*")
      .eq("id", clienteId)
      .maybeSingle();

    if (clienteErr || !cliente) {
      return jsonResponse({ error: "Cliente não encontrado" }, 404);
    }

    if (action === "regenerate") {
      const newToken = crypto.randomUUID();
      const { error: updateError } = await adm
        .from("clientes_portal")
        .update({
          token_hash: newToken,
          status: "ativo",
          token_expires_at: null,
        })
        .eq("id", clienteId);

      if (updateError) {
        return jsonResponse({ error: "Falha ao regenerar token" }, 500);
      }

      return jsonResponse({ success: true, token: newToken });
    }

    if (action === "revoke") {
      const { error: updateError } = await adm
        .from("clientes_portal")
        .update({ status: "revogado" })
        .eq("id", clienteId);

      if (updateError) {
        return jsonResponse({ error: "Falha ao revogar" }, 500);
      }

      return jsonResponse({ success: true, status: "revogado" });
    }

    if (action === "expire") {
      const { error: updateError } = await adm
        .from("clientes_portal")
        .update({ token_expires_at: new Date().toISOString() })
        .eq("id", clienteId);

      if (updateError) {
        return jsonResponse({ error: "Falha ao expirar" }, 500);
      }

      return jsonResponse({ success: true, status: "expirado" });
    }

    return jsonResponse({ error: "Ação inválida" }, 400);
  } catch (err) {
    console.error("Erro em portal-client-refresh-token", err);
    return jsonResponse({ error: "Erro interno" }, 500);
  }
});
