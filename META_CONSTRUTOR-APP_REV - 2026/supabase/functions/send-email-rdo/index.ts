import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

type SendEmailRDORequest = {
  rdo_id?: string;
  emails?: string[];
  to?: string[];
  subject?: string;
  motivo?: string;
  message?: string;
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

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: { code: "METHOD_NOT_ALLOWED", message: "Use POST" } }, corsHeaders, 405);
  }

  try {
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      return jsonResponse({ error: { code: "RESEND_NOT_CONFIGURED", message: "RESEND_API_KEY ausente" } }, corsHeaders, 500);
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createUserClient(authHeader);
    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Login obrigatorio" } }, corsHeaders, 401);
    }

    const payload: SendEmailRDORequest = await req.json();
    const rdoId = payload.rdo_id?.trim();
    const rawRecipients = payload.emails ?? payload.to ?? [];
    const recipients = [...new Set(rawRecipients.map((email) => email.trim().toLowerCase()).filter(Boolean))];

    if (!rdoId) {
      return jsonResponse({ error: { code: "VALIDATION_ERROR", message: "rdo_id e obrigatorio" } }, corsHeaders, 400);
    }

    if (!recipients.length || recipients.some((email) => !isEmail(email))) {
      return jsonResponse({ error: { code: "VALIDATION_ERROR", message: "Informe ao menos um e-mail valido" } }, corsHeaders, 400);
    }

    const admin = createAdminClient();
    const { data: rdo, error: rdoError } = await admin
      .from("rdos")
      .select("id, numero, data, status, org_id, obra_id, observacoes, obras(nome)")
      .eq("id", rdoId)
      .single();

    if (rdoError || !rdo) {
      return jsonResponse({ error: { code: "NOT_FOUND", message: "RDO nao encontrado" } }, corsHeaders, 404);
    }

    if (rdo.status !== "APPROVED") {
      return jsonResponse(
        { error: { code: "INVALID_STATUS", message: "Apenas RDOs aprovados podem ser enviados por e-mail" } },
        corsHeaders,
        409,
      );
    }

    const { data: membership, error: membershipError } = await admin
      .from("org_members")
      .select("id")
      .eq("org_id", rdo.org_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (membershipError || !membership) {
      return jsonResponse({ error: { code: "FORBIDDEN", message: "Acesso negado ao RDO" } }, corsHeaders, 403);
    }

    const appUrl = Deno.env.get("APP_URL") ?? "https://www.metaconstrutor.app.br";
    const from = Deno.env.get("RESEND_FROM_EMAIL") ?? "onboarding@resend.dev";
    const rdoNumber = rdo.numero ? String(rdo.numero) : rdo.id.slice(0, 8);
    const obraName = (rdo.obras as { nome?: string } | null)?.nome ?? "Obra nao informada";
    const rdoUrl = `${appUrl}/app/rdo/${rdo.id}/visualizar`;
    const subject = payload.subject?.trim() || `RDO ${rdoNumber} aprovado - ${obraName}`;
    const motivo = payload.motivo?.trim() || payload.message?.trim() || "RDO Aprovado";
    const safeMotivo = escapeHtml(motivo).replaceAll("\n", "<br>");
    const safeObraName = escapeHtml(obraName);

    const html = `
      <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.5">
        <h2 style="margin:0 0 12px">RDO ${escapeHtml(rdoNumber)} aprovado</h2>
        <p><strong>Obra:</strong> ${safeObraName}</p>
        <p><strong>Data:</strong> ${escapeHtml(String(rdo.data ?? "Nao informada"))}</p>
        <p><strong>Status:</strong> ${escapeHtml(String(rdo.status ?? "Nao informado"))}</p>
        <p><strong>Motivo:</strong><br>${safeMotivo}</p>
        <p><a href="${rdoUrl}">Abrir RDO no Meta Construtor</a></p>
      </div>
    `;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: recipients,
        subject,
        html,
      }),
    });

    const resendBody = await resendResponse.json().catch(() => ({}));

    if (!resendResponse.ok) {
      return jsonResponse(
        { error: { code: "RESEND_ERROR", message: "Falha ao enviar e-mail", details: resendBody } },
        corsHeaders,
        502,
      );
    }

    return jsonResponse({ success: true, email_id: resendBody.id, recipients }, corsHeaders);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno";
    return jsonResponse({ error: { code: "INTERNAL_ERROR", message } }, corsHeaders, 500);
  }
});
