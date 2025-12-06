-- Allow public/anonymous access to active stores for the public frontend
-- This is necessary for the store reels and store frontend pages

-- Add a policy for anonymous users to view active stores
CREATE POLICY "Public can view active stores for frontend"
ON public.stores
FOR SELECT
TO anon
USING (is_active = true);

-- Also allow authenticated users without organization to view active stores (for frontend)
-- This handles the case where someone is logged in but viewing a public page
CREATE POLICY "Authenticated can view active stores for public frontend"
ON public.stores
FOR SELECT
TO authenticated
USING (
  is_active = true 
  OR organization_id = get_user_organization(auth.uid())
);

-- Drop the old restrictive policy and replace with the combined one
DROP POLICY IF EXISTS "Users can only view stores in their own organization" ON public.stores;