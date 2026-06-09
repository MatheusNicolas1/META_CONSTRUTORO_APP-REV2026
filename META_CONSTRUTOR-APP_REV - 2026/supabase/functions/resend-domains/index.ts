import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async () => {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return new Response(JSON.stringify({ error: "no key" }), { status: 500 });

  const [domains, webhooks] = await Promise.all([
    fetch("https://api.resend.com/domains", { headers: { Authorization: `Bearer ${apiKey}` } }).then(r => r.json()),
    fetch("https://api.resend.com/webhooks", { headers: { Authorization: `Bearer ${apiKey}` } }).then(r => r.json()),
  ]);

  return new Response(JSON.stringify({ domains, webhooks }, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
});
