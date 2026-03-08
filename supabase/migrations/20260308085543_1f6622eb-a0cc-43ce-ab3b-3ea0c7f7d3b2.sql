
-- Create a SECURITY DEFINER function to fetch active promotions for a given organization
-- This bypasses RLS entirely, which is safe since we only return active promotions
CREATE OR REPLACE FUNCTION public.get_public_promotions_by_org(org_id uuid)
RETURNS TABLE(
  id uuid,
  organization_id uuid,
  store_id uuid,
  campaign_id uuid,
  title text,
  description text,
  category text,
  image_url text,
  video_url text,
  start_date timestamptz,
  end_date timestamptz,
  status text,
  is_mandatory boolean,
  can_be_modified_by_stores boolean,
  attributes jsonb,
  views_count integer,
  clicks_count integer,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    p.id, p.organization_id, p.store_id, p.campaign_id,
    p.title, p.description, p.category, p.image_url, p.video_url,
    p.start_date, p.end_date, p.status::text, p.is_mandatory, p.can_be_modified_by_stores,
    p.attributes, COALESCE(p.views_count, 0), COALESCE(p.clicks_count, 0), p.created_at
  FROM promotions p
  WHERE p.organization_id = org_id
    AND p.status = 'active'
  ORDER BY p.created_at DESC
$$;
