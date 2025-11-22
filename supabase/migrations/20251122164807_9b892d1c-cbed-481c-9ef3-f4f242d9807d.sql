-- Fix security definer view issue
-- Change stores_public view to use security invoker mode
-- This ensures RLS policies are enforced for the querying user, not the view creator

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
  opening_hours,
  google_maps_url,
  website_url,
  qr_code_url,
  is_active,
  created_at,
  updated_at
FROM public.stores
WHERE is_active = true;