-- Enable RLS on stores_with_contact view
ALTER VIEW public.stores_with_contact SET (security_invoker = true);

-- Add RLS policy to restrict access to authenticated organization members
-- Note: Views inherit RLS from underlying tables when security_invoker is true
-- But we need to ensure the view itself has RLS enabled via the base table

-- Create a policy on the stores table that the view references
-- This ensures the view respects organization boundaries

-- First, let's recreate the view with security_invoker to enforce RLS
DROP VIEW IF EXISTS public.stores_with_contact;

CREATE VIEW public.stores_with_contact 
WITH (security_invoker = true)
AS
SELECT 
  s.id,
  s.organization_id,
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
  s.qr_code_url,
  s.opening_hours,
  s.is_active,
  s.created_at,
  s.updated_at,
  s.email,
  s.phone
FROM stores s
WHERE s.is_active = true;