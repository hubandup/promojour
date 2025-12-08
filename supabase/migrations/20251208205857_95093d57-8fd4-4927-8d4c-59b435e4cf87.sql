-- Drop the existing policy
DROP POLICY IF EXISTS "Admins and editors can manage social connections" ON social_connections;

-- Recreate with super_admin included
CREATE POLICY "Admins and editors can manage social connections" 
ON social_connections 
FOR ALL 
USING (
  is_super_admin(auth.uid()) OR 
  (
    (EXISTS ( 
      SELECT 1 FROM stores 
      WHERE stores.id = social_connections.store_id 
      AND stores.organization_id = get_user_organization(auth.uid())
    )) 
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
  )
);