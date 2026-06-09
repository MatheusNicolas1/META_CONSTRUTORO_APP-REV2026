import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/supabase-client.ts";
import { logRequest } from "../_shared/guards.ts";

// ─────────────────────────────────────────────
// REGRAS DO CHEFE (Nicolas)
// ─────────────────────────────────────────────
const REGRAS = `
VOCÊ É UM ASSISTENTE DE ATENDIMENTO DA META CONSTRUTOR.

REGRAS ABSOLUTAS:
1. NUNCA ofereça descontos, promoções ou reduções de preço — seja qual for o motivo.
2. NUNCA compartilhe informações internas do sistema, código, arquitetura, bugs, fragilidades ou qualquer dado que comprometa a integridade do aplicativo.
3. NUNCA compartilhe dados de outros clientes, informações financeiras, ou estratégias internas.
4. Trate cada lead com profissionalismo e cordialidade.
5. Se o lead PERGUNTAR sobre preços, direcione para a página de preços do site.
6. Se o lead PEDIR para falar com um humano, NOTIFIQUE o chef IMEDIATAMENTE.
7. Se o lead demonstrar interesse genuíno (pedir demonstração, orçamento detalhado, visita técnica, contratação), capture as informações e NOTIFIQUE o chef.
8. Se o lead fizer perguntas técnicas que você não pode responder com segurança, diga que um especialista entrará em contato e NOTIFIQUE o chef.

TOM DE RESPOSTA:
- Profissional e acolhedor, no mesmo tom do e-mail de campanha que o lead recebeu.
- Responda EM PORTUGUÊS BRASILEIRO.
- Seja breve e direto, mas educado.
- Assine como "Equipe Meta Construtor".
`;

interface ResendWebhookPayload {
  type: "email.received" | "email.sent" | "email.bounced" | "email.complained";
  data: {
    from: string;
    to: string[];
    subject?: string;
    html?: string;
    text?: string;
    headers?: Record<string, string>;
    created_at: string;
    id: string;
  };
}

interface InboxEmail {
  from: string;
  fromName: string;
  to: string[];
  subject: string;
  body: string;
  receivedAt: string;
  emailId: string;
  campaignName?: string;
}

interface LeadResponse {
  to: string;
  subject: string;
  html: string;
  needsHuman: boolean;
  reason?: string;
  leadInfo?: {
    email: string;
    name: string;
    interest: string;
    phone?: string;
  };
}

function extractEmail(text: string): string {
  const match = text.match(/<?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>?/);
  return match ? match[1].toLowerCase() : text;
}

function extractName(from: string): string {
  const match = from.match(/^"?([^"<]+)"?\s*</);
  return match ? match[1].trim() : from.split("@")[0];
}

function extractPlainText(html?: string, text?: string): string {
  if (text) return text;
  if (!html) return "";
  // Remove HTML tags
  return html
    .replace(/<style[^>]*>[^<]*<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildPrompt(leadEmail: string, leadName: string, subject: string, message: string): string {
  return `${REGRAS}

LEAD:
- Nome: ${leadName}
- Email: ${leadEmail}
- Assunto: ${subject}
- Mensagem: ${message}

INSTRUÇÃO:
Analise a mensagem do lead acima e:
1. Determine se ele precisa falar com um humano (pedido explícito, dúvida complexa, quer orçamento, quer contratar)
2. Gere uma resposta adequada seguindo as regras
3. Se precisar de humano, capture o motivo e informações relevantes

Responda APENAS no seguinte formato JSON:
{
  "needsHuman": true/false,
  "reason": "motivo se needsHuman=true",
  "response": "sua resposta em PT-BR para o lead",
  "leadInfo": {
    "interest": "resumo do interesse do lead",
    "phone": "se mencionou telefone"
  }
}`;
}

async function callAI(prompt: string): Promise<{
  needsHuman: boolean;
  reason: string;
  response: string;
  leadInfo: { interest?: string; phone?: string };
}> {
  const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

  // Tenta OpenRouter primeiro, fallback para Supabase AI
  if (OPENROUTER_API_KEY) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://www.metaconstrutor.app.br",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            { role: "system", content: "You are a JSON-only response bot. Output ONLY valid JSON." },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 800,
        }),
      });

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || "";

      // Extrair JSON da resposta
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("OpenRouter error, falling back:", e);
    }
  }

  // Fallback: resposta automática sem IA
  return {
    needsHuman: true,
    reason: "Resposta automática: lead respondeu ao e-mail de campanha",
    response: gerarRespostaFallback(),
    leadInfo: { interest: "Lead respondeu ao e-mail de campanha" },
  };
}

