import { createClient } from "https://esm.sh/@supabase/supabase-js@2.78.0";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

interface Campaign {
  id: string;
  organization_id: string;
  store_id: string | null;
  name: string;
  daily_promotion_count: number;
  random_order: boolean;
  start_date: string;
  end_date: string;
}

interface Promotion {
  id: string;
  title: string;
  video_url: string | null;
  image_url: string | null;
  organization_id: string;
}

async function getActiveCampaigns(): Promise<Campaign[]> {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('status', 'active')
    .lte('start_date', today)
    .gte('end_date', today);

  if (error) {
    console.error('Error fetching active campaigns:', error);
    throw error;
  }

  return data || [];
}

async function getCampaignPromotions(campaignId: string): Promise<Promotion[]> {
  const { data, error } = await supabase
    .from('promotions')
    .select('id, title, video_url, image_url, organization_id')
    .eq('campaign_id', campaignId)
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching campaign promotions:', error);
    throw error;
  }

  return data || [];
}

async function getPromotionsDistributedToday(campaignId: string): Promise<string[]> {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('publication_history')
    .select('promotion_id')
    .gte('published_at', `${today}T00:00:00`)
    .lte('published_at', `${today}T23:59:59`)
    .eq('campaign_id', campaignId)
    .eq('status', 'success');

  if (error) {
    console.error('Error fetching distributed promotions:', error);
    return [];
  }

  // Get unique promotion IDs
  const uniquePromoIds = [...new Set(data?.map(d => d.promotion_id) || [])];
  return uniquePromoIds;
}

async function getStoresForCampaign(campaign: Campaign): Promise<string[]> {
  // If campaign is store-specific, return only that store
  if (campaign.store_id) {
    return [campaign.store_id];
  }

  // Otherwise, get all active stores in the organization
  const { data, error } = await supabase
    .from('stores')
    .select('id')
    .eq('organization_id', campaign.organization_id)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching stores:', error);
    return [];
  }

  return data?.map(s => s.id) || [];
}

async function getStoreAutoPublishSettings(storeId: string) {
  const { data, error } = await supabase
    .from('store_settings')
    .select('auto_publish_facebook, auto_publish_instagram')
    .eq('store_id', storeId)
    .single();

  if (error) {
    console.error('Error fetching store settings:', error);
    return { auto_publish_facebook: false, auto_publish_instagram: false };
  }

  return data || { auto_publish_facebook: false, auto_publish_instagram: false };
}

async function publishPromotionToSocial(promotion: Promotion, storeId: string, campaignId: string) {
  // Only publish if promotion has a video
  if (!promotion.video_url) {
    console.log(`Skipping promotion ${promotion.id}: no video`);
    return;
  }

  const settings = await getStoreAutoPublishSettings(storeId);
  
  // Build platforms array based on auto-publish settings
  const platforms: string[] = [];
  if (settings.auto_publish_facebook) platforms.push('facebook');
  if (settings.auto_publish_instagram) platforms.push('instagram');
  
  if (platforms.length === 0) {
    console.log(`Skipping promotion ${promotion.id}: auto-publish disabled for store ${storeId}`);
    return;
  }

  try {
    // Call the existing publish-social-reel edge function
    const { data, error } = await supabase.functions.invoke('publish-social-reel', {
      body: {
        promotionId: promotion.id,
        storeId: storeId,
        platforms: platforms,
        campaignId: campaignId,
      }
    });

    if (error) {
      console.error(`Error publishing promotion ${promotion.id}:`, error);
    } else {
      console.log(`Successfully published promotion ${promotion.id} to store ${storeId} on platforms: ${platforms.join(', ')}`);
    }
  } catch (error) {
    console.error(`Exception publishing promotion ${promotion.id}:`, error);
  }
}

async function distributeCampaignPromotions(campaign: Campaign) {
  console.log(`Processing campaign: ${campaign.name} (${campaign.id})`);

  // Get all promotions for this campaign
  const allPromotions = await getCampaignPromotions(campaign.id);
  
  if (allPromotions.length === 0) {
    console.log(`No promotions found for campaign ${campaign.id}`);
    return;
  }

  // Get promotions already distributed today
  const distributedToday = await getPromotionsDistributedToday(campaign.id);
  
  // Calculate how many more to distribute
  const remaining = campaign.daily_promotion_count - distributedToday.length;
  
  if (remaining <= 0) {
    console.log(`Campaign ${campaign.id} already distributed ${distributedToday.length} promotions today`);
    return;
  }

  // Filter out already distributed promotions
  const availablePromotions = allPromotions.filter(
    p => !distributedToday.includes(p.id)
  );

  if (availablePromotions.length === 0) {
    console.log(`No available promotions left for campaign ${campaign.id}`);
    return;
  }

  // Select promotions to distribute
  let selectedPromotions: Promotion[];
  
  if (campaign.random_order) {
    // Shuffle and take random promotions
    const shuffled = [...availablePromotions].sort(() => Math.random() - 0.5);
    selectedPromotions = shuffled.slice(0, remaining);
  } else {
    // Take first N available promotions (sequential order)
    selectedPromotions = availablePromotions.slice(0, remaining);
  }

  console.log(`Distributing ${selectedPromotions.length} promotions for campaign ${campaign.id}`);

  // Get stores for this campaign
  const stores = await getStoresForCampaign(campaign);

  // Publish to all stores
  for (const promotion of selectedPromotions) {
    for (const storeId of stores) {
      await publishPromotionToSocial(promotion, storeId, campaign.id);
    }
  }
}

async function processCampaigns() {
  console.log('Starting campaign distribution process...');
  
  const campaigns = await getActiveCampaigns();
  console.log(`Found ${campaigns.length} active campaigns`);

  for (const campaign of campaigns) {
    try {
      await distributeCampaignPromotions(campaign);
    } catch (error) {
      console.error(`Error processing campaign ${campaign.id}:`, error);
    }
  }

  console.log('Campaign distribution process completed');
}

Deno.serve(async (req) => {
  // This function is designed for cron jobs - requires service role key for authorization
  // Using service role key ensures only trusted server-side calls can trigger distribution
  const authHeader = req.headers.get('Authorization');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  // Verify authorization - must use service role key (not public anon key)
  if (!authHeader || authHeader !== `Bearer ${serviceRoleKey}`) {
    console.error('Unauthorized: Invalid or missing service role authorization');
    return new Response(
      JSON.stringify({ error: 'Unauthorized - requires service role authorization' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    await processCampaigns();
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Campaign distribution completed',
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in campaign distribution:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ 
        error: 'Campaign distribution failed', 
        details: errorMessage
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
