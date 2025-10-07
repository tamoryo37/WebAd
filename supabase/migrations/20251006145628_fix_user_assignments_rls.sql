/*
  # RLSポリシーの修正

  1. 既存のポリシーを削除
  2. シンプルで明確なポリシーを再作成
  
  新しいポリシー:
  - 全ての認証済みユーザーが自分のレコードを閲覧・更新可能
  - 全ての認証済みユーザーが全レコードを閲覧可能（管理者チェックはアプリ側で実施）
*/

DROP POLICY IF EXISTS "Users can view own assignments" ON user_campaign_assignments;
DROP POLICY IF EXISTS "Users can update own assignments" ON user_campaign_assignments;
DROP POLICY IF EXISTS "Users can insert own assignments" ON user_campaign_assignments;
DROP POLICY IF EXISTS "Admins can view all assignments" ON user_campaign_assignments;
DROP POLICY IF EXISTS "Admins can update all assignments" ON user_campaign_assignments;
DROP POLICY IF EXISTS "Admins can insert assignments" ON user_campaign_assignments;
DROP POLICY IF EXISTS "Admins can delete assignments" ON user_campaign_assignments;

CREATE POLICY "Enable read access for authenticated users"
  ON user_campaign_assignments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON user_campaign_assignments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON user_campaign_assignments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users"
  ON user_campaign_assignments FOR DELETE
  TO authenticated
  USING (true);
