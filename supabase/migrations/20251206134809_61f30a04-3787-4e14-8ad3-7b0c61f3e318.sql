-- Fix stores public exposure: Drop overly permissive public policy and create a restricted one
-- The stores_public view already exists and excludes sensitive fields, but we need to fix the direct table policy

-- Drop the existing overly permissive public policy
DROP POLICY IF EXISTS "Public can view active stores" ON public.stores;

-- Create a new restricted public policy that only allows access via the stores_public view
-- We'll create a function to restrict what columns can be accessed publicly
CREATE OR REPLACE FUNCTION public.get_public_store_data(store_id uuid)
RETURNS TABLE (
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
  is_active boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    s.id,
    s.name,
    s.description,
    s.logo_url,
    s.cover_image_url,
    s.address_line1,
    s.address_line2,
    s.city,
    s.postal_code,
    s.country,
    s.google_maps_url,
    s.website_url,
    s.opening_hours,
    s.is_active
  FROM stores s
  WHERE s.id = store_id AND s.is_active = true
$$;

-- Grant execute permission on the function to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.get_public_store_data(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_store_data(uuid) TO authenticated;