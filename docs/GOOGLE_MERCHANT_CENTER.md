# Google Merchant Center Integration

This document explains how to configure and use the Google Merchant Center integration in PromoJour to sync promotions to Google Shopping.

## Overview

The Google Merchant Center integration allows PromoJour to automatically push active promotions as products to Google Shopping, making them discoverable through Google search results and the Shopping tab.

## Architecture

The integration consists of:

1. **Database**: `google_merchant_accounts` table stores OAuth tokens and Merchant Center configuration per store
2. **Edge Functions**: 
   - `google-merchant-oauth-init`: Initiates OAuth flow
   - `google-merchant-oauth-callback`: Handles OAuth callback and stores tokens
   - `sync-google-merchant`: Syncs promotions to Google Merchant Center
3. **React Hook**: `useGoogleMerchant` manages connection state and sync operations
4. **UI Component**: `GoogleMerchantSettings` provides the user interface

## Prerequisites

Before using this integration, you need:

### 1. Google Merchant Center Account

- Create a Merchant Center account at https://merchants.google.com/
- Complete the account setup (business information, shipping, tax settings)
- Note your Merchant Center ID (visible in the URL or settings)

### 2. Google Cloud Project

- Go to https://console.cloud.google.com/
- Create a new project or select an existing one
- Enable the **Content API for Shopping**:
  - Navigate to APIs & Services → Library
  - Search for "Content API for Shopping"
  - Click Enable

### 3. OAuth 2.0 Credentials

In the Google Cloud Console:

1. Go to APIs & Services → Credentials
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: "Web application"
4. Authorized JavaScript origins:
   - `https://your-app-domain.com`
   - `http://localhost:5173` (for development)
5. Authorized redirect URIs:
   - `https://your-supabase-project.functions.supabase.co/google-merchant-oauth-callback`
6. Copy the **Client ID** and **Client Secret**

## Configuration

### 1. Set Environment Variables

The following secrets must be configured in your Supabase project:

```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-supabase-project.functions.supabase.co/google-merchant-oauth-callback
```

These are already configured if you followed the setup prompts during integration installation.

### 2. Configure Edge Functions

The edge functions are automatically deployed and configured in `supabase/config.toml`:

```toml
[functions.google-merchant-oauth-init]
verify_jwt = false

[functions.google-merchant-oauth-callback]
verify_jwt = false

[functions.sync-google-merchant]
verify_jwt = true
```

## Usage

### Connecting a Store to Google Merchant Center

1. Navigate to a store detail page: **Mes magasins → Select Store**
2. Click the **Google** tab
3. Click **"Connecter Google Merchant Center"**
4. Authorize PromoJour in the popup window
5. Enter your **Merchant Center Account ID** (numeric)
6. Click **"Enregistrer l'ID"**

### Syncing Promotions

Once connected, you can sync promotions manually:

1. Go to the store's Google tab
2. Click **"Synchroniser maintenant"**
3. Wait for confirmation

The sync process:
- Fetches all active promotions for the store
- Converts each promotion to a Google Merchant Center product
- Pushes products via the Content API
- Updates the last sync timestamp

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
