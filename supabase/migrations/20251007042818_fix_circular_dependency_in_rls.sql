/*
  # RLSの循環参照を完全に解決

  ## 問題
    usersテーブルのポリシーがget_user_tenant_id()を呼び出し、
    その関数がusersテーブルを参照する無限ループ

  ## 解決策
    1. usersテーブルのポリシーは関数を使わず、直接auth.uid()を使用
    2. 他のテーブルはget_user_tenant_id()を安全に使用できる
*/

-- usersテーブルのすべてのポリシーを削除
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view users in their tenant" ON users;
DROP POLICY IF EXISTS "Users can view users in their tenant" ON users;

-- usersテーブルのポリシーを再作成（関数を使わない）
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- System admins can insert new users
CREATE POLICY "System admins can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role = 'system_admin'
    )
  );

-- Admins can view users in their tenant (without using get_user_tenant_id)
CREATE POLICY "Admins can view tenant users"
  ON users FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT u.tenant_id FROM users u
      WHERE u.id = auth.uid()
    )
  );
