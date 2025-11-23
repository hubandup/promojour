-- Étape 2 : Créer les fonctions et mettre à jour les RLS policies
-- Créer une fonction pour vérifier le nombre de promos créées dans les 7 derniers jours
CREATE OR REPLACE FUNCTION public.count_promotions_last_7_days(_organization_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM promotions
  WHERE organization_id = _organization_id
    AND created_at >= NOW() - INTERVAL '7 days'
$$;

-- Créer une fonction pour vérifier si un utilisateur est store_manager d'un magasin spécifique
CREATE OR REPLACE FUNCTION public.is_store_manager(_user_id uuid, _store_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = _user_id 
      AND role = 'store_manager'
      AND store_id = _store_id
  )
$$;

-- Créer une fonction pour obtenir les magasins d'un store_manager
CREATE OR REPLACE FUNCTION public.get_store_manager_stores(_user_id uuid)
RETURNS TABLE(store_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT store_id
  FROM user_roles
  WHERE user_id = _user_id 
    AND role = 'store_manager'
    AND store_id IS NOT NULL
$$;

-- Mettre à jour les RLS policies pour promotions pour gérer les store_managers
DROP POLICY IF EXISTS "Admins and editors can update promotions" ON promotions;

CREATE POLICY "Admins, editors and store managers can update promotions"
ON promotions
FOR UPDATE
USING (
  is_super_admin(auth.uid()) OR
  (organization_id = get_user_organization(auth.uid()) AND (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'editor'::app_role)
  )) OR
  (store_id IN (SELECT get_store_manager_stores(auth.uid())))
);

DROP POLICY IF EXISTS "Admins and editors can delete promotions" ON promotions;

CREATE POLICY "Admins, editors and store managers can delete promotions"
ON promotions
FOR DELETE
USING (
  is_super_admin(auth.uid()) OR
  (organization_id = get_user_organization(auth.uid()) AND (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'editor'::app_role)
  )) OR
  (store_id IN (SELECT get_store_manager_stores(auth.uid())))
);