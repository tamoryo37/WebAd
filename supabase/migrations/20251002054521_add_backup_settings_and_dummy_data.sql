/*
  # Add Backup Settings and Dummy Data Support

  ## New Tables
  
  ### backup_settings
  - `id` (uuid, primary key) - Unique identifier
  - `auto_backup_enabled` (boolean) - Whether auto-backup is enabled
  - `backup_frequency` (text) - Frequency: daily, weekly, monthly
  - `backup_time` (text) - Time to run backup (HH:MM format)
  - `retention_days` (integer) - Number of days to retain backups
  - `last_backup_date` (timestamptz) - Last backup execution date
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Update timestamp
  
  ### dummy_data_sets
  - `id` (uuid, primary key) - Unique identifier
  - `set_name` (text) - Name of the dummy data set
  - `description` (text) - Description of the data set
  - `data_content` (jsonb) - The dummy data content
  - `record_counts` (jsonb) - Count of records per table
  - `created_at` (timestamptz) - Creation timestamp
  
  ## Security
  - Enable RLS on both tables
  - Add policies for anonymous access (for testing)
  
  ## Initial Data
  - Insert default backup settings
  - Insert sample dummy data sets
*/

-- Create backup_settings table
CREATE TABLE IF NOT EXISTS backup_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auto_backup_enabled boolean DEFAULT false,
  backup_frequency text DEFAULT 'daily',
  backup_time text DEFAULT '02:00',
  retention_days integer DEFAULT 30,
  last_backup_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create dummy_data_sets table
CREATE TABLE IF NOT EXISTS dummy_data_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  set_name text NOT NULL,
  description text,
  data_content jsonb NOT NULL,
  record_counts jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE backup_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE dummy_data_sets ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access
CREATE POLICY "Allow anonymous access to backup_settings"
  ON backup_settings FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous access to dummy_data_sets"
  ON dummy_data_sets FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Insert default backup settings (only if table is empty)
INSERT INTO backup_settings (auto_backup_enabled, backup_frequency, backup_time, retention_days)
SELECT false, 'daily', '02:00', 30
WHERE NOT EXISTS (SELECT 1 FROM backup_settings);