function gerarRespostaFallback(): string {
  return `
    <p>Olá!</p>
    <p>Recebemos sua mensagem e agradecemos o contato!</p>
    <p>Em breve nossa equipe entrará em contato para te atender da melhor forma possível.</p>
    <p>Enquanto isso, você pode conhecer mais sobre o Meta Construtor em nosso site:</p>
    <p><a href="https://www.metaconstrutor.app.br" style="display:inline-block;background:#1a73e8;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Conheça o Meta Construtor</a></p>
    <p>Atenciosamente,<br>Equipe Meta Construtor</p>
  `.trim();
}

function gerarRespostaHumano(leadName: string): string {
  return `
    <p>Olá, ${leadName}!</p>
    <p>Recebemos sua mensagem e entendemos que você deseja falar diretamente com nossa equipe.</p>
    <p>Um de nossos consultores entrará em contato o mais breve possível para te atender pessoalmente.</p>
    <p>Agradecemos o interesse no Meta Construtor!</p>
    <p>Atenciosamente,<br>Equipe Meta Construtor</p>
  `.trim();
}

function gerarRespostaInteresse(leadName: string): string {
  return `
    <p>Olá, ${leadName}!</p>
    <p>Ficamos muito felizes com seu interesse no Meta Construtor!</p>
    <p>Um de nossos consultores vai entrar em contato em breve para agendar uma demonstração personalizada e mostrar como podemos ajudar sua empresa.</p>
    <p>Enquanto isso, você pode explorar mais sobre nossos recursos em nosso site:</p>
    <p><a href="https://www.metaconstrutor.app.br" style="display:inline-block;background:#1a73e8;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Conheça o Meta Construtor</a></p>
    <p>Atenciosamente,<br>Equipe Meta Construtor</p>
  `.trim();
}

function gerarRespostaDuvida(leadName: string, respostaAI: string): string {
  return `
    <p>Olá, ${leadName}!</p>
    <p>${respostaAI}</p>
    <p>Se tiver mais dúvidas, fique à vontade para responder a este e-mail.</p>
    <p>Atenciosamente,<br>Equipe Meta Construtor</p>
  `.trim();
}

async function sendReply(to: string, subject: string, html: string): Promise<boolean> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev";

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured");
    return false;
  }

  const replySubject = subject.startsWith("Re:")
    ? subject
    : `Re: ${subject}`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `Meta Construtor <${RESEND_FROM_EMAIL}>`,
        to: [to],
        subject: replySubject,
        html: html,
        tags: [
          { name: "campaign", value: "email_auto_reply" },
          { name: "type", value: "inbound_response" },
        ],
      }),
    });

    const data = await res.json();
    if (res.ok) {
      console.log(`Reply sent to ${to}: ${data.id}`);
      return true;
    } else {
      console.error(`Failed to send reply to ${to}:`, data);
      return false;
    }
  } catch (error) {
    console.error(`Error sending reply to ${to}:`, error);
    return false;
  }
}

async function saveToDatabase(
  supabase: ReturnType<typeof createAdminClient>,
  email: InboxEmail,
  analysis: any,
  replySent: boolean
): Promise<void> {
  try {
    await supabase.from("email_inbound_log").insert({
      email_id: email.emailId,
      from_email: email.from,
      from_name: email.fromName,
      subject: email.subject,
      body_preview: email.body.substring(0, 500),
      received_at: email.receivedAt,
      needs_human: analysis.needsHuman,
      reason: analysis.reason || null,
      lead_interest: analysis.leadInfo?.interest || null,
      lead_phone: analysis.leadInfo?.phone || null,
      reply_sent: replySent,
      ai_response: analysis.response,
    });
  } catch (error) {
    console.error("Error saving to database:", error);
    // Non-critical, continue
  }
}

