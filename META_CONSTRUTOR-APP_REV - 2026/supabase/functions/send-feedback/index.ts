import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

type FeedbackRequest = {
  title?: string;
  type?: string;
  message?: string;
  rating?: number;
  org_id?: string;
};

const FEEDBACK_TYPE_MAP: Record<string, string> = {
  sugestao: "Sugestão",
  problema: "Bug",
  elogio: "Elogio",
  duvida: "Dúvida",
  reclamacao: "Reclamação",
  outro: "Outro",
};

const jsonResponse = (body: unknown, corsHeaders: Record<string, string>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const createUserClient = (authHeader: string) =>
  createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );

const createAdminClient = () =>
  createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: { code: "METHOD_NOT_ALLOWED", message: "Use POST" } }, corsHeaders, 405);
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createUserClient(authHeader);
    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Login obrigatorio" } }, corsHeaders, 401);
    }

    const payload: FeedbackRequest = await req.json();
    const message = payload.message?.trim();
    const rawType = payload.type?.trim() || "outro";
    const type = FEEDBACK_TYPE_MAP[rawType.toLowerCase()] ?? rawType;
    const title = payload.title?.trim() || null;
    const rating = typeof payload.rating === "number" ? payload.rating : null;

    if (!message) {
      return jsonResponse(
        { error: { code: "VALIDATION_ERROR", message: "Mensagem e obrigatoria" } },
        corsHeaders,
        400,
      );
    }

    if (rating !== null && (rating < 1 || rating > 5)) {
      return jsonResponse(
        { error: { code: "VALIDATION_ERROR", message: "Rating deve estar entre 1 e 5" } },
        corsHeaders,
        400,
      );
    }

    let orgId = payload.org_id ?? null;
    const admin = createAdminClient();

    if (orgId) {
      const { data: isMember, error: membershipError } = await userClient.rpc("is_org_member", {
        p_org_id: orgId,
      });

      if (membershipError || isMember !== true) {
        return jsonResponse({ error: { code: "FORBIDDEN", message: "Organizacao invalida" } }, corsHeaders, 403);
      }
    } else {
      const { data: membership } = await admin
        .from("org_members")
        .select("org_id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      orgId = membership?.org_id ?? null;
    }

    const { data, error } = await admin
      .from("feedbacks")
      .insert({
        user_id: user.id,
        org_id: orgId,
        titulo: title,
        tipo: type,
        mensagem: message,
        status: "Recebido",
        nota_satisfacao: rating,
      })
      .select("id, created_at")
      .single();

    if (error) throw error;

    return jsonResponse({ success: true, feedback_id: data.id, created_at: data.created_at }, corsHeaders);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno";
    return jsonResponse({ error: { code: "INTERNAL_ERROR", message } }, corsHeaders, 500);
  }
});
