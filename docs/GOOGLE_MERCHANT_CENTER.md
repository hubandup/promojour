# Google Merchant Center Integration

This document explains how to configure and use the Google Merchant Center integration in PromoJour to sync promotions to Google Shopping.

## Overview

The Google Merchant Center integration allows PromoJour stores to automatically push active promotions as products to Google Shopping. Each store can independently connect their own Google Merchant Center account without requiring access to Google Cloud Console.

## Multi-Tenant Architecture

The integration is fully multi-tenant and store-centric:

1. **Store-Level Connections**: Each store maintains its own Google account connection
2. **Account Selection**: After OAuth, users select which Merchant Center account to use
3. **Independent Syncing**: Each store syncs its own promotions to its selected account
4. **No Technical Setup Required**: Store owners connect directly through PromoJour UI

## Architecture

The integration consists of:

1. **Database**: `google_merchant_accounts` table stores OAuth tokens and selected Merchant Center account per store
2. **Edge Functions**: 
   - `google-merchant-oauth-init`: Initiates OAuth flow
   - `google-merchant-oauth-callback`: Handles OAuth callback, lists available accounts
   - `google-merchant-list-accounts`: Refreshes available Merchant Center accounts
   - `sync-google-merchant`: Syncs promotions to selected Merchant Center account
3. **React Hook**: `useGoogleMerchant` manages connection state and sync operations
4. **UI Component**: `GoogleMerchantSettings` provides the user interface

## User Workflow (No Technical Setup Required)

### Step 1: Connect Google Account

1. Navigate to store page: **Mes magasins → Select Store → Connexions tab**
2. Scroll to **Google Merchant Center** section
3. Click **"Connecter mon compte Google"**
4. Authorize PromoJour in the popup window

### Step 2: Select Merchant Center Account

After successful OAuth:
- PromoJour automatically lists all Merchant Center accounts accessible by your Google account
- Select the account you want to use for this store from the dropdown
- Selection is saved automatically

**If no accounts are found:**
- A message explains you need to create a Merchant Center account first
- Click the link to create one at https://merchants.google.com/
- Return to PromoJour and click **"Rafraîchir les comptes"**

### Step 3: Sync Promotions

Once an account is selected:
- Click **"Synchroniser maintenant"**
- All active promotions for the store are pushed to Google Merchant Center
- A confirmation message shows the sync result

## Prerequisites

### For Store Owners (Non-Technical Users)

1. **Google Account**: A standard Google account (Gmail)
2. **Merchant Center Account**: Create one at https://merchants.google.com/
   - Complete business information
   - Add shipping and tax settings
   - Verify and claim your website (if applicable)

That's it! No need to touch Google Cloud Console or configure OAuth credentials.

### For Platform Administrators Only

The following are configured once at the platform level (already done):

```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-supabase-project.functions.supabase.co/google-merchant-oauth-callback
```

## Features

### Automatic Account Discovery

After OAuth, the system automatically:
- Lists all Merchant Center accounts for the Google user
- Shows account names and IDs
- Allows switching between accounts
- Handles multi-account scenarios seamlessly

### Account Selection

Users can:
- Select from available Merchant Center accounts via dropdown
- Change selected account at any time
- Refresh the account list to detect newly created accounts
- See which account is currently active

### Manual Sync

The sync button:
- Pushes all active promotions to the selected Merchant Center account
- Shows sync progress with loading indicator
- Displays success/error messages
- Updates last sync timestamp

### Product Payload Structure

Each promotion is converted to a product with:

- **offerId**: Unique identifier (`promo-{promotion_id}`)
- **title**: Promotion title
- **description**: Promotion description or title
- **link**: Store website or PromoJour reel page
- **imageLink**: Promotion image URL
- **price**: Original price
- **salePrice**: Discounted price (if applicable)
- **salePriceEffectiveDate**: RFC 3339 interval (start/end dates)
- **gtin**: EAN/GTIN barcode (if available)
- **availability**: "in stock"
- **condition**: "new"
- **brand**: Store name

### Token Management

Access tokens are automatically refreshed when they expire (checked before each sync). Refresh tokens are stored securely in the database.

## Troubleshooting

### OAuth Popup Blocked

If the OAuth popup is blocked:
- Allow popups for your PromoJour domain
- Try again after enabling popups

### "Merchant Center account ID not configured"

Make sure you've entered your Merchant Center ID after connecting. It's a numeric value like `123456789`.

### "Failed to exchange authorization code"

Check that:
- Your OAuth credentials are correct
- The redirect URI matches exactly in Google Cloud Console
- Your Google Cloud project has the Content API enabled

### "Failed to sync promotion"

Common causes:
- Missing required product fields (title, description, link, image)
- Invalid price format
- Merchant Center account not fully configured
- Content API quota exceeded

Check the function logs for detailed error messages.

## API Reference

### Google Merchant Center Content API

- **Documentation**: https://developers.google.com/shopping-content/reference/rest/v2.1/products
- **OAuth Scopes**: `https://www.googleapis.com/auth/content`
- **Endpoint**: `https://shoppingcontent.googleapis.com/content/v2.1/{merchantId}/products`

### PromoJour Edge Functions

#### `google-merchant-oauth-init`
- **Method**: POST
- **Body**: `{ storeId: string }`
- **Response**: `{ authUrl: string }`

#### `google-merchant-oauth-callback`
- **Method**: GET
- **Query**: `?code={auth_code}&state={store_id}`
- **Response**: HTML that closes popup and sends message to parent

#### `sync-google-merchant`
- **Method**: POST
- **Body**: `{ storeId: string }`
- **Response**: `{ message: string, results: Array<SyncResult> }`

## Database Schema

### `google_merchant_accounts`

```sql
CREATE TABLE google_merchant_accounts (
  id UUID PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id),
  google_merchant_account_id TEXT NOT NULL,
  google_business_profile_location_id TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  google_email TEXT,
  is_connected BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(store_id)
);
```

## Security Considerations

- OAuth tokens are stored encrypted in Supabase
- RLS policies restrict access to organization members
- Only admins and editors can manage Google connections
- Refresh tokens enable automatic re-authentication

## Future Enhancements

Potential improvements for future versions:

1. **Automatic Sync**: Trigger sync when promotion status changes to "active"
2. **Batch Operations**: Sync multiple stores at once
3. **Local Inventory**: Support Google Local Inventory Ads
4. **Performance Metrics**: Track click-through rates from Google Shopping
5. **Product Feed Management**: Advanced feed customization options
6. **Multi-Account Support**: Connect multiple Merchant Center accounts per organization

## Support

For issues or questions:

1. Check the Supabase function logs
2. Review Google Merchant Center diagnostics
3. Verify OAuth credentials and API quotas
4. Contact support with error details
