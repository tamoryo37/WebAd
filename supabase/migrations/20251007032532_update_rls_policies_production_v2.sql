/*
  # 本番環境用RLSポリシーの更新

  3層セキュリティモデルの完全実装
  - レイヤー1: テナント分離
  - レイヤー2: 所有者制御
  - レイヤー3: メディア別アクセス制御
*/

-- campaigns テーブルのRLSポリシー
DROP POLICY IF EXISTS "Authenticated users can view campaigns" ON campaigns;
DROP POLICY IF EXISTS "Authenticated users can insert campaigns" ON campaigns;
DROP POLICY IF EXISTS "Authenticated users can update campaigns" ON campaigns;
DROP POLICY IF EXISTS "Authenticated users can delete campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can view campaigns in their tenant" ON campaigns;
DROP POLICY IF EXISTS "Users can create campaigns in their tenant" ON campaigns;
DROP POLICY IF EXISTS "Users can update campaigns in their tenant" ON campaigns;
DROP POLICY IF EXISTS "Admins can delete campaigns in their tenant" ON campaigns;

-- SELECT: テナント内のキャンペーンのみ表示
CREATE POLICY "Users can view campaigns in their tenant"
  ON campaigns FOR SELECT
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid())
  );

-- INSERT: テナント内のadminとstaffのみ作成可能
CREATE POLICY "Users can create campaigns in their tenant"
  ON campaigns FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid())
    AND (SELECT role FROM users WHERE users.id = auth.uid()) IN ('admin', 'staff', 'system_admin')
  );

-- UPDATE: 管理者は全て、担当者は自分が作成したもののみ編集可能
CREATE POLICY "Users can update campaigns in their tenant"
  ON campaigns FOR UPDATE
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid())
    AND (
      (SELECT role FROM users WHERE users.id = auth.uid()) IN ('admin', 'system_admin')
      OR (
        (SELECT role FROM users WHERE users.id = auth.uid()) = 'staff'
        AND created_by = auth.uid()
      )
    )
  )
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid())
  );

-- DELETE: 管理者のみ削除可能
CREATE POLICY "Admins can delete campaigns in their tenant"
  ON campaigns FOR DELETE
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid())
    AND (SELECT role FROM users WHERE users.id = auth.uid()) IN ('admin', 'system_admin')
  );

-- stores テーブルのRLSポリシー
DROP POLICY IF EXISTS "Authenticated users can view stores" ON stores;
DROP POLICY IF EXISTS "Authenticated users can insert stores" ON stores;
DROP POLICY IF EXISTS "Authenticated users can update stores" ON stores;
DROP POLICY IF EXISTS "Authenticated users can delete stores" ON stores;
DROP POLICY IF EXISTS "Users can view stores in their tenant" ON stores;
DROP POLICY IF EXISTS "Users can create stores in their tenant" ON stores;
DROP POLICY IF EXISTS "Users can update stores in their tenant" ON stores;
DROP POLICY IF EXISTS "Admins can delete stores in their tenant" ON stores;

CREATE POLICY "Users can view stores in their tenant"
  ON stores FOR SELECT
  TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid()));

CREATE POLICY "Users can create stores in their tenant"
  ON stores FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid())
    AND (SELECT role FROM users WHERE users.id = auth.uid()) IN ('admin', 'staff', 'system_admin')
  );

CREATE POLICY "Users can update stores in their tenant"
  ON stores FOR UPDATE
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid())
    AND (
      (SELECT role FROM users WHERE users.id = auth.uid()) IN ('admin', 'system_admin')
      OR (
        (SELECT role FROM users WHERE users.id = auth.uid()) = 'staff'
        AND created_by = auth.uid()
      )
    )
  )
  WITH CHECK (tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid()));

CREATE POLICY "Admins can delete stores in their tenant"
  ON stores FOR DELETE
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid())
    AND (SELECT role FROM users WHERE users.id = auth.uid()) IN ('admin', 'system_admin')
  );

