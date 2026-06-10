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

type ResumoNichoInput = {
  org_id: string;
  data: string; // formato "YYYY-MM-DD"
  nicho_slug: string;
};

type Ocorrencia = {
  tipo: string;
  descricao: string;
  gravidade?: string;
  impacto?: string;
};

type MaterialFalta = {
  nome: string;
  prioridade: string;
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: { code: "METHOD_NOT_ALLOWED", message: "Use POST" } }, 405);
  }

  try {
    const { org_id, data, nicho_slug } = (await req.json()) as ResumoNichoInput;

    if (!org_id || !data || !nicho_slug) {
      return jsonResponse(
        { error: { code: "VALIDATION_ERROR", message: "org_id, data e nicho_slug sao obrigatorios" } },
        400,
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Buscar o nicho pelo slug
    const { data: nicho, error: nichoError } = await supabaseAdmin
      .from("rdo_nichos")
      .select("id, nome, slug")
      .eq("org_id", org_id)
      .eq("slug", nicho_slug)
      .single();

    if (nichoError || !nicho) {
      return jsonResponse({ error: { code: "NOT_FOUND", message: "Nicho nao encontrado" } }, 404);
    }

    // 2. Buscar RDOs da org na data filtrados pelo nicho
    // data vem como "YYYY-MM-DD", converter para timestamptz range
    const dataInicio = data + "T00:00:00-03:00";
    const dataFim = data + "T23:59:59-03:00";

    const { data: rdos, error: rdosError } = await supabaseAdmin
      .from("rdos")
      .select(`
        id,
        status,
        criado_por_id,
        detalhes,
        rdo_atividades (id, nome, categoria, status),
        rdo_equipes (id, equipe_id, horas_trabalho, presente, horas_ociosas,
          equipes (id, nome, funcao)
        ),
        rdo_equipamentos (id, status, descricao_problema, horas_parada, causou_ociosidade,
          equipamentos (id, nome, categoria)
        )
      `)
      .eq("org_id", org_id)
      .eq("nicho_id", nicho.id)
      .gte("data", dataInicio)
      .lte("data", dataFim)
      .in("status", ["SUBMITTED", "APPROVED", "Aguardando aprovação", "Aprovado"]);

    if (rdosError) {
      return jsonResponse({ error: { code: "QUERY_ERROR", message: rdosError.message } }, 500);
    }

    const rdosList = rdos || [];
    const totalRdos = rdosList.length;

    // 3. Agregar dados
    let totalAtividades = 0;
    const equipeIds = new Set<string>();
    const todasOcorrencias: Ocorrencia[] = [];
    const todosMateriaisFalta: MaterialFalta[] = [];
    const colaboradoresIds = new Set<string>();
    let temAcidenteGrave = false;
    let totalOcorrenciasCriticas = 0;

    for (const rdo of rdosList) {
      // Atividades
      const atividades = (rdo.rdo_atividades as Array<Record<string, unknown>>) || [];
      totalAtividades += atividades.length;

      // Equipes
      const equipes = (rdo.rdo_equipes as Array<Record<string, unknown>>) || [];
      for (const eq of equipes) {
        const equipeData = eq.equipes as Record<string, unknown> | null;
        if (equipeData?.id) equipeIds.add(equipeData.id as string);
      }

      // Colaboradores que criaram RDOs
      if (rdo.criado_por_id) colaboradoresIds.add(rdo.criado_por_id as string);

      // Ocorrências de equipamentos quebrados (rdo_equipamentos com status 'Quebrado')
      const equipamentos = (rdo.rdo_equipamentos as Array<Record<string, unknown>>) || [];
      for (const eq of equipamentos) {
        if (eq.status === "Quebrado") {
          const eqData = eq.equipamentos as Record<string, unknown> | null;
          todasOcorrencias.push({
            tipo: "Equipamento Quebrado",
            descricao: (eq.descricao_problema as string) || `${eqData?.nome || "Equipamento"} com defeito`,
            gravidade: "Média",
            impacto: eq.causou_ociosidade ? "Causou ociosidade" : "Registrado",
          });
          totalOcorrenciasCriticas++;
        }
      }

      // Ocorrências do JSONB detalhes
      const detalhes = (rdo.detalhes as Record<string, unknown>) || {};

      // equipamentosQuebrados dentro de detalhes
      const eqQuebradosJSON = (detalhes.equipamentosQuebrados as Array<Record<string, unknown>>) || [];
      for (const eq of eqQuebradosJSON) {
        todasOcorrencias.push({
          tipo: (eq.tipoOcorrencia as string) || (eq.issueType as string) || "Equipamento Quebrado",
          descricao: (eq.descricaoProblema as string) || (eq.descricao as string) || "Ocorrência registrada",
          gravidade: "Média",
          impacto: eq.causouOciosidade ? "Causou ociosidade" : (eq.impactoProducao as string) || undefined,
        });
        totalOcorrenciasCriticas++;
      }

      // acidentes dentro de detalhes
      const acidentes = (detalhes.acidentes as Array<Record<string, unknown>>) || [];
      for (const ac of acidentes) {
        const gravidade = (ac.gravidade as string) || "Leve";
        const isGrave = gravidade === "Grave";
        if (isGrave) temAcidenteGrave = true;
        todasOcorrencias.push({
          tipo: "Acidente",
          descricao: (ac.descricao as string) || "Acidente registrado",
          gravidade,
          impacto: ac.precisouPararObra ? "Paralisou a obra" : undefined,
        });
        if (isGrave || gravidade === "Moderado") totalOcorrenciasCriticas++;

        // Colaboradores envolvidos no acidente
        const envolvidos = ac.colaboradoresEnvolvidos as string[] | undefined;
        if (envolvidos) {
          for (const nome of envolvidos) colaboradoresIds.add(nome);
        }
      }

      // materiaisFalta dentro de detalhes
      const materiaisFalta = (detalhes.materiaisFalta as Array<Record<string, unknown>>) || [];
      for (const mat of materiaisFalta) {
        const impacto = (mat.impactoProducao as string) || "Médio";
        const prioridadeMap: Record<string, string> = {
          "Alto": "Urgente",
          "Médio": "Prioritário",
          "Baixo": "Normal",
        };
        todosMateriaisFalta.push({
          nome: (mat.nome as string) || "Material não especificado",
          prioridade: prioridadeMap[impacto] || impacto,
        });
      }
    }

    // 4. Buscar nomes dos colaboradores
    const colaboradoresNomes: string[] = [];
    if (colaboradoresIds.size > 0) {
      const profileIds = Array.from(colaboradoresIds).filter((id) => id.includes("-"));
      if (profileIds.length > 0) {
        const { data: profiles } = await supabaseAdmin
          .from("profiles")
          .select("id, name")
          .in("id", profileIds);
        if (profiles) {
          for (const p of profiles) {
            if (p.name) colaboradoresNomes.push(p.name as string);
          }
        }
      }
      // Nomes que vieram diretamente de colaboradoresEnvolvidos (não UUIDs)
      for (const id of colaboradoresIds) {
        if (!id.includes("-") && !colaboradoresNomes.includes(id)) {
          colaboradoresNomes.push(id);
        }
      }
    }

    // 5. Determinar status geral
    let statusGeral: "NORMAL" | "ATENÇÃO" | "ALERTA" | "CRÍTICO" = "NORMAL";
    if (temAcidenteGrave) {
      statusGeral = "CRÍTICO";
    } else if (totalOcorrenciasCriticas >= 3) {
      statusGeral = "ALERTA";
    } else if (totalOcorrenciasCriticas >= 1) {
      statusGeral = "ATENÇÃO";
    }

    // 6. Gerar resumo_texto em português brasileiro
    const partesResumo: string[] = [];
    partesResumo.push(`Resumo do nicho "${nicho.nome}" para ${formatarDataBR(data)}.`);

    if (totalRdos === 0) {
      partesResumo.push("Nenhum RDO registrado ou aprovado neste dia para este nicho.");
    } else {
      partesResumo.push(`Foram registrados ${totalRdos} RDO(s), com ${totalAtividades} atividade(s) realizada(s) e ${equipeIds.size} equipe(s) envolvida(s).`);

      if (todasOcorrencias.length > 0) {
        const qtdEq = todasOcorrencias.filter((o) => o.tipo.includes("Equipamento")).length;
        const qtdAc = todasOcorrencias.filter((o) => o.tipo === "Acidente").length;
        const partesOcorrencias: string[] = [];
        if (qtdEq > 0) partesOcorrencias.push(`${qtdEq} ocorrência(s) com equipamento(s)`);
        if (qtdAc > 0) partesOcorrencias.push(`${qtdAc} acidente(s)`);
        partesResumo.push(`Registradas ${partesOcorrencias.join(" e ")}.`);
      }

      if (todosMateriaisFalta.length > 0) {
        const urgentes = todosMateriaisFalta.filter((m) => m.prioridade === "Urgente").length;
        if (urgentes > 0) {
          partesResumo.push(`${urgentes} material(is) em falta com prioridade urgente.`);
        } else {
          partesResumo.push(`${todosMateriaisFalta.length} material(is) em falta registrado(s).`);
        }
      }

      if (colaboradoresNomes.length > 0) {
        partesResumo.push(`Colaboradores envolvidos: ${colaboradoresNomes.join(", ")}.`);
      }
    }

    const resumo_texto = partesResumo.join(" ");

    // 7. Montar response no formato ResumoNicho
    return jsonResponse({
      data,
      nicho: nicho.nome,
      slug: nicho.slug,
      total_rdos: totalRdos,
      total_atividades: totalAtividades,
      total_equipes: equipeIds.size,
      ocorrencias: todasOcorrencias,
      materiais_em_falta: todosMateriaisFalta,
      resumo_texto,
      colaboradores_envolvidos: colaboradoresNomes,
      status_geral: statusGeral,
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
