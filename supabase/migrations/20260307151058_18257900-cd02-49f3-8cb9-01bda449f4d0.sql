
-- First, find charles's profile and org, then delete everything else
-- Delete in order of dependencies

-- Delete notifications for non-charles users
DELETE FROM public.notifications 
WHERE user_id != (SELECT id FROM public.profiles WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'charles@hubandup.com'
));

-- Delete user_preferences for non-charles users
DELETE FROM public.user_preferences 
WHERE user_id != (SELECT id FROM auth.users WHERE email = 'charles@hubandup.com');

-- Delete publication_history for non-charles orgs
DELETE FROM public.publication_history 
WHERE store_id IN (
  SELECT s.id FROM public.stores s 
  WHERE s.organization_id != (
    SELECT organization_id FROM public.profiles 
    WHERE id = (SELECT id FROM auth.users WHERE email = 'charles@hubandup.com')
  )
);

-- Delete promotion_stats for non-charles orgs
DELETE FROM public.promotion_stats 
WHERE promotion_id IN (
  SELECT p.id FROM public.promotions p 
  WHERE p.organization_id != (
    SELECT organization_id FROM public.profiles 
    WHERE id = (SELECT id FROM auth.users WHERE email = 'charles@hubandup.com')
  )
);

-- Delete store_settings for non-charles orgs
DELETE FROM public.store_settings 
WHERE store_id IN (
  SELECT s.id FROM public.stores s 
  WHERE s.organization_id != (
    SELECT organization_id FROM public.profiles 
    WHERE id = (SELECT id FROM auth.users WHERE email = 'charles@hubandup.com')
  )
);

-- Delete social_connections for non-charles orgs
DELETE FROM public.social_connections 
WHERE store_id IN (
  SELECT s.id FROM public.stores s 
  WHERE s.organization_id != (
    SELECT organization_id FROM public.profiles 
    WHERE id = (SELECT id FROM auth.users WHERE email = 'charles@hubandup.com')
  )
);

-- Delete google_merchant_accounts for non-charles orgs
DELETE FROM public.google_merchant_accounts 
WHERE store_id IN (
  SELECT s.id FROM public.stores s 
  WHERE s.organization_id != (
    SELECT organization_id FROM public.profiles 
    WHERE id = (SELECT id FROM auth.users WHERE email = 'charles@hubandup.com')
  )
);

-- Delete promotions for non-charles orgs
DELETE FROM public.promotions 
WHERE organization_id != (
  SELECT organization_id FROM public.profiles 
  WHERE id = (SELECT id FROM auth.users WHERE email = 'charles@hubandup.com')
);

-- Delete campaigns for non-charles orgs
DELETE FROM public.campaigns 
WHERE organization_id != (
  SELECT organization_id FROM public.profiles 
  WHERE id = (SELECT id FROM auth.users WHERE email = 'charles@hubandup.com')
);

-- Delete stores for non-charles orgs
DELETE FROM public.stores 
WHERE organization_id != (
  SELECT organization_id FROM public.profiles 
  WHERE id = (SELECT id FROM auth.users WHERE email = 'charles@hubandup.com')
);

-- Delete webhooks for non-charles orgs
DELETE FROM public.webhooks 
WHERE organization_id != (
  SELECT organization_id FROM public.profiles 
  WHERE id = (SELECT id FROM auth.users WHERE email = 'charles@hubandup.com')
);

-- Delete api_connections for non-charles orgs
DELETE FROM public.api_connections 
WHERE organization_id != (
  SELECT organization_id FROM public.profiles 
  WHERE id = (SELECT id FROM auth.users WHERE email = 'charles@hubandup.com')
);

-- Delete promotional_mechanics for non-charles orgs
DELETE FROM public.promotional_mechanics 
WHERE organization_id != (
  SELECT organization_id FROM public.profiles 
  WHERE id = (SELECT id FROM auth.users WHERE email = 'charles@hubandup.com')
);

-- Delete user_roles for non-charles users
DELETE FROM public.user_roles 
WHERE user_id != (SELECT id FROM auth.users WHERE email = 'charles@hubandup.com');

-- Delete profiles for non-charles users
DELETE FROM public.profiles 
WHERE id != (SELECT id FROM auth.users WHERE email = 'charles@hubandup.com');

-- Delete organizations that aren't charles's
DELETE FROM public.organizations 
WHERE id != (
  SELECT organization_id FROM public.profiles 
  WHERE id = (SELECT id FROM auth.users WHERE email = 'charles@hubandup.com')
);

-- Delete auth users (this cascades but we already cleaned up)
DELETE FROM auth.users 
WHERE email != 'charles@hubandup.com';
