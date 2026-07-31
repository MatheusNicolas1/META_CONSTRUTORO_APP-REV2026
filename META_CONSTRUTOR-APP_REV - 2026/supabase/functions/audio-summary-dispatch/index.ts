// audio-summary-dispatch: Edge Function para disparar áudio via WhatsApp com idempotência
//
// Fluxo:
//   1. Recebe job_id no body
//   2. Busca o job em audio_summary_jobs (deve estar com status='generated')
//   3. Verifica/gera idempotency_key para evitar disparo duplicado
//   4. Se WHATSAPP_ACCESS_TOKEN configurado: upload media + envia audio via WhatsApp API
//   5. Se WHATSAPP_ACCESS_TOKEN não configurado: retorna graciosamente (não crasha)
//   6. Atualiza audio_summary_jobs (status, provider_message_id, sent_at, chars_consumed)
//   7. Registra custo em audio_costs
//   8. Autenticada via service role (createAdminClient)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/supabase-client.ts";

const WHATSAPP_API_BASE = "https://graph.facebook.com/v18.0";

interface DispatchRequest {
  job_id: string;
}

function formatPhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabase = createAdminClient();

    // ===== Parse body =====
    const body: DispatchRequest = await req.json();
    const { job_id } = body;

    if (!job_id) {
      return new Response(
        JSON.stringify({ success: false, error: "job_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.info(`[audio-summary-dispatch] Iniciando disparo para job=${job_id}`);

    // ===== Buscar job em audio_summary_jobs =====
    const { data: job, error: jobError } = await supabase
      .from("audio_summary_jobs")
      .select("*")
      .eq("id", job_id)
      .single();

    if (jobError || !job) {
      throw new Error(`Job não encontrado: ${jobError?.message || "job_id inválido"}`);
    }

    // ===== Verificar se job já foi disparado (idempotência) =====
    if (job.status === "sent" || job.status === "dispatched") {
      console.info(`[${job_id}] Job já foi disparado anteriormente (status=${job.status}). Retornando idempotente.`);

      return new Response(
        JSON.stringify({
          success: true,
          jobId: job_id,
          status: job.status,
          idempotent: true,
          message: "Job já foi disparado anteriormente.",
          providerMessageId: job.provider_message_id || null,
          sentAt: job.sent_at || null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ===== Verificar se job está em estado válido para disparo =====
    if (job.status !== "generated") {
      throw new Error(
        `Job em estado inválido para disparo: status=${job.status}. Esperado: 'generated'.`,
      );
    }

    // ===== Gerar idempotency_key se não existir =====
    const idempotencyKey = job.idempotency_key || `${job.org_id}_${crypto.randomUUID()}`;
    if (!job.idempotency_key) {
      await supabase
        .from("audio_summary_jobs")
        .update({ idempotency_key: idempotencyKey })
        .eq("id", job_id);
    }

    const orgId = job.org_id;
    const recipientPhone = job.recipient_phone;
    const storagePath = job.audio_storage_path || `${orgId}/${job_id}.mp3`;

    // ===== Verificar configuração do WhatsApp =====
    const whatsappToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
    const whatsappPhoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

    if (!whatsappToken || !whatsappPhoneId) {
      console.info(`[${job_id}] WhatsApp não configurado. WHATSAPP_ACCESS_TOKEN ou WHATSAPP_PHONE_NUMBER_ID ausente.`);

      // Atualizar job com info de não configurado
      await supabase
        .from("audio_summary_jobs")
        .update({
          status: "generated",
          last_error: "WhatsApp não configurado. Configure WHATSAPP_ACCESS_TOKEN e WHATSAPP_PHONE_NUMBER_ID nos secrets.",
          updated_at: new Date().toISOString(),
        })
        .eq("id", job_id);

      return new Response(
        JSON.stringify({
          success: false,
          configured: false,
          jobId: job_id,
          status: "generated",
          message: "WhatsApp não configurado. Configure WHATSAPP_ACCESS_TOKEN e WHATSAPP_PHONE_NUMBER_ID nos secrets do Supabase para enviar áudio via WhatsApp.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ===== Buscar URL do áudio no Storage =====
    // Tenta gerar URL assinada primeiro, depois fallback para pública
    let audioUrl: string | null = null;

    const { data: signedUrlData } = await supabase
      .storage
      .from("audio-files")
      .createSignedUrl(storagePath, 3600); // 1 hora

    if (signedUrlData?.signedUrl) {
      audioUrl = signedUrlData.signedUrl;
    } else {
      const { data: publicUrlData } = supabase
        .storage
        .from("audio-files")
        .getPublicUrl(storagePath);

      audioUrl = publicUrlData?.publicUrl || null;
    }

    if (!audioUrl) {
      throw new Error(`Áudio não encontrado no Storage: ${storagePath}`);
    }

    // ===== Fazer download do áudio do Storage para enviar ao WhatsApp =====
    console.info(`[${job_id}] Baixando áudio do Storage: ${storagePath}`);

    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error(`Falha ao baixar áudio do Storage: ${audioResponse.status}`);
    }

    const audioBuffer = await audioResponse.arrayBuffer();
    console.info(`[${job_id}] Áudio baixado: ${audioBuffer.byteLength} bytes`);

    // ===== Upload media para WhatsApp =====
    const formattedPhone = formatPhone(recipientPhone || "");

    if (!formattedPhone) {
      throw new Error("recipient_phone não definido no job");
    }

    console.info(`[${job_id}] Fazendo upload de media para WhatsApp...`);

    const formData = new FormData();
    formData.append("file", new Blob([audioBuffer], { type: "audio/mpeg" }), "resumo.mp3");
    formData.append("messaging_product", "whatsapp");

    const uploadResponse = await fetch(
      `${WHATSAPP_API_BASE}/${whatsappPhoneId}/media`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${whatsappToken}` },
        body: formData,
      },
    );

    if (!uploadResponse.ok) {
      const uploadError = await uploadResponse.text();
      throw new Error(`WhatsApp upload de media falhou (${uploadResponse.status}): ${uploadError}`);
    }

    const uploadData = await uploadResponse.json();
    const mediaId = uploadData.id;
    console.info(`[${job_id}] WhatsApp media ID obtido: ${mediaId}`);

    // ===== Enviar mensagem de áudio via WhatsApp =====
    console.info(`[${job_id}] Enviando mensagem de áudio WhatsApp para ${formattedPhone}`);

    const sendResponse = await fetch(
      `${WHATSAPP_API_BASE}/${whatsappPhoneId}/messages`,
      {
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
      },
    );

    const sendData = await sendResponse.json();

    if (!sendResponse.ok || sendData.error) {
      throw new Error(
        `WhatsApp envio de mensagem falhou: ${JSON.stringify(sendData.error || sendData)}`,
      );
    }

    const messageId = sendData.messages?.[0]?.id;
    console.info(`[${job_id}] WhatsApp message ID: ${messageId}`);

    // ===== Atualizar audio_summary_jobs com sucesso =====
    const now = new Date().toISOString();
    const charsConsumed = job.tts_chars_consumed || 0;

    await supabase
      .from("audio_summary_jobs")
      .update({
        status: "sent",
        provider_message_id: messageId,
        sent_at: now,
        idempotency_key: idempotencyKey,
        last_error: null,
        updated_at: now,
      })
      .eq("id", job_id);

    // ===== Registrar custo em audio_costs =====
    await supabase
      .from("audio_costs")
      .insert({
        org_id: orgId,
        provider: "whatsapp",
        operation: "dispatch_audio",
        chars_consumed: charsConsumed,
        estimated_cost: 0.001, // Custo fixo simbólico por disparo WhatsApp
        job_id: job_id,
        metadata: {
          provider_message_id: messageId,
          whatsapp_media_id: mediaId,
          storage_path: storagePath,
        },
      });

    const elapsed = Date.now() - startTime;

    console.info(`[${job_id}] Disparo concluído em ${elapsed}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        configured: true,
        jobId: job_id,
        status: "sent",
        providerMessageId: messageId,
        sentAt: now,
        charsConsumed: charsConsumed,
        audioBytes: audioBuffer.byteLength,
        elapsed,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro interno";
    console.error(`[audio-summary-dispatch] Erro: ${errorMessage}`);

    // Tentar extrair job_id do contexto para atualizar status como failed
    // Nota: job_id pode não estar definido se o erro ocorreu antes da busca do job
    // O importante é logar o erro e não crashar a função

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
