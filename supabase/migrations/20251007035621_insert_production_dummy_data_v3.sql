/*
  # 本番環境用ダミーデータの追加 v3

  ## 内容
    1. 既存データのcreated_by更新
    2. campaign_progress、budget_trackingの不足データ補完
    3. campaign_alerts、store_imagesのサンプルデータ追加
    4. 設定データの追加
*/

-- 既存campaignsのcreated_byを最初の管理者ユーザーに設定
UPDATE campaigns 
SET created_by = (SELECT id FROM users WHERE role = 'admin' ORDER BY created_at LIMIT 1)
WHERE created_by IS NULL;

-- 既存campaignsのmedia_typeを設定（platformから推測）
UPDATE campaigns
SET media_type = CASE
  WHEN platform IN ('META', 'Instagram', 'Facebook') THEN 'meta'
  WHEN platform IN ('Google', 'GDN', 'GSN', 'GVN') THEN 'google'
  WHEN platform IN ('LINE') THEN 'line'
  WHEN platform IN ('Yahoo', 'YDA', 'YSA') THEN 'yahoo'
  ELSE 'meta'
END
WHERE media_type IS NULL OR media_type = '';

-- 既存storesのcreated_byを最初の管理者ユーザーに設定
UPDATE stores 
SET created_by = (SELECT id FROM users WHERE role = 'admin' ORDER BY created_at LIMIT 1)
WHERE created_by IS NULL;

-- 既存campaign_progressのcreated_byを設定
UPDATE campaign_progress 
SET created_by = (SELECT id FROM users WHERE role = 'admin' ORDER BY created_at LIMIT 1)
WHERE created_by IS NULL;

-- 既存budget_trackingのcreated_byを設定
UPDATE budget_tracking 
SET created_by = (SELECT id FROM users WHERE role = 'admin' ORDER BY created_at LIMIT 1)
WHERE created_by IS NULL;

-- 既存store_imagesのcreated_byを設定
UPDATE store_images 
SET created_by = (SELECT id FROM users WHERE role = 'admin' ORDER BY created_at LIMIT 1)
WHERE created_by IS NULL;

-- 既存store_monthly_documentsのcreated_byを設定
UPDATE store_monthly_documents 
SET created_by = (SELECT id FROM users WHERE role = 'admin' ORDER BY created_at LIMIT 1)
WHERE created_by IS NULL;

-- 不足しているキャンペーンのprogressデータを作成
INSERT INTO campaign_progress (id, campaign_id, tenant_id, created_by, has_proposal, has_quote, creative_status, progress_status, check_status)
SELECT 
  gen_random_uuid(),
  c.id,
  c.tenant_id,
  c.created_by,
  true,
  true,
  CASE 
    WHEN c.status = '配信中' THEN '完了'
    WHEN c.status = '完了' THEN '完了'
    ELSE '制作中'
  END,
  COALESCE(c.status, '企画中'),
  '確認済み'
FROM campaigns c
WHERE NOT EXISTS (
  SELECT 1 FROM campaign_progress cp WHERE cp.campaign_id = c.id
)
AND c.tenant_id IS NOT NULL
AND c.created_by IS NOT NULL;

-- budget_trackingのunder_deliveryを計算
UPDATE budget_tracking
SET under_delivery = GREATEST(0, target_amount - consumed_amount)
WHERE (under_delivery IS NULL OR under_delivery = 0) AND target_amount > 0;

-- campaign_alertsのサンプルデータ（未消化アラート）
INSERT INTO campaign_alerts (id, campaign_id, tenant_id, alert_type, alert_date, days_before, is_resolved)
SELECT 
  gen_random_uuid(),
  c.id,
  c.tenant_id,
  '未消化アラート',
  CURRENT_DATE,
  5,
  false
FROM campaigns c
WHERE c.status IN ('配信中', '進行中')
  AND EXISTS (
    SELECT 1 FROM budget_tracking bt 
    WHERE bt.campaign_id = c.id 
      AND bt.under_delivery > 50000
  )
  AND NOT EXISTS (
    SELECT 1 FROM campaign_alerts ca WHERE ca.campaign_id = c.id
  )
LIMIT 8;

-- 配信終了間近アラート
INSERT INTO campaign_alerts (id, campaign_id, tenant_id, alert_type, alert_date, days_before, is_resolved)
SELECT 
  gen_random_uuid(),
  c.id,
  c.tenant_id,
  '配信終了間近',
  CURRENT_DATE,
  3,
  false
FROM campaigns c
WHERE c.end_date IS NOT NULL
  AND c.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
  AND NOT EXISTS (
    SELECT 1 FROM campaign_alerts ca 
    WHERE ca.campaign_id = c.id AND ca.alert_type = '配信終了間近'
  )
