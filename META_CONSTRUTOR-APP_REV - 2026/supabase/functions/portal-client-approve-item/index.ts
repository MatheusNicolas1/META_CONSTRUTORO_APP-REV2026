import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const corsHeaders = getCorsHeaders();

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const createAdminClient = () =>
  createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adm = createAdminClient();
    const body = await req.json().catch(() => null);

    if (!body || !body.token) {
      return jsonResponse({ error: "Token obrigatório" }, 400);
    }

    if (!body.item_id) {
      return jsonResponse({ error: "item_id obrigatório" }, 400);
    }

    const { token, item_id, status, resposta } = body as {
      token: string;
      item_id: string;
      status: string;
      resposta?: Record<string, unknown>;
    };

    if (!["aprovado", "rejeitado"].includes(status)) {
      return jsonResponse({ error: "Status inválido" }, 400);
    }

    const { data: cliente, error: clienteError } = await adm
      .from("clientes_portal")
      .select("*")
      .eq("token_hash", token)
      .maybeSingle();

    if (clienteError) {
      return jsonResponse({ error: "Falha ao validar portal" }, 500);
    }

    if (!cliente || cliente.status !== "ativo") {
      return jsonResponse({ error: "Portal inválido" }, 403);
    }

    if (
      cliente.token_expires_at &&
      new Date(cliente.token_expires_at) < new Date()
    ) {
      return jsonResponse({ error: "Token expirado" }, 403);
    }

    const { data: aprovacao, error: aprovacaoError } = await adm
      .from("aprovacoes_cliente")
      .select("*")
      .eq("id", item_id)
      .eq("cliente_portal_id", cliente.id)
      .maybeSingle();

    if (aprovacaoError) {
      return jsonResponse({ error: "Falha ao consultar item" }, 500);
    }

    if (!aprovacao) {
      return jsonResponse({ error: "Item não encontrado" }, 404);
    }

    if (aprovacao.status !== "pendente") {
      return jsonResponse({ error: "Item já processado" }, 409);
    }

    const { error: updateError } = await adm
      .from("aprovacoes_cliente")
      .update({
        status: status,
        resposta: resposta || {},
        responded_at: new Date().toISOString(),
      })
      .eq("id", item_id);

    if (updateError) {
      return jsonResponse({ error: "Falha ao registrar resposta" }, 500);
    }

    return jsonResponse({ success: true, status });
  } catch (err) {
    console.error("Erro em portal-client-approve-item", err);
    return jsonResponse({ error: "Erro interno" }, 500);
  }
});
