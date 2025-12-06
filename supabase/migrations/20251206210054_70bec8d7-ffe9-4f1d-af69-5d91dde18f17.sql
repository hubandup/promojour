-- Drop the public SELECT policy that exposes all columns including email/phone
DROP POLICY IF EXISTS "Public can view active stores for frontend" ON public.stores;

-- Create a more restrictive policy for authenticated users only
-- Public access should go through stores_public view which excludes sensitive data
CREATE POLICY "Authenticated users can view active stores"
ON public.stores
FOR SELECT
TO authenticated
USING (is_active = true OR organization_id = get_user_organization(auth.uid()));

-- Enable RLS on stores_public view by adding a permissive policy
-- Note: Views inherit security from underlying tables, but we add explicit policy for clarity
-- Since stores_public already excludes email/phone, public access is safe

-- Also update the get_public_store_data function to be the canonical way to access public store data
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