-- Créer le bucket pour les images de promotions
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'promotion-images',
  'promotion-images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'video/mp4']
);

-- Créer les politiques RLS pour le bucket promotion-images
CREATE POLICY "Les images de promotions sont publiques"
ON storage.objects FOR SELECT
USING (bucket_id = 'promotion-images');

CREATE POLICY "Les utilisateurs authentifiés peuvent uploader des images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'promotion-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Les utilisateurs peuvent modifier leurs images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'promotion-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'promotion-images' 
  AND auth.role() = 'authenticated'
);