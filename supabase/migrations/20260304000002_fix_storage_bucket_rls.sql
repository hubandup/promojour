-- Fix RLS on storage bucket 'promotion-images':
-- Replace overly permissive policies (any authenticated user can modify/delete any image)
-- with ownership-based policies (only the uploader can modify/delete their own files).

-- Drop the insecure existing policies
DROP POLICY IF EXISTS "Les utilisateurs authentifiés peuvent uploader des images" ON storage.objects;
DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leurs images" ON storage.objects;
DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer leurs images" ON storage.objects;

-- INSERT: any authenticated user can upload (Supabase auto-sets owner = auth.uid())
CREATE POLICY "Les utilisateurs authentifiés peuvent uploader des images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'promotion-images'
  AND auth.role() = 'authenticated'
);

-- UPDATE: only the file owner can modify their own files
CREATE POLICY "Les utilisateurs peuvent modifier leurs images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'promotion-images'
  AND owner = auth.uid()
)
WITH CHECK (
  bucket_id = 'promotion-images'
  AND owner = auth.uid()
);

-- DELETE: only the file owner can delete their own files
CREATE POLICY "Les utilisateurs peuvent supprimer leurs images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'promotion-images'
  AND owner = auth.uid()
);
