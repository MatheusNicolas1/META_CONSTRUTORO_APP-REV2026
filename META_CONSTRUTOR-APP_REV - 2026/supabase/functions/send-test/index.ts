import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok");
  if (req.method !== "POST") return jsonResponse({ error: "Use POST" }, 405);

  try {
    // Conectar ao banco via service_role key (configurada no Supabase Secrets como SERVICE_ROLE_KEY)
    // Mas como não temos ela, vamos usar uma abordagem diferente:
    // A função já tem acesso ao SUPABASE_SERVICE_ROLE_KEY do ambiente Supabase
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    if (!serviceRoleKey) {
      return jsonResponse({ error: "Ambiente sem service_role key" }, 500);
    }

    const { to, subject, html, from } = await req.json();
    if (!to || !subject || !html) {
      return jsonResponse({ error: "to, subject and html required" }, 400);
    }

    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) return jsonResponse({ error: "RESEND_API_KEY not configured" }, 500);

    const fromDefault = Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev";
    const fromEmail = from || fromDefault;
    const resolvedFrom = fromEmail.includes("<") ? fromEmail : `Meta Construtor <${fromEmail}>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ from: resolvedFrom, to: [to], subject, html }),
    });

    const data = await res.json();
    return jsonResponse(res.ok
      ? { success: true, id: data.id }
      : { success: false, error: data.message }, res.ok ? 200 : 400);
  } catch (error) {
    return jsonResponse({ error: String(error) }, 500);
  }
});