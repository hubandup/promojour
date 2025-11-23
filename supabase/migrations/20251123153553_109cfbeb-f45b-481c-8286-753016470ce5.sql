-- Drop existing policy
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;

-- Create new policy that allows super admins to manage roles across all organizations
CREATE POLICY "Admins can manage user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  is_super_admin(auth.uid()) OR 
  ((organization_id = get_user_organization(auth.uid())) AND has_role(auth.uid(), 'admin'::app_role))
)
WITH CHECK (
  is_super_admin(auth.uid()) OR 
  ((organization_id = get_user_organization(auth.uid())) AND has_role(auth.uid(), 'admin'::app_role))
);