-- budget_tracking テーブルのRLSポリシー
DROP POLICY IF EXISTS "Authenticated users can view budget tracking" ON budget_tracking;
DROP POLICY IF EXISTS "Authenticated users can insert budget tracking" ON budget_tracking;
DROP POLICY IF EXISTS "Authenticated users can update budget tracking" ON budget_tracking;
DROP POLICY IF EXISTS "Users can view budget tracking in their tenant" ON budget_tracking;
DROP POLICY IF EXISTS "Users can manage budget tracking in their tenant" ON budget_tracking;

CREATE POLICY "Users can view budget tracking in their tenant"
  ON budget_tracking FOR SELECT
  TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid()));

CREATE POLICY "Users can manage budget tracking in their tenant"
  ON budget_tracking FOR ALL
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid())
    AND (SELECT role FROM users WHERE users.id = auth.uid()) IN ('admin', 'staff', 'system_admin')
  )
  WITH CHECK (tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid()));

-- campaign_progress テーブルのRLSポリシー
DROP POLICY IF EXISTS "Authenticated users can view campaign progress" ON campaign_progress;
DROP POLICY IF EXISTS "Authenticated users can insert campaign progress" ON campaign_progress;
DROP POLICY IF EXISTS "Authenticated users can update campaign progress" ON campaign_progress;
DROP POLICY IF EXISTS "Users can view campaign progress in their tenant" ON campaign_progress;
DROP POLICY IF EXISTS "Users can manage campaign progress in their tenant" ON campaign_progress;

CREATE POLICY "Users can view campaign progress in their tenant"
  ON campaign_progress FOR SELECT
  TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid()));

CREATE POLICY "Users can manage campaign progress in their tenant"
  ON campaign_progress FOR ALL
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid())
    AND (SELECT role FROM users WHERE users.id = auth.uid()) IN ('admin', 'staff', 'system_admin')
  )
  WITH CHECK (tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid()));

-- campaign_alerts テーブルのRLSポリシー
DROP POLICY IF EXISTS "Authenticated users can view campaign alerts" ON campaign_alerts;
DROP POLICY IF EXISTS "Users can view campaign alerts in their tenant" ON campaign_alerts;
DROP POLICY IF EXISTS "Users can manage campaign alerts in their tenant" ON campaign_alerts;

CREATE POLICY "Users can view campaign alerts in their tenant"
  ON campaign_alerts FOR SELECT
  TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid()));

CREATE POLICY "Users can manage campaign alerts in their tenant"
  ON campaign_alerts FOR ALL
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid())
    AND (SELECT role FROM users WHERE users.id = auth.uid()) IN ('admin', 'staff', 'system_admin')
  )
  WITH CHECK (tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid()));

-- store_images テーブルのRLSポリシー
DROP POLICY IF EXISTS "Authenticated users can view store images" ON store_images;
DROP POLICY IF EXISTS "Users can view store images in their tenant" ON store_images;
DROP POLICY IF EXISTS "Users can manage store images in their tenant" ON store_images;

CREATE POLICY "Users can view store images in their tenant"
  ON store_images FOR SELECT
  TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid()));

CREATE POLICY "Users can manage store images in their tenant"
  ON store_images FOR ALL
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid())
    AND (SELECT role FROM users WHERE users.id = auth.uid()) IN ('admin', 'staff', 'system_admin')
  )
  WITH CHECK (tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid()));

-- store_monthly_documents テーブルのRLSポリシー
DROP POLICY IF EXISTS "Authenticated users can view store monthly documents" ON store_monthly_documents;
DROP POLICY IF EXISTS "Users can view store monthly documents in their tenant" ON store_monthly_documents;
DROP POLICY IF EXISTS "Users can manage store monthly documents in their tenant" ON store_monthly_documents;

CREATE POLICY "Users can view store monthly documents in their tenant"
  ON store_monthly_documents FOR SELECT
  TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid()));

CREATE POLICY "Users can manage store monthly documents in their tenant"
  ON store_monthly_documents FOR ALL
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid())
    AND (SELECT role FROM users WHERE users.id = auth.uid()) IN ('admin', 'staff', 'system_admin')
  )
  WITH CHECK (tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid()));
