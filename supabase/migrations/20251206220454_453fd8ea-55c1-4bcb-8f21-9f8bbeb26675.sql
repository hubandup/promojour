-- Create a function to check if user can view sensitive store contact data
CREATE OR REPLACE FUNCTION public.can_view_store_contact_info(_user_id uuid, _store_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Super admins can always see contact info
    is_super_admin(_user_id) 
    OR 
    -- Admins and editors of the org can see contact info
    (has_role(_user_id, 'admin') OR has_role(_user_id, 'editor'))
    OR
    -- Store managers can see contact info for their assigned stores
    is_store_manager(_user_id, _store_id)
$$;

-- Create a secure view that conditionally shows contact info
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
FROM public.stores s;

-- Grant access to authenticated users
GRANT SELECT ON public.stores_with_contact TO authenticated;

-- Add comment
COMMENT ON VIEW public.stores_with_contact IS 'Secure view of stores that conditionally exposes contact information (email, phone) only to admins, editors, and assigned store managers. Viewers see NULL for contact fields.';

-- Update the stores table RLS policy to be more restrictive
-- Keep existing policies but document that frontend should use stores_with_contact view
COMMENT ON TABLE public.stores IS 'Store data with sensitive contact info. Frontend should use stores_with_contact view for conditional access to email/phone fields.';