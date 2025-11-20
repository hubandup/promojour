-- Drop the existing policy
DROP POLICY IF EXISTS "Public can view active promotions for frontend" ON public.promotions;

-- Create updated policy that allows access to store-specific and central promotions
CREATE POLICY "Public can view active promotions for frontend"
ON public.promotions
FOR SELECT
USING (
  status = 'active' AND (
    store_id IN (SELECT id FROM public.stores WHERE is_active = true)
    OR store_id IS NULL
  )
);