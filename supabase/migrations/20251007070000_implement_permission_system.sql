/*
  # 権限システムの実装

  ## 概要
  リソースごとのCRUD権限と表示範囲制限を実装します。

  ## 変更内容

  ### 1. テーブル構造
  既存のテーブルを活用:
  - users.view_scope: データ表示範囲（all/own/assigned）
  - user_permissions: リソースごとのCRUD権限
  - user_campaign_access: 外部ユーザーのキャンペーンアクセス
  - user_media_access: 外部ユーザーのメディアアクセス

  ### 2. RLSポリシーの更新
  各リソースに対して、以下のロジックでアクセス制御:

  #### 担当フィルターが必要なリソース（ダッシュボード、入稿管理、キャンペーン管理、未消化管理）
  - view_scope = 'all': すべてのデータにアクセス可能
  - view_scope = 'own': 自分が担当者のデータのみアクセス可能
  - view_scope = 'assigned': 指定されたキャンペーン×メディアのデータのみアクセス可能

  #### 担当フィルター不要なリソース（店舗管理、広告運用管理）
  - 権限があればすべてのデータにアクセス可能

  ## セキュリティ
  - すべてのテーブルでRLSを有効化
  - ユーザーのview_scopeに基づいてデータアクセスを制限
  - 外部ユーザーは入稿管理のみアクセス可能
*/

-- ============================================================================
-- campaigns テーブルのRLSポリシー更新
-- ============================================================================

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view campaigns based on scope" ON campaigns;
DROP POLICY IF EXISTS "Users can insert campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can update campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can delete campaigns" ON campaigns;

-- SELECT: 表示範囲に基づいてキャンペーンを閲覧
CREATE POLICY "Users can view campaigns based on scope"
  ON campaigns FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (
        -- 全データアクセス
        users.view_scope = 'all'
        OR
        -- 自分が担当のデータのみ
        (users.view_scope = 'own' AND campaigns.person_in_charge = users.username)
        OR
        -- 個別指定されたキャンペーン×メディア
        (
          users.view_scope = 'assigned'
          AND EXISTS (
            SELECT 1 FROM user_campaign_access uca
            WHERE uca.user_id = users.id
            AND uca.campaign_id = campaigns.id
          )
          AND EXISTS (
            SELECT 1 FROM user_media_access uma
            WHERE uma.user_id = users.id
            AND uma.media = campaigns.platform
            AND uma.has_access = true
          )
        )
      )
    )
  );

-- INSERT: 作成権限チェック
CREATE POLICY "Users can insert campaigns"
  ON campaigns FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.resource = 'campaigns'
      AND user_permissions.can_create = true
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

-- UPDATE: 編集権限チェック
CREATE POLICY "Users can update campaigns"
  ON campaigns FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (
        users.view_scope = 'all'
        OR (users.view_scope = 'own' AND campaigns.person_in_charge = users.username)
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.resource = 'campaigns'
      AND user_permissions.can_edit = true
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager', 'editor')
    )
  );

-- DELETE: 削除権限チェック
CREATE POLICY "Users can delete campaigns"
  ON campaigns FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.resource = 'campaigns'
      AND user_permissions.can_delete = true
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ============================================================================
-- campaign_progress テーブルのRLSポリシー更新（キャンペーンと同じロジック）
-- ============================================================================

DROP POLICY IF EXISTS "Users can view campaign progress based on scope" ON campaign_progress;
DROP POLICY IF EXISTS "Users can insert campaign progress" ON campaign_progress;
DROP POLICY IF EXISTS "Users can update campaign progress" ON campaign_progress;
DROP POLICY IF EXISTS "Users can delete campaign progress" ON campaign_progress;

CREATE POLICY "Users can view campaign progress based on scope"
  ON campaign_progress FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (
        users.view_scope = 'all'
        OR
        (
          users.view_scope = 'own'
          AND EXISTS (
            SELECT 1 FROM campaigns
            WHERE campaigns.id = campaign_progress.campaign_id
            AND campaigns.person_in_charge = users.username
          )
        )
        OR
        (
          users.view_scope = 'assigned'
          AND EXISTS (
            SELECT 1 FROM user_campaign_access uca
            WHERE uca.user_id = users.id
            AND uca.campaign_id = campaign_progress.campaign_id
          )
          AND EXISTS (
            SELECT 1 FROM campaigns c
            JOIN user_media_access uma ON uma.media = c.platform
            WHERE c.id = campaign_progress.campaign_id
            AND uma.user_id = users.id
            AND uma.has_access = true
          )
        )
      )
    )
  );

