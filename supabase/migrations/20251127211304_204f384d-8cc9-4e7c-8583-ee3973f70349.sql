-- Add field to store available Merchant Center accounts for a Google user
ALTER TABLE public.google_merchant_accounts 
ADD COLUMN IF NOT EXISTS available_accounts JSONB DEFAULT '[]'::jsonb;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_google_merchant_accounts_store_id 
ON public.google_merchant_accounts(store_id);

COMMENT ON COLUMN public.google_merchant_accounts.available_accounts IS 'List of Merchant Center accounts available for the connected Google user';
COMMENT ON COLUMN public.google_merchant_accounts.google_merchant_account_id IS 'Selected Merchant Center account ID for this store';