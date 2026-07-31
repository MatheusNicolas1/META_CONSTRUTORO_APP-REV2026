// elevenlabs-webhook: Recebe callbacks de status do ElevenLabs
// (voice generation completed, etc.)
//
// Uso: POST de webhook externo com assinatura xi-api-key

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

interface ElevenLabsWebhookPayload {
  event: string;
  job_id?: string;
  status?: string;
  output?: Record<string, unknown>;
  error?: string;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API key from header
    const webhookSecret = Deno.env.get("ELEVENLABS_WEBHOOK_SECRET");
    if (webhookSecret) {
      const auth = req.headers.get("authorization") || req.headers.get("x-xi-api-key") || "";
      if (auth !== `Bearer ${webhookSecret}` && auth !== webhookSecret) {
        return new Response(
          JSON.stringify({ success: false, error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const payload: ElevenLabsWebhookPayload = await req.json();

    console.info(`[elevenlabs-webhook] Event: ${payload.event}, status: ${payload.status || "unknown"}`);

    // For now, just acknowledge receipt
    // Future: update audio_summary_jobs or audio_inbound_messages status based on event

    return new Response(
      JSON.stringify({ success: true, received: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro interno";
    console.error(`[elevenlabs-webhook] Erro: ${errorMessage}`);

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
