// request-os-material/index.ts
// Links material requests to an Ordem de Servico (OS)

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
    const { os_id, materiais } = body as {
      os_id: string;
      materiais: Array<{ nome: string; quantidade: number; unidade: string }>;
    };

    if (!os_id) {
      return jsonResponse({ error: "os_id é obrigatório" }, 400);
    }

    if (!materiais || !Array.isArray(materiais) || materiais.length === 0) {
      return jsonResponse({ error: "materiais deve ser um array com pelo menos um item" }, 400);
    }

    for (const m of materiais) {
      if (!m.nome || !m.quantidade || !m.unidade) {
        return jsonResponse({ error: "Cada material deve ter nome, quantidade e unidade" }, 400);
      }
    }

    // Ensure OS table exists and verify OS
    const { data: os, error: osErr } = await adm
      .from("ordens_servico")
      .select("id, titulo, status")
      .eq("id", os_id)
      .single();

    if (osErr) {
      if (osErr.code === "42P01") {
        return jsonResponse({ error: "Tabela ordens_servico não encontrada. Crie a migration primeiro." }, 404);
      }
      throw osErr;
    }

    if (!os) {
      return jsonResponse({ error: "Ordem de Serviço não encontrada" }, 404);
    }

    // Ensure material_requests table
    const ensureSql = `
      CREATE TABLE IF NOT EXISTS os_material_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        os_id UUID NOT NULL REFERENCES ordens_servico(id),
        nome TEXT NOT NULL,
        quantidade NUMERIC NOT NULL,
        unidade TEXT NOT NULL,
        status TEXT DEFAULT 'pendente',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    const { error: ensureErr } = await adm.rpc("exec_sql", { query_text: ensureSql });
    if (ensureErr) {
      console.warn("Could not ensure os_material_requests table:", ensureErr);
    }

    // Insert material requests
    const inserts = materiais.map((m) => ({
      os_id,
      nome: m.nome,
      quantidade: m.quantidade,
      unidade: m.unidade,
      status: "pendente",
    }));

    const { data: inserted, error: insertErr } = await adm
      .from("os_material_requests")
      .insert(inserts)
      .select();

    if (insertErr) throw insertErr;

    return jsonResponse({
      status: "ok",
      material_requests: inserted || inserts.map((ins) => ({ ...ins, id: "generated" })),
    });
  } catch (err) {
    console.error("Erro em request-os-material", err);
    const message = err instanceof Error ? err.message : "Erro interno ao solicitar materiais para OS";
    return jsonResponse({ error: message }, 500);
  }
});
