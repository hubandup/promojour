-- Create function to count promotions in last 7 days for an organization
CREATE OR REPLACE FUNCTION public.count_promotions_last_7_days_by_org(org_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM promotions
  WHERE organization_id = org_id
    AND created_at >= NOW() - INTERVAL '7 days'
$$;

-- Create function to check if user can create promotion (Free tier limits)
CREATE OR REPLACE FUNCTION public.can_create_promotion(_user_id uuid, _start_date date, _end_date date)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_id uuid;
  org_account_type account_type;
  promo_count_7d integer;
  days_diff integer;
BEGIN
  -- Get user's organization and account type
  SELECT organization_id INTO org_id
  FROM profiles
  WHERE id = _user_id;
  
  IF org_id IS NULL THEN
    RETURN false;
  END IF;
  
  SELECT account_type INTO org_account_type
  FROM organizations
  WHERE id = org_id;
  
  -- If not Free tier, allow creation
  IF org_account_type != 'free' THEN
    RETURN true;
  END IF;
  
  -- Free tier checks:
  
  -- 1. Check 7 promotions per rolling 7 days limit
  SELECT count_promotions_last_7_days_by_org(org_id) INTO promo_count_7d;
  IF promo_count_7d >= 7 THEN
    RETURN false;
  END IF;
  
  -- 2. Check start_date <= today + 15 days (max planning horizon)
  IF _start_date > CURRENT_DATE + INTERVAL '15 days' THEN
    RETURN false;
  END IF;
  
  -- 3. Check promotion duration <= 15 days
  days_diff := _end_date - _start_date;
  IF days_diff > 15 THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Add RLS policy to enforce Free tier limits on INSERT
DROP POLICY IF EXISTS "Admins, editors and store managers can insert promotions" ON promotions;

CREATE POLICY "Admins, editors and store managers can insert promotions" 
ON promotions 
FOR INSERT 
WITH CHECK (
  (
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
  )
  AND can_create_promotion(auth.uid(), start_date::date, end_date::date)
);