-- Add RLS policy to allow public access to active stores for frontend display
CREATE POLICY "Public can view active stores for frontend"
ON public.stores
FOR SELECT
USING (is_active = true);