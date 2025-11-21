-- Étape 1: Ajouter le rôle super_admin à l'enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'super_admin';