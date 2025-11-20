-- Allow public read access to organization logo_url for active stores
-- This enables the frontend to display organization logos without authentication

CREATE POLICY "Public can view organization logos for active stores"
ON public.organizations
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.stores
    WHERE stores.organization_id = organizations.id
    AND stores.is_active = true
  )
);