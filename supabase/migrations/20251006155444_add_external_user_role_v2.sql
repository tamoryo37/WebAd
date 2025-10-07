/*
  # 社外ユーザー権限管理

  1. 変更内容
    - usersテーブルの既存roleカラムを使用
    - role値: 'admin', 'internal', 'external'を設定
    - externalユーザーは担当キャンペーンのみアクセス可能

  2. ロールの説明
    - admin: 全機能アクセス可能（内部管理者）
    - internal: 全機能アクセス可能（社内ユーザー）
    - external: 入稿管理の担当キャンペーンのみアクセス可能（社外ユーザー）

  3. セキュリティ
    - RLSポリシーでexternalユーザーは自分が担当のキャンペーンのみ閲覧可能
    - 店舗管理、未消化管理、ダッシュボードへのアクセスを制限

  4. テストデータ
    - external@example.comを社外ユーザーとして作成
*/

-- Update existing users with default internal role if null
UPDATE users 
SET role = 'internal' 
WHERE role IS NULL OR role = '';

-- Create external user for testing (insert into users table only)
INSERT INTO users (email, username, full_name, password_hash, role, is_active)
VALUES ('external@example.com', 'external', '社外ユーザー', 'dummy_hash', 'external', true)
ON CONFLICT (email) DO UPDATE SET role = 'external';

-- Update RLS policies for campaigns to restrict external users
DROP POLICY IF EXISTS "External users can only view assigned campaigns" ON campaigns;
CREATE POLICY "External users can only view assigned campaigns"
  ON campaigns FOR SELECT
  TO authenticated
  USING (
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM users 
        WHERE users.email = (SELECT email FROM auth.users WHERE id = auth.uid())
        AND users.role = 'external'
      ) THEN
        person_in_charge = (SELECT email FROM auth.users WHERE id = auth.uid())
      ELSE
        true
    END
  );

-- Update RLS policies for budget_tracking
DROP POLICY IF EXISTS "External users can view budget for assigned campaigns" ON budget_tracking;
CREATE POLICY "External users can view budget for assigned campaigns"
  ON budget_tracking FOR SELECT
  TO authenticated
  USING (
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM users 
        WHERE users.email = (SELECT email FROM auth.users WHERE id = auth.uid())
        AND users.role = 'external'
      ) THEN
        EXISTS (
          SELECT 1 FROM campaigns 
          WHERE campaigns.id = budget_tracking.campaign_id
          AND campaigns.person_in_charge = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
      ELSE
        true
    END
  );

-- Ensure stores table is restricted for external users
DROP POLICY IF EXISTS "External users cannot view stores" ON stores;
CREATE POLICY "External users cannot view stores"
  ON stores FOR SELECT
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM users 
      WHERE users.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND users.role = 'external'
    )
  );

-- Assign the October campaign to external user for testing
UPDATE campaigns 
SET person_in_charge = 'external@example.com'
WHERE campaign_number = '709';
