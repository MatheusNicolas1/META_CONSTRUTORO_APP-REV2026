import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DriveRequest {
  action: 'test' | 'oauth-url' | 'oauth-callback' | 'list-files' | 'upload' | 'create-folder';
  code?: string;
  redirectUri?: string;
  folderId?: string;
  fileName?: string;
  fileContent?: string;
  mimeType?: string;
  folderName?: string;
  parentId?: string;
}

serve(async (req) => {
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

    const requestData: DriveRequest = await req.json();
    const { action, code, redirectUri, folderId, fileName, fileContent, mimeType, folderName, parentId } = requestData;

    // Get OAuth credentials from secrets
    const clientId = Deno.env.get('GOOGLE_DRIVE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_DRIVE_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      console.info('Google Drive OAuth credentials not configured');
      return new Response(
        JSON.stringify({ 
          error: 'Google Drive integration not configured. Please add GOOGLE_DRIVE_CLIENT_ID and GOOGLE_DRIVE_CLIENT_SECRET secrets.',
          configured: false 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (action) {
      case 'oauth-url': {
        // Generate OAuth URL for user authorization
        const scopes = [
          'https://www.googleapis.com/auth/drive.file',
          'https://www.googleapis.com/auth/drive.readonly'
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
          return new Response(
            JSON.stringify({ error: 'Missing code or redirectUri' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
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
          return new Response(
            JSON.stringify({ error: tokenData.error_description || 'Failed to exchange code' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

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
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Google Drive integration is configured. OAuth flow required for full functionality.',
            configured: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'list-files': {
        // Placeholder - requires stored OAuth tokens
        console.info('List files request:', { folderId, userId: user.id });
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'File listing requires OAuth authorization. Please complete the OAuth flow first.',
            requiresOAuth: true,
            files: []
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'upload': {
        if (!fileName || !fileContent) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields: fileName, fileContent' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.info('Upload request:', { fileName, folderId, userId: user.id });
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'File upload requires OAuth authorization. Please complete the OAuth flow first.',
            requiresOAuth: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'create-folder': {
        if (!folderName) {
          return new Response(
            JSON.stringify({ error: 'Missing required field: folderName' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.info('Create folder request:', { folderName, parentId, userId: user.id });
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Folder creation requires OAuth authorization. Please complete the OAuth flow first.',
            requiresOAuth: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: unknown) {
    console.error('Google Drive integration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
