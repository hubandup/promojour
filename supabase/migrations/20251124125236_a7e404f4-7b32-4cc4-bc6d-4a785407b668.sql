-- Ajouter des colonnes pour la publication automatique dans store_settings
ALTER TABLE store_settings 
ADD COLUMN IF NOT EXISTS auto_publish_facebook BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_publish_instagram BOOLEAN DEFAULT false;

COMMENT ON COLUMN store_settings.auto_publish_facebook IS 'Publier automatiquement les promotions sur Facebook lors de leur activation';
COMMENT ON COLUMN store_settings.auto_publish_instagram IS 'Publier automatiquement les promotions Reels sur Instagram lors de leur activation';