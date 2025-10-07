/*
  # usersテーブルとauth.usersのID同期

  ## 問題
    - usersテーブルのidとauth.usersのidが異なる
    - RLSポリシーがauth.uid()を使用しているため、データにアクセスできない

  ## 解決策
    1. auth.usersに存在するユーザーのusersテーブルIDを更新
    2. 外部キー制約の一時的な無効化と再有効化
*/

-- 外部キー制約を一時的に無効化
ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS campaigns_created_by_fkey;
ALTER TABLE stores DROP CONSTRAINT IF EXISTS stores_created_by_fkey;
ALTER TABLE budget_tracking DROP CONSTRAINT IF EXISTS budget_tracking_created_by_fkey;
ALTER TABLE campaign_progress DROP CONSTRAINT IF EXISTS campaign_progress_created_by_fkey;
ALTER TABLE store_images DROP CONSTRAINT IF EXISTS store_images_created_by_fkey;
ALTER TABLE store_monthly_documents DROP CONSTRAINT IF EXISTS store_monthly_documents_created_by_fkey;

-- ryo.tamoto@osushi-inc.comのIDを更新
UPDATE users 
SET id = '174074c6-7901-47b7-af5c-d32be0dd0c08'
WHERE email = 'ryo.tamoto@osushi-inc.com';

-- external@example.comのIDを更新
UPDATE users 
SET id = 'df79e79a-bd38-4ba3-b3f2-84cfdebcb04f'
WHERE email = 'external@example.com';

-- 外部キー制約を再作成
ALTER TABLE campaigns ADD CONSTRAINT campaigns_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE stores ADD CONSTRAINT stores_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE budget_tracking ADD CONSTRAINT budget_tracking_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE campaign_progress ADD CONSTRAINT campaign_progress_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE store_images ADD CONSTRAINT store_images_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE store_monthly_documents ADD CONSTRAINT store_monthly_documents_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- 確認
SELECT 
  u.id,
  u.email,
  u.role,
  au.id as auth_id,
  CASE WHEN u.id = au.id THEN '✓ 一致' ELSE '✗ 不一致' END as status
FROM users u
LEFT JOIN auth.users au ON au.email = u.email
WHERE au.id IS NOT NULL;
