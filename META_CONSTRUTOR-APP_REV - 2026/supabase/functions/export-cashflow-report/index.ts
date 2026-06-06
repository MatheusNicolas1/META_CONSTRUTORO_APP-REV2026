// export-cashflow-report/index.ts
// Exports cashflow report combining previsoes + realizados

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
    const { org_id, obra_id, inicio, fim } = body as {
      org_id: string;
      obra_id?: string;
      inicio?: string;
      fim?: string;
    };

    if (!org_id || typeof org_id !== "string") {
      return jsonResponse({ error: "org_id é obrigatório" }, 400);
    }

    // Build query for previsoes
    let prevQuery = adm
      .from("fluxo_caixa_previsao")
      .select("*")
      .eq("org_id", org_id);

    if (obra_id) prevQuery = prevQuery.eq("obra_id", obra_id);
    if (inicio) prevQuery = prevQuery.gte("data_prevista", inicio);
    if (fim) prevQuery = prevQuery.lte("data_prevista", fim);

    const { data: previsoes, error: prevErr } = await prevQuery.order("data_prevista", { ascending: true });
    if (prevErr) throw prevErr;

    // Build query for realizados
    let realQuery = adm
      .from("fluxo_caixa_realizado")
      .select("*")
      .eq("org_id", org_id);

    if (obra_id) realQuery = realQuery.eq("obra_id", obra_id);
    if (inicio) realQuery = realQuery.gte("data_realizada", inicio);
    if (fim) realQuery = realQuery.lte("data_realizada", fim);

    const { data: realizados, error: realErr } = await realQuery.order("data_realizada", { ascending: true });
    if (realErr) throw realErr;

    // Group previsoes by month for summary
    const previsoesAgrupadas: Record<string, { total: number; entrada: number; saida: number; count: number }> = {};
    for (const p of previsoes ?? []) {
      const mes = (p.data_prevista || "").slice(0, 7);
      if (!mes) continue;
      if (!previsoesAgrupadas[mes]) previsoesAgrupadas[mes] = { total: 0, entrada: 0, saida: 0, count: 0 };
      const valor = Number(p.valor_previsto) || 0;
      previsoesAgrupadas[mes].total += valor;
      previsoesAgrupadas[mes].count++;
      if ((p.categoria || p.tipo || "").toLowerCase() === "entrada") {
        previsoesAgrupadas[mes].entrada += valor;
      } else {
        previsoesAgrupadas[mes].saida += valor;
      }
    }

    // Group realizados by month
    const realizadosAgrupados: Record<string, { total: number; entrada: number; saida: number; count: number }> = {};
    for (const r of realizados ?? []) {
      const mes = (r.data_realizada || "").slice(0, 7);
      if (!mes) continue;
      if (!realizadosAgrupados[mes]) realizadosAgrupados[mes] = { total: 0, entrada: 0, saida: 0, count: 0 };
      const valor = Number(r.valor_realizado) || 0;
      realizadosAgrupados[mes].total += valor;
      realizadosAgrupados[mes].count++;
      if ((r.categoria || "").toLowerCase() === "entrada") {
        realizadosAgrupados[mes].entrada += valor;
      } else {
        realizadosAgrupados[mes].saida += valor;
      }
    }

    // Build monthly summary
    const allMonths = new Set([
      ...Object.keys(previsoesAgrupadas),
      ...Object.keys(realizadosAgrupados),
    ]);
    const monthlySummary = Array.from(allMonths).sort().map((mes) => ({
      competencia: mes,
      previsao: previsoesAgrupadas[mes] || { total: 0, entrada: 0, saida: 0, count: 0 },
      realizado: realizadosAgrupados[mes] || { total: 0, entrada: 0, saida: 0, count: 0 },
      saldo_previsto: (previsoesAgrupadas[mes]?.entrada || 0) - (previsoesAgrupadas[mes]?.saida || 0),
      saldo_realizado: (realizadosAgrupados[mes]?.entrada || 0) - (realizadosAgrupados[mes]?.saida || 0),
    }));

    return jsonResponse({
      relatorio: {
        org_id,
        obra_id: obra_id || null,
        periodo: { inicio: inicio || null, fim: fim || null },
        gerado_em: new Date().toISOString(),
        resumo: {
          total_previsoes: previsoes?.length || 0,
          total_realizados: realizados?.length || 0,
          valor_total_previsto: (previsoes ?? []).reduce((s, p) => s + (Number(p.valor_previsto) || 0), 0),
          valor_total_realizado: (realizados ?? []).reduce((s, r) => s + (Number(r.valor_realizado) || 0), 0),
        },
        previsoes: previsoes ?? [],
        realizados: realizados ?? [],
        monthly_summary: monthlySummary,
      },
    });
  } catch (err) {
    console.error("Erro em export-cashflow-report", err);
    const message = err instanceof Error ? err.message : "Erro interno ao exportar relatório de fluxo de caixa";
    return jsonResponse({ error: message }, 500);
  }
});
