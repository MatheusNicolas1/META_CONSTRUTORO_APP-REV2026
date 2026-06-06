// ordem-servico-approve/index.ts
// Approves or rejects an Ordem de Servico (OS) at the approval level
// Expects status: 'pendente_aprovacao' before processing

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
    const { os_id, aprovado_por, status, observacoes } = body as {
      os_id: string;
      aprovado_por?: string;
      status: "aprovada" | "rejeitada";
      observacoes?: string;
    };

    // --- Validate required fields ---
    if (!os_id || !status) {
      return jsonResponse({ error: "os_id e status são obrigatórios" }, 400);
    }

    if (!["aprovada", "rejeitada"].includes(status)) {
      return jsonResponse(
        { error: "status deve ser 'aprovada' ou 'rejeitada'" },
        400
      );
    }

    // --- Fetch current OS ---
    const { data: os, error: osErr } = await adm
      .from("ordens_servico")
      .select("id, status, observacoes")
      .eq("id", os_id)
      .single();

    if (osErr) {
      if (osErr.code === "42P01") {
        return jsonResponse(
          { error: "Tabela ordens_servico não encontrada. Crie a migration primeiro." },
          404
        );
      }
      throw osErr;
    }

    if (!os) {
      return jsonResponse({ error: "Ordem de Serviço não encontrada" }, 404);
    }

    // --- Validate current status ---
    if (os.status !== "pendente_aprovacao") {
      return jsonResponse(
        {
          error: `Ordem de Serviço não está pendente de aprovação. Status atual: ${os.status}`,
          status_atual: os.status,
        },
        409
      );
    }

    const now = new Date().toISOString();

    // --- Build update payload ---
    const updateData: Record<string, unknown> = {
      status,
      aprovado_por: aprovado_por || null,
      data_aprovacao: now,
      updated_at: now,
    };

    // If rejected, append observacao to the existing observacoes array
    if (status === "rejeitada") {
      const currentObservacoes = Array.isArray(os.observacoes)
        ? os.observacoes
        : [];

      if (observacoes) {
        currentObservacoes.push({
          texto: observacoes,
          tipo: "rejeicao",
          criado_por: aprovado_por || null,
          criado_em: now,
        });
      }

      updateData.observacoes = currentObservacoes;
    }

    // --- Execute update ---
    const { error: updateErr } = await adm
      .from("ordens_servico")
      .update(updateData)
      .eq("id", os_id);

    if (updateErr) throw updateErr;

    return jsonResponse({
      success: true,
      os_id,
      novo_status: status,
    });
  } catch (err) {
    console.error("Erro em ordem-servico-approve", err);
    const message =
      err instanceof Error
        ? err.message
        : "Erro interno ao aprovar/rejeitar Ordem de Serviço";
    return jsonResponse({ error: message }, 500);
  }
});
