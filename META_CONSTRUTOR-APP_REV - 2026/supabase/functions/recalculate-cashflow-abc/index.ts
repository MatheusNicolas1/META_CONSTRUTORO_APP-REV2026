// recalculate-cashflow-abc/index.ts
// Recalculates Curva ABC data from previsao and realizado tables

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
    const { org_id, obra_id } = body as { org_id: string; obra_id?: string };

    if (!org_id || typeof org_id !== "string") {
      return jsonResponse({ error: "org_id é obrigatório" }, 400);
    }

    // Build query filter for previsoes
    const prevFilter: Record<string, unknown> = { org_id };
    if (obra_id) prevFilter.obra_id = obra_id;

    const { data: previsoes, error: prevErr } = await adm
      .from("fluxo_caixa_previsao")
      .select("obra_id, tipo, categoria, valor_previsto, alerta_percentual")
      .match(prevFilter);

    if (prevErr) throw prevErr;

    // Build query filter for realizado
    const realFilter: Record<string, unknown> = { org_id };
    if (obra_id) realFilter.obra_id = obra_id;

    const { data: realizados, error: realErr } = await adm
      .from("fluxo_caixa_realizado")
      .select("obra_id, categoria, valor_realizado")
      .match(realFilter);

    if (realErr) throw realErr;

    // Group previsoes by obra
    const obrasPrevisoes: Record<string, { entrada: number; saida: number }> = {};
    for (const p of previsoes ?? []) {
      const oid = p.obra_id || "sem_obra";
      if (!obrasPrevisoes[oid]) obrasPrevisoes[oid] = { entrada: 0, saida: 0 };
      const cat = (p.categoria || p.tipo || "saida").toLowerCase();
      if (cat === "entrada" || p.tipo === "entrada") {
        obrasPrevisoes[oid].entrada += Number(p.valor_previsto) || 0;
      } else {
        obrasPrevisoes[oid].saida += Number(p.valor_previsto) || 0;
      }
    }

    // Group realizados by obra
    const obrasRealizados: Record<string, { entrada: number; saida: number }> = {};
    for (const r of realizados ?? []) {
      const oid = r.obra_id || "sem_obra";
      if (!obrasRealizados[oid]) obrasRealizados[oid] = { entrada: 0, saida: 0 };
      const cat = (r.categoria || "").toLowerCase();
      if (cat === "entrada") {
        obrasRealizados[oid].entrada += Number(r.valor_realizado) || 0;
      } else {
        obrasRealizados[oid].saida += Number(r.valor_realizado) || 0;
      }
    }

    const allObraIds = new Set([
      ...Object.keys(obrasPrevisoes),
      ...Object.keys(obrasRealizados),
    ]);

    const competencia = new Date().toISOString().slice(0, 7);
    const alertas: Array<{ obra_id: string; desvio: number; limite: number }> = [];
    let obrasProcessadas = 0;

    for (const oid of allObraIds) {
      if (oid === "sem_obra") continue;

      const planejado = obrasPrevisoes[oid]?.entrada || 0;
      const realizado = obrasRealizados[oid]?.entrada || 0;
      const percentualPlanejado = planejado > 0 ? (planejado / (planejado + (obrasPrevisoes[oid]?.saida || 1))) * 100 : 0;
      const percentualRealizado = (realizado > 0 && planejado > 0) ? (realizado / planejado) * 100 : 0;
      const desvio = percentualRealizado - percentualPlanejado;

      // Get alerta_percentual from first previsao of this obra, or default to 20%
      const prevObra = (previsoes ?? []).find((p) => p.obra_id === oid);
      const limiteAlerta = Number(prevObra?.alerta_percentual) || 20;

      const basePlanejada = planejado + (obrasPrevisoes[oid]?.saida || 0);
      const baseRealizada = (realizados ?? [])
        .filter((r) => r.obra_id === oid)
        .reduce((s, r) => s + Number(r.valor_realizado || 0), 0);

      const logStatus = Math.abs(desvio) > limiteAlerta ? "alerta" : "ok";

      if (logStatus === "alerta") {
        alertas.push({ obra_id: oid, desvio: Math.round(desvio * 100) / 100, limite: limiteAlerta });
      }

      // Upsert into curva_abc_log
      const { data: existing } = await adm
        .from("curva_abc_log")
        .select("id")
        .eq("org_id", org_id)
        .eq("obra_id", oid)
        .eq("competencia", competencia)
        .maybeSingle();

      const snapshot = {
        previsoes: obrasPrevisoes[oid] || { entrada: 0, saida: 0 },
        realizados: obrasRealizados[oid] || { entrada: 0, saida: 0 },
      };

      const logData = {
        org_id,
        obra_id: oid,
        competencia,
        base_planejada: basePlanejada,
        base_realizada: baseRealizada,
        percentual_planejado: Math.round(percentualPlanejado * 100) / 100,
        percentual_realizado: Math.round(percentualRealizado * 100) / 100,
        desvio_percentual: Math.round(desvio * 100) / 100,
        limite_alerta_percentual: limiteAlerta,
        status: logStatus,
        snapshot,
        gerado_por: "system",
        generated_at: new Date().toISOString(),
      };

      if (existing) {
        await adm.from("curva_abc_log").update(logData).eq("id", existing.id);
      } else {
        await adm.from("curva_abc_log").insert(logData);
      }

      obrasProcessadas++;
    }

    return jsonResponse({
      status: "ok",
      obras_processadas: obrasProcessadas,
      alertas,
    });
  } catch (err) {
    console.error("Erro em recalculate-cashflow-abc", err);
    const message = err instanceof Error ? err.message : "Erro interno ao recalcular Curva ABC";
    return jsonResponse({ error: message }, 500);
  }
});
