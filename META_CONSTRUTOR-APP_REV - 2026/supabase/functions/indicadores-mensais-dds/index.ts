// indicadores-mensais-dds/index.ts
// Retorna indicadores mensais de DDS para dashboard

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
    const agora = new Date();

    const {
      org_id,
      mes = agora.getMonth() + 1,
      ano = agora.getFullYear(),
    } = body as {
      org_id: string;
      mes?: number;
      ano?: number;
    };

    if (!org_id) {
      return jsonResponse({ error: "org_id é obrigatório" }, 400);
    }

    const mesStr = String(mes).padStart(2, "0");
    const startDate = `${ano}-${mesStr}-01`;
    // Último dia do mês
    const endDate = new Date(ano, mes, 0).toISOString().slice(0, 10);

    // --- 1. Total de registros no mês ---
    const { count: total_registros, error: countErr } = await adm
      .from("dds_registros")
      .select("*", { count: "exact", head: true })
      .eq("org_id", org_id)
      .gte("data", startDate)
      .lte("data", endDate);

    if (countErr) {
      if (countErr.code === "42P01") {
        return jsonResponse({
          mes,
          ano,
          indicadores: {
            total_registros: 0,
            total_realizados: 0,
            total_pendentes: 0,
            total_cancelados: 0,
            participantes_unicos: 0,
          },
          meta: null,
          percentual: 0,
          temas_top: [],
          mensagem:
            "Nenhum indicador disponível. Tabela dds_registros pode não existir.",
        });
      }
      throw countErr;
    }

    // --- 2. Contagens por status ---
    const { data: statusCounts, error: statusErr } = await adm
      .from("dds_registros")
      .select("status")
      .eq("org_id", org_id)
      .gte("data", startDate)
      .lte("data", endDate);

    if (statusErr) throw statusErr;

    const registros = statusCounts || [];
    const total_realizados = registros.filter(
      (r) => r.status === "realizado"
    ).length;
    const total_pendentes = registros.filter(
      (r) => r.status === "pendente"
    ).length;
    const total_cancelados = registros.filter(
      (r) => r.status === "cancelado"
    ).length;

    // --- 3. Participantes únicos no mês ---
    // Busca os dds_ids do mês para filtrar participantes
    const { data: ddsIds, error: ddsIdsErr } = await adm
      .from("dds_registros")
      .select("id")
      .eq("org_id", org_id)
      .gte("data", startDate)
      .lte("data", endDate);

    if (ddsIdsErr) throw ddsIdsErr;

    let participantes_unicos = 0;
    if (ddsIds && ddsIds.length > 0) {
      const ids = ddsIds.map((d) => d.id);

      const { data: participantes, error: partErr } = await adm
        .from("dds_participantes")
        .select("nome")
        .in("dds_id", ids);

      if (partErr) throw partErr;

      const nomesUnicos = new Set(
        (participantes || []).map((p) => p.nome?.trim().toLowerCase()).filter(Boolean)
      );
      participantes_unicos = nomesUnicos.size;
    }

    // --- 4. Temas mais usados (top 5) ---
    // Buscar temas dos registros do mês
    const { data: temasData, error: temasErr } = await adm
      .from("dds_registros")
      .select("tema")
      .eq("org_id", org_id)
      .gte("data", startDate)
      .lte("data", endDate);

    if (temasErr) throw temasErr;

    const temaFreq: Record<string, number> = {};
    for (const t of temasData || []) {
      const nome = t.tema?.trim() || "Sem tema";
      temaFreq[nome] = (temaFreq[nome] || 0) + 1;
    }

    const temas_top = Object.entries(temaFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tema, frequencia]) => ({ tema, frequencia }));

    // --- 5. Meta mensal de DDS ---
    const { data: perfil, error: perfilErr } = await adm
      .from("perfil_empresa_seguranca")
      .select("meta_dds_mensal")
      .eq("org_id", org_id)
      .maybeSingle();

    if (perfilErr) throw perfilErr;

    const meta = perfil?.meta_dds_mensal ?? null;
    const percentual =
      meta && meta > 0
        ? Math.round((total_realizados / meta) * 10000) / 100
        : 0;

    return jsonResponse({
      mes,
      ano,
      indicadores: {
        total_registros: total_registros || 0,
        total_realizados,
        total_pendentes,
        total_cancelados,
        participantes_unicos,
      },
      meta,
      percentual,
      temas_top,
    });
  } catch (err) {
    console.error("Erro em indicadores-mensais-dds", err);
    const message =
      err instanceof Error
        ? err.message
        : "Erro interno ao calcular indicadores mensais de DDS";
    return jsonResponse({ error: message }, 500);
  }
});
