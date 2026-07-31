import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createHmac } from "https://deno.land/std@0.168.0/crypto/mod.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { createScopedClient, createAdminClient } from "../_shared/supabase-client.ts";
import { requireAuth, logRequest } from "../_shared/guards.ts";

interface N8NTestRequest {
  action: 'test' | 'trigger' | 'register-webhook' | 'test-webhook';
  n8nUrl?: string;
  apiKey?: string;
  webhookUrl?: string;
  payload?: Record<string, unknown>;
  name?: string;
  workflowUrl?: string;
  secret?: string;
  webhookId?: string;
}

interface RegisterWebhookRequest {
  action: 'register-webhook';
  name: string;
  workflowUrl: string;
  secret?: string;
}

interface TestWebhookRequest {
  action: 'test-webhook';
  webhookId: string;
}

function generateHmacSignature(payload: string, secret: string): string {
  const encoder = new TextEncoder();
  const key = encoder.encode(secret);
  const data = encoder.encode(payload);
  const hash = createHmac("sha256", key).update(data).digest();
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function isValidUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let user_id: string | undefined;
  let org_id: string | null = null;

  try {
    const supabaseClient = createScopedClient(req);
    const user = await requireAuth(supabaseClient);
    user_id = user.id;

    // Try to get org_id from user metadata or a default lookup
    org_id = user.user_metadata?.org_id || null;

    logRequest(requestId, user_id, org_id, 'n8n-integration', 'success', 'Auth passed');

    const body: N8NTestRequest = await req.json();
    const { action } = body;

    console.info(JSON.stringify({
      request_id: requestId,
      user_id,
      org_id,
      action,
      endpoint: 'n8n-integration',
      timestamp: new Date().toISOString(),
    }));

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
      const { webhookUrl, payload, secret } = body;

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

      if (!isValidUrl(webhookUrl)) {
        return new Response(
          JSON.stringify({
            success: false,
            configured: false,
            error: 'URL do webhook deve comecar com http:// ou https://.',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const bodyPayload = JSON.stringify({
        ...payload,
        timestamp: new Date().toISOString(),
        userId: user.id,
        org_id: org_id,
      });

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (secret) {
        const signature = generateHmacSignature(bodyPayload, secret);
        headers['x-n8n-signature'] = signature;
        console.info(`HMAC signature generated for webhook ${webhookUrl}`);
      }

      console.info(JSON.stringify({
        request_id: requestId,
        action: 'trigger',
        webhook_url: webhookUrl,
        org_id,
        user_id,
        has_signature: !!secret,
      }));

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: bodyPayload,
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

    if (action === 'register-webhook') {
      const { name, workflowUrl, secret } = body as RegisterWebhookRequest;

      if (!name || !workflowUrl) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Campos obrigatorios: name, workflowUrl.',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!isValidUrl(workflowUrl)) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'workflowUrl deve comecar com http:// ou https://.',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.info(JSON.stringify({
        request_id: requestId,
        action: 'register-webhook',
        webhook_name: name,
        workflow_url: workflowUrl,
        org_id,
        user_id,
      }));

      const adminClient = createAdminClient();

      const { data, error } = await adminClient
        .from('n8n_webhooks')
        .insert({
          name,
          workflow_url: workflowUrl,
          secret: secret || null,
          org_id: org_id,
          created_by: user_id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error registering webhook:', error);
        return new Response(
          JSON.stringify({
            success: false,
            error: `Erro ao registrar webhook: ${error.message}`,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      logRequest(requestId, user_id, org_id, 'n8n-integration', 'success', `Webhook "${name}" registrado (id: ${data.id})`);

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            id: data.id,
            name: data.name,
            workflow_url: data.workflow_url,
            created_at: data.created_at,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'test-webhook') {
      const { webhookId } = body as TestWebhookRequest;

      if (!webhookId) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Campo obrigatorio: webhookId.',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.info(JSON.stringify({
        request_id: requestId,
        action: 'test-webhook',
        webhook_id: webhookId,
        org_id,
        user_id,
      }));

      const adminClient = createAdminClient();

      const { data: webhook, error: fetchError } = await adminClient
        .from('n8n_webhooks')
        .select('*')
        .eq('id', webhookId)
        .single();

      if (fetchError || !webhook) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Webhook nao encontrado.',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const testPayload = JSON.stringify({
        test: true,
        timestamp: new Date().toISOString(),
        userId: user.id,
        org_id: org_id,
        source: 'n8n-integration-test',
        message: 'Webhook test from Meta Construtor',
      });

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (webhook.secret) {
        const signature = generateHmacSignature(testPayload, webhook.secret);
        headers['x-n8n-signature'] = signature;
      }

      const response = await fetch(webhook.workflow_url, {
        method: 'POST',
        headers,
        body: testPayload,
      });

      const responseBody = response.ok
        ? await response.json().catch(() => ({}))
        : await response.text().catch(() => '');

      logRequest(
        requestId,
        user_id,
        org_id,
        'n8n-integration',
        response.ok ? 'success' : 'error',
        `Test webhook "${webhook.name}" (id: ${webhookId}) retornou ${response.status}`
      );

      return new Response(
        JSON.stringify({
          success: response.ok,
          webhook_id: webhook.id,
          webhook_name: webhook.name,
          status: response.status,
          data: responseBody,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Acao invalida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    logRequest(requestId, user_id, org_id, 'n8n-integration', 'error', error.message);
    const status = error.message.includes('Unauthorized') ? 401 : 500;
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
