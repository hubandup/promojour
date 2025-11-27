-- Add super_admin SELECT policy for promotions table
-- This allows super admins to view all promotions regardless of organization

CREATE POLICY "Super admins can view all promotions"
ON public.promotions
FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));