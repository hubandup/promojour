/**
 * Google Merchant Center OAuth Initialization
 * 
 * This function initiates the Google OAuth flow for Merchant Center access.
 * 
 * Required Environment Variables:
 * - GOOGLE_CLIENT_ID: Your Google OAuth client ID from Google Cloud Console
 * - GOOGLE_REDIRECT_URI: The callback URL (e.g., https://yourapp.com/api/google-merchant-callback)
 * 
 * Required Google APIs:
 * - Content API for Shopping (https://console.cloud.google.com/apis/library/content.googleapis.com)
 * 
 * OAuth Scopes:
 * - https://www.googleapis.com/auth/content: Access to Merchant Center Content API
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
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

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const redirectUri = Deno.env.get('GOOGLE_REDIRECT_URI');

    if (!clientId || !redirectUri) {
      console.error('Missing required environment variables');
      return new Response(
        JSON.stringify({ error: 'Google OAuth is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Required scope for Merchant Center Content API
    const scope = 'https://www.googleapis.com/auth/content';

    // Build OAuth URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('access_type', 'offline'); // Get refresh token
    authUrl.searchParams.set('prompt', 'consent'); // Force consent to get refresh token
    authUrl.searchParams.set('state', storeId); // Pass store ID through state parameter

    console.log('Initiating Google Merchant OAuth for store:', storeId);

    return new Response(
      JSON.stringify({ authUrl: authUrl.toString() }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in google-merchant-oauth-init:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
