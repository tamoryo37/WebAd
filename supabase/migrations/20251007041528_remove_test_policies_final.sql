/*
  # テスト用ポリシーの完全削除

  "Allow all authenticated users full access"ポリシーを削除
*/

-- campaignsとstoresのテスト用ポリシーを削除
DROP POLICY IF EXISTS "Allow all authenticated users full access to campaigns" ON campaigns;
DROP POLICY IF EXISTS "Allow all authenticated users full access to stores" ON stores;
DROP POLICY IF EXISTS "Allow all authenticated users full access to budget_tracking" ON budget_tracking;
DROP POLICY IF EXISTS "Allow all authenticated users full access to campaign_progress" ON campaign_progress;
DROP POLICY IF EXISTS "Allow all authenticated users full access to campaign_alerts" ON campaign_alerts;
DROP POLICY IF EXISTS "Allow all authenticated users full access to store_images" ON store_images;
DROP POLICY IF EXISTS "Allow all authenticated users full access to store_monthly_documents" ON store_monthly_documents;
