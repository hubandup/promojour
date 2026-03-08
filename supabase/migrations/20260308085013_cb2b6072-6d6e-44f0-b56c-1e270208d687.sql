
-- Fix: Anonymous users (from Facebook links) cannot view active promotions or store data
-- The existing policies are all RESTRICTIVE which blocks anonymous access entirely

-- 1. Drop the broken restrictive public policy on promotions
DROP POLICY IF EXISTS "Public can view active promotions for frontend" ON public.promotions;

-- 2. Create a PERMISSIVE policy for anonymous/public SELECT on active promotions
CREATE POLICY "Public can view active promotions"
ON public.promotions
FOR SELECT
TO anon, authenticated
USING (status = 'active'::promotion_status);

-- 3. Add a PERMISSIVE policy on stores for anonymous users to allow subqueries 
-- (only reveals active stores, minimal data exposure)
CREATE POLICY "Public can view active stores"
ON public.stores
FOR SELECT
TO anon
USING (is_active = true);
