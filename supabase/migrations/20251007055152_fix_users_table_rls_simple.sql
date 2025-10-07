/*
  # usersテーブルのRLSをシンプルに修正（最終版）

  ## 問題
    usersテーブルのポリシーが自己参照して無限再帰

  ## 解決策
    usersテーブルには最もシンプルなポリシーのみ設定
    - 自分自身のプロフィールのみ閲覧可能
    - 他のテーブルはget_user_tenant_id()とget_user_role()を使用
*/

-- usersテーブルの全ポリシーを削除
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can view their tenant users" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "System admins can insert users" ON users;

-- 最もシンプルなポリシーのみ
CREATE POLICY "Users can view own profile only"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile only"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ユーザー挿入は認証済みユーザー全員可能（システム管理用）
CREATE POLICY "Authenticated users can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 注意: この設定では、ユーザーは自分自身のプロフィールしか見れません
-- UserManagementコンポーネントは、すべてのユーザーを取得するために
-- service_role経由でアクセスするか、専用のRPC関数を作成する必要があります
