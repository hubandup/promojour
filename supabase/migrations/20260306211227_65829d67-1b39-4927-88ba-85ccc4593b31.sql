
DELETE FROM social_connections WHERE store_id IN (SELECT id FROM stores WHERE organization_id = 'd4005280-9811-4fd2-b2e7-cfffa0e3939d');
DELETE FROM store_settings WHERE store_id IN (SELECT id FROM stores WHERE organization_id = 'd4005280-9811-4fd2-b2e7-cfffa0e3939d');
DELETE FROM google_merchant_accounts WHERE store_id IN (SELECT id FROM stores WHERE organization_id = 'd4005280-9811-4fd2-b2e7-cfffa0e3939d');
DELETE FROM publication_history WHERE store_id IN (SELECT id FROM stores WHERE organization_id = 'd4005280-9811-4fd2-b2e7-cfffa0e3939d');
DELETE FROM promotion_stats WHERE promotion_id IN (SELECT id FROM promotions WHERE organization_id = 'd4005280-9811-4fd2-b2e7-cfffa0e3939d');
DELETE FROM promotions WHERE organization_id = 'd4005280-9811-4fd2-b2e7-cfffa0e3939d';
DELETE FROM campaigns WHERE organization_id = 'd4005280-9811-4fd2-b2e7-cfffa0e3939d';
DELETE FROM stores WHERE organization_id = 'd4005280-9811-4fd2-b2e7-cfffa0e3939d';
DELETE FROM promotional_mechanics WHERE organization_id = 'd4005280-9811-4fd2-b2e7-cfffa0e3939d';
DELETE FROM webhooks WHERE organization_id = 'd4005280-9811-4fd2-b2e7-cfffa0e3939d';
DELETE FROM api_connections WHERE organization_id = 'd4005280-9811-4fd2-b2e7-cfffa0e3939d';
DELETE FROM notifications WHERE user_id = '805ccb63-db3f-482a-98fb-43abd82d4c3c';
DELETE FROM user_preferences WHERE user_id = '805ccb63-db3f-482a-98fb-43abd82d4c3c';
DELETE FROM user_roles WHERE user_id = '805ccb63-db3f-482a-98fb-43abd82d4c3c';
DELETE FROM profiles WHERE id = '805ccb63-db3f-482a-98fb-43abd82d4c3c';
DELETE FROM organizations WHERE id = 'd4005280-9811-4fd2-b2e7-cfffa0e3939d';
DELETE FROM auth.users WHERE id = '805ccb63-db3f-482a-98fb-43abd82d4c3c';
