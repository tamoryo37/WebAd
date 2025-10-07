/*
  # budget_trackingとcampaign_progressのRLSポリシー修正

  ## 問題
    usersテーブルへの参照で権限エラーが発生

  ## 解決策
    get_user_tenant_id()関数を使用してusersテーブルへの直接参照を回避
*/

-- budget_trackingのポリシーを再作成
DROP POLICY IF EXISTS "Users can view budget tracking in their tenant" ON budget_tracking;
DROP POLICY IF EXISTS "Users can manage budget tracking in their tenant" ON budget_tracking;

CREATE POLICY "Users can view budget tracking in their tenant"
  ON budget_tracking FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can insert budget tracking in their tenant"
  ON budget_tracking FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = get_user_tenant_id()
    AND get_user_role() IN ('admin', 'staff', 'system_admin')
  );

CREATE POLICY "Users can update budget tracking in their tenant"
  ON budget_tracking FOR UPDATE
  TO authenticated
  USING (
    tenant_id = get_user_tenant_id()
    AND get_user_role() IN ('admin', 'staff', 'system_admin')
  )
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can delete budget tracking in their tenant"
  ON budget_tracking FOR DELETE
  TO authenticated
  USING (
    tenant_id = get_user_tenant_id()
    AND get_user_role() IN ('admin', 'system_admin')
  );

-- campaign_progressのポリシーを再作成
DROP POLICY IF EXISTS "Users can view campaign progress in their tenant" ON campaign_progress;
DROP POLICY IF EXISTS "Users can manage campaign progress in their tenant" ON campaign_progress;

CREATE POLICY "Users can view campaign progress in their tenant"
  ON campaign_progress FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can insert campaign progress in their tenant"
  ON campaign_progress FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = get_user_tenant_id()
    AND get_user_role() IN ('admin', 'staff', 'system_admin')
  );

CREATE POLICY "Users can update campaign progress in their tenant"
  ON campaign_progress FOR UPDATE
  TO authenticated
  USING (
    tenant_id = get_user_tenant_id()
    AND get_user_role() IN ('admin', 'staff', 'system_admin')
  )
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can delete campaign progress in their tenant"
  ON campaign_progress FOR DELETE
  TO authenticated
  USING (
    tenant_id = get_user_tenant_id()
    AND get_user_role() IN ('admin', 'system_admin')
  );

-- campaign_alertsのポリシーも同様に修正
DROP POLICY IF EXISTS "Users can view campaign alerts in their tenant" ON campaign_alerts;
DROP POLICY IF EXISTS "Users can manage campaign alerts in their tenant" ON campaign_alerts;

CREATE POLICY "Users can view campaign alerts in their tenant"
  ON campaign_alerts FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can insert campaign alerts in their tenant"
  ON campaign_alerts FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = get_user_tenant_id()
    AND get_user_role() IN ('admin', 'staff', 'system_admin')
  );

CREATE POLICY "Users can update campaign alerts in their tenant"
  ON campaign_alerts FOR UPDATE
  TO authenticated
  USING (
    tenant_id = get_user_tenant_id()
    AND get_user_role() IN ('admin', 'staff', 'system_admin')
  )
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can delete campaign alerts in their tenant"
  ON campaign_alerts FOR DELETE
  TO authenticated
  USING (
    tenant_id = get_user_tenant_id()
    AND get_user_role() IN ('admin', 'system_admin')
  );
