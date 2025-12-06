-- 1. Recréer la vue stores_public sans les données sensibles (email, phone)
DROP VIEW IF EXISTS public.stores_public;

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

-- 2. Grant SELECT on stores_public to authenticated and anon users
GRANT SELECT ON public.stores_public TO authenticated;
GRANT SELECT ON public.stores_public TO anon;

-- 3. Add comment explaining the view purpose
COMMENT ON VIEW public.stores_public IS 'Public view of stores excluding sensitive contact information (email, phone). Use this view for public-facing queries.';

-- 4. Enforce store_id NOT NULL constraint on social_connections table
-- (if not already enforced at DB level)
ALTER TABLE public.social_connections 
  ALTER COLUMN store_id SET NOT NULL;