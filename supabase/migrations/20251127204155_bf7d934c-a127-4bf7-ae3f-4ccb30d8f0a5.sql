-- Create table for Google Merchant Center accounts
CREATE TABLE public.google_merchant_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  google_merchant_account_id TEXT NOT NULL,
  google_business_profile_location_id TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  google_email TEXT,
  is_connected BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(store_id)
);

-- Enable RLS
ALTER TABLE public.google_merchant_accounts ENABLE ROW LEVEL SECURITY;

-- Users can view Google Merchant accounts for their stores
CREATE POLICY "Users can view Google Merchant accounts for their stores"
ON public.google_merchant_accounts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = google_merchant_accounts.store_id
    AND stores.organization_id = get_user_organization(auth.uid())
  )
);

-- Admins and editors can manage Google Merchant accounts
CREATE POLICY "Admins and editors can manage Google Merchant accounts"
ON public.google_merchant_accounts
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = google_merchant_accounts.store_id
    AND stores.organization_id = get_user_organization(auth.uid())
  )
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
);

-- Add trigger for updated_at
CREATE TRIGGER update_google_merchant_accounts_updated_at
BEFORE UPDATE ON public.google_merchant_accounts
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();