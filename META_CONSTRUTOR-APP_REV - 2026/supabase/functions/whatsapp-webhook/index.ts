// whatsapp-webhook: Endpoint público para receber webhooks do WhatsApp Business API
//
// GET  /?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...
//   - Verify token (Webhook setup do Meta)
//   - Retorna hub.challenge como text/plain se token válido, senão 403
//
// POST / (recebe webhook JSON do Meta)
//   - Processa entry[].changes[].value.messages[]
//     - Áudio: cria registro em audio_inbound_messages
//     - Texto: cria registro simples
//   - Processa entry[].changes[].value.statuses[] (message_status)
//     - Atualiza audio_summary_jobs com status/whatsapp_message_id
//   - Sempre retorna 200 OK (WhatsApp retenta se errar)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/supabase-client.ts";

interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  audio?: { id: string; mime_type?: string };
  image?: { id: string };
  video?: { id: string };
  document?: { id: string };
}

interface WhatsAppStatus {
  id: string; // message id
  status: string; // "sent" | "delivered" | "read" | "failed"
  timestamp: string;
  recipient_id: string;
  conversation?: { id: string };
  pricing?: { billable: boolean; pricing_model: string };
}

interface WhatsAppChange {
  value: {
    messaging_product: string;
    metadata: {
      display_phone_number: string;
      phone_number_id: string;
    };
    messages?: WhatsAppMessage[];
    statuses?: WhatsAppStatus[];
  };
  field: string;
}

interface WhatsAppEntry {
  id: string;
  changes: WhatsAppChange[];
}

interface WhatsAppWebhookPayload {
  object: string;
  entry: WhatsAppEntry[];
}

/** Formata número: remove não-dígitos, prefixo 55 */
function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  // Se já tem 55 no início, mantém; senão adiciona
  if (digits.startsWith("55")) return digits;
  return `55${digits}`;
}

/** Extrai media ID de uma mensagem conforme seu tipo */
function extractMediaId(msg: WhatsAppMessage): string | null {
  if (msg.audio?.id) return msg.audio.id;
  if (msg.image?.id) return msg.image.id;
  if (msg.video?.id) return msg.video.id;
  if (msg.document?.id) return msg.document.id;
  return null;
}

