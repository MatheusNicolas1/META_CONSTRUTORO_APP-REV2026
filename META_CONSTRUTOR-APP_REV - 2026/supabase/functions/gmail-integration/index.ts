import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { createScopedClient } from "../_shared/supabase-client.ts";
import { requireAuth, logRequest } from "../_shared/guards.ts";

interface GmailSendRequest {
  action: 'send' | 'test' | 'oauth-url' | 'oauth-callback';
  to?: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  body?: string;
  isHtml?: boolean;
  code?: string;
  redirectUri?: string;
}

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let user_id: string | undefined;

  try {
    const supabaseClient = createScopedClient(req);
    // 2.4 Standardized Auth Guard
    const user = await requireAuth(supabaseClient);
    user_id = user.id;

    // Log intent
    logRequest(requestId, user_id, null, 'gmail-integration', 'success', 'Auth passed');

    const requestData: GmailSendRequest = await req.json();
    const { action, to, cc, bcc, subject, body, isHtml, code, redirectUri } = requestData;

    // Get OAuth credentials from secrets
    const clientId = Deno.env.get('GMAIL_CLIENT_ID');
    const clientSecret = Deno.env.get('GMAIL_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      console.info('Gmail OAuth credentials not configured');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Gmail integration not configured. Please add GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET secrets.',
          message: 'Gmail integration is blocked until OAuth secrets are configured.',
          configured: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (action) {
      case 'oauth-url': {
        // Generate OAuth URL for user authorization
        const scopes = [
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/gmail.readonly'
        ].join(' ');

        const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${encodeURIComponent(clientId)}&` +
          `redirect_uri=${encodeURIComponent(redirectUri || '')}&` +
          `response_type=code&` +
          `scope=${encodeURIComponent(scopes)}&` +
          `access_type=offline&` +
          `prompt=consent`;

        return new Response(
          JSON.stringify({ success: true, oauthUrl }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'oauth-callback': {
        // Exchange authorization code for tokens
        if (!code || !redirectUri) {
          throw new Error('Missing code or redirectUri');
        }

        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code'
          })
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
          console.error('OAuth token error:', tokenData);
          throw new Error(tokenData.error_description || 'Failed to exchange code');
        }

        // Return tokens (in production, store these securely per user)
        return new Response(
          JSON.stringify({
            success: true,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresIn: tokenData.expires_in
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'test': {
        // Test connection by checking if credentials are configured
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Gmail integration is configured. OAuth flow required for full functionality.',
            configured: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'send': {
        if (!to || !subject || !body) {
          throw new Error('Missing required fields: to, subject, body');
        }

        console.info('Gmail send request:', { to, subject, userId: user.id });

        // Placeholder response - actual implementation requires stored OAuth tokens
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Email sending requires OAuth authorization. Please complete the OAuth flow first.',
            requiresOAuth: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error('Invalid action');
    }
  } catch (error: any) {
    logRequest(requestId, user_id, null, 'gmail-integration', 'error', error.message);
    const errorMessage = error.message || 'Internal server error';
    const status = errorMessage.includes('Unauthorized') ? 401 : 400;

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
