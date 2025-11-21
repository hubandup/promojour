-- Étape 2: Assigner le rôle super_admin et mettre à jour les politiques RLS

-- 1. Assigner le rôle super_admin à charles@hubandup.com
INSERT INTO public.user_roles (user_id, organization_id, role)
VALUES (
  'de83002c-098f-4103-ae7b-da506b6afbf0', 
  'e1234567-89ab-cdef-0123-456789abcdef',
  'super_admin'
)
ON CONFLICT ON CONSTRAINT user_roles_user_id_organization_id_key
DO UPDATE SET role = 'super_admin';

-- 2. Créer une fonction pour vérifier si un utilisateur est super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  )
$$;

-- 3. Mettre à jour les politiques RLS pour les promotions
DROP POLICY IF EXISTS "Admins and editors can update promotions" ON public.promotions;
DROP POLICY IF EXISTS "Admins and editors can delete promotions" ON public.promotions;
DROP POLICY IF EXISTS "Admins and editors can insert promotions" ON public.promotions;

-- Nouvelle politique UPDATE avec super_admin
CREATE POLICY "Admins and editors can update promotions" 
ON public.promotions 
FOR UPDATE 
USING (
  is_super_admin(auth.uid()) 
  OR (
    organization_id = get_user_organization(auth.uid()) 
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
  )
);

-- Nouvelle politique DELETE avec super_admin
CREATE POLICY "Admins and editors can delete promotions" 
ON public.promotions 
FOR DELETE 
USING (
  is_super_admin(auth.uid()) 
  OR (
    organization_id = get_user_organization(auth.uid()) 
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
  )
);

-- Nouvelle politique INSERT avec super_admin
CREATE POLICY "Admins and editors can insert promotions" 
ON public.promotions 
FOR INSERT 
WITH CHECK (
  is_super_admin(auth.uid()) 
  OR (
    organization_id = get_user_organization(auth.uid()) 
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
  )
);

-- 4. Appliquer les mêmes changements aux stores
DROP POLICY IF EXISTS "Admins and editors can update stores" ON public.stores;
DROP POLICY IF EXISTS "Admins can delete stores" ON public.stores;
DROP POLICY IF EXISTS "Admins and editors can insert stores" ON public.stores;

CREATE POLICY "Admins and editors can update stores" 
ON public.stores 
FOR UPDATE 
USING (
  is_super_admin(auth.uid()) 
  OR (
    organization_id = get_user_organization(auth.uid()) 
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
  )
);

CREATE POLICY "Admins can delete stores" 
ON public.stores 
FOR DELETE 
USING (
  is_super_admin(auth.uid()) 
  OR (
    organization_id = get_user_organization(auth.uid()) 
    AND has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Admins and editors can insert stores" 
ON public.stores 
FOR INSERT 
WITH CHECK (
  is_super_admin(auth.uid()) 
  OR (
    organization_id = get_user_organization(auth.uid()) 
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
  )
);

-- 5. Campaigns
DROP POLICY IF EXISTS "Admins and editors can manage campaigns" ON public.campaigns;

CREATE POLICY "Admins and editors can manage campaigns" 
ON public.campaigns 
FOR ALL 
USING (
  is_super_admin(auth.uid()) 
  OR (
    organization_id = get_user_organization(auth.uid()) 
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
  )
);