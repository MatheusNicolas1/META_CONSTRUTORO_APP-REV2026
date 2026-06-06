// consolidar-fluxo-caixa/index.ts
// Consolidates cashflow: initial balance, projected vs real for a given month

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

function getMonthBounds(ano: number, mes: number) {
  // mes is 1-indexed (1=Jan … 12=Dec)
  const startDate = `${ano}-${String(mes).padStart(2, "0")}-01`;
  const endDate =
    mes === 12
      ? `${ano + 1}-01-01`
      : `${ano}-${String(mes + 1).padStart(2, "0")}-01`;
  return { startDate, endDate };
}

interface ConsolidationResult {
  mes: number;
  ano: number;
  saldo_inicial: number;
  entradas_previstas: number;
  saidas_previstas: number;
  realizado_entradas: number;
  realizado_saidas: number;
  saldo_projetado: number;
  saldo_real: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adm = createAdminClient();
    const body = await req.json().catch(() => ({}));
    const { org_id, mes, ano } = body as {
      org_id: string;
      mes?: number;
      ano?: number;
    };

    if (!org_id || typeof org_id !== "string") {
      return jsonResponse({ error: "org_id é obrigatório" }, 400);
    }

    // Default to current month
    const now = new Date();
    const targetMes = typeof mes === "number" && mes >= 1 && mes <= 12 ? mes : now.getMonth() + 1;
    const targetAno = typeof ano === "number" ? ano : now.getFullYear();

    const { startDate, endDate } = getMonthBounds(targetAno, targetMes);

    // ── Saldo inicial: realized entries - realized expenses up to the day BEFORE the target month ──
    const { data: saldoInicialData, error: saldoErr } = await adm
      .from("fluxo_caixa_realizado")
      .select("categoria, valor_realizado")
      .eq("org_id", org_id)
      .lt("data_realizada", startDate);

    if (saldoErr) throw saldoErr;

    let saldoInicial = 0;
    for (const r of saldoInicialData ?? []) {
      const valor = Number(r.valor_realizado) || 0;
      const cat = (r.categoria || "").toLowerCase();
      if (cat === "entrada") {
        saldoInicial += valor;
      } else {
        saldoInicial -= valor;
      }
    }

    // ── Entradas/saídas previstas for the target month ──
    const { data: previsoes, error: prevErr } = await adm
      .from("fluxo_caixa_previsao")
      .select("categoria, tipo, valor_previsto")
      .eq("org_id", org_id)
      .gte("data_prevista", startDate)
      .lt("data_prevista", endDate);

    if (prevErr) throw prevErr;

    let entradasPrevistas = 0;
    let saidasPrevistas = 0;
    for (const p of previsoes ?? []) {
      const valor = Number(p.valor_previsto) || 0;
      const cat = (p.categoria || p.tipo || "saida").toLowerCase();
      if (cat === "entrada") {
        entradasPrevistas += valor;
      } else {
        saidasPrevistas += valor;
      }
    }

    // ── Realizado (entradas/saídas) up to today within the target month ──
    const { data: realizados, error: realErr } = await adm
      .from("fluxo_caixa_realizado")
      .select("categoria, valor_realizado")
      .eq("org_id", org_id)
      .gte("data_realizada", startDate)
      .lt("data_realizada", endDate);

    if (realErr) throw realErr;

    let realizadoEntradas = 0;
    let realizadoSaidas = 0;
    for (const r of realizados ?? []) {
      const valor = Number(r.valor_realizado) || 0;
      const cat = (r.categoria || "").toLowerCase();
      if (cat === "entrada") {
        realizadoEntradas += valor;
      } else {
        realizadoSaidas += valor;
      }
    }

    // ── Calculate projected and real balances ──
    const saldoProjetado = saldoInicial + entradasPrevistas - saidasPrevistas;
    const saldoReal = saldoInicial + realizadoEntradas - realizadoSaidas;

    const result: ConsolidationResult = {
      mes: targetMes,
      ano: targetAno,
      saldo_inicial: Math.round(saldoInicial * 100) / 100,
      entradas_previstas: Math.round(entradasPrevistas * 100) / 100,
      saidas_previstas: Math.round(saidasPrevistas * 100) / 100,
      realizado_entradas: Math.round(realizadoEntradas * 100) / 100,
      realizado_saidas: Math.round(realizadoSaidas * 100) / 100,
      saldo_projetado: Math.round(saldoProjetado * 100) / 100,
      saldo_real: Math.round(saldoReal * 100) / 100,
    };

    return jsonResponse(result);
  } catch (err) {
    console.error("Erro em consolidar-fluxo-caixa", err);
    const message =
      err instanceof Error
        ? err.message
        : "Erro interno ao consolidar fluxo de caixa";
    return jsonResponse({ error: message }, 500);
  }
});
