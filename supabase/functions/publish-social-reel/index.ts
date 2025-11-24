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
    const { promotionId, storeId, platforms } = await req.json();

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

    if (!promotion.video_url) {
      throw new Error('Promotion does not have a video');
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

    // Build description
    const description = `${promotion.title}\n\n${promotion.description || ''}\n\n🔗 Découvrez cette offre : ${promoUrl}`;

    const results = [];

    // Publish to each platform
    for (const connection of connections) {
      try {
        let result;
        
        if (connection.platform === 'instagram') {
          result = await publishInstagramReel(
            connection.account_id!,
            connection.access_token!,
            promotion.video_url,
            description
          );
        } else if (connection.platform === 'facebook') {
          result = await publishFacebookReel(
            connection.account_id!,
            connection.access_token!,
            promotion.video_url,
            description
          );
        }

        // Enregistrer dans l'historique en cas de succès
        const postId = result?.id || result?.video_id || null;
        await supabase
          .from('publication_history')
          .insert({
            promotion_id: promotionId,
            store_id: storeId,
            platform: connection.platform,
            status: 'success',
            post_id: postId,
          });

        results.push({
          platform: connection.platform,
          success: true,
          result
        });

        console.log(`Successfully published to ${connection.platform}`);
      } catch (error) {
        console.error(`Error publishing to ${connection.platform}:`, error);
        
        // Enregistrer dans l'historique en cas d'erreur
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await supabase
          .from('publication_history')
          .insert({
            promotion_id: promotionId,
            store_id: storeId,
            platform: connection.platform,
            status: 'error',
            error_message: errorMessage,
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
    console.error('Error in publish-social-reel:', error);
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

async function publishInstagramReel(
  igUserId: string,
  accessToken: string,
  videoUrl: string,
  caption: string
): Promise<any> {
  // Step 1: Create media container
  const createUrl = `https://graph.facebook.com/v18.0/${igUserId}/media`;
  const createParams = new URLSearchParams({
    media_type: 'REELS',
    video_url: videoUrl,
    caption: caption,
    access_token: accessToken,
  });

  console.log('Creating Instagram Reel container...');
  const createResponse = await fetch(`${createUrl}?${createParams.toString()}`, {
    method: 'POST',
  });

  const createData = await createResponse.json();
  
  if (!createResponse.ok || !createData.id) {
    throw new Error(`Failed to create Instagram Reel container: ${JSON.stringify(createData)}`);
  }

  const containerId = createData.id;
  console.log('Container created:', containerId);

  // Step 2: Wait for video processing (poll status)
  const maxAttempts = 30; // 30 attempts * 2 seconds = 1 minute max
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

    const statusUrl = `https://graph.facebook.com/v18.0/${containerId}?fields=status_code&access_token=${accessToken}`;
    const statusResponse = await fetch(statusUrl);
    const statusData = await statusResponse.json();

    console.log(`Processing status: ${statusData.status_code}`);

    if (statusData.status_code === 'FINISHED') {
      // Step 3: Publish the Reel
      console.log('Publishing Instagram Reel...');
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
        throw new Error(`Failed to publish Instagram Reel: ${JSON.stringify(publishData)}`);
      }

      console.log('Instagram Reel published successfully:', publishData.id);
      return publishData;
    } else if (statusData.status_code === 'ERROR') {
      throw new Error('Instagram video processing failed');
    }
  }

  throw new Error('Instagram video processing timeout');
}

async function publishFacebookReel(
  pageId: string,
  accessToken: string,
  videoUrl: string,
  description: string
): Promise<any> {
  // Facebook Reels API
  const url = `https://graph.facebook.com/v18.0/${pageId}/video_reels`;
  
  const params = new URLSearchParams({
    upload_phase: 'start',
    access_token: accessToken,
  });

  console.log('Initiating Facebook Reel upload...');
  const initResponse = await fetch(`${url}?${params.toString()}`, {
    method: 'POST',
  });

  const initData = await initResponse.json();

  if (!initResponse.ok || !initData.video_id) {
    throw new Error(`Failed to initiate Facebook Reel upload: ${JSON.stringify(initData)}`);
  }

  const videoId = initData.video_id;
  const uploadUrl = initData.upload_url;

  console.log('Uploading video to Facebook...');
  
  // Download video from Supabase
  const videoResponse = await fetch(videoUrl);
  const videoBlob = await videoResponse.blob();
  
  // Upload video to Facebook
  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    body: videoBlob,
    headers: {
      'Authorization': `OAuth ${accessToken}`,
      'offset': '0',
      'file_size': videoBlob.size.toString(),
    },
  });

  if (!uploadResponse.ok) {
    throw new Error(`Failed to upload video to Facebook: ${uploadResponse.statusText}`);
  }

  console.log('Finalizing Facebook Reel...');
  
  // Finalize upload
  const finalizeParams = new URLSearchParams({
    upload_phase: 'finish',
    video_id: videoId,
    description: description,
    access_token: accessToken,
  });

  const finalizeResponse = await fetch(`${url}?${finalizeParams.toString()}`, {
    method: 'POST',
  });

  const finalizeData = await finalizeResponse.json();

  if (!finalizeResponse.ok) {
    throw new Error(`Failed to finalize Facebook Reel: ${JSON.stringify(finalizeData)}`);
  }

  console.log('Facebook Reel published successfully:', finalizeData);
  return finalizeData;
}
