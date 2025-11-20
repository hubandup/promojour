-- Add RLS policy to allow public access to active promotions for frontend display
CREATE POLICY "Public can view active promotions for frontend"
ON public.promotions
FOR SELECT
USING (status = 'active' AND store_id IN (
  SELECT id FROM public.stores WHERE is_active = true
));