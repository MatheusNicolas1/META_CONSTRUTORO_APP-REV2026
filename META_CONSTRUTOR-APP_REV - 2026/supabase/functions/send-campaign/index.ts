import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface CampaignEmail {
  to: string;
  empresa?: string;
}

interface SendCampaignRequest {
  emails: CampaignEmail[];
  subject: string;
  html: string;
  from?: string;
  dryRun?: boolean;
}

const jsonResponse = (body: unknown, corsHeaders: Record<string, string>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Use POST" }, corsHeaders, 405);
  }

  try {
    // Auth: aceita service_role key (x-sb-admin) OU JWT de admin autenticado
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    let isAuthorized = false;

    // Caminho 1: service_role key (campanha server-side)
    if (authHeader.startsWith("Bearer ") && authHeader.slice(7) === serviceRoleKey) {
      isAuthorized = true;
    }

    // Caminho 2: JWT de usuário admin
    if (!isAuthorized && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (user && !authError) {
        const { data: userRecord } = await supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();
        if (userRecord?.role === "admin") {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return jsonResponse({ error: "Unauthorized" }, corsHeaders, 401);
    }

    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      return jsonResponse({ error: "RESEND_API_KEY not configured" }, corsHeaders, 500);
    }

    const body: SendCampaignRequest = await req.json();
    const { emails, subject, html, from, dryRun } = body;

    if (!emails?.length) {
      return jsonResponse({ error: "emails array required" }, corsHeaders, 400);
    }
    if (!subject || !html) {
      return jsonResponse({ error: "subject and html required" }, corsHeaders, 400);
    }

    const validEmails = emails.filter(e => isEmail(e.to));
    const invalidEmails = emails.filter(e => !isEmail(e.to));

    if (dryRun) {
      return jsonResponse({
        dryRun: true,
        total: emails.length,
        valid: validEmails.length,
        invalid: invalidEmails.length,
        preview: validEmails.slice(0, 3).map(e => e.to),
      }, corsHeaders);
    }

    const fromDefault = Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev";
    // Se o from não tem formato "Name <email>", monta com nome padrão
    const fromEmail = from || fromDefault;
    const resolvedFrom = fromEmail.includes("<") ? fromEmail : `Meta Construtor <${fromEmail}>`;
    const results: { email: string; success: boolean; id?: string; error?: string }[] = [];

    for (const email of validEmails) {
      try {
        const personalizedHtml = email.empresa
          ? html.replace(/\{\{nome_empresa\}\}/g, email.empresa)
          : html;

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            from: resolvedFrom,
            to: [email.to],
            subject,
            html: personalizedHtml,
            tags: [{ name: "campaign", value: "lancamento_2026" }],
          }),
        });

        const data = await res.json();
        if (res.ok) {
          results.push({ email: email.to, success: true, id: data.id });
        } else {
          results.push({ email: email.to, success: false, error: data.message });
        }
      } catch (err) {
        results.push({ email: email.to, success: false, error: String(err) });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return jsonResponse({
      total: validEmails.length,
      sent: successCount,
      failed: failCount,
      invalidEmails: invalidEmails.map(e => e.to),
      results,
    }, corsHeaders);
  } catch (error) {
    return jsonResponse({ error: String(error) }, corsHeaders, 500);
  }
});
