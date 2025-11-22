-- Create a public view of stores that excludes sensitive contact information
CREATE OR REPLACE VIEW public.stores_public AS
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

-- Enable RLS on the view
ALTER VIEW public.stores_public SET (security_invoker = true);

-- Drop the overly permissive public policy on stores table
DROP POLICY IF EXISTS "Public can view active stores for frontend" ON stores;

-- Create a restrictive policy: only authenticated org members can see full store details
CREATE POLICY "Authenticated users can view stores in their organization"
ON stores
FOR SELECT
USING (
  organization_id = get_user_organization(auth.uid())
);