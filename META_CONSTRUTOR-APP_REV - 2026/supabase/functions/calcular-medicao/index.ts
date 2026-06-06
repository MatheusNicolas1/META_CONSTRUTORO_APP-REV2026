// calcular-medicao/index.ts
// Calcula valor_apurado de uma medição com base nos itens (medicao_itens)
//
// Fluxo:
//   Recebe { medicao_id }
//   Busca medicao_contrato + medicao_itens
//   Calcula: valor_total = SUM(item.percentual_executado/100 * item.valor_unitario * item.quantidade)
//   Atualiza medicao_contrato.valor_apurado
//   Retorna { medicao_id, valor_apurado, itens_count, percentual_medio }

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
    const { medicao_id } = body as { medicao_id: string };

    if (!medicao_id) {
      return jsonResponse({ error: "medicao_id é obrigatório" }, 400);
    }

    // 1. Buscar a medição (medicao_contrato)
    let medicao: Record<string, unknown> | null = null;
    try {
      const { data, error } = await adm
        .from("medicoes")
        .select("*")
        .eq("id", medicao_id)
        .single();
      if (error && error.code === "42P01") {
        return jsonResponse(
          { error: "Tabela medicoes não encontrada. Execute as migrations primeiro." },
          500
        );
      }
      if (error) throw error;
      medicao = data;
    } catch (e) {
      console.error("Erro ao buscar medição", e);
      return jsonResponse(
        { error: "Erro ao buscar medição: " + (e instanceof Error ? e.message : String(e)) },
        500
      );
    }

    if (!medicao) {
      return jsonResponse({ error: "Medição não encontrada" }, 404);
    }

    // 2. Buscar os itens da medição (medicao_itens)
    interface MedicaoItem {
      id: string;
      medicao_id: string;
      item_contrato_id?: string;
      descricao?: string;
      percentual_executado: number;
      valor_unitario: number;
      quantidade: number;
      created_at?: string;
    }

    let itens: MedicaoItem[] = [];
    try {
      const { data, error } = await adm
        .from("medicao_itens")
        .select("*")
        .eq("medicao_id", medicao_id);
      if (error && error.code === "42P01") {
        return jsonResponse(
          { error: "Tabela medicao_itens não encontrada. Execute as migrations primeiro." },
          500
        );
      }
      if (error) throw error;
      itens = (data || []) as MedicaoItem[];
    } catch (e) {
      console.error("Erro ao buscar itens da medição", e);
      return jsonResponse(
        { error: "Erro ao buscar itens da medição: " + (e instanceof Error ? e.message : String(e)) },
        500
      );
    }

    if (itens.length === 0) {
      return jsonResponse({
        medicao_id,
        valor_apurado: 0,
        itens_count: 0,
        percentual_medio: 0,
        aviso: "Nenhum item encontrado para esta medição. Valor apurado definido como 0.",
      });
    }

    // 3. Calcular valor_total = SUM(percentual_executado/100 * valor_unitario * quantidade)
    let valorApurado = 0;
    let somaPercentuais = 0;

    for (const item of itens) {
      const perc = (item.percentual_executado ?? 0) / 100;
      const vu = item.valor_unitario ?? 0;
      const qtd = item.quantidade ?? 0;
      valorApurado += perc * vu * qtd;
      somaPercentuais += item.percentual_executado ?? 0;
    }

    const percentualMedio = itens.length > 0
      ? Math.round((somaPercentuais / itens.length) * 100) / 100
      : 0;

    valorApurado = Math.round(valorApurado * 100) / 100;

    // 4. Atualizar medicao_contrato.valor_apurado
    const updateData: Record<string, unknown> = {
      valor_apurar: valorApurado,
      updated_at: new Date().toISOString(),
    };

    const { error: updateErr } = await adm
      .from("medicoes")
      .update(updateData)
      .eq("id", medicao_id);

    if (updateErr) {
      console.error("Erro ao atualizar valor_apurar da medição", updateErr);
      // Non-fatal: retornamos o cálculo mesmo se o update falhar
    }

    return jsonResponse({
      medicao_id,
      valor_apurado: valorApurado,
      itens_count: itens.length,
      percentual_medio: percentualMedio,
    });
  } catch (err) {
    console.error("Erro em calcular-medicao", err);
    const message = err instanceof Error
      ? err.message
      : "Erro interno ao calcular valor da medição";
    return jsonResponse({ error: message }, 500);
  }
});
