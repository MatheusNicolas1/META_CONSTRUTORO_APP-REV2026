// elevenlabs-tts: Edge Function para gerar audio via ElevenLabs TTS
//
// Fluxo:
//   1. Recebe text + voice_id + options
//   2. Chama ElevenLabs TTS via _shared/elevenlabs.ts
//   3. Salva MP3 no bucket audio-files/{orgId}/{jobId}.mp3
//   4. Registra job em audio_summary_jobs + custo em audio_costs
//
// Uso: POST com JSON body { orgId, text, voiceId?, topicId? }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { textToSpeech, type TtsOptions } from "../_shared/elevenlabs.ts";

interface ElevenLabsTtsRequest {
  orgId: string;
  text: string;
  voiceId?: string;
  topicId?: string;
  recipientUserId?: string;
  recipientPhone?: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
  speed?: number;
  scheduleFor?: string; // ISO timestamp
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const body: ElevenLabsTtsRequest = await req.json();
    const {
      orgId,
      text,
      voiceId,
      topicId,
      recipientUserId,
      recipientPhone,
      modelId,
      stability,
      similarityBoost,
      speed,
      scheduleFor,
    } = body;

    if (!orgId || !text) {
      return new Response(
        JSON.stringify({ success: false, error: "orgId e text sao obrigatorios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 1. Criar job em audio_summary_jobs
    const { data: job, error: jobError } = await supabase
      .from("audio_summary_jobs")
      .insert({
        org_id: orgId,
        topic_id: topicId || null,
        recipient_user_id: recipientUserId || null,
        recipient_phone: recipientPhone || null,
        idempotency_key: `${orgId}_${crypto.randomUUID()}`,
        status: "generating",
        summary_text: text,
        tts_chars_consumed: 0,
        scheduled_for: scheduleFor || null,
      })
      .select("id")
      .single();

    if (jobError || !job) {
      throw new Error(`Falha ao criar job: ${jobError?.message}`);
    }

    const jobId = job.id;

    // 2. Resolver voice_id
    const resolvedVoiceId = voiceId || "pqHfZKP75CvOlQylNhV4"; // default masculina Bill

    // 3. Chamar ElevenLabs TTS
    console.info(`[${jobId}] Gerando audio: ${text.length} chars, voice=${resolvedVoiceId}`);

    const ttsOptions: TtsOptions = {
      text,
      voiceId: resolvedVoiceId,
      modelId: modelId || "eleven_multilingual_v2",
      stability,
      similarityBoost,
      speed,
    };

    const { audioBuffer, charsConsumed } = await textToSpeech(ttsOptions);

    // 4. Salvar no Storage
    const storagePath = `${orgId}/${jobId}.mp3`;

    const { error: uploadError } = await supabase
      .storage
      .from("audio-files")
      .upload(storagePath, audioBuffer, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (uploadError) {
      console.warn(`[${jobId}] Upload storage warning: ${uploadError.message}`);
    }

    // 5. Gerar URL temporaria assinada
    const { data: signedUrlData } = await supabase
      .storage
      .from("audio-files")
      .createSignedUrl(storagePath, 3600); // 1 hora

    const audioUrl = signedUrlData?.signedUrl || null;

    // 6. Atualizar job
    await supabase
      .from("audio_summary_jobs")
      .update({
        status: "generated",
        audio_storage_path: storagePath,
        tts_chars_consumed: charsConsumed,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    // 7. Registrar custo
    await supabase
      .from("audio_costs")
      .insert({
        org_id: orgId,
        provider: "elevenlabs",
        operation: "tts",
        chars_consumed: charsConsumed,
        estimated_cost: (charsConsumed / 1000) * 0.03, // ~$0.03/1K chars
        job_id: jobId,
      });

    const elapsed = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        jobId,
        status: "generated",
        charsConsumed,
        audioBytes: audioBuffer.byteLength,
        audioUrl,
        elapsed,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro interno";
    console.error(`[elevenlabs-tts] Erro: ${errorMessage}`);

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
