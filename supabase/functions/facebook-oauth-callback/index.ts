import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get the frontend URL based on environment
function getFrontendUrl(): string {
  // Production URL
  return 'https://promojour.lovable.app';
}

// Generate redirect URL to the store page
function getRedirectUrl(success: boolean, storeId: string | null, errorMessage?: string): string {
  const baseUrl = getFrontendUrl();
  
  if (success && storeId) {
    // Redirect to store page with success message
    return `${baseUrl}/stores/${storeId}?tab=connexions&oauth=success&platform=facebook`;
  } else if (storeId) {
    // Redirect to store page with error message
    const error = encodeURIComponent(errorMessage || 'Erreur de connexion');
    return `${baseUrl}/stores/${storeId}?tab=connexions&oauth=error&platform=facebook&error=${error}`;
  } else {
    // Fallback to dashboard with error
    const error = encodeURIComponent(errorMessage || 'Erreur de connexion');
    return `${baseUrl}/dashboard?oauth=error&platform=facebook&error=${error}`;
  }
}

// Helper to create redirect response
function redirectTo(url: string): Response {
  return new Response(null, {
    status: 302,
    headers: { 'Location': url },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Facebook OAuth Callback - Starting ===');
    console.log('Request URL:', req.url);
    
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const storeId = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorReason = url.searchParams.get('error_reason');
    const errorDescription = url.searchParams.get('error_description');

    console.log('Query parameters:');
    console.log('- code:', code ? `Present (${code.substring(0, 10)}...)` : 'Missing');
    console.log('- state (storeId):', storeId);
    console.log('- error:', error);
    console.log('- error_reason:', errorReason);
    console.log('- error_description:', errorDescription);

    if (error) {
      console.error('❌ OAuth error from Facebook:', {
        error,
        error_reason: errorReason,
        error_description: errorDescription,
      });
      
      return redirectTo(getRedirectUrl(false, storeId, errorDescription || errorReason || 'Connexion annulée'));
    }

    if (!code || !storeId) {
      console.error('❌ Missing required parameters:', { code: !!code, storeId: !!storeId });
      return redirectTo(getRedirectUrl(false, storeId, 'Paramètres manquants'));
    }

    console.log('✓ All required parameters present');

    const FACEBOOK_APP_ID = Deno.env.get('FACEBOOK_APP_ID');
    const FACEBOOK_APP_SECRET = Deno.env.get('FACEBOOK_APP_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const redirectUri = `${SUPABASE_URL}/functions/v1/facebook-oauth-callback`;

    console.log('Environment check:');
    console.log('- FACEBOOK_APP_ID:', FACEBOOK_APP_ID ? 'Present' : 'Missing');
    console.log('- FACEBOOK_APP_SECRET:', FACEBOOK_APP_SECRET ? 'Present' : 'Missing');
    console.log('- SUPABASE_URL:', SUPABASE_URL);
    console.log('- Redirect URI:', redirectUri);

    // Exchange code for access token
    const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', FACEBOOK_APP_ID!);
    tokenUrl.searchParams.set('client_secret', FACEBOOK_APP_SECRET!);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('code', code);

    console.log('Step 1: Exchanging authorization code for short-lived token...');
    
    const tokenResponse = await fetch(tokenUrl.toString());
    const tokenData = await tokenResponse.json();

    console.log('Token response status:', tokenResponse.status);

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('❌ Failed to get access token:', tokenData);
      const fbError = tokenData.error?.message || 'Échec de récupération du token';
      return redirectTo(getRedirectUrl(false, storeId, fbError));
    }

    console.log('✓ Short-lived token obtained');
    const shortLivedToken = tokenData.access_token;

    // Exchange short-lived token for long-lived token
    const longLivedUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
    longLivedUrl.searchParams.set('grant_type', 'fb_exchange_token');
    longLivedUrl.searchParams.set('client_id', FACEBOOK_APP_ID!);
    longLivedUrl.searchParams.set('client_secret', FACEBOOK_APP_SECRET!);
    longLivedUrl.searchParams.set('fb_exchange_token', shortLivedToken);

    console.log('Step 2: Exchanging for long-lived token...');
    const longLivedResponse = await fetch(longLivedUrl.toString());
    const longLivedData = await longLivedResponse.json();

    console.log('Long-lived token response status:', longLivedResponse.status);

    const accessToken = longLivedData.access_token || shortLivedToken;
    const expiresIn = longLivedData.expires_in || tokenData.expires_in || 5184000;
    
    console.log('✓ Using token type:', longLivedData.access_token ? 'long-lived' : 'short-lived');

    // Get user info
    console.log('Step 3: Fetching user info...');
    const meUrl = `https://graph.facebook.com/v18.0/me?access_token=${accessToken}`;
    const meResponse = await fetch(meUrl);
    const meData = await meResponse.json();

    console.log('User info response status:', meResponse.status);

    if (meData.error) {
      console.error('❌ Error fetching user info:', meData.error);
      return redirectTo(getRedirectUrl(false, storeId, meData.error.message));
    }

    console.log('✓ User info obtained:', meData.name, `(ID: ${meData.id})`);

    // Get Facebook Pages
    console.log('Step 4: Fetching Facebook Pages...');
    const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`;
    const pagesResponse = await fetch(pagesUrl);
    const pagesData = await pagesResponse.json();

    console.log('Pages count:', pagesData.data?.length || 0);

    // Initialize Supabase client
    console.log('Step 5: Initializing Supabase client...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✓ Supabase client initialized');

    // Store Facebook connection
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    
    console.log('Step 6: Saving Facebook connection to database...');
    
    const { error: fbError } = await supabase
      .from('social_connections')
      .upsert({
        store_id: storeId,
        platform: 'facebook',
        access_token: accessToken,
        token_expires_at: expiresAt,
        account_id: meData.id,
        account_name: meData.name,
        is_connected: true,
        last_synced_at: new Date().toISOString(),
      }, {
        onConflict: 'store_id,platform',
      });

    if (fbError) {
      console.error('❌ Error saving Facebook connection:', fbError);
      return redirectTo(getRedirectUrl(false, storeId, 'Erreur de sauvegarde'));
    }
    
    console.log('✓ Facebook connection saved successfully');

    // Check for Instagram Business Account on pages
    console.log('Step 7: Checking for Instagram Business Account...');
    
    for (const page of pagesData.data || []) {
      console.log(`Checking page: ${page.name} (ID: ${page.id})`);
      
      const igUrl = `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`;
      const igResponse = await fetch(igUrl);
      const igData = await igResponse.json();

      if (igData.instagram_business_account) {
        const igAccountId = igData.instagram_business_account.id;
        console.log('✓ Instagram Business Account found:', igAccountId);
        
        const igInfoUrl = `https://graph.facebook.com/v18.0/${igAccountId}?fields=username,followers_count&access_token=${page.access_token}`;
        const igInfoResponse = await fetch(igInfoUrl);
        const igInfo = await igInfoResponse.json();

        if (!igInfo.error) {
          const { error: igError } = await supabase
            .from('social_connections')
            .upsert({
              store_id: storeId,
              platform: 'instagram',
              access_token: page.access_token,
              token_expires_at: expiresAt,
              account_id: igAccountId,
              account_name: igInfo.username,
              followers_count: igInfo.followers_count || 0,
              is_connected: true,
              last_synced_at: new Date().toISOString(),
            }, {
              onConflict: 'store_id,platform',
            });

          if (!igError) {
            console.log('✓ Instagram connection saved successfully');
          }
        }
        break;
      }
    }

    console.log('=== Facebook OAuth Callback - Success ===');
    
    return redirectTo(getRedirectUrl(true, storeId));

  } catch (error) {
    console.error('=== Facebook OAuth Callback - Error ===');
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return redirectTo(getRedirectUrl(false, null, errorMessage));
  }
});
