-- Étape 1 : Ajouter le rôle store_manager et la colonne store_id
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'store_manager';

-- Ajouter store_id à user_roles pour lier les store_managers à un magasin
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES stores(id) ON DELETE CASCADE;

-- Créer un index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_user_roles_store_id ON user_roles(store_id);

-- Mettre à jour les limites des organisations existantes selon leur account_type
UPDATE organizations SET 
  max_stores = CASE 
    WHEN account_type = 'free' THEN 1
    WHEN account_type = 'store' THEN 5
    WHEN account_type = 'central' THEN NULL
  END,
  max_users = CASE 
    WHEN account_type = 'free' THEN 1
    WHEN account_type = 'store' THEN 5
    WHEN account_type = 'central' THEN NULL
  END,
  max_promotions = CASE 
    WHEN account_type = 'free' THEN 7
    WHEN account_type = 'store' THEN NULL
    WHEN account_type = 'central' THEN NULL
  END;