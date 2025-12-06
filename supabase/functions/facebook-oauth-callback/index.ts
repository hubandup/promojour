import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to log with timestamp and structure
function log(level: 'INFO' | 'ERROR' | 'DEBUG' | 'WARN', message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    function: 'facebook-oauth-callback',
    message,
    ...(data && { data }),
  };
  console.log(JSON.stringify(logEntry, null, 2));
}

// Get the frontend URL based on environment
function getFrontendUrl(): string {
  // Production URL
  return 'https://promojour.lovable.app';
}

// Generate redirect URL to the store page
function getRedirectUrl(success: boolean, storeId: string | null, errorMessage?: string): string {
  const baseUrl = getFrontendUrl();
  
  if (success && storeId) {
    return `${baseUrl}/stores/${storeId}?tab=connexions&oauth=success&platform=facebook`;
  } else if (storeId) {
    const error = encodeURIComponent(errorMessage || 'Erreur de connexion');
    return `${baseUrl}/stores/${storeId}?tab=connexions&oauth=error&platform=facebook&error=${error}`;
  } else {
    const error = encodeURIComponent(errorMessage || 'Erreur de connexion');
    return `${baseUrl}/dashboard?oauth=error&platform=facebook&error=${error}`;
  }
}

// Helper to create redirect response
function redirectTo(url: string): Response {
  log('INFO', 'Redirecting to', { url });
  return new Response(null, {
    status: 302,
    headers: { 'Location': url },
  });
}

