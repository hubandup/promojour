-- Créer des organisations de démonstration pour chaque profil

-- Organisation Free (démo)
INSERT INTO public.organizations (id, name, description, account_type, max_stores, max_users, max_promotions)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Demo Free - Test Account', 'Organisation de démonstration pour le profil Free', 'free', 1, 1, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  account_type = EXCLUDED.account_type,
  max_stores = EXCLUDED.max_stores,
  max_users = EXCLUDED.max_users,
  max_promotions = EXCLUDED.max_promotions;

-- Organisation Magasin Pro (démo)
INSERT INTO public.organizations (id, name, description, account_type, max_stores, max_users, max_promotions)
VALUES 
  ('00000000-0000-0000-0000-000000000002', 'Demo Magasin Pro - Test Store', 'Organisation de démonstration pour le profil Magasin Pro', 'store', 5, 5, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  account_type = EXCLUDED.account_type,
  max_stores = EXCLUDED.max_stores,
  max_users = EXCLUDED.max_users,
  max_promotions = EXCLUDED.max_promotions;

-- Organisation Centrale (démo)
INSERT INTO public.organizations (id, name, description, account_type, max_stores, max_users, max_promotions)
VALUES 
  ('00000000-0000-0000-0000-000000000003', 'Demo Centrale - Test Network', 'Organisation de démonstration pour le profil Centrale', 'central', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  account_type = EXCLUDED.account_type,
  max_stores = EXCLUDED.max_stores,
  max_users = EXCLUDED.max_users,
  max_promotions = EXCLUDED.max_promotions;

-- Créer un magasin pour l'organisation Free
INSERT INTO public.stores (id, organization_id, name, description, is_active)
VALUES 
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Magasin Demo Free', 'Magasin de démonstration pour le profil Free', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Créer des magasins pour l'organisation Magasin Pro
INSERT INTO public.stores (id, organization_id, name, description, is_active)
VALUES 
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000002', 'Magasin Demo Pro 1', 'Premier magasin de démonstration Pro', true),
  ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000002', 'Magasin Demo Pro 2', 'Deuxième magasin de démonstration Pro', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Créer des magasins pour l'organisation Centrale
INSERT INTO public.stores (id, organization_id, name, description, is_active)
VALUES 
  ('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000003', 'Magasin Centrale 1', 'Premier magasin de démonstration Centrale', true),
  ('00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000003', 'Magasin Centrale 2', 'Deuxième magasin de démonstration Centrale', true),
  ('00000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000003', 'Magasin Centrale 3', 'Troisième magasin de démonstration Centrale', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Créer quelques promotions pour l'organisation Free (max 7)
INSERT INTO public.promotions (organization_id, store_id, title, description, start_date, end_date, status, category)
VALUES 
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'Promo Free 1', 'Première promotion Free', CURRENT_DATE, CURRENT_DATE + INTERVAL '10 days', 'active', 'Chaussures'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'Promo Free 2', 'Deuxième promotion Free', CURRENT_DATE, CURRENT_DATE + INTERVAL '10 days', 'active', 'Vêtements'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'Promo Free 3', 'Troisième promotion Free', CURRENT_DATE, CURRENT_DATE + INTERVAL '10 days', 'active', 'Accessoires'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'Promo Free 4', 'Quatrième promotion Free', CURRENT_DATE, CURRENT_DATE + INTERVAL '10 days', 'scheduled', 'Chaussures'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'Promo Free 5', 'Cinquième promotion Free', CURRENT_DATE, CURRENT_DATE + INTERVAL '10 days', 'scheduled', 'Vêtements'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'Promo Free 6', 'Sixième promotion Free', CURRENT_DATE, CURRENT_DATE + INTERVAL '10 days', 'scheduled', 'Accessoires'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'Promo Free 7', 'Septième promotion Free', CURRENT_DATE, CURRENT_DATE + INTERVAL '10 days', 'draft', 'Chaussures')
ON CONFLICT DO NOTHING;

-- Créer des promotions pour l'organisation Magasin Pro
INSERT INTO public.promotions (organization_id, store_id, title, description, start_date, end_date, status, category)
VALUES 
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000021', 'Promo Pro 1', 'Première promotion Pro', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'active', 'Chaussures'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000021', 'Promo Pro 2', 'Deuxième promotion Pro', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'active', 'Vêtements'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000022', 'Promo Pro 3', 'Troisième promotion Pro', CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '30 days', 'scheduled', 'Accessoires')
ON CONFLICT DO NOTHING;

-- Créer des promotions pour l'organisation Centrale
INSERT INTO public.promotions (organization_id, store_id, title, description, start_date, end_date, status, category)
VALUES 
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000031', 'Promo Centrale 1', 'Première promotion Centrale', CURRENT_DATE, CURRENT_DATE + INTERVAL '60 days', 'active', 'Chaussures'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000031', 'Promo Centrale 2', 'Deuxième promotion Centrale', CURRENT_DATE, CURRENT_DATE + INTERVAL '60 days', 'active', 'Vêtements'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000032', 'Promo Centrale 3', 'Troisième promotion Centrale', CURRENT_DATE, CURRENT_DATE + INTERVAL '60 days', 'active', 'Accessoires'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000033', 'Promo Centrale 4', 'Quatrième promotion Centrale', CURRENT_DATE + INTERVAL '10 days', CURRENT_DATE + INTERVAL '60 days', 'scheduled', 'Chaussures')
ON CONFLICT DO NOTHING;