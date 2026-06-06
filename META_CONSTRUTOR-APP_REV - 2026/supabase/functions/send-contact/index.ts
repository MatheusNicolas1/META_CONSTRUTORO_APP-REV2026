import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

type ContactRequest = {
  name?: string;
  email?: string;
  company?: string;
  phone?: string;
  subject?: string;
  message?: string;
};

const jsonResponse = (body: unknown, corsHeaders: Record<string, string>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const adminClient = () =>
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
    const payload: ContactRequest = await req.json();
    const name = payload.name?.trim();
    const email = payload.email?.trim().toLowerCase();
    const subject = payload.subject?.trim() || "Contato via site";
    const message = payload.message?.trim();

    if (!name || !email || !message) {
      return jsonResponse(
        { error: { code: "VALIDATION_ERROR", message: "Nome, email e mensagem sao obrigatorios" } },
        corsHeaders,
        400,
      );
    }

    const { data, error } = await adminClient()
      .from("contact_messages")
      .insert({
        nome: name,
        email,
        empresa: payload.company?.trim() || null,
        telefone: payload.phone?.trim() || null,
        assunto: subject,
        mensagem: message,
      })
      .select("id, created_at")
      .single();

    if (error) throw error;

    return jsonResponse({ success: true, message_id: data.id, created_at: data.created_at }, corsHeaders);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno";
    return jsonResponse({ error: { code: "INTERNAL_ERROR", message } }, corsHeaders, 500);
  }
});
