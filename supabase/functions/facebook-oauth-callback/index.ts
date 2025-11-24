import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
      const baseUrl = Deno.env.get('SUPABASE_URL') || '';
      const redirectUrl = `${baseUrl.replace('.supabase.co', '.lovableproject.com')}/stores/${storeId}?error=oauth_denied`;
      console.log('Redirecting to:', redirectUrl);
      return new Response(null, {
        status: 302,
        headers: {
          'Location': redirectUrl,
        },
      });
    }

    if (!code || !storeId) {
      console.error('❌ Missing required parameters:', { code: !!code, storeId: !!storeId });
      throw new Error('Missing code or store ID');
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
    console.log('Token endpoint:', tokenUrl.toString().replace(FACEBOOK_APP_SECRET!, '***SECRET***'));
    
    const tokenResponse = await fetch(tokenUrl.toString());
    const tokenData = await tokenResponse.json();

    console.log('Token response status:', tokenResponse.status);
    console.log('Token response:', JSON.stringify({
      ...tokenData,
      access_token: tokenData.access_token ? `${tokenData.access_token.substring(0, 20)}...` : 'missing',
    }));

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('❌ Failed to get access token:', tokenData);
      throw new Error(`Failed to get access token: ${JSON.stringify(tokenData)}`);
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
    console.log('Long-lived token data:', JSON.stringify({
      ...longLivedData,
      access_token: longLivedData.access_token ? `${longLivedData.access_token.substring(0, 20)}...` : 'missing',
    }));

    const accessToken = longLivedData.access_token || shortLivedToken;
    const expiresIn = longLivedData.expires_in || tokenData.expires_in || 5184000; // 60 days default
    
    console.log('✓ Using token type:', longLivedData.access_token ? 'long-lived' : 'short-lived');
    console.log('Token expires in:', expiresIn, 'seconds');

    // Get user info
    console.log('Step 3: Fetching user info...');
    const meUrl = `https://graph.facebook.com/v18.0/me?access_token=${accessToken}`;
    const meResponse = await fetch(meUrl);
    const meData = await meResponse.json();

    console.log('User info response status:', meResponse.status);
    console.log('User data:', JSON.stringify(meData));

    if (meData.error) {
      console.error('❌ Error fetching user info:', meData.error);
      throw new Error(`Failed to get user info: ${meData.error.message}`);
    }

    console.log('✓ User info obtained:', meData.name, `(ID: ${meData.id})`);

    // Get Facebook Pages
    console.log('Step 4: Fetching Facebook Pages...');
    const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`;
    const pagesResponse = await fetch(pagesUrl);
    const pagesData = await pagesResponse.json();

    console.log('Pages response status:', pagesResponse.status);
    console.log('Pages count:', pagesData.data?.length || 0);
    console.log('Pages data:', JSON.stringify(pagesData));

    if (pagesData.error) {
      console.error('❌ Error fetching pages:', pagesData.error);
    }

    // Initialize Supabase client
    console.log('Step 5: Initializing Supabase client...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    console.log('Supabase URL:', supabaseUrl);
    console.log('Service role key:', supabaseKey ? 'Present' : 'Missing');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✓ Supabase client initialized');

    // Store Facebook connection
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    
    console.log('Step 6: Saving Facebook connection to database...');
    console.log('Connection data:', {
      store_id: storeId,
      platform: 'facebook',
      account_id: meData.id,
      account_name: meData.name,
      token_expires_at: expiresAt,
    });
    
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
      console.error('Error details:', JSON.stringify(fbError, null, 2));
    } else {
      console.log('✓ Facebook connection saved successfully');
    }

    // Check for Instagram Business Account on pages
    console.log('Step 7: Checking for Instagram Business Account...');
    let instagramFound = false;
    
    for (const page of pagesData.data || []) {
      console.log(`Checking page: ${page.name} (ID: ${page.id})`);
      
      const igUrl = `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`;
      const igResponse = await fetch(igUrl);
      const igData = await igResponse.json();

      console.log('Instagram check response:', JSON.stringify(igData));

      if (igData.instagram_business_account) {
        instagramFound = true;
        const igAccountId = igData.instagram_business_account.id;
        console.log('✓ Instagram Business Account found:', igAccountId);
        
        // Get Instagram account info
        console.log('Fetching Instagram account details...');
        const igInfoUrl = `https://graph.facebook.com/v18.0/${igAccountId}?fields=username,followers_count&access_token=${page.access_token}`;
        const igInfoResponse = await fetch(igInfoUrl);
        const igInfo = await igInfoResponse.json();

        console.log('Instagram info:', JSON.stringify(igInfo));

        if (igInfo.error) {
          console.error('❌ Error fetching Instagram info:', igInfo.error);
          continue;
        }

        // Store Instagram connection
        console.log('Saving Instagram connection to database...');
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

        if (igError) {
          console.error('❌ Error saving Instagram connection:', igError);
          console.error('Error details:', JSON.stringify(igError, null, 2));
        } else {
          console.log('✓ Instagram connection saved successfully');
        }

        break; // Use first Instagram account found
      } else {
        console.log(`No Instagram Business Account linked to page: ${page.name}`);
      }
    }

    if (!instagramFound) {
      console.log('ℹ️ No Instagram Business Account found on any Facebook Page');
    }

    // Redirect back to store page with success
    const baseUrl = Deno.env.get('SUPABASE_URL') || '';
    const redirectUrl = `${baseUrl.replace('.supabase.co', '.lovableproject.com')}/stores/${storeId}?success=social_connected`;
    
    console.log('Step 8: Redirecting to success page...');
    console.log('Redirect URL:', redirectUrl);
    console.log('=== Facebook OAuth Callback - Success ===');
    
    return new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl,
      },
    });

  } catch (error) {
    console.error('=== Facebook OAuth Callback - Error ===');
    if (error && typeof error === 'object' && 'constructor' in error) {
      console.error('Error type:', (error as any).constructor.name);
    }
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    try {
      console.error('Full error object:', JSON.stringify(error, null, 2));
    } catch {
      console.error('Full error object: (cannot stringify)');
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