LIMIT 5;

-- store_imagesのサンプルデータ
INSERT INTO store_images (id, store_id, tenant_id, created_by, image_type, month, image_url, file_name, file_size, mime_type)
SELECT 
  gen_random_uuid(),
  s.id,
  s.tenant_id,
  s.created_by,
  '外観',
  DATE_TRUNC('month', CURRENT_DATE),
  'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=800',
  s.store_name || '_外観.jpg',
  1024000,
  'image/jpeg'
FROM stores s
WHERE s.tenant_id IS NOT NULL
  AND s.created_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM store_images si WHERE si.store_id = s.id AND si.image_type = '外観'
  );

-- 内観画像
INSERT INTO store_images (id, store_id, tenant_id, created_by, image_type, month, image_url, file_name, file_size, mime_type)
SELECT 
  gen_random_uuid(),
  s.id,
  s.tenant_id,
  s.created_by,
  '内観',
  DATE_TRUNC('month', CURRENT_DATE),
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800',
  s.store_name || '_内観.jpg',
  980000,
  'image/jpeg'
FROM stores s
WHERE s.tenant_id IS NOT NULL
  AND s.created_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM store_images si WHERE si.store_id = s.id AND si.image_type = '内観'
  )
LIMIT 5;

-- chatwork_notification_settingsのデフォルト設定
INSERT INTO chatwork_notification_settings (
  id, tenant_id, is_enabled, 
  notify_creative_order, notify_creative_order_completed,
  notify_creative_collection, notify_creative_person_in_charge,
  notify_creative_submission, notify_progress_pickup,
  notify_progress_chk_wait, notify_progress_configuration_wait,
  notify_progress_delivery_start, notify_progress_completion,
  notify_chk_day_before_amount, notify_chk_day_before_target,
  notify_chk_day_before_underdelivery, notify_chk_allocated_amount
)
SELECT
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  false,
  true, true, true, true, true, true,
  true, true, true, true, true, true, true, true
WHERE NOT EXISTS (
  SELECT 1 FROM chatwork_notification_settings 
  WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
);

-- backup_settingsのデフォルト設定
INSERT INTO backup_settings (
  id, tenant_id, auto_backup_enabled, backup_frequency,
  backup_time, retention_days, last_backup_date
)
SELECT
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  true,
  'daily',
  '02:00',
  30,
  CURRENT_DATE - INTERVAL '1 day'
WHERE NOT EXISTS (
  SELECT 1 FROM backup_settings 
  WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
);

-- monthly_dashboardのサンプルデータ
INSERT INTO monthly_dashboard (
  id, store_id, tenant_id, month, has_quote, has_proposal,
  campaign_count, consumed_budget, total_budget, progress_rate,
  person_in_charge, unsaved_count, incomplete_count
)
SELECT 
  gen_random_uuid(),
  s.id,
  s.tenant_id,
  DATE_TRUNC('month', CURRENT_DATE),
  true,
  true,
  (SELECT COUNT(*) FROM campaigns WHERE store_id = s.id),
  (SELECT COALESCE(SUM(bt.consumed_amount), 0) FROM budget_tracking bt 
   JOIN campaigns c ON c.id = bt.campaign_id WHERE c.store_id = s.id),
  (SELECT COALESCE(SUM(bt.target_amount), 0) FROM budget_tracking bt 
   JOIN campaigns c ON c.id = bt.campaign_id WHERE c.store_id = s.id),
  75.0 + random() * 20.0,
  '田中太郎',
  0,
  0
FROM stores s
WHERE s.tenant_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM monthly_dashboard md 
    WHERE md.store_id = s.id 
      AND md.month = DATE_TRUNC('month', CURRENT_DATE)
  );

-- operation_historyのサンプルデータ
INSERT INTO operation_history (id, tenant_id, operation_type, table_name, record_id, operation_data, operation_date)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  'INSERT',
  'campaigns',
  c.id::text,
  jsonb_build_object(
    'campaign_name', c.campaign_name,
    'store_id', c.store_id,
    'status', c.status,
    'platform', c.platform
  ),
  c.created_at
FROM campaigns c
WHERE NOT EXISTS (
  SELECT 1 FROM operation_history oh 
  WHERE oh.table_name = 'campaigns' AND oh.record_id = c.id::text
)
LIMIT 15;

-- UPDATE操作のログ
INSERT INTO operation_history (id, tenant_id, operation_type, table_name, record_id, operation_data, operation_date)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  'UPDATE',
  'campaigns',
  c.id::text,
  jsonb_build_object(
    'campaign_name', c.campaign_name,
    'status', c.status,
    'updated_field', 'status'
  ),
  c.updated_at
FROM campaigns c
WHERE c.updated_at > c.created_at
LIMIT 10;
