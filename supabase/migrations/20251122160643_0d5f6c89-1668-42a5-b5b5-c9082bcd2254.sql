-- Enable RLS on stores_public view if not already enabled
ALTER VIEW stores_public SET (security_invoker = false);

-- Drop existing policies on stores_public if any
DROP POLICY IF EXISTS "Public can view stores_public" ON stores_public;

-- Note: Views don't support RLS policies directly, they inherit from base tables
-- So we need to add a public SELECT policy on the stores table for the stores_public use case

-- Add policy to allow public to view active stores (needed for stores_public view)
DROP POLICY IF EXISTS "Public can view active stores" ON stores;

CREATE POLICY "Public can view active stores"
ON stores
FOR SELECT
TO anon, authenticated
USING (is_active = true);