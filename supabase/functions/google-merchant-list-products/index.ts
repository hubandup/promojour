/**
 * Google Merchant Center - List Products
 * 
 * This function lists products from a connected Google Merchant Center account.
 * Used for testing and verification that the integration works end-to-end.
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

    // Fetch the connection
    const { data: connection, error: fetchError } = await supabase
      .from('google_merchant_accounts')
      .select('*')
      .eq('store_id', storeId)
      .single();

    if (fetchError || !connection) {
      return new Response(
        JSON.stringify({ error: 'No Google Merchant connection found for this store' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!connection.google_merchant_account_id) {
      return new Response(
        JSON.stringify({ error: 'No Merchant Center account selected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if access token is expired and refresh if needed
    let accessToken = connection.access_token;
    const now = new Date();
    const expiresAt = connection.token_expires_at ? new Date(connection.token_expires_at) : null;

    if (expiresAt && expiresAt <= now && connection.refresh_token) {
      // Token expired, refresh it
      const clientId = Deno.env.get('GOOGLE_CLIENT_ID')!;
      const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')!;

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: connection.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (tokenResponse.ok) {
        const tokens = await tokenResponse.json();
        accessToken = tokens.access_token;
        const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

        // Update tokens in database
        await supabase
          .from('google_merchant_accounts')
          .update({
            access_token: accessToken,
            token_expires_at: newExpiresAt,
          })
          .eq('store_id', storeId);
      }
    }

    const merchantId = connection.google_merchant_account_id;

    // List products from Google Merchant Center
    const productsResponse = await fetch(
      `https://shoppingcontent.googleapis.com/content/v2.1/${merchantId}/products`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!productsResponse.ok) {
      const errorText = await productsResponse.text();
      console.error('Failed to fetch products:', errorText);
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch products from Google Merchant Center',
          details: errorText 
        }),
        { status: productsResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const productsData = await productsResponse.json();
    const products = productsData.resources || [];

    console.log(`Listed ${products.length} products for merchant ${merchantId}`);

    return new Response(
      JSON.stringify({
        success: true,
        merchantId,
        count: products.length,
        products: products.map((p: any) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          link: p.link,
          imageLink: p.imageLink,
          price: p.price,
          availability: p.availability,
        })),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in google-merchant-list-products:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
