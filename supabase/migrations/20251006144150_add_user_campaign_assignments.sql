/*
  # ユーザーキャンペーン割り当て機能

  1. 新しいテーブル
    - `user_campaign_assignments`
      - `id` (uuid, primary key)
      - `user_email` (text) - ユーザーのメールアドレス
      - `assigned_person_in_charge` (text[]) - 割り当てられた担当者名の配列
      - `can_view_all` (boolean) - 全てのキャンペーンを閲覧可能か
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. セキュリティ
    - RLSを有効化
    - 認証済みユーザーが自分のレコードを閲覧・更新可能
*/

CREATE TABLE IF NOT EXISTS user_campaign_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text UNIQUE NOT NULL,
  assigned_person_in_charge text[] DEFAULT '{}',
  can_view_all boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_campaign_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assignments"
  ON user_campaign_assignments FOR SELECT
  TO authenticated
  USING (auth.jwt()->>'email' = user_email);

CREATE POLICY "Users can update own assignments"
  ON user_campaign_assignments FOR UPDATE
  TO authenticated
  USING (auth.jwt()->>'email' = user_email)
  WITH CHECK (auth.jwt()->>'email' = user_email);

CREATE POLICY "Users can insert own assignments"
  ON user_campaign_assignments FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt()->>'email' = user_email);
