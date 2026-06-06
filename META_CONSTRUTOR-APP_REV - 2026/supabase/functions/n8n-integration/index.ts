import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { createScopedClient } from "../_shared/supabase-client.ts";
import { requireAuth, logRequest } from "../_shared/guards.ts";

interface N8NTestRequest {
  action: 'test' | 'trigger';
  n8nUrl?: string;
  apiKey?: string;
  webhookUrl?: string;
  payload?: Record<string, unknown>;
}

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let user_id: string | undefined;

  try {
    const supabaseClient = createScopedClient(req);
    const user = await requireAuth(supabaseClient);
    user_id = user.id;

    logRequest(requestId, user_id, null, 'n8n-integration', 'success', 'Auth passed');

    const body: N8NTestRequest = await req.json();
    const { action } = body;

    if (action === 'test') {
      const { n8nUrl, apiKey } = body;
      if (!n8nUrl || !apiKey) {
        return new Response(
          JSON.stringify({
            success: false,
            configured: false,
            error: 'URL e API Key do N8N sao obrigatorios para teste real.',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.info(`Testing N8N connection to: ${n8nUrl}`);

      const response = await fetch(`${n8nUrl}/api/v1/workflows`, {
        method: 'GET',
        headers: {
          'X-N8N-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return new Response(
          JSON.stringify({ success: true, configured: true, message: 'Conexao com N8N estabelecida com sucesso' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      await response.text().catch(() => '');
      return new Response(
        JSON.stringify({
          success: false,
          configured: true,
          error: `Falha na conexao: ${response.status} - verifique a URL e API Key.`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'trigger') {
      const { webhookUrl, payload } = body;

      if (!webhookUrl) {
        return new Response(
          JSON.stringify({
            success: false,
            configured: false,
            error: 'URL do webhook N8N e obrigatoria para disparo real.',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payload,
          timestamp: new Date().toISOString(),
          userId: user.id,
        }),
      });

      if (response.ok) {
        const responseData = await response.json().catch(() => ({}));
        return new Response(
          JSON.stringify({ success: true, configured: true, data: responseData }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          configured: true,
          error: `Webhook retornou erro: ${response.status}`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Acao invalida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    logRequest(requestId, user_id, null, 'n8n-integration', 'error', error.message);
    const status = error.message.includes('Unauthorized') ? 401 : 500;
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
