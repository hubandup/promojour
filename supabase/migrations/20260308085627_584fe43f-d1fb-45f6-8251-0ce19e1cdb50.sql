
-- Drop and recreate with organization_id included
DROP FUNCTION IF EXISTS public.get_public_store_data(uuid);

CREATE FUNCTION public.get_public_store_data(store_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  description text,
  logo_url text,
  cover_image_url text,
  address_line1 text,
  address_line2 text,
  city text,
  postal_code text,
  country text,
  google_maps_url text,
  website_url text,
  opening_hours jsonb,
  is_active boolean,
  organization_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    s.id, s.name, s.description, s.logo_url, s.cover_image_url,
    s.address_line1, s.address_line2, s.city, s.postal_code, s.country,
    s.google_maps_url, s.website_url, s.opening_hours, s.is_active,
    s.organization_id
  FROM stores s
  WHERE s.id = store_id AND s.is_active = true
$$;