/** Processa uma única mensagem de áudio */
async function processAudioMessage(
  supabase: ReturnType<typeof createAdminClient>,
  msg: WhatsAppMessage,
  change: WhatsAppChange,
): Promise<void> {
  const mediaId = extractMediaId(msg);
  const fromPhone = formatPhone(msg.from);

  console.info(
    `[whatsapp-webhook] Audio message received: message_id=${msg.id}, from=${fromPhone}, media_id=${mediaId || "N/A"}`,
  );

  // Tenta baixar URL do áudio via WhatsApp API (se token configurado)
  let mediaUrl: string | null = null;
  const whatsappToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  if (whatsappToken && mediaId) {
    try {
      const mediaRes = await fetch(
        `https://graph.facebook.com/v18.0/${mediaId}`,
        { headers: { Authorization: `Bearer ${whatsappToken}` } },
      );
      if (mediaRes.ok) {
        const mediaData = await mediaRes.json();
        mediaUrl = mediaData.url || null;
        console.info(
          `[whatsapp-webhook] Media URL retrieved for ${mediaId}: ${mediaUrl ? "OK" : "N/A"}`,
        );
      } else {
        console.warn(
          `[whatsapp-webhook] Failed to retrieve media info for ${mediaId}: ${mediaRes.status}`,
        );
      }
    } catch (err) {
      console.warn(
        `[whatsapp-webhook] Error fetching media ${mediaId}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  // Baixa o binário do áudio se temos URL
  let audioBytes: number | null = null;
  let audioStoragePath: string | null = null;
  if (mediaUrl && whatsappToken) {
    try {
      const audioRes = await fetch(mediaUrl, {
        headers: { Authorization: `Bearer ${whatsappToken}` },
      });
      if (audioRes.ok) {
        const audioBuffer = await audioRes.arrayBuffer();
        audioBytes = audioBuffer.byteLength;

        // Salva no Supabase Storage
        const storagePath = `inbound/${msg.id}.ogg`;
        const { error: uploadError } = await supabase.storage
          .from("audio-files")
          .upload(storagePath, audioBuffer, {
            contentType: msg.audio?.mime_type || "audio/ogg",
            upsert: true,
          });

        if (uploadError) {
          console.warn(
            `[whatsapp-webhook] Storage upload failed: ${uploadError.message}`,
          );
        } else {
          audioStoragePath = storagePath;
          console.info(
            `[whatsapp-webhook] Audio saved to storage: ${storagePath} (${audioBytes} bytes)`,
          );
        }
      } else {
        console.warn(
          `[whatsapp-webhook] Failed to download audio: ${audioRes.status}`,
        );
      }
    } catch (err) {
      console.warn(
        `[whatsapp-webhook] Error downloading audio: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  const { error: insertError } = await supabase
    .from("audio_inbound_messages")
    .insert({
      message_id: msg.id,
      from_phone: fromPhone,
      message_type: "audio",
      media_id: mediaId,
      media_url: mediaUrl,
      audio_storage_path: audioStoragePath,
      audio_bytes: audioBytes,
      raw_payload: {
        message: msg,
        metadata: change.value.metadata,
      },
      received_at: new Date(parseInt(msg.timestamp) * 1000).toISOString(),
    });

  if (insertError) {
    console.error(
      `[whatsapp-webhook] Failed to insert audio_inbound_messages for ${msg.id}: ${insertError.message}`,
    );
  } else {
    console.info(
      `[whatsapp-webhook] audio_inbound_messages created for ${msg.id}`,
    );
  }
}

/** Processa uma única mensagem de texto */
async function processTextMessage(
  supabase: ReturnType<typeof createAdminClient>,
  msg: WhatsAppMessage,
  change: WhatsAppChange,
): Promise<void> {
  const fromPhone = formatPhone(msg.from);
  const textBody = msg.text?.body || "";

  console.info(
    `[whatsapp-webhook] Text message received: message_id=${msg.id}, from=${fromPhone}, text_length=${textBody.length}`,
  );

  const { error: insertError } = await supabase
    .from("audio_inbound_messages")
    .insert({
      message_id: msg.id,
      from_phone: fromPhone,
      message_type: "text",
      text_body: textBody,
      raw_payload: {
        message: msg,
        metadata: change.value.metadata,
      },
      received_at: new Date(parseInt(msg.timestamp) * 1000).toISOString(),
    });

  if (insertError) {
    console.error(
      `[whatsapp-webhook] Failed to insert audio_inbound_messages for ${msg.id}: ${insertError.message}`,
    );
  } else {
    console.info(
      `[whatsapp-webhook] audio_inbound_messages created (text) for ${msg.id}`,
    );
  }
}

/** Processa uma mensagem de mídia não-áudio (image/video/document) */
async function processMediaMessage(
  supabase: ReturnType<typeof createAdminClient>,
  msg: WhatsAppMessage,
  change: WhatsAppChange,
): Promise<void> {
  const mediaId = extractMediaId(msg);
  const fromPhone = formatPhone(msg.from);

  console.info(
    `[whatsapp-webhook] ${msg.type} message received: message_id=${msg.id}, from=${fromPhone}, media_id=${mediaId || "N/A"}`,
  );

  const { error: insertError } = await supabase
    .from("audio_inbound_messages")
    .insert({
      message_id: msg.id,
      from_phone: fromPhone,
      message_type: msg.type,
      media_id: mediaId,
      raw_payload: {
        message: msg,
        metadata: change.value.metadata,
      },
      received_at: new Date(parseInt(msg.timestamp) * 1000).toISOString(),
    });

  if (insertError) {
    console.error(
      `[whatsapp-webhook] Failed to insert audio_inbound_messages for ${msg.id}: ${insertError.message}`,
    );
  } else {
    console.info(
      `[whatsapp-webhook] audio_inbound_messages created (${msg.type}) for ${msg.id}`,
    );
  }
}

/** Processa status updates do WhatsApp */
async function processStatusUpdate(
  supabase: ReturnType<typeof createAdminClient>,
  status: WhatsAppStatus,
): Promise<void> {
  console.info(
    `[whatsapp-webhook] Status update: message_id=${status.id}, status=${status.status}`,
  );

  // Tenta atualizar audio_summary_jobs com o message_id do WhatsApp
  const { error: updateError } = await supabase
    .from("audio_summary_jobs")
    .update({
      whatsapp_message_status: status.status,
      whatsapp_status_updated_at: new Date(
        parseInt(status.timestamp) * 1000,
      ).toISOString(),
    })
    .eq("whatsapp_message_id", status.id);

  if (updateError) {
    // Pode não haver job correspondente — log apenas como warn
    console.warn(
      `[whatsapp-webhook] No audio_summary_jobs match for message_id ${status.id}: ${updateError.message}`,
    );
  } else {
    console.info(
      `[whatsapp-webhook] audio_summary_jobs updated for message_id ${status.id} -> ${status.status}`,
    );
  }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const url = new URL(req.url);

  // ===== OPTIONS (CORS preflight) =====
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // ===== GET: Webhook verification (Meta Setup) =====
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    console.info(
      `[whatsapp-webhook] Verify attempt: mode=${mode}, token_provided=${!!token}, challenge_provided=${!!challenge}`,
    );

    const expectedToken = Deno.env.get("WHATSAPP_WEBHOOK_VERIFY_TOKEN");

    if (
      mode === "subscribe" &&
      token &&
      expectedToken &&
      token === expectedToken &&
      challenge
    ) {
      console.info(
        `[whatsapp-webhook] Verify SUCCESS — returning challenge: ${challenge}`,
      );
      return new Response(challenge, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/plain",
        },
      });
    }

    console.warn(
      `[whatsapp-webhook] Verify FAILED — mode=${mode}, token_match=${token === expectedToken}`,
    );
    return new Response("Forbidden", {
      status: 403,
      headers: corsHeaders,
    });
  }

  // ===== POST: Webhook events from Meta =====
  if (req.method === "POST") {
    let payload: WhatsAppWebhookPayload;

    try {
      payload = await req.json();
    } catch (err) {
      console.error(
        `[whatsapp-webhook] Invalid JSON payload: ${err instanceof Error ? err.message : err}`,
      );
      // Sempre 200 — WhatsApp retenta se não for 200
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log do objeto recebido (resumido, sem dados sensíveis)
    const entryCount = payload.entry?.length || 0;
    console.info(
      `[whatsapp-webhook] Webhook received: object=${payload.object}, entries=${entryCount}`,
    );

    // Se não for do WhatsApp, ignora
    if (payload.object !== "whatsapp_business_account") {
      console.info(
        `[whatsapp-webhook] Ignoring non-whatsapp object: ${payload.object}`,
      );
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createAdminClient();

    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        const messages = change.value?.messages || [];
        const statuses = change.value?.statuses || [];

        // Processa mensagens
        for (const msg of messages) {
          try {
            console.info(
              `[whatsapp-webhook] Processing message: id=${msg.id}, type=${msg.type}, from=${msg.from}`,
            );

            if (msg.type === "audio") {
              await processAudioMessage(supabase, msg, change);
            } else if (msg.type === "text") {
              await processTextMessage(supabase, msg, change);
            } else {
              // image, video, document, etc.
              await processMediaMessage(supabase, msg, change);
            }
          } catch (err) {
            // Log do erro mas não propaga — sempre retorna 200
            console.error(
              `[whatsapp-webhook] Error processing message ${msg.id}: ${err instanceof Error ? err.message : err}`,
            );
          }
        }

        // Processa status updates
        for (const st of statuses) {
          try {
            await processStatusUpdate(supabase, st);
          } catch (err) {
            console.error(
              `[whatsapp-webhook] Error processing status ${st.id}: ${err instanceof Error ? err.message : err}`,
            );
          }
        }
      }
    }

    // Sempre retorna 200 OK para o WhatsApp não retentar
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ===== Outros métodos =====
  return new Response("Method Not Allowed", {
    status: 405,
    headers: corsHeaders,
  });
});
