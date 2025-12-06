-- Fix: Remove duplicate permissive SELECT policies that expose sensitive data
-- Users should use stores_public for public access (no email/phone)
-- Organization members can still access full data through their org membership

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Authenticated can view active stores for public frontend" ON public.stores;
DROP POLICY IF EXISTS "Authenticated users can view active stores" ON public.stores;

-- Create a new policy that only allows org members to see their own stores (including sensitive data)
CREATE POLICY "Organization members can view their stores"
ON public.stores
FOR SELECT
TO authenticated
USING (
  organization_id = get_user_organization(auth.uid())
  OR is_super_admin(auth.uid())
);

-- For public access without sensitive data, users should query stores_public view