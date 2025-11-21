import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
      throw new Error('Store ID is required');
    }

    const FACEBOOK_APP_ID = Deno.env.get('FACEBOOK_APP_ID');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/facebook-oauth-callback`;
    
    if (!FACEBOOK_APP_ID) {
      throw new Error('Facebook App ID not configured');
    }

    // Facebook OAuth scopes for Instagram and Facebook Pages
    const scopes = [
      'pages_show_list',
      'pages_read_engagement',
      'instagram_basic',
      'instagram_content_publish',
      'business_management',
    ].join(',');

    // Build OAuth URL
    const oauthUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
    oauthUrl.searchParams.set('client_id', FACEBOOK_APP_ID);
    oauthUrl.searchParams.set('redirect_uri', redirectUri);
    oauthUrl.searchParams.set('scope', scopes);
    oauthUrl.searchParams.set('response_type', 'code');
    oauthUrl.searchParams.set('state', storeId); // Pass store ID in state

    console.log('Initiating OAuth flow for store:', storeId);
    console.log('Redirect URI:', redirectUri);

    return new Response(
      JSON.stringify({ authUrl: oauthUrl.toString() }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in facebook-oauth-init:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
