-- Drop existing public policy
DROP POLICY IF EXISTS "Public can view active promotions for frontend" ON promotions;

-- Create new policy that allows viewing all active promotions from organizations with active stores
CREATE POLICY "Public can view active promotions for frontend"
ON promotions
FOR SELECT
USING (
  status = 'active' 
  AND organization_id IN (
    SELECT organization_id 
    FROM stores 
    WHERE is_active = true
  )
);