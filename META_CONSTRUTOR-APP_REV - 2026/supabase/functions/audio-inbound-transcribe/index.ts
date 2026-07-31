// audio-inbound-transcribe: Edge Function para baixar áudio recebido de inbound,
// transcrever via ElevenLabs STT e salvar transcrição no banco.
//
// Fluxo:
//   1. Recebe { inbound_message_id } no body
//   2. Busca registro em audio_inbound_messages
//   3. Se já transcrito, retorna sucesso (idempotente)
//   4. Baixa áudio do Storage bucket audio-files
//   5. Chama speechToText do _shared/elevenlabs.ts
//   6. Atualiza audio_inbound_messages (transcription_text, status='transcribed', stt_model_used)
//   7. Registra custo em audio_costs
//   8. Se audio_summary_jobs relacionado, atualiza status
//
// Autenticação: service role (via createAdminClient) para bypass de RLS

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/supabase-client.ts";
import { speechToText } from "../_shared/elevenlabs.ts";

interface TranscribeRequest {
  inbound_message_id: string;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ===== 1. Validar body =====
    const body: TranscribeRequest = await req.json();

    if (!body.inbound_message_id || typeof body.inbound_message_id !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "inbound_message_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { inbound_message_id } = body;
    console.info(`[audio-inbound-transcribe] Starting: inbound_message_id=${inbound_message_id}`);

    // ===== 2. Criar admin client (service role) =====
    const supabase = createAdminClient();

    // ===== 3. Buscar registro em audio_inbound_messages =====
    const { data: inbound, error: fetchError } = await supabase
      .from("audio_inbound_messages")
      .select("*")
      .eq("id", inbound_message_id)
      .maybeSingle();

    if (fetchError) {
      throw new Error(`Erro ao buscar audio_inbound_messages: ${fetchError.message}`);
    }

    if (!inbound) {
      return new Response(
        JSON.stringify({ success: false, error: "audio_inbound_messages não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.info(
      `[audio-inbound-transcribe] Found inbound: id=${inbound.id}, status=${inbound.status}, org_id=${inbound.org_id}`,
    );

    // ===== 4. Idempotência: se já transcrito, retorna sucesso =====
    if (inbound.status === "transcribed" || (inbound.transcription_text && inbound.transcription_text.length > 0)) {
      console.info(
        `[audio-inbound-transcribe] Already transcribed: inbound_message_id=${inbound_message_id}, text_length=${inbound.transcription_text?.length}`,
      );
      return new Response(
        JSON.stringify({
          success: true,
          already_transcribed: true,
          inbound_message_id,
          transcription_text: inbound.transcription_text,
          stt_model_used: inbound.stt_model_used,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ===== 5. Verificar se tem áudio para transcrever =====
    if (!inbound.audio_storage_path) {
      throw new Error("Registro não possui audio_storage_path — não é possível baixar áudio");
    }

    // ===== 6. Marcar como transcribing =====
    const { error: updateTranscribingError } = await supabase
      .from("audio_inbound_messages")
      .update({ status: "transcribing" })
      .eq("id", inbound_message_id);

    if (updateTranscribingError) {
      console.warn(
        `[audio-inbound-transcribe] Warning: could not update status to transcribing: ${updateTranscribingError.message}`,
      );
    }

    // ===== 7. Baixar áudio do Storage =====
    console.info(
      `[audio-inbound-transcribe] Downloading audio from storage: ${inbound.audio_storage_path}`,
    );

    const { data: audioData, error: downloadError } = await supabase
      .storage
      .from("audio-files")
      .download(inbound.audio_storage_path);

    if (downloadError) {
      throw new Error(`Erro ao baixar áudio do Storage: ${downloadError.message}`);
    }

    if (!audioData) {
      throw new Error("Áudio baixado está vazio");
    }

    const audioBuffer = await audioData.arrayBuffer();
    console.info(
      `[audio-inbound-transcribe] Audio downloaded: ${audioBuffer.byteLength} bytes`,
    );

    // ===== 8. Verificar ElevenLabs API Key =====
    const elevenlabsKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!elevenlabsKey) {
      console.warn(`[audio-inbound-transcribe] ELEVENLABS_API_KEY not configured`);

      // Reverter status para received
      await supabase
        .from("audio_inbound_messages")
        .update({ status: "received", last_error: "ELEVENLABS_API_KEY não configurada" })
        .eq("id", inbound_message_id);

      return new Response(
        JSON.stringify({ success: false, configured: false, error: "ELEVENLABS_API_KEY não configurada" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ===== 9. Chamar ElevenLabs STT =====
    console.info(`[audio-inbound-transcribe] Calling ElevenLabs STT...`);

    let sttResult;
    try {
      sttResult = await speechToText({
        audioBuffer,
        modelId: "eleven_multilingual_v2",
      });
    } catch (sttError) {
      const sttErrorMessage = sttError instanceof Error ? sttError.message : "Erro desconhecido no STT";
      console.error(`[audio-inbound-transcribe] STT failed: ${sttErrorMessage}`);

      await supabase
        .from("audio_inbound_messages")
        .update({ status: "failed", last_error: sttErrorMessage })
        .eq("id", inbound_message_id);

      throw new Error(`ElevenLabs STT failed: ${sttErrorMessage}`);
    }

    const transcriptionText = sttResult.text;
    const durationSeconds = sttResult.durationSeconds;
    const sttModelUsed = "eleven_multilingual_v2";

    console.info(
      `[audio-inbound-transcribe] STT success: text_length=${transcriptionText.length}, duration=${durationSeconds}s`,
    );

    // ===== 10. Atualizar audio_inbound_messages com transcrição =====
    const { error: updateTranscribedError } = await supabase
      .from("audio_inbound_messages")
      .update({
        transcription_text: transcriptionText,
        status: "transcribed",
        stt_model_used: sttModelUsed,
      })
      .eq("id", inbound_message_id);

    if (updateTranscribedError) {
      console.error(
        `[audio-inbound-transcribe] Failed to update transcription: ${updateTranscribedError.message}`,
      );
      throw new Error(`Erro ao salvar transcrição: ${updateTranscribedError.message}`);
    }

    console.info(
      `[audio-inbound-transcribe] Transcription saved to audio_inbound_messages: id=${inbound_message_id}`,
    );

    // ===== 11. Registrar custo em audio_costs =====
    // Estimativa de custo ElevenLabs STT: ~$0.0001/segundo (preço varia, mantemos estimativa conservadora)
    const estimatedCost = durationSeconds > 0 ? durationSeconds * 0.0001 : 0.001;

    const { error: costError } = await supabase
      .from("audio_costs")
      .insert({
        org_id: inbound.org_id,
        date: new Date().toISOString().split("T")[0],
        provider: "elevenlabs",
        operation: "stt",
        chars_consumed: transcriptionText.length,
        estimated_cost: estimatedCost,
      });

    if (costError) {
      // Non-fatal: loga warning mas não falha a operação
      console.warn(
        `[audio-inbound-transcribe] Warning: could not register cost: ${costError.message}`,
      );
    } else {
      console.info(
        `[audio-inbound-transcribe] Cost registered: estimated=${estimatedCost}, chars=${transcriptionText.length}`,
      );
    }

    // ===== 12. Atualizar audio_summary_jobs relacionado (se houver) =====
    // audio_summary_jobs pode estar relacionado via provider_message_id ou phone number
    // Procuramos jobs pendentes/failed com o mesmo org_id e recipient_phone
    if (inbound.org_id && inbound.contact_phone) {
      const { data: relatedJobs, error: jobsError } = await supabase
        .from("audio_summary_jobs")
        .select("id, status")
        .eq("org_id", inbound.org_id)
        .eq("recipient_phone", inbound.contact_phone)
        .in("status", ["pending", "failed"])
        .limit(5);

      if (!jobsError && relatedJobs && relatedJobs.length > 0) {
        for (const job of relatedJobs) {
          // Se estava failed, marca como pending para retentar
          const newStatus = job.status === "failed" ? "pending" : job.status;

          const { error: updateJobError } = await supabase
            .from("audio_summary_jobs")
            .update({ status: newStatus, last_error: null })
            .eq("id", job.id);

          if (updateJobError) {
            console.warn(
              `[audio-inbound-transcribe] Warning: could not update audio_summary_jobs ${job.id}: ${updateJobError.message}`,
            );
          } else {
            console.info(
              `[audio-inbound-transcribe] audio_summary_jobs ${job.id} updated: ${job.status} -> ${newStatus}`,
            );
          }
        }
      }
    }

    // ===== 13. Retornar sucesso =====
    return new Response(
      JSON.stringify({
        success: true,
        inbound_message_id,
        transcription_text: transcriptionText,
        duration_seconds: durationSeconds,
        stt_model_used: sttModelUsed,
        chars: transcriptionText.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro interno";
    console.error(`[audio-inbound-transcribe] Error: ${errorMessage}`);

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
