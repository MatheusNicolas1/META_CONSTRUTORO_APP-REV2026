import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

interface WhatsAppRequest {
  action: 'test' | 'send-message' | 'send-template' | 'send-audio' | 'send-media' | 'verify-webhook';
  to?: string;
  message?: string;
  templateName?: string;
  templateParams?: string[];
  mediaUrl?: string;
  mediaType?: 'image' | 'document' | 'video' | 'audio';
  caption?: string;
  filename?: string;
  webhookVerifyToken?: string;
}

interface MediaPayload {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'audio' | 'image' | 'document' | 'video';
  audio?: { id?: string; link?: string };
  image?: { id?: string; link?: string; caption?: string };
  document?: { id?: string; link?: string; caption?: string; filename?: string };
  video?: { id?: string; link?: string; caption?: string };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestData: WhatsAppRequest = await req.json();
    const { action, to, message, templateName, templateParams, mediaUrl, mediaType, caption, filename } = requestData;

    // Get WhatsApp Business API credentials from secrets
    const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
    const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
    const businessAccountId = Deno.env.get('WHATSAPP_BUSINESS_ACCOUNT_ID');

    if (!accessToken || !phoneNumberId) {
      console.info('WhatsApp Business API credentials not configured');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'WhatsApp integration not configured. Please add WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID secrets.',
          message: 'WhatsApp integration is blocked until API secrets are configured.',
          configured: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const whatsappApiUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

    switch (action) {
      case 'test': {
        // Test connection by checking phone number details
        try {
          const response = await fetch(
            `https://graph.facebook.com/v18.0/${phoneNumberId}`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              }
            }
          );

          const data = await response.json();

          if (data.error) {
            console.error('WhatsApp test error:', data.error);
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: data.error.message,
                configured: true
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'WhatsApp Business API connection successful',
              phoneNumber: data.display_phone_number,
              verifiedName: data.verified_name,
              configured: true
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('WhatsApp test connection error:', error);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Failed to connect to WhatsApp API',
              configured: true
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'send-message': {
        if (!to || !message) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields: to, message' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Format phone number (remove non-digits, ensure country code)
        const formattedPhone = to.replace(/\D/g, '');

        const messagePayload: any = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedPhone,
          type: 'text',
          text: { body: message }
        };

        try {
          const response = await fetch(whatsappApiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(messagePayload)
          });

          const data = await response.json();

          if (data.error) {
            console.error('WhatsApp send error:', data.error);
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: data.error.message,
                errorCode: data.error.code
              }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          console.info('WhatsApp message sent:', { to: formattedPhone, messageId: data.messages?.[0]?.id, userId: user.id });

          return new Response(
            JSON.stringify({ 
              success: true, 
              messageId: data.messages?.[0]?.id,
              status: 'sent'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('WhatsApp send error:', error);
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to send message' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'send-template': {
        if (!to || !templateName) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields: to, templateName' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const formattedPhone = to.replace(/\D/g, '');

        const templatePayload: any = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedPhone,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'pt_BR' },
            components: templateParams?.length ? [{
              type: 'body',
              parameters: templateParams.map(param => ({ type: 'text', text: param }))
            }] : []
          }
        };

        try {
          const response = await fetch(whatsappApiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(templatePayload)
          });

          const data = await response.json();

          if (data.error) {
            console.error('WhatsApp template error:', data.error);
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: data.error.message,
                errorCode: data.error.code
              }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          console.info('WhatsApp template sent:', { to: formattedPhone, templateName, messageId: data.messages?.[0]?.id, userId: user.id });

          return new Response(
            JSON.stringify({ 
              success: true, 
              messageId: data.messages?.[0]?.id,
              status: 'sent'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('WhatsApp template error:', error);
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to send template message' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'send-audio': {
        if (!to || !mediaUrl) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields: to, mediaUrl' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const formattedPhone = to.replace(/\D/g, '');

        // Determine if mediaUrl is a media_id (alphanumeric without protocol) or an external URL
        const isMediaId = /^[a-zA-Z0-9_-]+$/.test(mediaUrl) && !mediaUrl.includes('://');

        const audioPayload: MediaPayload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedPhone,
          type: 'audio',
          audio: isMediaId ? { id: mediaUrl } : { link: mediaUrl }
        };

        try {
          const response = await fetch(whatsappApiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(audioPayload)
          });

          const data = await response.json();

          if (data.error) {
            console.error('WhatsApp send-audio error:', data.error);
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: data.error.message,
                errorCode: data.error.code
              }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          console.info('WhatsApp audio sent:', { to: formattedPhone, mediaUrl, messageId: data.messages?.[0]?.id, userId: user.id });

          return new Response(
            JSON.stringify({ 
              success: true, 
              messageId: data.messages?.[0]?.id,
              mediaType: 'audio',
              status: 'sent'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('WhatsApp send-audio error:', error);
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to send audio message' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'send-media': {
        if (!to || !mediaUrl || !mediaType) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields: to, mediaUrl, mediaType' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Validate mediaType is one of the supported types
        const validMediaTypes = ['image', 'document', 'video', 'audio'];
        if (!validMediaTypes.includes(mediaType)) {
          return new Response(
            JSON.stringify({ error: `Invalid mediaType. Must be one of: ${validMediaTypes.join(', ')}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const formattedPhone = to.replace(/\D/g, '');

        // Determine if mediaUrl is a media_id (alphanumeric without protocol) or an external URL
        const isMediaId = /^[a-zA-Z0-9_-]+$/.test(mediaUrl) && !mediaUrl.includes('://');

        // Build the media payload based on type
        const mediaPayload: MediaPayload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedPhone,
          type: mediaType as 'audio' | 'image' | 'document' | 'video',
        };

        // Set the media-specific property (audio, image, document, video) with link or id
        const mediaRef = isMediaId ? { id: mediaUrl } : { link: mediaUrl };

        switch (mediaType) {
          case 'audio':
            mediaPayload.audio = mediaRef;
            break;
          case 'image':
            mediaPayload.image = { ...mediaRef };
            if (caption) mediaPayload.image.caption = caption;
            break;
          case 'document':
            mediaPayload.document = { ...mediaRef };
            if (caption) mediaPayload.document.caption = caption;
            if (filename) mediaPayload.document.filename = filename;
            break;
          case 'video':
            mediaPayload.video = { ...mediaRef };
            if (caption) mediaPayload.video.caption = caption;
            break;
        }

        try {
          const response = await fetch(whatsappApiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(mediaPayload)
          });

          const data = await response.json();

          if (data.error) {
            console.error('WhatsApp send-media error:', data.error);
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: data.error.message,
                errorCode: data.error.code
              }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          console.info('WhatsApp media sent:', { to: formattedPhone, mediaType, mediaUrl, caption, filename, messageId: data.messages?.[0]?.id, userId: user.id });

          return new Response(
            JSON.stringify({ 
              success: true, 
              messageId: data.messages?.[0]?.id,
              mediaType,
              status: 'sent'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('WhatsApp send-media error:', error);
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to send media message' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: unknown) {
    console.error('WhatsApp integration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
