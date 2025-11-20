-- Create enum types
CREATE TYPE public.account_type AS ENUM ('free', 'store', 'central');
CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'viewer');
CREATE TYPE public.promotion_status AS ENUM ('draft', 'scheduled', 'active', 'expired', 'archived');
CREATE TYPE public.campaign_status AS ENUM ('draft', 'scheduled', 'active', 'completed', 'archived');
CREATE TYPE public.social_platform AS ENUM ('facebook', 'instagram', 'google_business');

-- Organizations table (Centrales)
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  account_type account_type NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT,
  max_stores INTEGER DEFAULT 1,
  max_users INTEGER DEFAULT 1,
  max_promotions INTEGER,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Stores table (Magasins)
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  postal_code TEXT,
  city TEXT,
  country TEXT DEFAULT 'France',
  phone TEXT,
  email TEXT,
  website_url TEXT,
  google_maps_url TEXT,
  opening_hours JSONB,
  qr_code_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles table (User information)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

-- Campaigns table
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status campaign_status NOT NULL DEFAULT 'draft',
  daily_promotion_count INTEGER DEFAULT 1,
  random_order BOOLEAN DEFAULT false,
  canva_template_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Promotions table
CREATE TABLE public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  image_url TEXT,
  video_url TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status promotion_status NOT NULL DEFAULT 'draft',
  is_mandatory BOOLEAN DEFAULT false,
  can_be_modified_by_stores BOOLEAN DEFAULT true,
  attributes JSONB,
  views_count INTEGER DEFAULT 0,
  clicks_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Social media connections table
CREATE TABLE public.social_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  platform social_platform NOT NULL,
  account_id TEXT,
  account_name TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  followers_count INTEGER DEFAULT 0,
  is_connected BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, platform)
);

-- Statistics table
CREATE TABLE public.promotion_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  platform social_platform,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(promotion_id, date, platform)
);

-- Store settings table
CREATE TABLE public.store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE UNIQUE,
  min_active_promotions INTEGER DEFAULT 3,
  min_upcoming_promotions INTEGER DEFAULT 5,
  alert_email_enabled BOOLEAN DEFAULT true,
  seo_tags JSONB,
  custom_attributes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- API connections table
CREATE TABLE public.api_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  api_key TEXT,
  api_secret TEXT,
  credentials JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Webhooks table
CREATE TABLE public.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  is_automatic BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to get user's organization
CREATE OR REPLACE FUNCTION public.get_user_organization(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.profiles
  WHERE id = _user_id
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for organizations
CREATE POLICY "Users can view their organization"
  ON public.organizations FOR SELECT
  USING (id = public.get_user_organization(auth.uid()));

CREATE POLICY "Admins can update their organization"
  ON public.organizations FOR UPDATE
  USING (id = public.get_user_organization(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- RLS Policies for stores
CREATE POLICY "Users can view stores in their organization"
  ON public.stores FOR SELECT
  USING (organization_id = public.get_user_organization(auth.uid()));

CREATE POLICY "Admins and editors can insert stores"
  ON public.stores FOR INSERT
  WITH CHECK (
    organization_id = public.get_user_organization(auth.uid()) AND
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
  );

CREATE POLICY "Admins and editors can update stores"
  ON public.stores FOR UPDATE
  USING (
    organization_id = public.get_user_organization(auth.uid()) AND
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
  );

CREATE POLICY "Admins can delete stores"
  ON public.stores FOR DELETE
  USING (organization_id = public.get_user_organization(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- RLS Policies for promotions
CREATE POLICY "Users can view promotions in their organization"
  ON public.promotions FOR SELECT
  USING (organization_id = public.get_user_organization(auth.uid()));

CREATE POLICY "Admins and editors can insert promotions"
  ON public.promotions FOR INSERT
  WITH CHECK (
    organization_id = public.get_user_organization(auth.uid()) AND
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
  );

CREATE POLICY "Admins and editors can update promotions"
  ON public.promotions FOR UPDATE
  USING (
    organization_id = public.get_user_organization(auth.uid()) AND
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
  );

CREATE POLICY "Admins and editors can delete promotions"
  ON public.promotions FOR DELETE
  USING (
    organization_id = public.get_user_organization(auth.uid()) AND
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
  );

-- RLS Policies for campaigns
CREATE POLICY "Users can view campaigns in their organization"
  ON public.campaigns FOR SELECT
  USING (organization_id = public.get_user_organization(auth.uid()));

CREATE POLICY "Admins and editors can manage campaigns"
  ON public.campaigns FOR ALL
  USING (
    organization_id = public.get_user_organization(auth.uid()) AND
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
  );

-- RLS Policies for social_connections
CREATE POLICY "Users can view social connections for their stores"
  ON public.social_connections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = social_connections.store_id
      AND stores.organization_id = public.get_user_organization(auth.uid())
    )
  );

CREATE POLICY "Admins and editors can manage social connections"
  ON public.social_connections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = social_connections.store_id
      AND stores.organization_id = public.get_user_organization(auth.uid())
    ) AND
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
  );

-- RLS Policies for promotion_stats
CREATE POLICY "Users can view stats for their organization"
  ON public.promotion_stats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.promotions
      WHERE promotions.id = promotion_stats.promotion_id
      AND promotions.organization_id = public.get_user_organization(auth.uid())
    )
  );

