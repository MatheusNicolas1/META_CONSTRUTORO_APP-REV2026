// calcular-receitas-previstas/index.ts
// Calcula receitas previstas combinando fluxo_caixa_previsoes (tipo='entrada') e obra_contratos ativos

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

interface ReceitaPrevista {
  mes: number;
  ano: number;
  total_previsto: number;
  fonte: "previsao_direta" | "contrato";
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

    // 1. Buscar previsões diretas de entrada
    const { data: previsoes, error: prevErr } = await adm
      .from("fluxo_caixa_previsoes")
      .select("*")
      .eq("org_id", org_id)
      .eq("tipo", "entrada");

    if (prevErr) throw prevErr;

    // 2. Buscar contratos ativos (LEFT JOIN — tabela pode não existir)
    let contratos: Array<Record<string, unknown>> = [];
    const { data: contratosData, error: contrErr } = await adm
      .from("obra_contratos")
      .select("*")
      .eq("status", "ativo");

    if (contrErr) {
      // Tabela pode não existir — log e continua sem contratos
      console.warn("obra_contratos não disponível ou erro na consulta:", contrErr.message);
    } else {
      contratos = contratosData ?? [];
    }

    // 3. Agrupar previsões diretas por mês/ano
    const receitasPorMes: Record<string, ReceitaPrevista> = {};

    for (const p of previsoes ?? []) {
      const dataStr: string = p.data_prevista || p.data || "";
      if (!dataStr) continue;

      const dt = new Date(dataStr);
      if (isNaN(dt.getTime())) continue;

      const ano = dt.getFullYear();
      const mes = dt.getMonth() + 1; // 1-based
      const key = `${ano}-${String(mes).padStart(2, "0")}`;

      const valor = Number(p.valor_previsto || p.valor || 0);

      if (!receitasPorMes[key]) {
        receitasPorMes[key] = { mes, ano, total_previsto: 0, fonte: "previsao_direta" };
      }

      receitasPorMes[key].total_previsto += valor;
    }

    // 4. Agrupar contratos ativos por mês/ano (parcelas)
    for (const c of contratos) {
      // Tenta extrair data de vigência ou próxima parcela do contrato
      const dataContrato: string = c.data_inicio || c.data_assinatura || c.created_at || "";
      if (!dataContrato) continue;

      const dt = new Date(dataContrato as string);
      if (isNaN(dt.getTime())) continue;

      const ano = dt.getFullYear();
      const mes = dt.getMonth() + 1;
      const key = `${ano}-${String(mes).padStart(2, "0")}`;

      // Usa valor_total ou valor_mensal do contrato, ou 0
      const valorContrato = Number(c.valor_total || c.valor_mensal || c.valor || 0);

      if (!receitasPorMes[key]) {
        receitasPorMes[key] = { mes, ano, total_previsto: 0, fonte: "previsao_direta" };
      }

      // Se a entrada veio de contrato, marca como contrato e adiciona
      if (receitasPorMes[key].fonte === "previsao_direta") {
        receitasPorMes[key].fonte = "contrato";
      }
      receitasPorMes[key].total_previsto += valorContrato;
    }

    // 5. Ordenar por ano/mês crescente
    const resultado = Object.values(receitasPorMes).sort((a, b) => {
      if (a.ano !== b.ano) return a.ano - b.ano;
      return a.mes - b.mes;
    });

    return jsonResponse(resultado);
  } catch (err) {
    console.error("Erro em calcular-receitas-previstas", err);
    const message = err instanceof Error ? err.message : "Erro interno ao calcular receitas previstas";
    return jsonResponse({ error: message }, 500);
  }
});
