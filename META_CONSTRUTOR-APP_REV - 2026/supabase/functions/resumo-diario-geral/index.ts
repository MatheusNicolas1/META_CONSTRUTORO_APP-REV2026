import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

type ResumoGeralInput = {
  org_id: string;
  data: string; // formato "YYYY-MM-DD"
};

type NichoResumo = {
  nicho: string;
  slug: string;
  total_rdos: number;
  ocorrencias_criticas: number;
  status: string;
  resumo_curto: string;
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: { code: "METHOD_NOT_ALLOWED", message: "Use POST" } }, 405);
  }

  try {
    const { org_id, data } = (await req.json()) as ResumoGeralInput;

    if (!org_id || !data) {
      return jsonResponse(
        { error: { code: "VALIDATION_ERROR", message: "org_id e data sao obrigatorios" } },
        400,
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Buscar todos os nichos ativos da org
    const { data: nichos, error: nichosError } = await supabaseAdmin
      .from("rdo_nichos")
      .select("id, nome, slug")
      .eq("org_id", org_id)
      .eq("ativo", true)
      .order("ordem", { ascending: true });

    if (nichosError) {
      return jsonResponse({ error: { code: "QUERY_ERROR", message: nichosError.message } }, 500);
    }

    const nichosList = nichos || [];

    if (nichosList.length === 0) {
      return jsonResponse({
        data,
        total_rdos: 0,
        total_nichos: 0,
        nichos: [],
        status_geral: "NORMAL",
        resumo_geral: `Nenhum nicho ativo encontrado para a organização em ${formatarDataBR(data)}.`,
      });
    }

    // 2. Buscar RDOs da org na data (todos os nichos)
    const dataInicio = data + "T00:00:00-03:00";
    const dataFim = data + "T23:59:59-03:00";

    const { data: rdos, error: rdosError } = await supabaseAdmin
      .from("rdos")
      .select(`
        id,
        nicho_id,
        status,
        detalhes,
        rdo_equipamentos (id, status, descricao_problema)
      `)
      .eq("org_id", org_id)
      .gte("data", dataInicio)
      .lte("data", dataFim)
      .in("status", ["SUBMITTED", "APPROVED", "Aguardando aprovação", "Aprovado"]);

    if (rdosError) {
      return jsonResponse({ error: { code: "QUERY_ERROR", message: rdosError.message } }, 500);
    }

    const rdosList = rdos || [];
    const totalRdos = rdosList.length;

    // 3. Agrupar por nicho
    const nichoIndexMap = new Map<string, number>();
    const nichosResumo: NichoResumo[] = [];
    const nichoRdosMap = new Map<string, typeof rdosList>();

    for (const nicho of nichosList) {
      const idx = nichosResumo.length;
      nichoIndexMap.set(nicho.id, idx);
      nichosResumo.push({
        nicho: nicho.nome,
        slug: nicho.slug,
        total_rdos: 0,
        ocorrencias_criticas: 0,
        status: "NORMAL",
        resumo_curto: "",
      });
      nichoRdosMap.set(nicho.id, []);
    }

    let totalOcorrenciasCriticasGeral = 0;
    let temAcidenteGraveGeral = false;

    for (const rdo of rdosList) {
      const nichoId = (rdo.nicho_id as string) || "";
      const idx = nichoIndexMap.get(nichoId);
      if (idx === undefined) continue; // RDO sem nicho ou nicho inativo — ignorar

      const nr = nichosResumo[idx];
      nr.total_rdos++;

      // Equipamentos quebrados direto da tabela
      const equipamentos = (rdo.rdo_equipamentos as Array<Record<string, unknown>>) || [];
      for (const eq of equipamentos) {
        if (eq.status === "Quebrado") {
          nr.ocorrencias_criticas++;
          totalOcorrenciasCriticasGeral++;
        }
      }

      // Ocorrências do JSONB detalhes
      const detalhes = (rdo.detalhes as Record<string, unknown>) || {};

      const eqQuebradosJSON = (detalhes.equipamentosQuebrados as Array<Record<string, unknown>>) || [];
      for (const eq of eqQuebradosJSON) {
        nr.ocorrencias_criticas++;
        totalOcorrenciasCriticasGeral++;
      }

      const acidentes = (detalhes.acidentes as Array<Record<string, unknown>>) || [];
      for (const ac of acidentes) {
        const gravidade = (ac.gravidade as string) || "Leve";
        if (gravidade === "Grave") {
          temAcidenteGraveGeral = true;
        }
        if (gravidade === "Grave" || gravidade === "Moderado") {
          nr.ocorrencias_criticas++;
          totalOcorrenciasCriticasGeral++;
        }
      }
    }

    // 4. Determinar status por nicho e gerar resumo_curto
    for (const nr of nichosResumo) {
      if (nr.total_rdos === 0) {
        nr.status = "NORMAL";
        nr.resumo_curto = "Nenhum RDO registrado.";
        continue;
      }

      // Status: CRÍTICO se alguma ocorrência grave, ALERTA se 3+, ATENÇÃO se 1-2, NORMAL se 0
      // (recalcula localmente — simplificado; para precisão exata precisaríamos do temAcidenteGrave por nicho)
      if (nr.ocorrencias_criticas >= 3) {
        nr.status = "ALERTA";
      } else if (nr.ocorrencias_criticas >= 1) {
        nr.status = "ATENÇÃO";
      } else {
        nr.status = "NORMAL";
      }

      // Resumo curto
      if (nr.ocorrencias_criticas > 0) {
        nr.resumo_curto = `${nr.total_rdos} RDO(s), ${nr.ocorrencias_criticas} ocorrência(s) crítica(s).`;
      } else {
        nr.resumo_curto = `${nr.total_rdos} RDO(s), sem ocorrências críticas.`;
      }
    }

    // 4b. Verificar nicho com acidente grave específico (percorrer RDOs novamente)
    for (const rdo of rdosList) {
      const nichoId = (rdo.nicho_id as string) || "";
      const idx = nichoIndexMap.get(nichoId);
      if (idx === undefined) continue;

      const detalhes = (rdo.detalhes as Record<string, unknown>) || {};
      const acidentes = (detalhes.acidentes as Array<Record<string, unknown>>) || [];
      for (const ac of acidentes) {
        if ((ac.gravidade as string) === "Grave") {
          nichosResumo[idx].status = "CRÍTICO";
          nichosResumo[idx].resumo_curto += " Acidente grave reportado.";
        }
      }
    }

    // 5. Determinar status geral
    let statusGeral: "NORMAL" | "ATENÇÃO" | "ALERTA" | "CRÍTICO" = "NORMAL";
    if (temAcidenteGraveGeral) {
      statusGeral = "CRÍTICO";
    } else if (totalOcorrenciasCriticasGeral >= 3) {
      statusGeral = "ALERTA";
    } else if (totalOcorrenciasCriticasGeral >= 1) {
      statusGeral = "ATENÇÃO";
    }

    // 6. Gerar resumo_geral em português brasileiro
    const partesResumo: string[] = [];
    partesResumo.push(`Resumo geral da obra para ${formatarDataBR(data)}.`);

    if (totalRdos === 0) {
      partesResumo.push("Nenhum RDO registrado ou aprovado neste dia.");
    } else {
      partesResumo.push(`Foram registrados ${totalRdos} RDO(s) distribuídos em ${nichosList.length} nicho(s).`);

      const nichosComRDO = nichosResumo.filter((n) => n.total_rdos > 0);
      if (nichosComRDO.length > 0) {
        const nomesNichos = nichosComRDO.map((n) => `${n.nicho} (${n.total_rdos} RDO)`);
        partesResumo.push(`Nichos com atividade: ${nomesNichos.join(", ")}.`);
      }

      if (totalOcorrenciasCriticasGeral > 0) {
        partesResumo.push(`Total de ${totalOcorrenciasCriticasGeral} ocorrência(s) crítica(s) no dia.`);
        const nichosCriticos = nichosResumo.filter(
          (n) => n.status === "CRÍTICO" || n.status === "ALERTA",
        );
        if (nichosCriticos.length > 0) {
          const alertas = nichosCriticos.map((n) => `${n.nicho} (${n.status})`);
          partesResumo.push(`Nichos em alerta ou crítico: ${alertas.join(", ")}.`);
        }
      }

      if (temAcidenteGraveGeral) {
        partesResumo.push("ATENÇÃO: Houve pelo menos um acidente grave reportado no dia.");
      }
    }

    const resumo_geral = partesResumo.join(" ");

    // 7. Montar response no formato ResumoGeral
    return jsonResponse({
      data,
      total_rdos: totalRdos,
      total_nichos: nichosList.length,
      nichos: nichosResumo,
      status_geral: statusGeral,
      resumo_geral,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno do servidor";
    return jsonResponse({ error: { code: "INTERNAL_ERROR", message } }, 500);
  }
});

function formatarDataBR(dataStr: string): string {
  const [ano, mes, dia] = dataStr.split("-");
  const meses = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  return `${parseInt(dia)} de ${meses[parseInt(mes) - 1]} de ${ano}`;
}
