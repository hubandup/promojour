-- Sécuriser stores_with_contact : accès service_role uniquement
-- Révoquer tous les accès existants
REVOKE ALL ON public.stores_with_contact FROM public;
REVOKE ALL ON public.stores_with_contact FROM anon;
REVOKE ALL ON public.stores_with_contact FROM authenticated;

-- Accorder uniquement au service_role
GRANT SELECT ON public.stores_with_contact TO service_role;

COMMENT ON VIEW public.stores_with_contact IS 'Vue sécurisée accessible uniquement via service_role. Les clients doivent passer par une Edge Function pour accéder aux infos de contact.';