-- RLS Policies for store_settings
CREATE POLICY "Users can view settings for their stores"
  ON public.store_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = store_settings.store_id
      AND stores.organization_id = public.get_user_organization(auth.uid())
    )
  );

CREATE POLICY "Admins can manage store settings"
  ON public.store_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = store_settings.store_id
      AND stores.organization_id = public.get_user_organization(auth.uid())
    ) AND public.has_role(auth.uid(), 'admin')
  );

-- RLS Policies for api_connections
CREATE POLICY "Users can view api connections for their organization"
  ON public.api_connections FOR SELECT
  USING (organization_id = public.get_user_organization(auth.uid()));

CREATE POLICY "Admins can manage api connections"
  ON public.api_connections FOR ALL
  USING (organization_id = public.get_user_organization(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- RLS Policies for webhooks
CREATE POLICY "Users can view webhooks for their organization"
  ON public.webhooks FOR SELECT
  USING (organization_id = public.get_user_organization(auth.uid()));

CREATE POLICY "Admins can manage webhooks"
  ON public.webhooks FOR ALL
  USING (organization_id = public.get_user_organization(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view roles in their organization"
  ON public.user_roles FOR SELECT
  USING (organization_id = public.get_user_organization(auth.uid()));

CREATE POLICY "Admins can manage user roles"
  ON public.user_roles FOR ALL
  USING (organization_id = public.get_user_organization(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Create organization for new user
  INSERT INTO public.organizations (name, account_type)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'company_name', 'Mon Organisation'), 'free')
  RETURNING id INTO new_org_id;

  -- Create profile
  INSERT INTO public.profiles (id, organization_id, first_name, last_name)
  VALUES (
    NEW.id,
    new_org_id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );

  -- Assign admin role
  INSERT INTO public.user_roles (user_id, organization_id, role)
  VALUES (NEW.id, new_org_id, 'admin');

  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.promotions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.social_connections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.store_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.api_connections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.webhooks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_stores_organization_id ON public.stores(organization_id);
CREATE INDEX idx_profiles_organization_id ON public.profiles(organization_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_organization_id ON public.user_roles(organization_id);
CREATE INDEX idx_campaigns_organization_id ON public.campaigns(organization_id);
CREATE INDEX idx_campaigns_store_id ON public.campaigns(store_id);
CREATE INDEX idx_promotions_organization_id ON public.promotions(organization_id);
CREATE INDEX idx_promotions_store_id ON public.promotions(store_id);
CREATE INDEX idx_promotions_campaign_id ON public.promotions(campaign_id);
CREATE INDEX idx_promotions_status ON public.promotions(status);
CREATE INDEX idx_social_connections_store_id ON public.social_connections(store_id);
CREATE INDEX idx_promotion_stats_promotion_id ON public.promotion_stats(promotion_id);
CREATE INDEX idx_promotion_stats_date ON public.promotion_stats(date);