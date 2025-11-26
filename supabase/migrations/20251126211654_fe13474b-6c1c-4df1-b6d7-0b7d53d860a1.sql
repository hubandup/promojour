-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Admins and editors can insert promotions" ON promotions;

-- Create new INSERT policy that includes store_managers
CREATE POLICY "Admins, editors and store managers can insert promotions" 
ON promotions 
FOR INSERT 
WITH CHECK (
  is_super_admin(auth.uid()) 
  OR (
    (organization_id = get_user_organization(auth.uid())) 
    AND (
      has_role(auth.uid(), 'admin'::app_role) 
      OR has_role(auth.uid(), 'editor'::app_role)
    )
  )
  OR (
    store_id IN (
      SELECT get_store_manager_stores(auth.uid())
    )
  )
);