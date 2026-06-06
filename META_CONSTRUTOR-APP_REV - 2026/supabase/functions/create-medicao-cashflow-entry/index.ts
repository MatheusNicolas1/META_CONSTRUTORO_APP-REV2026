// create-medicao-cashflow-entry/index.ts
// Creates a cashflow previsao entry originated from a medicao approval

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
    const { medicao_id, data_prevista, valor } = body as {
      medicao_id: string;
      data_prevista: string;
      valor: number;
    };

    if (!medicao_id || !data_prevista || valor === undefined) {
      return jsonResponse({ error: "medicao_id, data_prevista e valor são obrigatórios" }, 400);
    }

    // Get medicao details for context
    const { data: medicao, error: medErr } = await adm
      .from("medicoes")
      .select("id, org_id, obra_id, descricao, competencia, contrato_id")
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

    // Get contract info for fornecedor details
    let fornecedorNome = "Medição";
    let contratoInfo: Record<string, unknown> | null = null;

    if (medicao.contrato_id) {
      const { data: contrato } = await adm
        .from("obra_contratos")
        .select("contratada_nome, numero_contrato")
        .eq("id", medicao.contrato_id)
        .single();

      if (contrato) {
        contratoInfo = contrato;
        fornecedorNome = contrato.contratada_nome || "Contrato " + (contrato.numero_contrato || "");
      }
    }

    // Create previsao entry
    const previsaoData: Record<string, unknown> = {
      org_id: medicao.org_id,
      obra_id: medicao.obra_id,
      tipo: "saida",
      origem: "medicao",
      categoria: "medicao",
      fornecedor_nome: fornecedorNome,
      descricao: medicao.descricao || `Medição #${medicao_id.slice(0, 8)} - ${medicao.competencia || ""}`.trim(),
      data_prevista,
      valor_previsto: valor,
      status: "pendente",
      created_by: null,
    };

    const { data: previsao, error: prevErr } = await adm
      .from("fluxo_caixa_previsao")
      .insert(previsaoData)
      .select()
      .single();

    if (prevErr) throw prevErr;

    return jsonResponse({
      status: "ok",
      previsao_id: previsao?.id || "generated",
      medicao_id,
      data_prevista,
      valor,
      fornecedor: fornecedorNome,
    });
  } catch (err) {
    console.error("Erro em create-medicao-cashflow-entry", err);
    const message = err instanceof Error ? err.message : "Erro interno ao criar entrada de fluxo de caixa para medição";
    return jsonResponse({ error: message }, 500);
  }
});
