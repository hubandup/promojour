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
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const storeId = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      const baseUrl = Deno.env.get('SUPABASE_URL') || '';
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${baseUrl.replace('.supabase.co', '.lovableproject.com')}/stores/${storeId}?error=oauth_denied`,
        },
      });
    }

    if (!code || !storeId) {
      throw new Error('Missing code or store ID');
    }

    const FACEBOOK_APP_ID = Deno.env.get('FACEBOOK_APP_ID');
    const FACEBOOK_APP_SECRET = Deno.env.get('FACEBOOK_APP_SECRET');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/facebook-oauth-callback`;

    // Exchange code for access token
    const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', FACEBOOK_APP_ID!);
    tokenUrl.searchParams.set('client_secret', FACEBOOK_APP_SECRET!);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('code', code);

    console.log('Exchanging code for token...');
    const tokenResponse = await fetch(tokenUrl.toString());
    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      throw new Error(`Failed to get access token: ${JSON.stringify(tokenData)}`);
    }

    const shortLivedToken = tokenData.access_token;

    // Exchange short-lived token for long-lived token
    const longLivedUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
    longLivedUrl.searchParams.set('grant_type', 'fb_exchange_token');
    longLivedUrl.searchParams.set('client_id', FACEBOOK_APP_ID!);
    longLivedUrl.searchParams.set('client_secret', FACEBOOK_APP_SECRET!);
    longLivedUrl.searchParams.set('fb_exchange_token', shortLivedToken);

    console.log('Exchanging for long-lived token...');
    const longLivedResponse = await fetch(longLivedUrl.toString());
    const longLivedData = await longLivedResponse.json();

    const accessToken = longLivedData.access_token || shortLivedToken;
    const expiresIn = longLivedData.expires_in || tokenData.expires_in || 5184000; // 60 days default

    // Get user info
    const meUrl = `https://graph.facebook.com/v18.0/me?access_token=${accessToken}`;
    const meResponse = await fetch(meUrl);
    const meData = await meResponse.json();

    // Get Facebook Pages
    const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`;
    const pagesResponse = await fetch(pagesUrl);
    const pagesData = await pagesResponse.json();

    console.log('Facebook Pages:', pagesData);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store Facebook connection
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    
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
      console.error('Error saving Facebook connection:', fbError);
    } else {
      console.log('Facebook connection saved successfully');
    }

    // Check for Instagram Business Account on pages
    for (const page of pagesData.data || []) {
      const igUrl = `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`;
      const igResponse = await fetch(igUrl);
      const igData = await igResponse.json();

      if (igData.instagram_business_account) {
        const igAccountId = igData.instagram_business_account.id;
        
        // Get Instagram account info
        const igInfoUrl = `https://graph.facebook.com/v18.0/${igAccountId}?fields=username,followers_count&access_token=${page.access_token}`;
        const igInfoResponse = await fetch(igInfoUrl);
        const igInfo = await igInfoResponse.json();

        // Store Instagram connection
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
          console.error('Error saving Instagram connection:', igError);
        } else {
          console.log('Instagram connection saved successfully');
        }

        break; // Use first Instagram account found
      }
    }

    // Redirect back to store page with success
    const baseUrl = Deno.env.get('SUPABASE_URL') || '';
    const redirectUrl = `${baseUrl.replace('.supabase.co', '.lovableproject.com')}/stores/${storeId}?success=social_connected`;
    
    return new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl,
      },
    });

  } catch (error) {
    console.error('Error in facebook-oauth-callback:', error);
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
