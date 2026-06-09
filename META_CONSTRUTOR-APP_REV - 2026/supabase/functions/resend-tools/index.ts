import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) return new Response(JSON.stringify({ error: "no key" }), { status: 500 });

  if (req.method === "GET") {
    const results: Record<string, any> = {};

    // 1. Atualizar webhook para apontar pra Edge Function
    const whRes = await fetch("https://api.resend.com/webhooks/b2c5b4a5-00b0-4831-a862-0b4af02e71c3", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: "https://bgdvlhttyjeuprrfxgun.functions.supabase.co/email-inbound-responder"
      }),
    });
    results.webhook = await whRes.json();

    // 2. Ativar inbound no domínio
    const dmRes = await fetch("https://api.resend.com/domains/eccdc08b-cd0d-4c70-96aa-a7585cc1e58f", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        inbound_config: {
          enabled: true,
          destination: "contato@metaconstrutor.app.br"
        }
      }),
    });
    results.inbound = await dmRes.json();

    return new Response(JSON.stringify(results, null, 2), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "use GET" }), { status: 405 });
});
