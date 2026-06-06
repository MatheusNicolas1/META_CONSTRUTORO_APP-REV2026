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

    const { token, mensagem } = body as { token: string; mensagem: string };

    if (!mensagem || typeof mensagem !== "string" || mensagem.trim().length === 0) {
      return jsonResponse({ error: "Mensagem vazia" }, 400);
    }

    if (mensagem.length > 2000) {
      return jsonResponse({ error: "Mensagem muito longa" }, 400);
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

    const allowed =
      cliente.allowed_sections &&
      typeof cliente.allowed_sections === "object" &&
      !Array.isArray(cliente.allowed_sections)
        ? (cliente.allowed_sections as Record<string, unknown>)
        : {};

    if (allowed.mensagens !== true) {
      return jsonResponse({ error: "Mensagens não permitidas" }, 403);
    }

    // Rate limit básico: máximo 1 mensagem nos últimos 30 segundos
    const { data: recentes, error: rateError } = await adm
      .from("mensagens_portal")
      .select("created_at")
      .eq("cliente_portal_id", cliente.id)
      .eq("direction", "cliente_para_interno")
      .order("created_at", { ascending: false })
      .limit(5);

    if (rateError) {
      return jsonResponse({ error: "Falha ao verificar rate limit" }, 500);
    }

    if (recentes && recentes.length > 0) {
      const ultima = new Date(recentes[0].created_at).getTime();
      if (Date.now() - ultima < 15000) {
        return jsonResponse({ error: "Aguarde antes de enviar nova mensagem" }, 429);
      }
    }

    const { error: insertError } = await adm
      .from("mensagens_portal")
      .insert({
        org_id: cliente.org_id,
        cliente_portal_id: cliente.id,
        obra_id: cliente.obra_id,
        direction: "cliente_para_interno",
        author_type: "cliente",
        mensagem: mensagem.trim(),
      });

    if (insertError) {
      return jsonResponse({ error: "Falha ao enviar mensagem" }, 500);
    }

    return jsonResponse({ success: true });
  } catch (err) {
    console.error("Erro em portal-client-send-message", err);
    return jsonResponse({ error: "Erro interno" }, 500);
  }
});
