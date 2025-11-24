-- Créer la table publication_history pour l'historique des publications automatiques
CREATE TABLE public.publication_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram')),
  status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  post_id TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.publication_history ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux utilisateurs de voir l'historique de leur organisation
CREATE POLICY "Users can view publication history for their organization"
  ON public.publication_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM promotions
      WHERE promotions.id = publication_history.promotion_id
        AND promotions.organization_id = get_user_organization(auth.uid())
    )
  );

-- Index pour améliorer les performances
CREATE INDEX idx_publication_history_promotion_id ON public.publication_history(promotion_id);
CREATE INDEX idx_publication_history_store_id ON public.publication_history(store_id);
CREATE INDEX idx_publication_history_published_at ON public.publication_history(published_at DESC);