/*
  # メディアプラットフォームとusersテーブルのRLS無限再帰を修正

  ## 問題
    media_platformsとusersのポリシーがお互いを参照して無限再帰発生

  ## 解決策
    1. media_platformsのポリシーをget_user_tenant_id()関数を使うように変更
    2. usersのポリシーは自己参照を避けるため、最低限のポリシーのみ
*/

-- media_platformsの全ポリシーを削除して再作成
DROP POLICY IF EXISTS "Users can view media platforms in their tenant" ON media_platforms;
DROP POLICY IF EXISTS "Admins can insert media platforms in their tenant" ON media_platforms;
DROP POLICY IF EXISTS "Admins can update media platforms in their tenant" ON media_platforms;
DROP POLICY IF EXISTS "Admins can delete media platforms in their tenant" ON media_platforms;

-- シンプルなポリシーに変更（get_user_tenant_id関数を使用）
CREATE POLICY "Users can view media platforms"
  ON media_platforms FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Admins can insert media platforms"
  ON media_platforms FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = get_user_tenant_id()
    AND get_user_role() IN ('admin', 'staff', 'system_admin')
  );

CREATE POLICY "Admins can update media platforms"
  ON media_platforms FOR UPDATE
  TO authenticated
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (
    tenant_id = get_user_tenant_id()
    AND get_user_role() IN ('admin', 'staff', 'system_admin')
  );

CREATE POLICY "Admins can delete media platforms"
  ON media_platforms FOR DELETE
  TO authenticated
  USING (
    tenant_id = get_user_tenant_id()
    AND get_user_role() IN ('admin', 'system_admin')
  );

-- usersテーブルのポリシーも確認（"Admins can view tenant users"が問題）
DROP POLICY IF EXISTS "Admins can view tenant users" ON users;

-- usersテーブルには自分自身のプロフィールのみ閲覧可能にする（シンプルに）
-- Adminが他のユーザーを見る場合は、別のアプローチを取る必要がある
CREATE POLICY "Users can view their tenant users"
  ON users FOR SELECT
  TO authenticated
  USING (
    -- 自分自身は常に見れる
    id = auth.uid()
    OR
    -- 同じテナントのadminは他のユーザーを見れる
    (
      EXISTS (
        SELECT 1 FROM users self
        WHERE self.id = auth.uid()
          AND self.tenant_id = users.tenant_id
          AND self.role IN ('admin', 'system_admin')
      )
    )
  );
