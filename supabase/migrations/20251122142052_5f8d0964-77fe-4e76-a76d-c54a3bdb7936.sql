-- Drop the existing policy that allows all org users to view credentials
DROP POLICY IF EXISTS "Users can view api connections for their organization" ON api_connections;

-- Create a new policy that only allows admins to view API credentials
CREATE POLICY "Only admins can view api connections for their organization"
ON api_connections
FOR SELECT
USING (
  organization_id = get_user_organization(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);