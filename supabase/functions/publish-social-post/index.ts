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
    const { promotionId, storeId, platforms, campaignId } = await req.json();

    if (!promotionId || !storeId || !platforms || !Array.isArray(platforms)) {
      throw new Error('Missing required parameters: promotionId, storeId, and platforms');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch promotion details
    const { data: promotion, error: promoError } = await supabase
      .from('promotions')
      .select('*, stores(*)')
      .eq('id', promotionId)
      .single();

    if (promoError || !promotion) {
      throw new Error(`Failed to fetch promotion: ${promoError?.message}`);
    }

    if (!promotion.image_url) {
      throw new Error('Promotion does not have an image');
    }

    // Fetch social connections for the store
    const { data: connections, error: connError } = await supabase
      .from('social_connections')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_connected', true)
      .in('platform', platforms);

    if (connError || !connections || connections.length === 0) {
      throw new Error('No active social connections found for specified platforms');
    }

    // Build PromoJour link
    const baseUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com') || '';
    const promoUrl = `${baseUrl}/magasin/${storeId}/${promotionId}`;

    // Build caption/message
    const message = `${promotion.title}\n\n${promotion.description || ''}\n\n🔗 Découvrez cette offre : ${promoUrl}`;

    const results = [];

    // Publish to each platform
    for (const connection of connections) {
      try {
        let result;
        
        if (connection.platform === 'facebook') {
          result = await publishFacebookPost(
            connection.account_id!,
            connection.access_token!,
            promotion.image_url,
            message
          );
        } else if (connection.platform === 'instagram') {
          result = await publishInstagramPost(
            connection.account_id!,
            connection.access_token!,
            promotion.image_url,
            message
          );
        }

        // Save to publication history on success
        const postId = result?.id || result?.post_id || null;
        await supabase
          .from('publication_history')
          .insert({
            promotion_id: promotionId,
            store_id: storeId,
            platform: connection.platform,
            status: 'success',
            post_id: postId,
            campaign_id: campaignId || null,
          });

        results.push({
          platform: connection.platform,
          success: true,
          result
        });

        console.log(`Successfully published to ${connection.platform}`);
      } catch (error) {
        console.error(`Error publishing to ${connection.platform}:`, error);
        
        // Save to publication history on error
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await supabase
          .from('publication_history')
          .insert({
            promotion_id: promotionId,
            store_id: storeId,
            platform: connection.platform,
            status: 'error',
            error_message: errorMessage,
            campaign_id: campaignId || null,
          });

        results.push({
          platform: connection.platform,
          success: false,
          error: errorMessage
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        results,
        promotionUrl: promoUrl
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in publish-social-post:', error);
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

async function publishFacebookPost(
  pageId: string,
  accessToken: string,
  imageUrl: string,
  message: string
): Promise<any> {
  // Use Facebook Photos API for better image quality
  const url = `https://graph.facebook.com/v18.0/${pageId}/photos`;
  
  const params = new URLSearchParams({
    url: imageUrl,
    caption: message,
    access_token: accessToken,
  });

  console.log('Publishing Facebook photo post...');
  const response = await fetch(`${url}?${params.toString()}`, {
    method: 'POST',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Failed to publish Facebook photo: ${JSON.stringify(data)}`);
  }

  console.log('Facebook photo post published successfully:', data.id);
  return data;
}

async function publishInstagramPost(
  igUserId: string,
  accessToken: string,
  imageUrl: string,
  caption: string
): Promise<any> {
  // Step 1: Create media container
  const createUrl = `https://graph.facebook.com/v18.0/${igUserId}/media`;
  const createParams = new URLSearchParams({
    image_url: imageUrl,
    caption: caption,
    access_token: accessToken,
  });

  console.log('Creating Instagram post container...');
  const createResponse = await fetch(`${createUrl}?${createParams.toString()}`, {
    method: 'POST',
  });

  const createData = await createResponse.json();
  
  if (!createResponse.ok || !createData.id) {
    throw new Error(`Failed to create Instagram post container: ${JSON.stringify(createData)}`);
  }

  const containerId = createData.id;
  console.log('Container created:', containerId);

  // Step 2: Publish the post immediately (images don't need processing time)
  console.log('Publishing Instagram post...');
  const publishUrl = `https://graph.facebook.com/v18.0/${igUserId}/media_publish`;
  const publishParams = new URLSearchParams({
    creation_id: containerId,
    access_token: accessToken,
  });

  const publishResponse = await fetch(`${publishUrl}?${publishParams.toString()}`, {
    method: 'POST',
  });

  const publishData = await publishResponse.json();

  if (!publishResponse.ok) {
    throw new Error(`Failed to publish Instagram post: ${JSON.stringify(publishData)}`);
  }

  console.log('Instagram post published successfully:', publishData.id);
  return publishData;
}
