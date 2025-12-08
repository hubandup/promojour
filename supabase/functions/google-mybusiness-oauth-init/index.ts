/**
 * Google My Business OAuth Initialization
 * 
 * This function initiates the Google OAuth flow for Google My Business access.
 * 
 * Required Environment Variables:
 * - GOOGLE_CLIENT_ID: Your Google OAuth client ID from Google Cloud Console
 * - GOOGLE_REDIRECT_URI: The callback URL
 * 
 * Required Google APIs:
 * - Business Profile API (https://console.cloud.google.com/apis/library/mybusinessbusinessinformation.googleapis.com)
 * 
 * OAuth Scopes:
 * - https://www.googleapis.com/auth/business.manage: Access to Google My Business
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
    // Use a specific redirect URI for Google My Business
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const redirectUri = `${supabaseUrl}/functions/v1/google-mybusiness-oauth-callback`;

    if (!clientId) {
      console.error('Missing GOOGLE_CLIENT_ID environment variable');
      return new Response(
        JSON.stringify({ error: 'Google OAuth is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Required scope for Google My Business API
    const scope = 'https://www.googleapis.com/auth/business.manage';

    // Build OAuth URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('access_type', 'offline'); // Get refresh token
    authUrl.searchParams.set('prompt', 'consent'); // Force consent to get refresh token
    authUrl.searchParams.set('state', storeId); // Pass store ID through state parameter

    console.log('Initiating Google My Business OAuth for store:', storeId);
    console.log('Redirect URI:', redirectUri);

    return new Response(
      JSON.stringify({ authUrl: authUrl.toString() }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in google-mybusiness-oauth-init:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
