
-- =============================================
-- 1. Table notifications
-- =============================================
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Index for performance
CREATE INDEX idx_notifications_user_unread ON public.notifications (user_id, read) WHERE read = false;

-- =============================================
-- 2. Colonnes organizations (branding)
-- =============================================
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS branding_color text DEFAULT '#8B5CF6',
  ADD COLUMN IF NOT EXISTS use_custom_logo boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS use_brand_colors boolean DEFAULT false;

-- =============================================
-- 3. Table user_preferences
-- =============================================
CREATE TABLE public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications boolean NOT NULL DEFAULT true,
  performance_alerts boolean NOT NULL DEFAULT true,
  tips_enabled boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================
-- 4. Trigger: notification quand promotion expire
-- =============================================
CREATE OR REPLACE FUNCTION public.notify_promotion_expired()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status != 'expired' AND NEW.status = 'expired' THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    SELECT ur.user_id,
           'Promotion expirée',
           'La promotion "' || NEW.title || '" a expiré.',
           'warning'
    FROM user_roles ur
    WHERE ur.organization_id = NEW.organization_id
      AND ur.role IN ('admin', 'editor');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_promotion_expired
  AFTER UPDATE ON public.promotions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_promotion_expired();

-- =============================================
-- 5. Cron job pour check-promotion-alerts (9h Paris = 8h UTC en hiver, 7h UTC en été)
-- =============================================
SELECT cron.schedule(
  'check-promotion-alerts-daily',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/check-promotion-alerts',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
