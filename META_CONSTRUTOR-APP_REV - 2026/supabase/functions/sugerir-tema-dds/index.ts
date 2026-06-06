// sugerir-tema-dds/index.ts
// Sugere temas para DDS (Diálogo Diário de Segurança) menos usados primeiro

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

interface SugestaoTema {
  id: string;
  tema: string;
  segmento: string | null;
  nrs_relacionadas: string[] | null;
  frequencia: number;
}

interface SugerirTemaBody {
  org_id: string;
  segmento?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adm = createAdminClient();
    const body = await req.json().catch(() => ({}));
    const { org_id, segmento } = body as SugerirTemaBody;

    if (!org_id || typeof org_id !== "string") {
      return jsonResponse({ error: "org_id é obrigatório" }, 400);
    }

    // Montar query base: sugestoes_temas WHERE ativo = true
    let query = adm
      .from("sugestoes_temas")
      .select("id, tema, segmento, nrs_relacionadas, frequencia")
      .eq("ativo", true);

    // Se segmento informado, filtrar por segmento ou nrs_relacionadas contendo o segmento
    if (segmento && typeof segmento === "string") {
      query = query.or(
        `segmento.eq.${segmento},nrs_relacionadas.cs.{${segmento}}`
      );
    }

    // Ordenar por frequencia ASC (menos usados primeiro) e depois updated_at ASC
    query = query
      .order("frequencia", { ascending: true })
      .order("updated_at", { ascending: true })
      .limit(10);

    const { data, error } = await query;

    if (error) throw error;

    const sugestoes: SugestaoTema[] = data ?? [];

    return jsonResponse({ sugestoes });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno do servidor";
    return jsonResponse({ error: message }, 500);
  }
});
