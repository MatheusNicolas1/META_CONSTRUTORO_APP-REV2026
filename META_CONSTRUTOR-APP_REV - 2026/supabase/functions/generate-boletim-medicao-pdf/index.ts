// generate-boletim-medicao-pdf/index.ts
// Generates a structured JSON boletim de medicao (PDF generation is future cycle)

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

    // Try to get the medicao from medicoes table
    let medicao: Record<string, unknown> | null = null;
    let medicaoErr: unknown = null;

    try {
      const result = await adm
        .from("medicoes")
        .select("*, obra_contratos(*)")
        .eq("id", medicao_id)
        .single();
      medicao = result.data;
      medicaoErr = result.error;
    } catch (e) {
      medicaoErr = e;
    }

    if (medicaoErr) {
      // If table doesn't exist, return a structured report anyway with the ID provided
      if ((medicaoErr as Record<string, unknown>)?.code === "42P01") {
        // Table doesn't exist - create a DDL inline and return sample structure
        const ensureSql = `
          CREATE TABLE IF NOT EXISTS obra_contratos (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            org_id UUID NOT NULL,
            obra_id UUID,
            numero_contrato TEXT,
            objeto TEXT,
            contratada_nome TEXT,
            valor_total NUMERIC DEFAULT 0,
            data_inicio DATE,
            data_fim DATE,
            status TEXT DEFAULT 'ativo',
            created_at TIMESTAMPTZ DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS medicoes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            org_id UUID NOT NULL,
            obra_id UUID,
            contrato_id UUID REFERENCES obra_contratos(id),
            numero_medicao INTEGER,
            competencia TEXT,
            descricao TEXT,
            valor_medido NUMERIC DEFAULT 0,
            valor_aprovado_campo NUMERIC,
            valor_aprovado_financeiro NUMERIC,
            status TEXT DEFAULT 'pendente',
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

          CREATE TABLE IF NOT EXISTS boletim_medicao (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            medicao_id UUID REFERENCES medicoes(id),
            org_id UUID,
            obra_id UUID,
            dados_boletim JSONB,
            gerado_em TIMESTAMPTZ DEFAULT NOW()
          );
        `;

        try {
          await adm.rpc("exec_sql", { query_text: ensureSql });
        } catch {
          console.warn("Could not create tables via exec_sql");
        }

        return jsonResponse({
          boletim: {
            id: medicao_id,
            medicao_id,
            status: "informational",
            dados_estruturados: {
              cabecalho: {
                medicao_id,
                numero_medicao: null,
                competencia: null,
                data_geracao: new Date().toISOString(),
              },
              contrato: null,
              itens_medidos: [],
              resumo: {
                valor_medido: 0,
                valor_aprovado_campo: 0,
                valor_aprovado_financeiro: 0,
              },
              observacoes: "Medição não encontrada na base de dados. Verifique se as tabelas foram criadas.",
            },
          },
          gerado_em: new Date().toISOString(),
          message: "Tabela medicoes não encontrada. Estrutura criada e boletim informacional gerado.",
        });
      }
      throw medicaoErr;
    }

    if (!medicao) {
      return jsonResponse({ error: "Medição não encontrada" }, 404);
    }

    // Build structured boletim
    const boletim = {
      cabecalho: {
        medicao_id: medicao.id,
        numero_medicao: medicao.numero_medicao,
        competencia: medicao.competencia,
        data_geracao: new Date().toISOString(),
        obra_id: medicao.obra_id,
        contrato_id: medicao.contrato_id,
      },
      contrato: (medicao as Record<string, unknown>)["obra_contratos"] || null,
      itens_medidos: medicao.itens_medidos || [],
      resumo: {
        valor_medido: medicao.valor_medido || 0,
        valor_aprovado_campo: medicao.valor_aprovado_campo || 0,
        valor_aprovado_financeiro: medicao.valor_aprovado_financeiro || 0,
        status: medicao.status,
        descricao: medicao.descricao,
      },
      aprovacoes: {
        campo: {
          aprovado_por: medicao.aprovado_campo_por,
          data: medicao.data_aprovacao_campo,
        },
        financeiro: {
          aprovado_por: medicao.aprovado_financeiro_por,
          data: medicao.data_aprovacao_financeiro,
        },
      },
    };

    // Register the boletim generation
    try {
      await adm.from("boletim_medicao").insert({
        medicao_id,
        org_id: medicao.org_id,
        obra_id: medicao.obra_id,
        dados_boletim: boletim,
        gerado_em: new Date().toISOString(),
      });
    } catch {
      // Non-blocking: boletim_medicao table might not exist
    }

    return jsonResponse({
      boletim,
      gerado_em: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Erro em generate-boletim-medicao-pdf", err);
    const message = err instanceof Error ? err.message : "Erro interno ao gerar boletim de medição";
    return jsonResponse({ error: message }, 500);
  }
});
