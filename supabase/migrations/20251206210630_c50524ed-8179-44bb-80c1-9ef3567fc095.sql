-- Fix 1: Create SECURITY DEFINER function to expose only safe org fields
-- Drop existing policy that exposes all columns
DROP POLICY IF EXISTS "Public can view organization logos for active stores" ON public.organizations;

-- Create a secure function to get only public-safe organization data
CREATE OR REPLACE FUNCTION public.get_public_org_data(org_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  logo_url text,
  cover_image_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    o.id,
    o.name,
    o.logo_url,
    o.cover_image_url
  FROM organizations o
  WHERE o.id = org_id
    AND EXISTS (
      SELECT 1 FROM stores s 
      WHERE s.organization_id = o.id 
      AND s.is_active = true
    )
$$;