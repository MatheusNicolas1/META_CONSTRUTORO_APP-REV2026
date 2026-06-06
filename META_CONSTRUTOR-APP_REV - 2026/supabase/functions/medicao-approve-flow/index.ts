// medicao-approve-flow/index.ts
// Fluxo de aprovação de medições em dois níveis: campo e financeiro
//
// Fluxo:
//   Recebe { medicao_id, nivel: 'campo'|'financeiro', aprovado_por, status, observacoes }
//   Se nivel='campo': atualiza de 'pendente_campo' para 'aprovado_campo' ou 'rejeitado'
//   Se nivel='financeiro': atualiza de 'pendente_financeiro' para 'aprovado_financeiro' ou 'rejeitado'
//   Se aprovado_financeiro: gera boletins_medicao automaticamente
//   Retorna { medicao_id, novo_status, boletim_gerado? }

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
    const { medicao_id, nivel, aprovado_por, status, observacoes } = body as {
      medicao_id: string;
      nivel: "campo" | "financeiro";
      aprovado_por?: string;
      status: string;
      observacoes?: string;
    };

    // --- Validações de entrada ---
    if (!medicao_id) {
      return jsonResponse({ error: "medicao_id é obrigatório" }, 400);
    }
    if (!nivel || !["campo", "financeiro"].includes(nivel)) {
      return jsonResponse(
        { error: "nivel deve ser 'campo' ou 'financeiro'" },
        400
      );
    }
    if (!status) {
      return jsonResponse({ error: "status é obrigatório" }, 400);
    }

    // --- Buscar medição atual ---
    let medicao: Record<string, unknown> | null = null;
    try {
      const { data, error } = await adm
        .from("medicoes")
        .select("*")
        .eq("id", medicao_id)
        .single();

      if (error && error.code === "42P01") {
        // Tabela não existe — tentar criar via exec_sql
        try {
          await adm.rpc("exec_sql", {
            query_text: `
              CREATE TABLE IF NOT EXISTS medicoes (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                org_id UUID NOT NULL,
                obra_id UUID,
                contrato_id UUID,
                numero_medicao INTEGER,
                competencia TEXT,
                descricao TEXT,
                valor_medido NUMERIC DEFAULT 0,
                valor_apurar NUMERIC DEFAULT 0,
                valor_aprovado_campo NUMERIC,
                valor_aprovado_financeiro NUMERIC,
                status TEXT DEFAULT 'pendente_campo',
                observacao TEXT,
                medido_por TEXT,
                aprovado_campo_por TEXT,
                aprovado_financeiro_por TEXT,
                data_medicao DATE,
                data_aprovacao_campo TIMESTAMPTZ,
                data_aprovacao_financeiro TIMESTAMPTZ,
                created_by UUID,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
              );
            `,
          });
        } catch {
          console.warn("Não foi possível criar tabela medicoes via exec_sql");
        }
        return jsonResponse(
          { error: "Tabela medicoes não encontrada. Estrutura criada, tente novamente." },
          404
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

    const currentStatus = (medicao.status as string) || "";

    // --- Validações de fluxo ---
    if (nivel === "campo") {
      const statusEsperado = ["pendente_campo", "pendente"];
      if (!statusEsperado.includes(currentStatus)) {
        return jsonResponse(
          {
            error: `Status atual "${currentStatus}" não permite aprovação de campo. Status esperado: ${statusEsperado.join(" ou ")}`,
          },
          409
        );
      }

      const allowedStatuses = ["aprovado_campo", "rejeitado_campo"];
      if (!allowedStatuses.includes(status)) {
        return jsonResponse(
          { error: `Para nível 'campo', status deve ser ${allowedStatuses.join(" ou ")}` },
          400
        );
      }
    }

    if (nivel === "financeiro") {
      if (!["aprovado_campo", "pendente_financeiro"].includes(currentStatus)) {
        return jsonResponse(
          {
            error: `Status atual "${currentStatus}" não permite aprovação financeira. É necessário aprovação de campo primeiro.`,
          },
          409
        );
      }

      const allowedStatuses = ["aprovado_financeiro", "rejeitado_financeiro"];
      if (!allowedStatuses.includes(status)) {
        return jsonResponse(
          { error: `Para nível 'financeiro', status deve ser ${allowedStatuses.join(" ou ")}` },
          400
        );
      }
    }

    // --- Montar dados de atualização ---
    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = {
      status,
      observacao: observacoes ?? medicao.observacao ?? null,
      updated_at: now,
    };

    if (nivel === "campo") {
      updateData.aprovado_campo_por = aprovado_por || null;
      updateData.data_aprovacao_campo = now;

      if (status === "aprovado_campo") {
        // Avança para pendente_financeiro
        updateData.valor_aprovado_campo = medicao.valor_medido ?? medicao.valor_apurar ?? 0;
      }
    }

    if (nivel === "financeiro") {
      updateData.aprovado_financeiro_por = aprovado_por || null;
      updateData.data_aprovacao_financeiro = now;

      if (status === "aprovado_financeiro") {
        updateData.valor_aprovado_financeiro =
          medicao.valor_aprovado_campo ?? medicao.valor_medido ?? medicao.valor_apurar ?? 0;
      }
    }

    // --- Executar update ---
    const { error: updateErr } = await adm
      .from("medicoes")
      .update(updateData)
      .eq("id", medicao_id);

    if (updateErr) {
      console.error("Erro ao atualizar medição", updateErr);
      return jsonResponse(
        { error: "Erro ao atualizar medição: " + updateErr.message },
        500
      );
    }

    // --- Se aprovado_financeiro, gerar boletim automaticamente ---
    let boletimGerado = false;
    if (nivel === "financeiro" && status === "aprovado_financeiro") {
      try {
        await adm.from("boletim_medicao").insert({
          medicao_id,
          org_id: medicao.org_id,
          obra_id: medicao.obra_id,
          dados_boletim: {
            cabecalho: {
              medicao_id,
              numero_medicao: medicao.numero_medicao,
              competencia: medicao.competencia,
              data_geracao: now,
              obra_id: medicao.obra_id,
              contrato_id: medicao.contrato_id,
            },
            resumo: {
              valor_medido: medicao.valor_medido ?? 0,
              valor_aprovado_campo: medicao.valor_aprovado_campo ?? 0,
              valor_aprovado_financeiro: updateData.valor_aprovado_financeiro ?? 0,
              status,
            },
            aprovacoes: {
              campo: {
                aprovado_por: medicao.aprovado_campo_por,
                data: medicao.data_aprovacao_campo,
              },
              financeiro: {
                aprovado_por: aprovado_por || medicao.aprovado_financeiro_por || null,
                data: now,
              },
            },
            observacoes: observacoes || medicao.observacao || null,
          },
          gerado_em: now,
        });
        boletimGerado = true;
      } catch (e) {
        console.warn("Não foi possível gerar boletim automaticamente", e);
        // Non-fatal: a aprovação já ocorreu
      }
    }

    return jsonResponse({
      medicao_id,
      novo_status: status,
      boletim_gerado: boletimGerado,
      nivel_aprovacao: nivel,
      aprovado_por: aprovado_por || null,
    });
  } catch (err) {
    console.error("Erro em medicao-approve-flow", err);
    const message = err instanceof Error
      ? err.message
      : "Erro interno ao processar aprovação de medição";
    return jsonResponse({ error: message }, 500);
  }
});