-- Insert sample dummy data sets
INSERT INTO dummy_data_sets (set_name, description, data_content, record_counts)
VALUES
  (
    'テストデータセット1（小規模）',
    '3店舗、5キャンペーンの小規模テストデータ',
    '{
      "stores": [
        {"store_name": "テスト店舗A", "postal_code": "100-0001", "address": "東京都千代田区千代田1-1", "phone": "03-1234-5678", "google_account": "test-a@example.com"},
        {"store_name": "テスト店舗B", "postal_code": "530-0001", "address": "大阪府大阪市北区梅田1-1", "phone": "06-1234-5678", "google_account": "test-b@example.com"},
        {"store_name": "テスト店舗C", "postal_code": "460-0001", "address": "愛知県名古屋市中区栄1-1", "phone": "052-1234-5678", "google_account": "test-c@example.com"}
      ],
      "campaigns": [
        {"campaign_number": "TEST001", "platform": "Google", "account_name": "テストアカウントA", "campaign_name": "春のキャンペーン", "start_date": "2025-04-01", "end_date": "2025-04-30", "total_budget": 500000, "set_total_budget": 480000, "set_daily_budget": 16000, "delivery_days": 30},
        {"campaign_number": "TEST002", "platform": "LINE", "account_name": "テストアカウントB", "campaign_name": "新規顧客獲得CP", "start_date": "2025-05-01", "end_date": "2025-05-31", "total_budget": 300000, "set_total_budget": 290000, "set_daily_budget": 9667, "delivery_days": 31},
        {"campaign_number": "TEST003", "platform": "META", "account_name": "テストアカウントC", "campaign_name": "リターゲティングCP", "start_date": "2025-06-01", "end_date": "2025-06-15", "total_budget": 200000, "set_total_budget": 195000, "set_daily_budget": 13000, "delivery_days": 15},
        {"campaign_number": "TEST004", "platform": "X", "account_name": "テストアカウントA", "campaign_name": "認知拡大キャンペーン", "start_date": "2025-07-01", "end_date": "2025-07-31", "total_budget": 400000, "set_total_budget": 390000, "set_daily_budget": 13000, "delivery_days": 31},
        {"campaign_number": "TEST005", "platform": "YDA", "account_name": "テストアカウントB", "campaign_name": "夏季セールCP", "start_date": "2025-08-01", "end_date": "2025-08-31", "total_budget": 600000, "set_total_budget": 580000, "set_daily_budget": 19333, "delivery_days": 31}
      ]
    }',
    '{"stores": 3, "campaigns": 5}'
  ),
  (
    'テストデータセット2（中規模）',
    '5店舗、10キャンペーンの中規模テストデータ',
    '{
      "stores": [
        {"store_name": "サンプル店舗1", "postal_code": "150-0001", "address": "東京都渋谷区神宮前1-1", "phone": "03-2345-6789", "google_account": "sample1@example.com", "meta_account": "sample1_meta"},
        {"store_name": "サンプル店舗2", "postal_code": "810-0001", "address": "福岡県福岡市中央区天神1-1", "phone": "092-1234-5678", "google_account": "sample2@example.com", "meta_account": "sample2_meta"},
        {"store_name": "サンプル店舗3", "postal_code": "060-0001", "address": "北海道札幌市中央区北1条西1", "phone": "011-1234-5678", "google_account": "sample3@example.com", "line_ad_account_1": "sample3_line"},
        {"store_name": "サンプル店舗4", "postal_code": "980-0001", "address": "宮城県仙台市青葉区中央1-1", "phone": "022-1234-5678", "yahoo_account": "sample4@example.com", "x_ad_account_1": "sample4_x"},
        {"store_name": "サンプル店舗5", "postal_code": "730-0001", "address": "広島県広島市中区大手町1-1", "phone": "082-1234-5678", "google_account": "sample5@example.com", "meta_account": "sample5_meta"}
      ],
      "campaigns": [
        {"campaign_number": "CP001", "platform": "GDN", "account_name": "サンプルGDNアカウント", "campaign_name": "ディスプレイ広告CP", "start_date": "2025-04-01", "end_date": "2025-04-30", "total_budget": 800000, "set_total_budget": 780000, "set_daily_budget": 26000, "delivery_days": 30, "setter": "田中太郎"},
        {"campaign_number": "CP002", "platform": "GSN", "account_name": "サンプルGSNアカウント", "campaign_name": "検索広告CP", "start_date": "2025-04-01", "end_date": "2025-04-30", "total_budget": 1000000, "set_total_budget": 980000, "set_daily_budget": 32667, "delivery_days": 30, "setter": "佐藤花子"},
        {"campaign_number": "CP003", "platform": "LINE", "account_name": "サンプルLINEアカウント1", "campaign_name": "LINE配信CP第1弾", "start_date": "2025-05-01", "end_date": "2025-05-31", "total_budget": 500000, "set_total_budget": 490000, "set_daily_budget": 16333, "delivery_days": 31, "setter": "鈴木一郎"},
        {"campaign_number": "CP004", "platform": "META", "account_name": "サンプルMETAアカウント", "campaign_name": "Instagram・Facebook連携CP", "start_date": "2025-05-15", "end_date": "2025-06-14", "total_budget": 600000, "set_total_budget": 590000, "set_daily_budget": 19333, "delivery_days": 31, "setter": "田中太郎"},
        {"campaign_number": "CP005", "platform": "X", "account_name": "サンプルXアカウント", "campaign_name": "X広告キャンペーン", "start_date": "2025-06-01", "end_date": "2025-06-30", "total_budget": 450000, "set_total_budget": 440000, "set_daily_budget": 14667, "delivery_days": 30, "setter": "佐藤花子"},
        {"campaign_number": "CP006", "platform": "YDA", "account_name": "サンプルYDAアカウント", "campaign_name": "Yahooディスプレイ広告", "start_date": "2025-06-15", "end_date": "2025-07-14", "total_budget": 700000, "set_total_budget": 685000, "set_daily_budget": 22833, "delivery_days": 30, "setter": "鈴木一郎"},
        {"campaign_number": "CP007", "platform": "LINE", "account_name": "サンプルLINEアカウント2", "campaign_name": "LINE配信CP第2弾", "start_date": "2025-07-01", "end_date": "2025-07-31", "total_budget": 550000, "set_total_budget": 540000, "set_daily_budget": 18000, "delivery_days": 31, "setter": "山田三郎"},
        {"campaign_number": "CP008", "platform": "GVN", "account_name": "サンプルGVNアカウント", "campaign_name": "動画広告キャンペーン", "start_date": "2025-08-01", "end_date": "2025-08-31", "total_budget": 900000, "set_total_budget": 880000, "set_daily_budget": 29333, "delivery_days": 31, "setter": "田中太郎"},
        {"campaign_number": "CP009", "platform": "META", "account_name": "サンプルMETAアカウント2", "campaign_name": "リード獲得CP", "start_date": "2025-09-01", "end_date": "2025-09-30", "total_budget": 750000, "set_total_budget": 735000, "set_daily_budget": 24500, "delivery_days": 30, "setter": "佐藤花子"},
        {"campaign_number": "CP010", "platform": "Logicad", "account_name": "サンプルLogicadアカウント", "campaign_name": "DSP配信CP", "start_date": "2025-10-01", "end_date": "2025-10-31", "total_budget": 850000, "set_total_budget": 830000, "set_daily_budget": 27667, "delivery_days": 31, "setter": "鈴木一郎"}
      ]
    }',
    '{"stores": 5, "campaigns": 10}'
  );
