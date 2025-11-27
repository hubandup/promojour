/**
 * Sync Promotions to Google Merchant Center
 * 
 * This function pushes active promotions as products to Google Merchant Center
 * using the Content API for Shopping.
 * 
 * Google Merchant Center Product Fields:
 * - Required: id, title, description, link, imageLink, price, availability
 * - Optional: salePrice, salePriceEffectiveDate, gtin, brand
 * 
 * API Reference: https://developers.google.com/shopping-content/reference/rest/v2.1/products
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

    // Get Google Merchant account for this store
    const { data: merchantAccount, error: accountError } = await supabase
      .from('google_merchant_accounts')
      .select('*')
      .eq('store_id', storeId)
      .single();

    if (accountError || !merchantAccount) {
      throw new Error('Google Merchant Center not connected for this store');
    }

    if (!merchantAccount.google_merchant_account_id) {
      throw new Error('Merchant Center account ID not configured');
    }

    // Refresh token if expired
    const accessToken = await refreshTokenIfNeeded(merchantAccount, supabase);

    // Get active promotions for this store
    const { data: promotions, error: promoError } = await supabase
      .from('promotions')
      .select('*')
      .eq('store_id', storeId)
      .eq('status', 'active');

    if (promoError) throw promoError;

    if (!promotions || promotions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active promotions to sync', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get store info for product links
    const { data: store } = await supabase
      .from('stores')
      .select('name, website_url')
      .eq('id', storeId)
      .single();

    const results = [];

    // Push each promotion as a product to Google Merchant Center
    for (const promo of promotions) {
      try {
        const product = buildProductPayload(promo, store);
        
        const response = await fetch(
          `https://shoppingcontent.googleapis.com/content/v2.1/${merchantAccount.google_merchant_account_id}/products`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(product),
          }
        );

        const responseText = await response.text();
        
        if (!response.ok) {
          console.error(`Failed to sync promotion ${promo.id}:`, responseText);
          results.push({
            promotionId: promo.id,
            success: false,
            error: responseText,
          });
        } else {
          console.log(`Successfully synced promotion ${promo.id}`);
          results.push({
            promotionId: promo.id,
            success: true,
          });
        }
      } catch (error) {
        console.error(`Error syncing promotion ${promo.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          promotionId: promo.id,
          success: false,
          error: errorMessage,
        });
      }
    }

    // Update last synced timestamp
    await supabase
      .from('google_merchant_accounts')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('store_id', storeId);

    const successCount = results.filter(r => r.success).length;

    return new Response(
      JSON.stringify({
        message: `Synced ${successCount} of ${results.length} promotions`,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sync-google-merchant:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Refresh access token if expired
 */
async function refreshTokenIfNeeded(merchantAccount: any, supabase: any): Promise<string> {
  const now = new Date();
  const expiresAt = new Date(merchantAccount.token_expires_at);

  // If token expires in less than 5 minutes, refresh it
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
        refresh_token: merchantAccount.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh access token');
    }

    const tokens = await response.json();
    const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Update tokens in database
    await supabase
      .from('google_merchant_accounts')
      .update({
        access_token: tokens.access_token,
        token_expires_at: newExpiresAt,
      })
      .eq('id', merchantAccount.id);

    return tokens.access_token;
  }

  return merchantAccount.access_token;
}

/**
 * Build Google Merchant Center product payload from promotion
 */
function buildProductPayload(promo: any, store: any) {
  // Extract pricing info from attributes
  const attributes = promo.attributes || {};
  const originalPrice = attributes.original_price || '0';
  const discountedPrice = attributes.discounted_price || originalPrice;
  const eanCode = attributes.cta_ean_code || attributes.ean_code;

  // Build product link (use store website or PromoJour reel page)
  const productLink = store?.website_url || `https://promojour.fr/magasin/${promo.store_id}/${promo.id}`;

  // Format dates for sale price effective date (RFC 3339 interval)
  const startDate = new Date(promo.start_date).toISOString();
  const endDate = new Date(promo.end_date).toISOString();
  const salePriceEffectiveDate = `${startDate}/${endDate}`;

  return {
    offerId: `promo-${promo.id}`, // Unique ID for this product
    contentLanguage: 'fr', // French
    targetCountry: 'FR', // France
    channel: 'online',
    title: promo.title,
    description: promo.description || promo.title,
    link: productLink,
    imageLink: promo.image_url || 'https://promojour.fr/placeholder.jpg',
    price: {
      value: originalPrice,
      currency: 'EUR',
    },
    salePrice: discountedPrice !== originalPrice ? {
      value: discountedPrice,
      currency: 'EUR',
    } : undefined,
    salePriceEffectiveDate: discountedPrice !== originalPrice ? salePriceEffectiveDate : undefined,
    availability: 'in stock',
    condition: 'new',
    gtin: eanCode || undefined, // EAN/GTIN barcode if available
    brand: store?.name || 'PromoJour',
  };
}
