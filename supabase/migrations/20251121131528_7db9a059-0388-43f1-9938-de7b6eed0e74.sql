-- Create promotional_mechanics table
CREATE TABLE IF NOT EXISTS public.promotional_mechanics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(organization_id, code)
);

-- Enable RLS
ALTER TABLE public.promotional_mechanics ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view mechanics for their organization"
  ON public.promotional_mechanics
  FOR SELECT
  USING (organization_id = get_user_organization(auth.uid()));

CREATE POLICY "Admins can manage mechanics"
  ON public.promotional_mechanics
  FOR ALL
  USING (
    is_super_admin(auth.uid()) OR 
    (organization_id = get_user_organization(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role))
  );

-- Trigger for updated_at
CREATE TRIGGER update_promotional_mechanics_updated_at
  BEFORE UPDATE ON public.promotional_mechanics
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert default mechanics for existing organizations
INSERT INTO public.promotional_mechanics (organization_id, name, code, fields)
SELECT 
  id as organization_id,
  'Remise de prix' as name,
  'price_discount' as code,
  '[{"name": "originalPrice", "label": "Prix d''origine", "type": "number"}, {"name": "discountedPrice", "label": "Prix remisé", "type": "number"}]'::jsonb as fields
FROM public.organizations
ON CONFLICT (organization_id, code) DO NOTHING;

INSERT INTO public.promotional_mechanics (organization_id, name, code, fields)
SELECT 
  id as organization_id,
  'Pourcentage' as name,
  'percentage_discount' as code,
  '[{"name": "originalPrice", "label": "Prix d''origine", "type": "number"}, {"name": "discountPercentage", "label": "Pourcentage de réduction", "type": "number"}]'::jsonb as fields
FROM public.organizations
ON CONFLICT (organization_id, code) DO NOTHING;

INSERT INTO public.promotional_mechanics (organization_id, name, code, fields)
SELECT 
  id as organization_id,
  'Offre groupée' as name,
  'bundle_offer' as code,
  '[{"name": "bundleDescription", "label": "Description de l''offre", "type": "text"}]'::jsonb as fields
FROM public.organizations
ON CONFLICT (organization_id, code) DO NOTHING;

INSERT INTO public.promotional_mechanics (organization_id, name, code, fields)
SELECT 
  id as organization_id,
  'Gratuit' as name,
  'free_offer' as code,
  '[{"name": "conditions", "label": "Conditions", "type": "text"}]'::jsonb as fields
FROM public.organizations
ON CONFLICT (organization_id, code) DO NOTHING;