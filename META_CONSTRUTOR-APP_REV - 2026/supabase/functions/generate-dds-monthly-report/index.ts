// generate-dds-monthly-report/index.ts
// Generates monthly consolidated DDS report

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
    const { org_id, obra_id, mes, ano } = body as {
      org_id: string;
      obra_id?: string;
      mes: number;
      ano: number;
    };

    if (!org_id || mes === undefined || !ano) {
      return jsonResponse({ error: "org_id, mes e ano são obrigatórios" }, 400);
    }

    const mesStr = String(mes).padStart(2, "0");
    const startDate = `${ano}-${mesStr}-01`;
    const endDate = `${ano}-${mesStr}-31`;

    // Try to query DDS table
    let ddsQuery = adm
      .from("dds")
      .select("*, dds_participants(*)")
      .eq("org_id", org_id)
      .gte("data_realizacao", startDate)
      .lte("data_realizacao", endDate);

    if (obra_id) {
      ddsQuery = ddsQuery.eq("obra_id", obra_id);
    }

    const { data: ddsList, error: ddsErr } = await ddsQuery.order("data_realizacao", { ascending: true });

    if (ddsErr) {
      // If table doesn't exist, return empty report
      if (ddsErr.code === "42P01") {
        return jsonResponse({
          total_dds: 0,
          participantes_unicos: 0,
          temas: [],
          por_obra: {},
          message: "Nenhum DDS encontrado para o período. Tabela dds pode não existir.",
          mes,
          ano,
        });
      }
      throw ddsErr;
    }

    if (!ddsList || ddsList.length === 0) {
      return jsonResponse({
        total_dds: 0,
        participantes_unicos: 0,
        temas: [],
        por_obra: {},
        mes,
        ano,
      });
    }

    // Count participants
    const allParticipants = new Set<string>();
    const themeCount: Record<string, number> = {};
    const obraCount: Record<string, number> = {};

    for (const dds of ddsList) {
      // Count themes
      const tema = dds.tema || "Sem tema";
      themeCount[tema] = (themeCount[tema] || 0) + 1;

      // Count by obra
      const oid = dds.obra_id || "sem_obra";
      obraCount[oid] = (obraCount[oid] || 0) + 1;

      // Collect participants
      if (dds.dds_participants && Array.isArray(dds.dds_participants)) {
        for (const p of dds.dds_participants) {
          if (p.participante_nome) allParticipants.add(p.participante_nome);
          if (p.participante_cpf) allParticipants.add(`${p.participante_nome}-${p.participante_cpf}`);
        }
      }
    }

    const temas = Object.entries(themeCount).map(([tema, quantidade]) => ({
      tema,
      quantidade,
      percentual: Math.round((quantidade / ddsList.length) * 100 * 100) / 100,
    }));

    return jsonResponse({
      total_dds: ddsList.length,
      participantes_unicos: allParticipants.size,
      temas,
      por_obra: obraCount,
      mes,
      ano,
      detalhes: ddsList.map((d) => ({
        id: d.id,
        tema: d.tema,
        data_realizacao: d.data_realizacao,
        obra_id: d.obra_id,
        responsavel: d.responsavel_nome,
        participantes_count: d.dds_participants?.length || 0,
      })),
    });
  } catch (err) {
    console.error("Erro em generate-dds-monthly-report", err);
    const message = err instanceof Error ? err.message : "Erro interno ao gerar relatório mensal de DDS";
    return jsonResponse({ error: message }, 500);
  }
});
