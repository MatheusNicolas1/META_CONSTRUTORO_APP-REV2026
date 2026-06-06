// send-audio-summary: Edge Function para gerar resumo de audio via ElevenLabs
//
// Fluxo completo (WhatsApp configurado):
//   1. Consulta dados reais da org (obras ativas, atividades recentes, RDOs do dia)
//   2. Monta texto resumo em portugues
//   3. Chama ElevenLabs TTS -> MP3
//   4. Salva audio no Supabase Storage (bucket: audio-files / {orgId}/{jobId}.mp3)
//   5. Se WhatsApp estiver configurado: upload media + envia mensagem
//   6. Registra job em audio_jobs com status e detalhes
//
// Fluxo parcial (sem WhatsApp):
//   Executa ate passo 4, status = 'generated' (sem envio)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const ELEVENLABS_API = "https://api.elevenlabs.io/v1/text-to-speech";
const WHATSAPP_API_BASE = "https://graph.facebook.com/v18.0";

interface SendAudioRequest {
  orgId: string;
  recipientPhone: string;
  voiceId?: string;
  forceWhatsapp?: boolean; // se true, falha se whatsapp nao configurado
}

function formatPhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

async function fetchOrgSummary(supabaseClient: any, orgId: string): Promise<string> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Obras ativas
  const { data: obras } = await supabaseClient
    .from("obras")
    .select("id, nome, status")
    .eq("org_id", orgId)
    .eq("status", "em_andamento")
    .limit(5);

  // Atividades recentes (ultimos 7 dias)
  const { data: atividades } = await supabaseClient
    .from("atividades")
    .select("id, titulo, status, prioridade, obra_id, updated_at")
    .eq("org_id", orgId)
    .gte("updated_at", weekAgo)
    .order("updated_at", { ascending: false })
    .limit(10);

  // RDOs do dia
  const { data: rdos } = await supabaseClient
    .from("rdos")
    .select("id, status, obra_id, created_at")
    .eq("org_id", orgId)
    .gte("created_at", todayStart)
    .order("created_at", { ascending: false })
    .limit(5);

  const obraCount = obras?.length ?? 0;
  const atividadeCount = atividades?.length ?? 0;
  const rdoCount = rdos?.length ?? 0;

  const atividadeConcluida = atividades?.filter((a: any) => a.status === "concluida").length ?? 0;
  const atividadePendente = atividades?.filter((a: any) => a.status === "pendente" || a.status === "em_andamento").length ?? 0;
  const rdoAprovado = rdos?.filter((r: any) => r.status === "APPROVED").length ?? 0;
  const rdoPendente = rdos?.filter((r: any) => r.status === "SUBMITTED" || r.status === "DRAFT").length ?? 0;

  const obraNomes = (obras ?? []).map((o: any) => o.nome).join(", ");

  const hoje = now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  let resumo = `Olá! Aqui está o resumo da Meta Construtor de ${hoje}.\n\n`;

  if (obraCount === 0 && atividadeCount === 0 && rdoCount === 0) {
    resumo += "Nenhuma atividade registrada no período. Tudo em ordem!";
  } else {
    if (obraCount > 0) {
      resumo += `Você tem ${obraCount} obra${obraCount > 1 ? "s" : ""} ativa${obraCount > 1 ? "s" : ""}: ${obraNomes}.\n\n`;
    }

    if (atividadeCount > 0) {
      resumo += `Atividades: ${atividadeConcluida} concluída${atividadeConcluida !== 1 ? "s" : ""}`;
      if (atividadePendente > 0) {
        resumo += ` e ${atividadePendente} pendente${atividadePendente !== 1 ? "s" : ""}`;
      }
      resumo += ` nos últimos 7 dias.\n\n`;
    }

    if (rdoCount > 0) {
      resumo += `RDOs de hoje: ${rdoCount} registro${rdoCount > 1 ? "s" : ""}`;
      if (rdoAprovado > 0) resumo += `, ${rdoAprovado} aprovado${rdoAprovado !== 1 ? "s" : ""}`;
      if (rdoPendente > 0) resumo += `, ${rdoPendente} pendente${rdoPendente !== 1 ? "s" : ""} de aprovação`;
      resumo += ".\n\n";
    }
  }

  resumo += "Acesse o app para mais detalhes: https://www.metaconstrutor.app.br";

  return resumo;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let orgId: string;
  let recipientPhone: string;
  let voiceId: string;
  let jobId: string;

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body: SendAudioRequest = await req.json();
    orgId = body.orgId;
    recipientPhone = body.recipientPhone;
    voiceId = body.voiceId || "pNInz6obpgDQG8FMA7zC"; // Voz masculina padrao: Bill

    if (!orgId || !recipientPhone) {
      return new Response(
        JSON.stringify({ success: false, error: "orgId e recipientPhone sao obrigatorios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formattedPhone = formatPhone(recipientPhone);

    // ===== 1. Criar job =====
    const { data: job, error: jobError } = await supabaseClient
      .from("audio_jobs")
      .insert({
        org_id: orgId,
        user_id: "00000000-0000-0000-0000-000000000000",
        recipient_phone: formattedPhone,
        voice_id: voiceId,
        status: "generating",
      })
      .select("id")
      .single();

    if (jobError || !job) {
      throw new Error(`Falha ao criar job: ${jobError?.message}`);
    }
    jobId = job.id;

    // ===== 2. Gerar resumo textual =====
    console.info(`[${jobId}] Gerando resumo para org=${orgId}`);
    const summaryText = await fetchOrgSummary(supabaseClient, orgId);

    await supabaseClient
      .from("audio_jobs")
      .update({ summary_text: summaryText, chars_consumed: summaryText.length })
      .eq("id", jobId);

    // ===== 3. Chamar ElevenLabs TTS =====
    const elevenlabsKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!elevenlabsKey) {
      throw new Error("ELEVENLABS_API_KEY nao configurada nos secrets do Supabase");
    }

    console.info(`[${jobId}] Chamando ElevenLabs TTS com voice_id=${voiceId}`);
    const ttsResponse = await fetch(`${ELEVENLABS_API}/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": elevenlabsKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: summaryText,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!ttsResponse.ok) {
      const ttsError = await ttsResponse.text();
      throw new Error(`ElevenLabs TTS falhou (${ttsResponse.status}): ${ttsError}`);
    }

    const audioBuffer = await ttsResponse.arrayBuffer();
    const audioBytes = audioBuffer.byteLength;
    console.info(`[${jobId}] Audio gerado: ${audioBytes} bytes`);

    // ===== 4. Salvar audio no Supabase Storage =====
    const storagePath = `${orgId}/${jobId}.mp3`;
    console.info(`[${jobId}] Salvando no Storage: ${storagePath}`);

    const { error: uploadStorageError } = await supabaseClient
      .storage
      .from("audio-files")
      .upload(storagePath, audioBuffer, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (uploadStorageError) {
      // Se o bucket nao existir, tentar criar e reupload
      console.warn(`[${jobId}] Erro ao salvar no Storage (bucket pode nao existir): ${uploadStorageError.message}`);
    }

    // Gera URL publica para download (se bucket for publico) ou signed URL
    const { data: publicUrlData } = supabaseClient
      .storage
      .from("audio-files")
      .getPublicUrl(storagePath);

    const audioUrl = publicUrlData?.publicUrl || null;

    await supabaseClient
      .from("audio_jobs")
      .update({
        status: "generated",
        audio_storage_path: storagePath,
      })
      .eq("id", jobId);

    // ===== 5. Tentar WhatsApp (opcional) =====
    const whatsappToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
    const whatsappPhoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
    const whatsappConfigured = !!(whatsappToken && whatsappPhoneId);

    if (!whatsappConfigured) {
      if (body.forceWhatsapp) {
        throw new Error(
          "WhatsApp nao configurado. Configure WHATSAPP_ACCESS_TOKEN e WHATSAPP_PHONE_NUMBER_ID nos secrets."
        );
      }

      console.info(`[${jobId}] WhatsApp nao configurado. Job concluido em status=generated.`);

      return new Response(
        JSON.stringify({
          success: true,
          jobId,
          status: "generated",
          mode: "tts_only",
          charsConsumed: summaryText.length,
          audioBytes,
          audioUrl,
          summaryText,
          info: "Audio gerado e salvo no Storage. Configure WHATSAPP_ACCESS_TOKEN e WHATSAPP_PHONE_NUMBER_ID para enviar via WhatsApp.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // WhatsApp configurado: upload + envio
    console.info(`[${jobId}] Enviando via WhatsApp para ${formattedPhone}`);

    // Upload media
    const formData = new FormData();
    formData.append("file", new Blob([audioBuffer], { type: "audio/mpeg" }), "resumo.mp3");
    formData.append("messaging_product", "whatsapp");

    const uploadResponse = await fetch(`${WHATSAPP_API_BASE}/${whatsappPhoneId}/media`, {
      method: "POST",
      headers: { Authorization: `Bearer ${whatsappToken}` },
      body: formData,
    });

    if (!uploadResponse.ok) {
      const uploadError = await uploadResponse.text();
      throw new Error(`WhatsApp upload falhou (${uploadResponse.status}): ${uploadError}`);
    }

    const uploadData = await uploadResponse.json();
    const mediaId = uploadData.id;
    console.info(`[${jobId}] WhatsApp media ID: ${mediaId}`);

    // Enviar mensagem
    const sendResponse = await fetch(`${WHATSAPP_API_BASE}/${whatsappPhoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${whatsappToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: formattedPhone,
        type: "audio",
        audio: { id: mediaId },
      }),
    });

    const sendData = await sendResponse.json();

    if (!sendResponse.ok || sendData.error) {
      throw new Error(`WhatsApp envio falhou: ${JSON.stringify(sendData.error || sendData)}`);
    }

    const messageId = sendData.messages?.[0]?.id;
    console.info(`[${jobId}] WhatsApp message ID: ${messageId}`);

    // Atualizar job como sent
    await supabaseClient
      .from("audio_jobs")
      .update({
        status: "sent",
        whatsapp_media_id: mediaId,
        whatsapp_message_id: messageId,
        sent_at: new Date().toISOString(),
        attempts: 1,
      })
      .eq("id", jobId);

    return new Response(
      JSON.stringify({
        success: true,
        jobId,
        status: "sent",
        mode: "whatsapp",
        messageId,
        mediaId,
        charsConsumed: summaryText.length,
        audioBytes,
        audioUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro interno";
    console.error(`[send-audio-summary] Erro: ${errorMessage}`);

    if (jobId!) {
      try {
        const supabaseClient = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );
        await supabaseClient
          .from("audio_jobs")
          .update({
            status: "failed",
            last_error: errorMessage,
            attempts: 1,
          })
          .eq("id", jobId!);
      } catch {
        // Silencioso
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: errorMessage, jobId }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
