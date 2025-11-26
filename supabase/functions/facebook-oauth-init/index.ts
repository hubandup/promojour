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
    console.log('=== Facebook OAuth Init - Starting ===');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    
    const body = await req.json();
    console.log('Request body:', JSON.stringify(body));
    
    const { storeId } = body;
    
    if (!storeId) {
      console.error('ERROR: Store ID is required but not provided');
      throw new Error('Store ID is required');
    }

    console.log('✓ Store ID:', storeId);

    const FACEBOOK_APP_ID = Deno.env.get('FACEBOOK_APP_ID');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const redirectUri = `${SUPABASE_URL}/functions/v1/facebook-oauth-callback`;
    
    console.log('Environment check:');
    console.log('- FACEBOOK_APP_ID:', FACEBOOK_APP_ID ? `Present (${FACEBOOK_APP_ID.substring(0, 4)}...)` : 'Missing');
    console.log('- SUPABASE_URL:', SUPABASE_URL);
    console.log('- Redirect URI:', redirectUri);
    
    if (!FACEBOOK_APP_ID) {
      console.error('ERROR: Facebook App ID not configured in environment variables');
      throw new Error('Facebook App ID not configured');
    }

    // Facebook OAuth scopes for Instagram and Facebook Pages
    // Note: instagram_basic and instagram_content_publish are deprecated
    // Use pages_* permissions and instagram_manage_content for Instagram Business Accounts
    const scopes = [
      'pages_show_list',
      'pages_read_engagement',
      'pages_manage_posts',
      'instagram_manage_content',
      'business_management',
    ].join(',');

    console.log('OAuth scopes requested:', scopes);

    // Build OAuth URL
    const oauthUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
    oauthUrl.searchParams.set('client_id', FACEBOOK_APP_ID);
    oauthUrl.searchParams.set('redirect_uri', redirectUri);
    oauthUrl.searchParams.set('scope', scopes);
    oauthUrl.searchParams.set('response_type', 'code');
    oauthUrl.searchParams.set('state', storeId); // Pass store ID in state

    console.log('✓ OAuth URL generated:', oauthUrl.toString());
    console.log('=== Facebook OAuth Init - Success ===');

    return new Response(
      JSON.stringify({ authUrl: oauthUrl.toString() }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('=== Facebook OAuth Init - Error ===');
    if (error && typeof error === 'object' && 'constructor' in error) {
      console.error('Error type:', (error as any).constructor.name);
    }
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    try {
      console.error('Full error object:', JSON.stringify(error, null, 2));
    } catch {
      console.error('Full error object: (cannot stringify)');
    }
    
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