// Helper to log and make fetch requests
async function fetchWithLogging(url: string, options?: RequestInit): Promise<{ response: Response; data: any }> {
  log('DEBUG', 'Making HTTP request', { 
    url: url.replace(/access_token=[^&]+/, 'access_token=***REDACTED***'),
    method: options?.method || 'GET',
  });
  
  const response = await fetch(url, options);
  const responseText = await response.text();
  
  let data;
  try {
    data = JSON.parse(responseText);
  } catch {
    data = { rawText: responseText };
  }
  
  log('DEBUG', 'HTTP response received', {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
    body: data,
  });
  
  return { response, data };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log('INFO', '=== Facebook OAuth Callback - Starting ===');
    log('DEBUG', 'Request details', {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries()),
    });
    
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const storeId = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorReason = url.searchParams.get('error_reason');
    const errorDescription = url.searchParams.get('error_description');

    log('DEBUG', 'Query parameters from Facebook', {
      code: code ? `${code.substring(0, 20)}...` : 'MISSING',
      state: storeId,
      error,
      error_reason: errorReason,
      error_description: errorDescription,
      allParams: Object.fromEntries(url.searchParams.entries()),
    });

    if (error) {
      log('ERROR', 'OAuth error returned by Facebook', {
        error,
        error_reason: errorReason,
        error_description: errorDescription,
        storeId,
      });
      
      return redirectTo(getRedirectUrl(false, storeId, errorDescription || errorReason || 'Connexion annulée'));
    }

    if (!code || !storeId) {
      log('ERROR', 'Missing required parameters', { 
        hasCode: !!code, 
        hasStoreId: !!storeId,
        storeId,
      });
      return redirectTo(getRedirectUrl(false, storeId, 'Paramètres manquants'));
    }

    log('INFO', 'All required parameters present, proceeding with token exchange');

    const FACEBOOK_APP_ID = Deno.env.get('FACEBOOK_APP_ID');
    const FACEBOOK_APP_SECRET = Deno.env.get('FACEBOOK_APP_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const redirectUri = `${SUPABASE_URL}/functions/v1/facebook-oauth-callback`;

    log('DEBUG', 'Environment configuration', {
      FACEBOOK_APP_ID: FACEBOOK_APP_ID ? `${FACEBOOK_APP_ID.substring(0, 8)}...` : 'MISSING',
      FACEBOOK_APP_SECRET: FACEBOOK_APP_SECRET ? 'Present (hidden)' : 'MISSING',
      SUPABASE_URL,
      redirectUri,
    });

    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      log('ERROR', 'Missing Facebook credentials', {
        hasAppId: !!FACEBOOK_APP_ID,
        hasAppSecret: !!FACEBOOK_APP_SECRET,
      });
      return redirectTo(getRedirectUrl(false, storeId, 'Configuration Facebook manquante'));
    }

    // Step 1: Exchange code for access token
    log('INFO', 'Step 1: Exchanging authorization code for short-lived token');
    
    const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', FACEBOOK_APP_ID);
    tokenUrl.searchParams.set('client_secret', FACEBOOK_APP_SECRET);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('code', code);

    log('DEBUG', 'Token exchange request', {
      url: tokenUrl.toString().replace(/client_secret=[^&]+/, 'client_secret=***REDACTED***').replace(/code=[^&]+/, 'code=***REDACTED***'),
      params: {
        client_id: FACEBOOK_APP_ID,
        redirect_uri: redirectUri,
        code: `${code.substring(0, 20)}...`,
      },
    });

    const { response: tokenResponse, data: tokenData } = await fetchWithLogging(tokenUrl.toString());

    if (!tokenResponse.ok || !tokenData.access_token) {
      log('ERROR', 'Failed to get access token from Facebook', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        responseBody: tokenData,
        facebookError: tokenData.error,
        facebookErrorMessage: tokenData.error?.message,
        facebookErrorType: tokenData.error?.type,
        facebookErrorCode: tokenData.error?.code,
        facebookErrorSubcode: tokenData.error?.error_subcode,
        facebookFbtraceId: tokenData.error?.fbtrace_id,
      });
      
      const fbError = tokenData.error?.message || `HTTP ${tokenResponse.status}: Échec de récupération du token`;
      return redirectTo(getRedirectUrl(false, storeId, fbError));
    }

    log('INFO', 'Short-lived token obtained successfully');
    const shortLivedToken = tokenData.access_token;

    // Step 2: Exchange for long-lived token
    log('INFO', 'Step 2: Exchanging for long-lived token');
    
    const longLivedUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
    longLivedUrl.searchParams.set('grant_type', 'fb_exchange_token');
    longLivedUrl.searchParams.set('client_id', FACEBOOK_APP_ID);
    longLivedUrl.searchParams.set('client_secret', FACEBOOK_APP_SECRET);
    longLivedUrl.searchParams.set('fb_exchange_token', shortLivedToken);

    const { response: longLivedResponse, data: longLivedData } = await fetchWithLogging(longLivedUrl.toString());

    const accessToken = longLivedData.access_token || shortLivedToken;
    const expiresIn = longLivedData.expires_in || tokenData.expires_in || 5184000;
    
    log('INFO', 'Token exchange result', {
      usedLongLivedToken: !!longLivedData.access_token,
      expiresIn,
      longLivedStatus: longLivedResponse.status,
    });

    // Step 3: Get user info
    log('INFO', 'Step 3: Fetching user info');
    
    const meUrl = `https://graph.facebook.com/v18.0/me?access_token=${accessToken}`;
    const { response: meResponse, data: meData } = await fetchWithLogging(meUrl);

    if (meData.error) {
      log('ERROR', 'Error fetching user info', {
        error: meData.error,
        errorMessage: meData.error?.message,
        errorType: meData.error?.type,
        errorCode: meData.error?.code,
      });
      return redirectTo(getRedirectUrl(false, storeId, meData.error.message));
    }

    log('INFO', 'User info obtained', {
      userId: meData.id,
      userName: meData.name,
    });

    // Step 4: Get Facebook Pages
    log('INFO', 'Step 4: Fetching Facebook Pages');
    
    const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`;
    const { response: pagesResponse, data: pagesData } = await fetchWithLogging(pagesUrl);

    log('INFO', 'Facebook Pages retrieved', {
      pagesCount: pagesData.data?.length || 0,
      pages: pagesData.data?.map((p: any) => ({ id: p.id, name: p.name })) || [],
    });

    // Step 5: Initialize Supabase client
    log('INFO', 'Step 5: Initializing Supabase client');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Step 6: Store Facebook connection
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    
    log('INFO', 'Step 6: Saving Facebook connection to database', {
      storeId,
      accountId: meData.id,
      accountName: meData.name,
      expiresAt,
    });
    
    const { error: fbError, data: insertData } = await supabase
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
      })
      .select();

    if (fbError) {
      log('ERROR', 'Error saving Facebook connection to database', {
        error: fbError,
        errorMessage: fbError.message,
        errorCode: fbError.code,
        errorDetails: fbError.details,
      });
      return redirectTo(getRedirectUrl(false, storeId, 'Erreur de sauvegarde'));
    }
    
    log('INFO', 'Facebook connection saved successfully', { insertData });

    // Step 7: Check for Instagram Business Account on pages
    log('INFO', 'Step 7: Checking for Instagram Business Account');
    
    for (const page of pagesData.data || []) {
      log('DEBUG', `Checking page for Instagram`, { pageId: page.id, pageName: page.name });
      
      const igUrl = `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`;
      const { response: igResponse, data: igData } = await fetchWithLogging(igUrl);

      if (igData.instagram_business_account) {
        const igAccountId = igData.instagram_business_account.id;
        log('INFO', 'Instagram Business Account found', { igAccountId, pageId: page.id });
        
        const igInfoUrl = `https://graph.facebook.com/v18.0/${igAccountId}?fields=username,followers_count&access_token=${page.access_token}`;
        const { response: igInfoResponse, data: igInfo } = await fetchWithLogging(igInfoUrl);

        if (!igInfo.error) {
          log('INFO', 'Saving Instagram connection', {
            igAccountId,
            username: igInfo.username,
            followersCount: igInfo.followers_count,
          });
          
          const { error: igError, data: igInsertData } = await supabase
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
            })
            .select();

          if (!igError) {
            log('INFO', 'Instagram connection saved successfully', { igInsertData });
          } else {
            log('WARN', 'Failed to save Instagram connection', { error: igError });
          }
        } else {
          log('WARN', 'Error fetching Instagram account info', { error: igInfo.error });
        }
        break;
      }
    }

    log('INFO', '=== Facebook OAuth Callback - SUCCESS ===', { storeId });
    
    return redirectTo(getRedirectUrl(true, storeId));

  } catch (error) {
    log('ERROR', '=== Facebook OAuth Callback - FAILED ===', {
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : 'No stack trace',
    });
    
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return redirectTo(getRedirectUrl(false, null, errorMessage));
  }
});
