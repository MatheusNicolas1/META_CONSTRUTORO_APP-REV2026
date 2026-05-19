import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: { code: "METHOD_NOT_ALLOWED", message: "Use POST" } }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const authHeader = req.headers.get("Authorization") ?? "";

  const response = await fetch(`${supabaseUrl}/functions/v1/update-rdo-status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: req.headers.get("apikey") ?? supabaseAnonKey,
      Authorization: authHeader,
    },
    body: await req.text(),
  });

  const body = await response.text();
  return new Response(body, {
    status: response.status,
    headers: { ...corsHeaders, "Content-Type": response.headers.get("Content-Type") ?? "application/json" },
  });
});
