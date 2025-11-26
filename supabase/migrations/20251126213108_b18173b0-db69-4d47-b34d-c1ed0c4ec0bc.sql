-- Align test account organization_ids with demo data (FIXED)
-- This fixes the mismatch between account organizations and promotion organizations

-- First, delete existing user_roles for accounts we're updating
DELETE FROM user_roles 
WHERE user_id IN (
  'ea5fcea5-2afd-4f7c-9c30-baa513f71b2f',  -- free@hubandup.com
  '6dd7c8bb-fb73-43e1-9c38-65377490c2a1'   -- pro@hubandup.com
);

-- Update free@hubandup.com profile to use Demo Free organization
UPDATE profiles 
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE id = 'ea5fcea5-2afd-4f7c-9c30-baa513f71b2f';

-- Re-insert free@hubandup.com user role with correct organization
INSERT INTO user_roles (user_id, organization_id, role)
VALUES ('ea5fcea5-2afd-4f7c-9c30-baa513f71b2f', '00000000-0000-0000-0000-000000000001', 'admin');

-- Update pro@hubandup.com profile
UPDATE profiles 
SET organization_id = '22222222-2222-2222-2222-222222222222'
WHERE id = '6dd7c8bb-fb73-43e1-9c38-65377490c2a1';

-- Re-insert pro@hubandup.com user role with correct organization
INSERT INTO user_roles (user_id, organization_id, role)
VALUES ('6dd7c8bb-fb73-43e1-9c38-65377490c2a1', '22222222-2222-2222-2222-222222222222', 'admin');