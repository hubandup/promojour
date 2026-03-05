# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
npm install        # or: bun install

# Development server (port 8080)
npm run dev

# Type-check + build
npm run build

# Lint
npm run lint

# Preview production build
npm run preview
```

No test suite is configured. There is no `test` script.

For Supabase Edge Functions, deploy via the Supabase CLI:
```bash
supabase functions deploy <function-name>
supabase db push   # apply pending migrations
```

## Architecture Overview

PromoJour is a B2B SaaS for retail promotion management. It is a **Lovable-generated** project (see `lovable-tagger` in vite config) — the Lovable platform auto-commits changes, so git history may contain AI-generated commits.

### Frontend (React + Vite)

**Entry point**: `src/main.tsx` → `src/App.tsx`

All authenticated app routes are wrapped in `<ProtectedRoute>` (checks Supabase session) and `<AppLayout>` (sidebar + header + mobile nav). Public routes (landing, auth, legal, store frontend) are bare.

**Data fetching pattern**: All server state goes through `@tanstack/react-query`. Each domain area has a dedicated hook in `src/hooks/`:
- `use-user-data.ts` — fetches profile + organization + role; used as the base for everything auth-related
- `use-permissions.ts` — derives the full `Permissions` object from `useUserData()`; **UI-only gate**, not a security boundary
- `use-promotions.ts`, `use-campaigns.ts`, `use-stores.ts`, etc. — standard CRUD hooks wrapping Supabase queries

**Path alias**: `@/` resolves to `src/`.

**UI components**: shadcn/ui in `src/components/ui/`. Custom business components are in `src/components/`.

### Backend (Supabase)

**Client**: `src/integrations/supabase/client.ts` — typed via `src/integrations/supabase/types.ts` (auto-generated, do not edit manually).

**Database security**: Row Level Security (RLS) is the real authorization boundary. Helper functions used in policies:
- `get_user_organization(auth.uid())` — returns the org ID for the current user
- `has_role(auth.uid(), 'admin'::app_role)` — checks user role

**Edge Functions** (`supabase/functions/`): 21 Deno functions. All use a shared CORS helper:
```typescript
import { getCorsHeaders } from '../_shared/cors.ts';
// Inside serve():
const corsHeaders = getCorsHeaders(req);
```
Functions with `verify_jwt = false` in `supabase/config.toml`: OAuth init/callback functions, `stripe-webhook`, `distribute-campaign-promotions`, `check-promotion-alerts`. All others require a valid Supabase JWT.

**Migrations**: `supabase/migrations/` — 41+ files. Always create new migration files; never edit existing ones.

### Multi-Tenant Data Model

Organizations have three `account_type` values:
- `free` — 1 store, 7 simultaneous promos, 15-day horizon
- `store` (Pro) — up to 5 stores, 5 users
- `central` (Centrale) — unlimited stores/users, promotions cascade down to attached stores

User roles: `super_admin` > `admin` > `editor` > `store_manager` > `viewer`

`store_manager` is scoped to specific stores via `get_store_manager_stores(auth.uid())` in RLS policies.

**Promotion inheritance**: Centrale promotions automatically appear in all attached stores. Social publishing always happens at the store level — `canConnectSocialAtOrgLevel` is always `false`.

### Integrations

| Service | Usage | Key files |
|---------|-------|-----------|
| **Stripe** | Subscriptions + checkout | `create-checkout`, `stripe-webhook`, `customer-portal`, `check-subscription` Edge Functions; `src/pages/Checkout.tsx` |
| **Facebook/Instagram** | OAuth + post/reel publishing | `facebook-oauth-{init,callback}`, `publish-social-{post,reel}` |
| **Google Merchant Center** | Product feed sync | `google-merchant-*` functions |
| **Google My Business** | Business profile publishing | `google-mybusiness-*` functions |
| **Brevo** | Transactional email | `send-email` Edge Function (template IDs 52/53) |

### Public Store Frontend

Routes `/magasin/:storeId` and `/enseigne/magasin/:storeId` render `StoreReels` — a public-facing page for end customers, no auth required.

## Key Conventions

- **Supabase imports**: always `import { supabase } from "@/integrations/supabase/client"`
- **Toast notifications**: use `sonner` (`import { toast } from "sonner"`) for new code; legacy code uses the shadcn `useToast` hook
- **Permissions check order**: check `permissions.loading` before rendering gated UI to avoid flicker
- **New Edge Functions**: must add an entry to `supabase/config.toml` with `verify_jwt`; import CORS from `../_shared/cors.ts`
- **New migrations**: filename format `YYYYMMDDHHMMSS_<slug>.sql`; never modify existing migration files
