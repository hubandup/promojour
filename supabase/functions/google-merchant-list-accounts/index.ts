/**
 * List Google Merchant Center Accounts
 * 
 * This function lists all Merchant Center accounts accessible by the authenticated Google user.
 * Used after OAuth to let the user select which account to use for their store.
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
    const { storeId } = await req.json();

    if (!storeId) {
      return new Response(
        JSON.stringify({ error: 'Store ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get connection for this store
    const { data: connection, error: connectionError } = await supabase
      .from('google_merchant_accounts')
      .select('*')
      .eq('store_id', storeId)
      .single();

    if (connectionError || !connection) {
      return new Response(
        JSON.stringify({ error: 'Google account not connected for this store' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Refresh token if needed
    const accessToken = await refreshTokenIfNeeded(connection, supabase);

    // List Merchant Center accounts using Content API
    const accountsResponse = await fetch(
      'https://shoppingcontent.googleapis.com/content/v2.1/accounts/authinfo',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!accountsResponse.ok) {
      const errorText = await accountsResponse.text();
      console.error('Failed to list accounts:', errorText);
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to list Merchant Center accounts',
          accounts: [],
          message: 'No Merchant Center accounts found for this Google account'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accountsData = await accountsResponse.json();
    const accountInfos = accountsData.accountIdentifiers || [];

    // Fetch detailed info for each account
    const accounts = [];
    for (const info of accountInfos) {
      if (info.merchantId) {
        try {
          const detailResponse = await fetch(
            `https://shoppingcontent.googleapis.com/content/v2.1/${info.merchantId}/accounts/${info.merchantId}`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (detailResponse.ok) {
            const detail = await detailResponse.json();
            accounts.push({
              id: info.merchantId,
              name: detail.name || `Account ${info.merchantId}`,
              websiteUrl: detail.websiteUrl || null,
            });
          }
        } catch (err) {
          console.error(`Failed to fetch details for account ${info.merchantId}:`, err);
          // Add basic info even if details fail
          accounts.push({
            id: info.merchantId,
            name: `Merchant Account ${info.merchantId}`,
            websiteUrl: null,
          });
        }
      }
    }

    // Store available accounts in database
    await supabase
      .from('google_merchant_accounts')
      .update({ available_accounts: accounts })
      .eq('store_id', storeId);

    console.log(`Found ${accounts.length} Merchant Center accounts for store ${storeId}`);

    return new Response(
      JSON.stringify({ 
        accounts,
        message: accounts.length === 0 
          ? 'No Merchant Center accounts found. Please create one in Google Merchant Center.'
          : `Found ${accounts.length} account(s)`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in google-merchant-list-accounts:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage, accounts: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Refresh access token if expired
 */
async function refreshTokenIfNeeded(connection: any, supabase: any): Promise<string> {
  const now = new Date();
  const expiresAt = new Date(connection.token_expires_at);

  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    console.log('Refreshing Google access token');

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID')!;
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')!;

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: connection.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh access token');
    }

    const tokens = await response.json();
    const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    await supabase
      .from('google_merchant_accounts')
      .update({
        access_token: tokens.access_token,
        token_expires_at: newExpiresAt,
      })
      .eq('id', connection.id);

    return tokens.access_token;
  }

  return connection.access_token;
}
