/**
 * Google Merchant Center OAuth Callback
 * 
 * This function handles the OAuth callback from Google after user authorization.
 * It exchanges the authorization code for access and refresh tokens.
 * 
 * Required Environment Variables:
 * - GOOGLE_CLIENT_ID: Your Google OAuth client ID
 * - GOOGLE_CLIENT_SECRET: Your Google OAuth client secret
 * - GOOGLE_REDIRECT_URI: The callback URL (must match OAuth init)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const storeId = url.searchParams.get('state'); // Store ID from state parameter
    const error = url.searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      return new Response(
        `<html><body><script>
          window.opener?.postMessage({ success: false, error: '${error}' }, '*');
          window.close();
        </script></body></html>`,
        { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
      );
    }

    if (!code || !storeId) {
      throw new Error('Missing authorization code or store ID');
    }

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const redirectUri = Deno.env.get('GOOGLE_REDIRECT_URI');

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Google OAuth credentials not configured');
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      throw new Error('Failed to exchange authorization code');
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokens;

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const userInfo = await userInfoResponse.json();
    const googleEmail = userInfo.email;

    // Calculate token expiry
    const tokenExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    // Store tokens in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // List available Merchant Center accounts for this Google user
    let availableAccounts: any[] = [];
    try {
      const accountsResponse = await fetch(
        'https://shoppingcontent.googleapis.com/content/v2.1/accounts/authinfo',
        {
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (accountsResponse.ok) {
        const accountsData = await accountsResponse.json();
        const accountInfos = accountsData.accountIdentifiers || [];

        for (const info of accountInfos) {
          if (info.merchantId) {
            availableAccounts.push({
              id: info.merchantId,
              name: `Merchant Account ${info.merchantId}`,
            });
          }
        }
      }
    } catch (err) {
      console.warn('Failed to list accounts during OAuth:', err);
    }

    // Check if connection already exists
    const { data: existing } = await supabase
      .from('google_merchant_accounts')
      .select('id')
      .eq('store_id', storeId)
      .single();

    if (existing) {
      // Update existing connection
      const { error: updateError } = await supabase
        .from('google_merchant_accounts')
        .update({
          access_token,
          refresh_token,
          token_expires_at: tokenExpiresAt,
          google_email: googleEmail,
          is_connected: true,
          available_accounts: availableAccounts,
          google_merchant_account_id: availableAccounts.length === 1 ? availableAccounts[0].id : '',
        })
        .eq('store_id', storeId);

      if (updateError) throw updateError;
    } else {
      // Create new connection
      const { error: insertError } = await supabase
        .from('google_merchant_accounts')
        .insert({
          store_id: storeId,
          access_token,
          refresh_token,
          token_expires_at: tokenExpiresAt,
          google_email: googleEmail,
          google_merchant_account_id: availableAccounts.length === 1 ? availableAccounts[0].id : '',
          is_connected: true,
          available_accounts: availableAccounts,
        });

      if (insertError) throw insertError;
    }

    console.log(`Successfully stored Google Merchant tokens for store ${storeId}. Found ${availableAccounts.length} accounts.`);

    // Return success HTML that closes the popup
    return new Response(
      `<html><body><script>
        window.opener?.postMessage({ success: true, storeId: '${storeId}' }, '*');
        window.close();
      </script></body></html>`,
      { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
    );

  } catch (error) {
    console.error('Error in google-merchant-oauth-callback:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      `<html><body><script>
        window.opener?.postMessage({ success: false, error: '${errorMessage}' }, '*');
        window.close();
      </script></body></html>`,
      { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
    );
  }
});
