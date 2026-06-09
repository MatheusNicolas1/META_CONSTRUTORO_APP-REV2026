import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

interface CampaignEmail {
  to: string;
  empresa?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok");
  if (req.method !== "POST") return jsonResponse({ error: "Use POST" }, 405);

  try {
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) return jsonResponse({ error: "RESEND_API_KEY not configured" }, 500);

    const body = await req.json();
    const { emails, subject, html, from, dryRun } = body;

    if (!emails?.length) return jsonResponse({ error: "emails array required" }, 400);
    if (!subject || !html) return jsonResponse({ error: "subject and html required" }, 400);

    const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    const validEmails = emails.filter((e: CampaignEmail) => isEmail(e.to));
    const invalidEmails = emails.filter((e: CampaignEmail) => !isEmail(e.to));

    if (dryRun) {
      return jsonResponse({
        dryRun: true,
        total: emails.length,
        valid: validEmails.length,
        invalid: invalidEmails.length,
        preview: validEmails.slice(0, 3).map((e: CampaignEmail) => e.to),
      });
    }

    const fromDefault = Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev";
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
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
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
      invalidEmails: invalidEmails.map((e: CampaignEmail) => e.to),
      results,
    });
  } catch (error) {
    return jsonResponse({ error: String(error) }, 500);
  }
});
