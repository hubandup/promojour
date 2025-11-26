-- Fix RLS policy: restrict public view to unauthenticated users only
-- The problem is that "Public can view active promotions for frontend" policy
-- was allowing authenticated users to see all active promotions across organizations

-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Public can view active promotions for frontend" ON promotions;

-- Recreate it to apply ONLY to unauthenticated users (anon role)
CREATE POLICY "Public can view active promotions for frontend" 
ON promotions 
FOR SELECT 
TO anon
USING (
  (status = 'active'::promotion_status) 
  AND (organization_id IN (
    SELECT stores.organization_id 
    FROM stores 
    WHERE stores.is_active = true
  ))
);

-- Ensure authenticated users policy takes precedence and is properly scoped
DROP POLICY IF EXISTS "Users can view promotions in their organization" ON promotions;

CREATE POLICY "Users can view promotions in their organization" 
ON promotions 
FOR SELECT 
TO authenticated
USING (organization_id = get_user_organization(auth.uid()));