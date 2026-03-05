ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_step integer NOT NULL DEFAULT 1;