-- Fix RLS on publication_history: add missing INSERT, UPDATE, DELETE policies
-- Only Edge Functions (service role) should write to this table.
-- Regular users can only read history for their own organization.

-- INSERT: only service role (Edge Functions) can insert; regular users cannot
-- Since service role bypasses RLS, we add a policy that denies user inserts
-- by using a WITH CHECK that always returns false for non-service-role callers.
-- In practice, we simply do not create an INSERT policy, which means
-- authenticated users cannot insert (RLS denies by default when no policy matches).
-- This comment documents the intentional absence of a user INSERT policy.

-- UPDATE: deny all updates from regular users (Edge Functions use service role)
CREATE POLICY "publication_history_no_user_update"
  ON public.publication_history
  FOR UPDATE
  USING (false);

-- DELETE: deny all deletes from regular users (Edge Functions use service role)
CREATE POLICY "publication_history_no_user_delete"
  ON public.publication_history
  FOR DELETE
  USING (false);
