// approve-medicao-financeiro/index.ts
// Approves or rejects a medicao at the financeiro (financial) level

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
    const { medicao_id, status, observacao, aprovado_por } = body as {
      medicao_id: string;
      status: string;
      observacao?: string;
      aprovado_por?: string;
    };

    if (!medicao_id || !status) {
      return jsonResponse({ error: "medicao_id e status são obrigatórios" }, 400);
    }

    const allowedStatuses = ["aprovado_financeiro", "rejeitado_financeiro"];
    if (!allowedStatuses.includes(status)) {
      return jsonResponse({ error: `status deve ser ${allowedStatuses.join(" ou ")}` }, 400);
    }

    const { data: medicao, error: medErr } = await adm
      .from("medicoes")
      .select("id, status, valor_aprovado_campo, obra_id, org_id")
      .eq("id", medicao_id)
      .single();

    if (medErr) {
      if (medErr.code === "42P01") {
        return jsonResponse({ error: "Tabela medicoes não encontrada. Crie a migration primeiro." }, 404);
      }
      throw medErr;
    }

    if (!medicao) {
      return jsonResponse({ error: "Medição não encontrada" }, 404);
    }

    // Validate that campo approval happened first
    if (medicao.status !== "aprovado_campo" && medicao.status !== "aprovado_financeiro") {
      return jsonResponse({
        error: "Medição precisa ser aprovada no campo antes da aprovação financeira",
        status_atual: medicao.status,
      }, 409);
    }

    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = {
      status,
      aprovado_financeiro_por: aprovado_por || null,
      data_aprovacao_financeiro: now,
      observacao: observacao || null,
      updated_at: now,
    };

    if (status === "aprovado_financeiro") {
      updateData.valor_aprovado_financeiro = medicao.valor_aprovado_campo || 0;
    }

    const { error: updateErr } = await adm
      .from("medicoes")
      .update(updateData)
      .eq("id", medicao_id);

    if (updateErr) throw updateErr;

    return jsonResponse({
      status: "ok",
      medicao_id,
      novo_status: status,
      aprovado_financeiro_por: aprovado_por || null,
    });
  } catch (err) {
    console.error("Erro em approve-medicao-financeiro", err);
    const message = err instanceof Error ? err.message : "Erro interno ao aprovar medição financeiro";
    return jsonResponse({ error: message }, 500);
  }
});
