// sign-dds-participant/index.ts
// Registers a participant signature in a DDS (Dialogo Diario de Seguranca)

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
    const { dds_id, participante_nome, participante_cpf, assinatura_data } = body as {
      dds_id: string;
      participante_nome: string;
      participante_cpf?: string;
      assinatura_data: string;
    };

    if (!dds_id || !participante_nome || !assinatura_data) {
      return jsonResponse({ error: "dds_id, participante_nome e assinatura_data são obrigatórios" }, 400);
    }

    // Ensure the dds table exists by checking
    const { data: dds, error: ddsErr } = await adm
      .from("dds")
      .select("id, org_id, tema, data_realizacao")
      .eq("id", dds_id)
      .single();

    if (ddsErr) {
      if (ddsErr.code === "42P01") {
        return jsonResponse({ error: "Tabela dds não encontrada. Crie a migration primeiro." }, 404);
      }
      throw ddsErr;
    }

    if (!dds) {
      return jsonResponse({ error: "DDS não encontrado" }, 404);
    }

    // Ensure dds_participants table exists
    const ensureSql = `
      CREATE TABLE IF NOT EXISTS dds_participants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        dds_id UUID NOT NULL REFERENCES dds(id),
        participante_nome TEXT NOT NULL,
        participante_cpf TEXT,
        assinatura_data TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    const { error: ensureErr } = await adm.rpc("exec_sql", { query_text: ensureSql });
    if (ensureErr) {
      console.warn("Could not ensure dds_participants table:", ensureErr);
    }

    // Insert signature
    const { data: signature, error: insertErr } = await adm
      .from("dds_participants")
      .insert({
        dds_id,
        participante_nome,
        participante_cpf: participante_cpf || null,
        assinatura_data,
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    return jsonResponse({
      status: "ok",
      signature: {
        id: signature?.id || "generated",
        dds_id,
        participante_nome,
        participante_cpf: participante_cpf || null,
        assinatura_data,
      },
    });
  } catch (err) {
    console.error("Erro em sign-dds-participant", err);
    const message = err instanceof Error ? err.message : "Erro interno ao registrar assinatura de DDS";
    return jsonResponse({ error: message }, 500);
  }
});
