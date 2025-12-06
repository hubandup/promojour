-- Fix: Make stores_with_contact view more restrictive
-- Only return stores from user's organization and revoke anon access

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
  s.opening_hours,
  s.qr_code_url,
  s.is_active,
  s.created_at,
  s.updated_at,
  -- Only show email/phone to authorized users
  CASE WHEN can_view_store_contact_info(auth.uid(), s.id) THEN s.email ELSE NULL END as email,
  CASE WHEN can_view_store_contact_info(auth.uid(), s.id) THEN s.phone ELSE NULL END as phone
FROM public.stores s
WHERE 
  -- Filter to user's organization only (matches underlying RLS)
  s.organization_id = get_user_organization(auth.uid())
  OR is_super_admin(auth.uid());

-- Only grant to authenticated users, explicitly revoke from anon and public
REVOKE ALL ON public.stores_with_contact FROM anon;
REVOKE ALL ON public.stores_with_contact FROM public;
GRANT SELECT ON public.stores_with_contact TO authenticated;

COMMENT ON VIEW public.stores_with_contact IS 'Secure view of stores for authenticated org members only. Conditionally exposes contact info (email, phone) to admins, editors, and assigned store managers.';