async function notifyChef(
  email: InboxEmail,
  analysis: any
): Promise<void> {
  const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID");

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log("Telegram not configured for notifications");
    return;
  }

  const message = `
🔔 *NOVO LEAD QUALIFICADO - META CONSTRUTOR*

👤 *Nome:* ${email.fromName}
📧 *Email:* ${email.from}
📋 *Interesse:* ${analysis.leadInfo?.interest || "Não especificado"}
${analysis.leadInfo?.phone ? `📞 *Telefone:* ${analysis.leadInfo.phone}` : ""}
📝 *Motivo:* ${analysis.reason || "Quer falar com humano"}

*Mensagem original:*
${email.body.substring(0, 300)}${email.body.length > 300 ? "..." : ""}
  `.trim();

  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      }),
    });
  } catch (error) {
    console.error("Error notifying chef:", error);
  }
}

function verifyResendSignature(req: Request, body: string): boolean {
  const signingSecret = Deno.env.get("RESEND_SIGNING_SECRET");
  if (!signingSecret) {
    console.warn("RESEND_SIGNING_SECRET not configured - skipping verification");
    return true; // Allow if not configured (dev mode)
  }

  const signature = req.headers.get("Resend-Signature");
  if (!signature) {
    console.warn("Missing Resend-Signature header");
    return false;
  }

  try {
    // Use Web Crypto API - works in Deno/Edge runtime
    const encoder = new TextEncoder();
    const keyData = encoder.encode(signingSecret);
    return crypto.subtle?.importKey?.("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["verify"])
      .then(key => crypto.subtle.verify("HMAC", key, hexToBytes(signature), encoder.encode(body)))
      .catch(() => false) as unknown as boolean;
  } catch {
    return false;
  }
}

// Simple hex string to bytes
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Use POST" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createAdminClient();

  try {
    const rawBody = await req.text();

    // Verify webhook signature
    if (!verifyResendSignature(req, rawBody)) {
      logRequest(requestId, null, null, "email-inbound-responder", "denied", "Invalid signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload: ResendWebhookPayload = JSON.parse(rawBody);

    // Only process received emails
    if (payload.type !== "email.received") {
      return new Response(JSON.stringify({ ok: true, type: payload.type }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const email: InboxEmail = {
      from: extractEmail(payload.data.from),
      fromName: extractName(payload.data.from),
      to: payload.data.to,
      subject: payload.data.subject || "(sem assunto)",
      body: extractPlainText(payload.data.html, payload.data.text),
      receivedAt: payload.data.created_at,
      emailId: payload.data.id,
    };

    console.log(`Inbound email received from ${email.from}: "${email.subject}"`);

    // Use AI to analyze the email
    const prompt = buildPrompt(email.from, email.fromName, email.subject, email.body);
    const analysis = await callAI(prompt);

    let replySent = false;

    if (analysis.needsHuman) {
      // Lead quer falar com humano → avisa chef + resposta automática dizendo que vão contatar
      const html = gerarRespostaHumano(email.fromName);
      replySent = await sendReply(email.from, email.subject, html);

      // Notifica chef no Telegram
      await notifyChef(email, analysis);
    } else if (analysis.leadInfo?.interest) {
      // Lead demonstrou interesse → resposta de interesse + notifica chef
      const html = gerarRespostaInteresse(email.fromName);
      replySent = await sendReply(email.from, email.subject, html);

      // Notifica chef mesmo assim (lead quente)
      await notifyChef(email, analysis);
    } else {
      // Dúvida simples → responde com a análise da IA
      const html = gerarRespostaDuvida(email.fromName, analysis.response);
      replySent = await sendReply(email.from, email.subject, html);
    }

    // Log to database
    await saveToDatabase(supabase, email, analysis, replySent);

    logRequest(requestId, null, null, "email-inbound-responder", "success", `From: ${email.from}, needsHuman: ${analysis.needsHuman}`);

    return new Response(
      JSON.stringify({
        ok: true,
        from: email.from,
        needsHuman: analysis.needsHuman,
        replySent,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error processing inbound email:", error);
    logRequest(requestId, null, null, "email-inbound-responder", "error", error.message);

    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
