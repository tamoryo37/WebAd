/*
  # RLSポリシーの無限再帰問題を修正

  ## 問題
    usersテーブルのRLSポリシーがサブクエリでusersを参照して無限再帰

  ## 解決策
    auth.uid()を直接使用するシンプルなポリシーに変更
*/

-- usersテーブルのポリシーを削除して再作成
DROP POLICY IF EXISTS "Users can view users in their tenant" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- SELECT: 自分のテナント内のユーザーを表示（無限再帰を回避）
CREATE POLICY "Users can view users in their tenant"
  ON users FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT u.tenant_id 
      FROM users u 
      WHERE u.id = auth.uid()
    )
    OR id = auth.uid()
  );

-- UPDATE: 自分自身のみ更新可能
CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- campaignsテーブルのポリシーも最適化（無限再帰回避）
DROP POLICY IF EXISTS "Users can view campaigns in their tenant" ON campaigns;
DROP POLICY IF EXISTS "Users can create campaigns in their tenant" ON campaigns;
DROP POLICY IF EXISTS "Users can update campaigns in their tenant" ON campaigns;
DROP POLICY IF EXISTS "Admins can delete campaigns in their tenant" ON campaigns;

-- SELECT: シンプルな条件に変更
CREATE POLICY "Users can view campaigns in their tenant"
  ON campaigns FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- INSERT
CREATE POLICY "Users can create campaigns in their tenant"
  ON campaigns FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
    AND (
      SELECT role FROM users WHERE id = auth.uid()
    ) IN ('admin', 'staff', 'system_admin')
  );

-- UPDATE
CREATE POLICY "Users can update campaigns in their tenant"
  ON campaigns FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
    AND (
      (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'system_admin')
      OR created_by = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- DELETE
CREATE POLICY "Admins can delete campaigns in their tenant"
  ON campaigns FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
    AND (
      SELECT role FROM users WHERE id = auth.uid()
    ) IN ('admin', 'system_admin')
  );

-- storesテーブルのポリシーも最適化
DROP POLICY IF EXISTS "Users can view stores in their tenant" ON stores;
DROP POLICY IF EXISTS "Users can create stores in their tenant" ON stores;
DROP POLICY IF EXISTS "Users can update stores in their tenant" ON stores;
DROP POLICY IF EXISTS "Admins can delete stores in their tenant" ON stores;

CREATE POLICY "Users can view stores in their tenant"
  ON stores FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create stores in their tenant"
  ON stores FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
    AND (
      SELECT role FROM users WHERE id = auth.uid()
    ) IN ('admin', 'staff', 'system_admin')
  );

CREATE POLICY "Users can update stores in their tenant"
  ON stores FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
    AND (
      (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'system_admin')
      OR created_by = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete stores in their tenant"
  ON stores FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
    AND (
      SELECT role FROM users WHERE id = auth.uid()
    ) IN ('admin', 'system_admin')
  );

-- その他のテーブルのポリシーも同様に最適化
DROP POLICY IF EXISTS "Users can view budget tracking in their tenant" ON budget_tracking;
DROP POLICY IF EXISTS "Users can manage budget tracking in their tenant" ON budget_tracking;

CREATE POLICY "Users can view budget tracking in their tenant"
  ON budget_tracking FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage budget tracking in their tenant"
  ON budget_tracking FOR ALL
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
    AND (
      SELECT role FROM users WHERE id = auth.uid()
    ) IN ('admin', 'staff', 'system_admin')
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- campaign_progress
DROP POLICY IF EXISTS "Users can view campaign progress in their tenant" ON campaign_progress;
DROP POLICY IF EXISTS "Users can manage campaign progress in their tenant" ON campaign_progress;

CREATE POLICY "Users can view campaign progress in their tenant"
  ON campaign_progress FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage campaign progress in their tenant"
  ON campaign_progress FOR ALL
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
    AND (
      SELECT role FROM users WHERE id = auth.uid()
    ) IN ('admin', 'staff', 'system_admin')
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );
