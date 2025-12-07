import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    // Vérifier le JWT de l'utilisateur
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Client avec le token de l'utilisateur pour vérifier son identité
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Récupérer l'utilisateur authentifié
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Client avec service_role pour accéder aux données protégées
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Vérifier le rôle de l'utilisateur (admin, editor, super_admin, ou store_manager)
    const { data: userRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('role, store_id, organization_id')
      .eq('user_id', user.id);

    if (rolesError) {
      console.error('Roles error:', rolesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user roles' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier si l'utilisateur a un rôle autorisé
    const isSuperAdmin = userRoles?.some(r => r.role === 'super_admin');
    const isAdmin = userRoles?.some(r => r.role === 'admin');
    const isEditor = userRoles?.some(r => r.role === 'editor');
    const storeManagerStoreIds = userRoles?.filter(r => r.role === 'store_manager').map(r => r.store_id) || [];

    if (!isSuperAdmin && !isAdmin && !isEditor && storeManagerStoreIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Accès refusé. Rôle admin, éditeur ou store_manager requis.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer l'organization_id de l'utilisateur
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      console.error('Profile error:', profileError);
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer les contacts des magasins via la vue sécurisée (service_role)
    let query = supabaseAdmin
      .from('stores_with_contact')
      .select('id, name, city, email, phone')
      .eq('is_active', true)
      .order('name');

    // Super admin voit tout, sinon filtrer par organisation
    if (!isSuperAdmin) {
      query = query.eq('organization_id', profile.organization_id);
    }

    // Store managers ne voient que leurs magasins assignés
    if (!isSuperAdmin && !isAdmin && !isEditor && storeManagerStoreIds.length > 0) {
      query = query.in('id', storeManagerStoreIds);
    }

    const { data: stores, error: storesError } = await query;

    if (storesError) {
      console.error('Stores error:', storesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch store contacts' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Returned ${stores?.length || 0} store contacts for user ${user.id}`);

    return new Response(
      JSON.stringify({ stores }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