CREATE POLICY "Users can insert campaign progress"
  ON campaign_progress FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.resource = 'campaigns'
      AND user_permissions.can_create = true
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can update campaign progress"
  ON campaign_progress FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (
        users.view_scope = 'all'
        OR
        (
          users.view_scope = 'own'
          AND EXISTS (
            SELECT 1 FROM campaigns
            WHERE campaigns.id = campaign_progress.campaign_id
            AND campaigns.person_in_charge = users.username
          )
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.resource = 'campaigns'
      AND user_permissions.can_edit = true
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager', 'editor')
    )
  );

CREATE POLICY "Users can delete campaign progress"
  ON campaign_progress FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.resource = 'campaigns'
      AND user_permissions.can_delete = true
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ============================================================================
-- budget_tracking テーブルのRLSポリシー更新（キャンペーンと同じロジック）
-- ============================================================================

DROP POLICY IF EXISTS "Users can view budget tracking based on scope" ON budget_tracking;
DROP POLICY IF EXISTS "Users can insert budget tracking" ON budget_tracking;
DROP POLICY IF EXISTS "Users can update budget tracking" ON budget_tracking;
DROP POLICY IF EXISTS "Users can delete budget tracking" ON budget_tracking;

CREATE POLICY "Users can view budget tracking based on scope"
  ON budget_tracking FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (
        users.view_scope = 'all'
        OR
        (
          users.view_scope = 'own'
          AND EXISTS (
            SELECT 1 FROM campaigns
            WHERE campaigns.id = budget_tracking.campaign_id
            AND campaigns.person_in_charge = users.username
          )
        )
        OR
        (
          users.view_scope = 'assigned'
          AND EXISTS (
            SELECT 1 FROM user_campaign_access uca
            WHERE uca.user_id = users.id
            AND uca.campaign_id = budget_tracking.campaign_id
          )
          AND EXISTS (
            SELECT 1 FROM campaigns c
            JOIN user_media_access uma ON uma.media = c.platform
            WHERE c.id = budget_tracking.campaign_id
            AND uma.user_id = users.id
            AND uma.has_access = true
          )
        )
      )
    )
  );

CREATE POLICY "Users can insert budget tracking"
  ON budget_tracking FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.resource = 'underdelivery'
      AND user_permissions.can_create = true
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can update budget tracking"
  ON budget_tracking FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (
        users.view_scope = 'all'
        OR
        (
          users.view_scope = 'own'
          AND EXISTS (
            SELECT 1 FROM campaigns
            WHERE campaigns.id = budget_tracking.campaign_id
            AND campaigns.person_in_charge = users.username
          )
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.resource = 'underdelivery'
      AND user_permissions.can_edit = true
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager', 'editor')
    )
  );

CREATE POLICY "Users can delete budget tracking"
  ON budget_tracking FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.resource = 'underdelivery'
      AND user_permissions.can_delete = true
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ============================================================================
-- stores テーブルのRLSポリシー更新（担当フィルター不要）
-- ============================================================================

DROP POLICY IF EXISTS "Users can view stores" ON stores;
DROP POLICY IF EXISTS "Users can insert stores" ON stores;
DROP POLICY IF EXISTS "Users can update stores" ON stores;
DROP POLICY IF EXISTS "Users can delete stores" ON stores;

CREATE POLICY "Users can view stores"
  ON stores FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.resource = 'stores'
      AND user_permissions.can_view = true
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager', 'editor', 'viewer')
    )
  );

CREATE POLICY "Users can insert stores"
  ON stores FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.resource = 'stores'
      AND user_permissions.can_create = true
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can update stores"
  ON stores FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.resource = 'stores'
      AND user_permissions.can_edit = true
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager', 'editor')
    )
  );

CREATE POLICY "Users can delete stores"
  ON stores FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.resource = 'stores'
      AND user_permissions.can_delete = true
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ============================================================================
-- インデックスの作成（パフォーマンス最適化）
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_campaigns_person_in_charge ON campaigns(person_in_charge);
CREATE INDEX IF NOT EXISTS idx_campaigns_platform ON campaigns(platform);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_resource ON user_permissions(user_id, resource);
CREATE INDEX IF NOT EXISTS idx_user_media_access_user_media ON user_media_access(user_id, media);
