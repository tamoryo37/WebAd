/*
  # ChatWork通知設定機能

  1. 新しいテーブル
    - `chatwork_notification_settings`
      - `id` (uuid, primary key)
      - `chatwork_room_id` (text) - ChatWorkのルームID
      - `chatwork_api_token` (text) - ChatWork APIトークン
      - `is_enabled` (boolean) - 通知機能の有効/無効
      - 各種通知タイミング設定（boolean）
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. 通知タイミング
    - クリエイティブ関連
      - `notify_creative_order` - 発注時
      - `notify_creative_order_completed` - 発注済み時
      - `notify_creative_collection` - 回収時
      - `notify_creative_person_in_charge` - 担当者決定時
      - `notify_creative_submission` - 入稿待ち時
    - 進捗関連
      - `notify_progress_pickup` - 入稿待ち時
      - `notify_progress_chk_wait` - CHK待ち時
      - `notify_progress_configuration_wait` - 設定待ち時
      - `notify_progress_delivery_start` - 配信中時
      - `notify_progress_completion` - 完了時
    - CHK関連
      - `notify_chk_day_before_amount` - 前日までの消化金額
      - `notify_chk_day_before_target` - 前日までの消化目標
      - `notify_chk_day_before_underdelivery` - 前日までの未達
      - `notify_chk_allocated_amount` - 配信金額
  
  3. セキュリティ
    - RLSを有効化
    - 認証済みユーザーのみアクセス可能
*/

CREATE TABLE IF NOT EXISTS chatwork_notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatwork_room_id text DEFAULT '',
  chatwork_api_token text DEFAULT '',
  is_enabled boolean DEFAULT false,
  
  notify_creative_order boolean DEFAULT false,
  notify_creative_order_completed boolean DEFAULT false,
  notify_creative_collection boolean DEFAULT false,
  notify_creative_person_in_charge boolean DEFAULT false,
  notify_creative_submission boolean DEFAULT false,
  
  notify_progress_pickup boolean DEFAULT false,
  notify_progress_chk_wait boolean DEFAULT false,
  notify_progress_configuration_wait boolean DEFAULT false,
  notify_progress_delivery_start boolean DEFAULT false,
  notify_progress_completion boolean DEFAULT false,
  
  notify_chk_day_before_amount boolean DEFAULT false,
  notify_chk_day_before_target boolean DEFAULT false,
  notify_chk_day_before_underdelivery boolean DEFAULT false,
  notify_chk_allocated_amount boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE chatwork_notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view notification settings"
  ON chatwork_notification_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert notification settings"
  ON chatwork_notification_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update notification settings"
  ON chatwork_notification_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete notification settings"
  ON chatwork_notification_settings FOR DELETE
  TO authenticated
  USING (true);

INSERT INTO chatwork_notification_settings (id) 
VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;
