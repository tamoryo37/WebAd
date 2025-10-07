/*
  # RLSポリシーの簡略化（最終修正）

  ## 問題
    budget_trackingとcampaign_progressに複数のSELECTポリシーがあり、
    外部ユーザーポリシーの評価時にusersテーブルへのアクセスが発生

  ## 解決策
    すべてのSELECTポリシーを1つに統合し、シンプルな条件に変更
*/

-- budget_trackingのSELECTポリシーをすべて削除して1つに統合
DROP POLICY IF EXISTS "Users can view budget tracking in their tenant" ON budget_tracking;
DROP POLICY IF EXISTS "External users can view budget for assigned campaigns" ON budget_tracking;

CREATE POLICY "Allow authenticated users to view budget tracking"
  ON budget_tracking FOR SELECT
  TO authenticated
  USING (
    tenant_id = get_user_tenant_id()
  );

-- campaign_progressのSELECTポリシーをすべて削除して1つに統合
DROP POLICY IF EXISTS "Users can view campaign progress in their tenant" ON campaign_progress;
DROP POLICY IF EXISTS "External users can view progress for assigned campaigns" ON campaign_progress;

CREATE POLICY "Allow authenticated users to view campaign progress"
  ON campaign_progress FOR SELECT
  TO authenticated
  USING (
    tenant_id = get_user_tenant_id()
  );
