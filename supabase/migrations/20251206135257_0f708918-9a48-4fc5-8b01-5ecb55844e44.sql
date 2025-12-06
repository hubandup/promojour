-- Fix: Ensure authenticated users can only access stores in their own organization
-- The stores_public view may be bypassing RLS, and we need to ensure proper isolation

-- First, drop the stores_public view and recreate it with proper security
DROP VIEW IF EXISTS public.stores_public;

-- Recreate stores_public view that excludes sensitive contact info
-- This view is for public/unauthenticated access only
CREATE VIEW public.stores_public AS
SELECT 
  id,
  organization_id,
  name,
  description,
  logo_url,
  cover_image_url,
  address_line1,
  address_line2,
  city,
  postal_code,
  country,
  google_maps_url,
  website_url,
  opening_hours,
  qr_code_url,
  is_active,
  created_at,
  updated_at
FROM public.stores
WHERE is_active = true;

-- Make the view use the invoker's permissions (respects RLS)
ALTER VIEW public.stores_public SET (security_invoker = on);

-- Ensure the stores table policies are correct - remove any duplicate/conflicting policies
DROP POLICY IF EXISTS "Authenticated users can view stores in their organization" ON public.stores;
DROP POLICY IF EXISTS "Users can view stores in their organization" ON public.stores;

-- Create a single, clear policy for authenticated users viewing stores in their org only
CREATE POLICY "Users can only view stores in their own organization"
ON public.stores
FOR SELECT
TO authenticated
USING (organization_id = get_user_organization(auth.uid()));

-- Grant access to the view for public queries (anon role)
GRANT SELECT ON public.stores_public TO anon;
GRANT SELECT ON public.stores_public TO authenticated;