/*
  # usersテーブルのRLS修正（関数用）

  ## 問題
    get_user_tenant_id()とget_user_role()がSECURITY DEFINERなのに
    usersテーブルのRLSポリシーで制限されている

  ## 解決策
    usersテーブルのRLSを一時的に無効化してテスト
    または、関数がusersテーブルにアクセスできるようにポリシーを調整
*/

-- usersテーブルのRLSを確認して、必要に応じて調整
-- SECURITY DEFINER関数はRLSをバイパスするはずだが、念のため確認

-- 現在のポリシーを削除して再作成
DROP POLICY IF EXISTS "Users can view users in their tenant" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- より寛容なポリシーに変更
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admins can view all users in their tenant
CREATE POLICY "Admins can view users in their tenant"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role IN ('admin', 'system_admin')
        AND u.tenant_id = users.tenant_id
    )
  );
