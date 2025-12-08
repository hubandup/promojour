import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to log with timestamp
function log(level: 'INFO' | 'ERROR' | 'DEBUG', message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    function: 'facebook-oauth-init',
    message,
    ...(data && { data }),
  };
  console.log(JSON.stringify(logEntry, null, 2));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log('INFO', '=== Facebook OAuth Init - Starting ===');
    log('DEBUG', 'Request details', {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries()),
    });
    
    let storeId: string | null = null;
    let shouldRedirect = false;
    let targetPlatform: string = 'both'; // 'facebook', 'instagram', or 'both'

    // Handle both GET (direct navigation - should redirect) and POST (API call - returns JSON)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      storeId = url.searchParams.get('store_id');
      targetPlatform = url.searchParams.get('platform') || 'both';
      shouldRedirect = true; // GET requests should redirect directly to Facebook
      log('DEBUG', 'GET request - will redirect to Facebook', { storeId, targetPlatform });
    } else if (req.method === 'POST') {
      try {
        const body = await req.json();
        storeId = body.storeId;
        targetPlatform = body.platform || 'both';
        shouldRedirect = false; // POST requests return JSON for frontend handling
        log('DEBUG', 'POST request - will return JSON', { storeId, targetPlatform });
      } catch (e) {
        log('ERROR', 'Failed to parse request body', { error: e instanceof Error ? e.message : 'Unknown' });
      }
    }
    
    if (!storeId) {
      log('ERROR', 'Store ID is required but not provided');
      if (shouldRedirect) {
        return new Response(
          `<!DOCTYPE html><html><body><h1>Erreur</h1><p>Store ID manquant</p></body></html>`,
          { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 400 }
        );
      }
      throw new Error('Store ID is required');
    }

    const FACEBOOK_APP_ID = Deno.env.get('FACEBOOK_APP_ID');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const redirectUri = `${SUPABASE_URL}/functions/v1/facebook-oauth-callback`;
    
    log('DEBUG', 'Environment configuration', {
      FACEBOOK_APP_ID: FACEBOOK_APP_ID ? `${FACEBOOK_APP_ID.substring(0, 8)}...` : 'MISSING',
      SUPABASE_URL,
      redirectUri,
      storeId,
    });
    
    if (!FACEBOOK_APP_ID) {
      log('ERROR', 'Facebook App ID not configured in environment variables');
      if (shouldRedirect) {
        return new Response(
          `<!DOCTYPE html><html><body><h1>Erreur</h1><p>Facebook App ID non configuré</p></body></html>`,
          { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 500 }
        );
      }
      throw new Error('Facebook App ID not configured');
    }

    // Facebook OAuth scopes - Instagram Business API uses Facebook Page permissions
    // instagram_basic and instagram_content_publish require App Review approval
    // Instead, we use pages_read_engagement which grants access to Instagram Business accounts linked to Pages
    const scopes = [
      'pages_show_list',
      'pages_read_engagement', 
      'pages_manage_posts',
      'business_management',
    ].join(',');

    log('DEBUG', 'OAuth scopes', { scopes, targetPlatform });

    // Build OAuth URL - encode store_id and platform in state
    const stateData = JSON.stringify({ store_id: storeId, platform: targetPlatform });
    const encodedState = btoa(stateData);
    
    const oauthUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
    oauthUrl.searchParams.set('client_id', FACEBOOK_APP_ID);
    oauthUrl.searchParams.set('redirect_uri', redirectUri);
    oauthUrl.searchParams.set('scope', scopes);
    oauthUrl.searchParams.set('response_type', 'code');
    oauthUrl.searchParams.set('state', encodedState); // Pass store ID and platform in encoded state

    log('INFO', 'OAuth URL generated', {
      url: oauthUrl.toString(),
      params: {
        client_id: FACEBOOK_APP_ID,
        redirect_uri: redirectUri,
        scope: scopes,
        response_type: 'code',
        state: storeId,
      },
    });

    // For GET requests (direct popup navigation), redirect to Facebook
    if (shouldRedirect) {
      log('INFO', 'Redirecting to Facebook OAuth...', { redirectUrl: oauthUrl.toString() });
      return new Response(null, {
        status: 302,
        headers: {
          'Location': oauthUrl.toString(),
        },
      });
    }

    // For POST requests (API calls), return JSON with auth URL
    log('INFO', 'Returning auth URL as JSON');
    return new Response(
      JSON.stringify({ authUrl: oauthUrl.toString() }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    log('ERROR', '=== Facebook OAuth Init - FAILED ===', {
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : 'No stack trace',
    });
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
