// approve-medicao-campo/index.ts
// Approves or rejects a medicao at the campo (field) level

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

    const allowedStatuses = ["aprovado_campo", "rejeitado_campo"];
    if (!allowedStatuses.includes(status)) {
      return jsonResponse({ error: `status deve ser ${allowedStatuses.join(" ou ")}` }, 400);
    }

    // Ensure tables exist and update
    const { data: medicao, error: medErr } = await adm
      .from("medicoes")
      .select("id, status, obra_id, org_id")
      .eq("id", medicao_id)
      .single();

    if (medErr) {
      if (medErr.code === "42P01") {
        // Create tables inline
        const ensureSql = `
          CREATE TABLE IF NOT EXISTS obra_contratos (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL, obra_id UUID, numero_contrato TEXT, objeto TEXT, contratada_nome TEXT, valor_total NUMERIC DEFAULT 0, data_inicio DATE, data_fim DATE, status TEXT DEFAULT 'ativo', created_at TIMESTAMPTZ DEFAULT NOW());
          CREATE TABLE IF NOT EXISTS medicoes (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL, obra_id UUID, contrato_id UUID, numero_medicao INTEGER, competencia TEXT, descricao TEXT, valor_medido NUMERIC DEFAULT 0, valor_aprovado_campo NUMERIC, valor_aprovado_financeiro NUMERIC, status TEXT DEFAULT 'pendente', observacao TEXT, medido_por TEXT, aprovado_campo_por TEXT, aprovado_financeiro_por TEXT, data_medicao DATE, data_aprovacao_campo TIMESTAMPTZ, data_aprovacao_financeiro TIMESTAMPTZ, created_by UUID, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
        `;
        try {
          await adm.rpc("exec_sql", { query_text: ensureSql });
        } catch {
          console.warn("Could not create medicoes table");
        }
        return jsonResponse({ error: "Tabela medicoes não encontrada. Estrutura criada, tente novamente." }, 404);
      }
      throw medErr;
    }

    if (!medicao) {
      return jsonResponse({ error: "Medição não encontrada" }, 404);
    }

    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = {
      status,
      aprovado_campo_por: aprovado_por || null,
      data_aprovacao_campo: now,
      observacao: observacao || medicao.observacao || null,
      updated_at: now,
    };

    if (status === "aprovado_campo") {
      updateData.valor_aprovado_campo = medicao.valor_medido || 0;
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
      aprovado_campo_por: aprovado_por || null,
    });
  } catch (err) {
    console.error("Erro em approve-medicao-campo", err);
    const message = err instanceof Error ? err.message : "Erro interno ao aprovar medição de campo";
    return jsonResponse({ error: message }, 500);
  }
});
