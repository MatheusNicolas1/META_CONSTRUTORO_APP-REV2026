import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import {
  createAdminClient,
  createUserClient,
  escapeHtml,
  formatDate,
  isEmail,
  jsonResponse,
  loadChecklistReport,
  UUID_PATTERN,
} from "../_shared/checklist-report.ts";

type SendChecklistEmailRequest = {
  checklist_id?: string;
  emails?: string[];
  to?: string[];
  message?: string;
};

const buildHtml = (
  report: Awaited<ReturnType<typeof loadChecklistReport>>,
  checklistUrl: string,
  message?: string,
) => {
  const completed = report.items.filter((item) => item.status === "Concluido" || item.status === "Concluído").length;
  const progress = report.items.length ? Math.round((completed / report.items.length) * 100) : 0;
  const obraName = report.checklist.obras?.nome ?? "Obra nao informada";

  const itemsHtml = report.items
    .map((item, index) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${index + 1}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(item.titulo)}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(item.status)}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(item.prioridade)}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center">${item.attachments.length}</td>
      </tr>
    `)
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.5">
      <h2 style="margin:0 0 12px">Checklist: ${escapeHtml(report.checklist.titulo)}</h2>
      <p><strong>Obra:</strong> ${escapeHtml(obraName)}</p>
      <p><strong>Categoria:</strong> ${escapeHtml(report.checklist.categoria)}</p>
      <p><strong>Status:</strong> ${escapeHtml(report.checklist.status)}</p>
      <p><strong>Prazo:</strong> ${escapeHtml(formatDate(report.checklist.data_vencimento))}</p>
      <p><strong>Progresso:</strong> ${completed}/${report.items.length} itens (${progress}%)</p>
      ${message ? `<p><strong>Mensagem:</strong><br>${escapeHtml(message).replaceAll("\n", "<br>")}</p>` : ""}
      <p><a href="${escapeHtml(checklistUrl)}">Abrir checklist no Meta Construtor</a></p>
      <table style="border-collapse:collapse;width:100%;margin-top:16px;font-size:14px">
        <thead>
          <tr>
            <th align="left" style="padding:8px;border-bottom:2px solid #d1d5db">#</th>
            <th align="left" style="padding:8px;border-bottom:2px solid #d1d5db">Item</th>
            <th align="left" style="padding:8px;border-bottom:2px solid #d1d5db">Status</th>
            <th align="left" style="padding:8px;border-bottom:2px solid #d1d5db">Prioridade</th>
            <th align="center" style="padding:8px;border-bottom:2px solid #d1d5db">Evidencias</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
    </div>
  `;
};

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

    const payload: SendChecklistEmailRequest = await req.json().catch(() => ({}));
    const checklistId = payload.checklist_id?.trim();
    const rawRecipients = payload.emails ?? payload.to ?? [];
    const recipients = [...new Set(rawRecipients.map((email) => email.trim().toLowerCase()).filter(Boolean))];

    if (!checklistId || !UUID_PATTERN.test(checklistId)) {
      return jsonResponse({ error: { code: "VALIDATION_ERROR", message: "checklist_id invalido" } }, corsHeaders, 400);
    }

    if (!recipients.length || recipients.some((email) => !isEmail(email))) {
      return jsonResponse({ error: { code: "VALIDATION_ERROR", message: "Informe ao menos um e-mail valido" } }, corsHeaders, 400);
    }

    const report = await loadChecklistReport(createAdminClient(), checklistId, user.id);
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      return jsonResponse({ error: { code: "RESEND_NOT_CONFIGURED", message: "RESEND_API_KEY ausente" } }, corsHeaders, 500);
    }

    const appUrl = Deno.env.get("APP_URL") ?? "https://www.metaconstrutor.app.br";
    const from = Deno.env.get("RESEND_FROM_EMAIL") ?? "onboarding@resend.dev";
    const checklistUrl = `${appUrl}/app/checklist/${report.checklist.id}`;
    const obraName = report.checklist.obras?.nome ?? "Obra nao informada";
    const subject = `Checklist ${report.checklist.titulo} - ${obraName}`;

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
        html: buildHtml(report, checklistUrl, payload.message?.trim()),
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
    if (error instanceof Response) {
      const body = await error.json().catch(() => ({ error: { code: "INTERNAL_ERROR", message: "Erro interno" } }));
      return jsonResponse(body, corsHeaders, error.status);
    }

    const message = error instanceof Error ? error.message : "Erro interno";
    return jsonResponse({ error: { code: "INTERNAL_ERROR", message } }, corsHeaders, 500);
  }
});
