/*
  # usersテーブルのRLSポリシー完全修正

  ## 問題
    サブクエリでusersテーブルを参照して無限再帰が発生

  ## 解決策
    セキュリティコンテキスト(security definer)を使った関数を作成し、
    無限再帰を回避
*/

-- セキュリティコンテキスト関数の作成
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT tenant_id FROM users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$;

-- usersテーブルのポリシーを完全に再作成
DROP POLICY IF EXISTS "Users can view users in their tenant" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can view their tenant" ON tenants;

-- SELECTポリシー: 関数を使って無限再帰を回避
CREATE POLICY "Users can view users in their tenant"
  ON users FOR SELECT
  TO authenticated
  USING (
    tenant_id = get_user_tenant_id()
    OR id = auth.uid()
  );

-- UPDATEポリシー
CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- tenantsテーブルのポリシー
CREATE POLICY "Users can view their tenant"
  ON tenants FOR SELECT
  TO authenticated
  USING (id = get_user_tenant_id());

-- 他のテーブルのポリシーも関数を使用するように更新
DROP POLICY IF EXISTS "Users can view campaigns in their tenant" ON campaigns;
DROP POLICY IF EXISTS "Users can create campaigns in their tenant" ON campaigns;
DROP POLICY IF EXISTS "Users can update campaigns in their tenant" ON campaigns;
DROP POLICY IF EXISTS "Admins can delete campaigns in their tenant" ON campaigns;

CREATE POLICY "Users can view campaigns in their tenant"
  ON campaigns FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can create campaigns in their tenant"
  ON campaigns FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = get_user_tenant_id()
    AND get_user_role() IN ('admin', 'staff', 'system_admin')
  );

CREATE POLICY "Users can update campaigns in their tenant"
  ON campaigns FOR UPDATE
  TO authenticated
  USING (
    tenant_id = get_user_tenant_id()
    AND (
      get_user_role() IN ('admin', 'system_admin')
      OR created_by = auth.uid()
    )
  )
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Admins can delete campaigns in their tenant"
  ON campaigns FOR DELETE
  TO authenticated
  USING (
    tenant_id = get_user_tenant_id()
    AND get_user_role() IN ('admin', 'system_admin')
  );

-- storesテーブル
DROP POLICY IF EXISTS "Users can view stores in their tenant" ON stores;
DROP POLICY IF EXISTS "Users can create stores in their tenant" ON stores;
DROP POLICY IF EXISTS "Users can update stores in their tenant" ON stores;
DROP POLICY IF EXISTS "Admins can delete stores in their tenant" ON stores;

CREATE POLICY "Users can view stores in their tenant"
  ON stores FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can create stores in their tenant"
  ON stores FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = get_user_tenant_id()
    AND get_user_role() IN ('admin', 'staff', 'system_admin')
  );

CREATE POLICY "Users can update stores in their tenant"
  ON stores FOR UPDATE
  TO authenticated
  USING (
    tenant_id = get_user_tenant_id()
    AND (
      get_user_role() IN ('admin', 'system_admin')
      OR created_by = auth.uid()
    )
  )
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Admins can delete stores in their tenant"
  ON stores FOR DELETE
  TO authenticated
  USING (
    tenant_id = get_user_tenant_id()
    AND get_user_role() IN ('admin', 'system_admin')
  );

-- budget_tracking
DROP POLICY IF EXISTS "Users can view budget tracking in their tenant" ON budget_tracking;
DROP POLICY IF EXISTS "Users can manage budget tracking in their tenant" ON budget_tracking;

CREATE POLICY "Users can view budget tracking in their tenant"
  ON budget_tracking FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can manage budget tracking in their tenant"
  ON budget_tracking FOR ALL
  TO authenticated
  USING (
    tenant_id = get_user_tenant_id()
    AND get_user_role() IN ('admin', 'staff', 'system_admin')
  )
  WITH CHECK (tenant_id = get_user_tenant_id());

-- campaign_progress
DROP POLICY IF EXISTS "Users can view campaign progress in their tenant" ON campaign_progress;
DROP POLICY IF EXISTS "Users can manage campaign progress in their tenant" ON campaign_progress;

CREATE POLICY "Users can view campaign progress in their tenant"
  ON campaign_progress FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can manage campaign progress in their tenant"
  ON campaign_progress FOR ALL
  TO authenticated
  USING (
    tenant_id = get_user_tenant_id()
    AND get_user_role() IN ('admin', 'staff', 'system_admin')
  )
  WITH CHECK (tenant_id = get_user_tenant_id());

-- campaign_alerts
DROP POLICY IF EXISTS "Users can view campaign alerts in their tenant" ON campaign_alerts;
DROP POLICY IF EXISTS "Users can manage campaign alerts in their tenant" ON campaign_alerts;

CREATE POLICY "Users can view campaign alerts in their tenant"
  ON campaign_alerts FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can manage campaign alerts in their tenant"
  ON campaign_alerts FOR ALL
  TO authenticated
  USING (
    tenant_id = get_user_tenant_id()
    AND get_user_role() IN ('admin', 'staff', 'system_admin')
  )
  WITH CHECK (tenant_id = get_user_tenant_id());

-- store_images
DROP POLICY IF EXISTS "Users can view store images in their tenant" ON store_images;
DROP POLICY IF EXISTS "Users can manage store images in their tenant" ON store_images;

CREATE POLICY "Users can view store images in their tenant"
  ON store_images FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can manage store images in their tenant"
  ON store_images FOR ALL
  TO authenticated
  USING (
    tenant_id = get_user_tenant_id()
    AND get_user_role() IN ('admin', 'staff', 'system_admin')
  )
  WITH CHECK (tenant_id = get_user_tenant_id());

-- store_monthly_documents
DROP POLICY IF EXISTS "Users can view store monthly documents in their tenant" ON store_monthly_documents;
DROP POLICY IF EXISTS "Users can manage store monthly documents in their tenant" ON store_monthly_documents;

CREATE POLICY "Users can view store monthly documents in their tenant"
  ON store_monthly_documents FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can manage store monthly documents in their tenant"
  ON store_monthly_documents FOR ALL
  TO authenticated
  USING (
    tenant_id = get_user_tenant_id()
    AND get_user_role() IN ('admin', 'staff', 'system_admin')
  )
  WITH CHECK (tenant_id = get_user_tenant_id());

-- monthly_dashboard
DROP POLICY IF EXISTS "Users can view monthly dashboard in their tenant" ON monthly_dashboard;

CREATE POLICY "Users can view monthly dashboard in their tenant"
  ON monthly_dashboard FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can manage monthly dashboard in their tenant"
  ON monthly_dashboard FOR ALL
  TO authenticated
  USING (
    tenant_id = get_user_tenant_id()
    AND get_user_role() IN ('admin', 'staff', 'system_admin')
  )
  WITH CHECK (tenant_id = get_user_tenant_id());
