-- Fix: Recreate stores_public view with SECURITY INVOKER to enforce RLS of the querying user
DROP VIEW IF EXISTS public.stores_public;

CREATE VIEW public.stores_public
WITH (security_invoker = true)
AS
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

-- Re-grant SELECT permissions
GRANT SELECT ON public.stores_public TO authenticated;
GRANT SELECT ON public.stores_public TO anon;

-- Update comment
COMMENT ON VIEW public.stores_public IS 'Public view of stores excluding sensitive contact information (email, phone). Uses SECURITY INVOKER to enforce RLS of the querying user.';