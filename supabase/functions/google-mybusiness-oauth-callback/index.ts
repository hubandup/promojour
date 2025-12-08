/**
 * Google My Business OAuth Callback
 * 
 * This function handles the OAuth callback from Google after user authorization.
 * It exchanges the authorization code for access and refresh tokens.
 * 
 * Required Environment Variables:
 * - GOOGLE_CLIENT_ID: Your Google OAuth client ID
 * - GOOGLE_CLIENT_SECRET: Your Google OAuth client secret
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

    console.log('Google My Business OAuth callback received');
    console.log('Store ID:', storeId);

    if (error) {
      console.error('OAuth error:', error);
      return new Response(
        `<html><body><script>
          window.opener?.postMessage({ success: false, error: '${error}', platform: 'google_business' }, '*');
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const redirectUri = `${supabaseUrl}/functions/v1/google-mybusiness-oauth-callback`;

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }

    console.log('Exchanging authorization code for tokens...');

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

    console.log('Token exchange successful');

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const userInfo = await userInfoResponse.json();
    const googleEmail = userInfo.email;

    console.log('Retrieved user info for:', googleEmail);

    // Calculate token expiry
    const tokenExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    // Store tokens in database
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // List available Google My Business accounts/locations
    let availableLocations: any[] = [];
    try {
      // First, get the list of accounts
      const accountsResponse = await fetch(
        'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
        {
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (accountsResponse.ok) {
        const accountsData = await accountsResponse.json();
        const accounts = accountsData.accounts || [];

        console.log(`Found ${accounts.length} Google My Business accounts`);

        // For each account, get the locations
        for (const account of accounts) {
          try {
            const locationsResponse = await fetch(
              `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations`,
              {
                headers: {
                  'Authorization': `Bearer ${access_token}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (locationsResponse.ok) {
              const locationsData = await locationsResponse.json();
              const locations = locationsData.locations || [];

              for (const location of locations) {
                availableLocations.push({
                  id: location.name,
                  name: location.title || location.locationName || 'Unknown Location',
                  accountId: account.name,
                  accountName: account.accountName || account.name,
                });
              }
            }
          } catch (locErr) {
            console.warn('Failed to fetch locations for account:', account.name, locErr);
          }
        }
      } else {
        console.warn('Failed to list GMB accounts:', await accountsResponse.text());
      }
    } catch (err) {
      console.warn('Failed to list Google My Business accounts during OAuth:', err);
    }

    console.log(`Found ${availableLocations.length} Google My Business locations`);

    // Check if connection already exists
    const { data: existing } = await supabase
      .from('social_connections')
      .select('id')
      .eq('store_id', storeId)
      .eq('platform', 'google_business')
      .single();

    if (existing) {
      // Update existing connection
      const { error: updateError } = await supabase
        .from('social_connections')
        .update({
          access_token,
          refresh_token,
          token_expires_at: tokenExpiresAt,
          account_name: googleEmail,
          account_id: availableLocations.length === 1 ? availableLocations[0].id : null,
          is_connected: true,
          last_synced_at: new Date().toISOString(),
        })
        .eq('store_id', storeId)
        .eq('platform', 'google_business');

      if (updateError) throw updateError;
      console.log('Updated existing Google My Business connection');
    } else {
      // Create new connection
      const { error: insertError } = await supabase
        .from('social_connections')
        .insert({
          store_id: storeId,
          platform: 'google_business',
          access_token,
          refresh_token,
          token_expires_at: tokenExpiresAt,
          account_name: googleEmail,
          account_id: availableLocations.length === 1 ? availableLocations[0].id : null,
          is_connected: true,
          last_synced_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;
      console.log('Created new Google My Business connection');
    }

    console.log(`Successfully stored Google My Business tokens for store ${storeId}`);

    // Return success HTML that closes the popup
    return new Response(
      `<html><body><script>
        window.opener?.postMessage({ success: true, storeId: '${storeId}', platform: 'google_business' }, '*');
        window.close();
      </script></body></html>`,
      { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
    );

  } catch (error) {
    console.error('Error in google-mybusiness-oauth-callback:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      `<html><body><script>
        window.opener?.postMessage({ success: false, error: '${errorMessage}', platform: 'google_business' }, '*');
        window.close();
      </script></body></html>`,
      { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
    );
  }
});
