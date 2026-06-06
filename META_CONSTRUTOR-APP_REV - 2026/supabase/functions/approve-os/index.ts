// approve-os/index.ts
// Approves or rejects an Ordem de Servico (OS)
// Creates tables inline if they do not exist

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

async function ensureTables(adm: ReturnType<typeof createAdminClient>): Promise<void> {
  const sql = `
    CREATE TABLE IF NOT EXISTS ordens_servico (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID NOT NULL,
      obra_id UUID,
      titulo TEXT NOT NULL,
      descricao TEXT,
      status TEXT NOT NULL DEFAULT 'pendente',
      prioridade TEXT DEFAULT 'media',
      data_abertura TIMESTAMPTZ DEFAULT NOW(),
      data_vencimento TIMESTAMPTZ,
      data_conclusao TIMESTAMPTZ,
      responsavel_id UUID,
      responsavel_nome TEXT,
      created_by UUID,
      updated_by UUID,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS os_auditoria (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      os_id UUID NOT NULL REFERENCES ordens_servico(id),
      status_anterior TEXT,
      status_novo TEXT NOT NULL,
      motivo TEXT,
      alterado_por UUID,
      alterado_por_nome TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  const { error } = await adm.rpc("exec_sql", { query_text: sql });
  if (error) {
    console.warn("exec_sql RPC not available, trying raw query via REST API fallback");
    // Fallback: direct SQL via REST (some Supabase projects allow rest/v1/rpc/exec_sql)
    console.log("Tables may need to be created manually via migration.");
    // Non-blocking: function still works if tables exist
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adm = createAdminClient();
    const body = await req.json().catch(() => ({}));
    const { os_id, status, motivo } = body as {
      os_id: string;
      status: "aprovado" | "rejeitado";
      motivo?: string;
    };

    if (!os_id || !status) {
      return jsonResponse({ error: "os_id e status são obrigatórios" }, 400);
    }

    if (!["aprovado", "rejeitado"].includes(status)) {
      return jsonResponse({ error: "status deve ser 'aprovado' ou 'rejeitado'" }, 400);
    }

    await ensureTables(adm);

    // Get current OS
    const { data: os, error: osErr } = await adm
      .from("ordens_servico")
      .select("id, status, titulo")
      .eq("id", os_id)
      .single();

    if (osErr || !os) {
      return jsonResponse({ error: "Ordem de Serviço não encontrada" }, 404);
    }

    if (os.status === "aprovado" || os.status === "rejeitado") {
      return jsonResponse({ error: "Ordem de Serviço já foi finalizada" }, 409);
    }

    const now = new Date().toISOString();
    const newStatus = status === "aprovado" ? "aprovado" : "rejeitado";

    // Update OS status
    const { error: updateErr } = await adm
      .from("ordens_servico")
      .update({
        status: newStatus,
        updated_at: now,
        ...(status === "aprovado" ? { data_conclusao: now } : {}),
      })
      .eq("id", os_id);

    if (updateErr) throw updateErr;

    // Record audit
    const auditData: Record<string, unknown> = {
      os_id,
      status_anterior: os.status,
      status_novo: newStatus,
      motivo: motivo || null,
      created_at: now,
    };

    try {
      await adm.from("os_auditoria").insert(auditData);
    } catch (auditErr) {
      console.warn("Could not record audit (table may not exist):", auditErr);
    }

    return jsonResponse({ status: "ok", os_id, new_status: newStatus });
  } catch (err) {
    console.error("Erro em approve-os", err);
    const message = err instanceof Error ? err.message : "Erro interno ao aprovar/rejeitar OS";
    return jsonResponse({ error: message }, 500);
  }
});
