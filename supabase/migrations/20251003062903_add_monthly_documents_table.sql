/*
  # 月次ドキュメント管理機能の追加

  1. 新しいテーブル
    - `store_monthly_documents`
      - `id` (uuid, primary key)
      - `store_id` (uuid, foreign key to stores)
      - `year_month` (text, YYYY-MM形式)
      - `quote_url` (text, nullable) - 見積書URL
      - `proposal_url` (text, nullable) - 提案書URL
      - `report_url` (text, nullable) - レポートURL
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. 変更点
    - 店舗ごとに月単位でドキュメントを管理
    - 年月をキーとして複数月のドキュメントを保存可能
    - 既存のstoresテーブルのドキュメントURLフィールドは維持（後方互換性）

  3. セキュリティ
    - RLSを有効化
    - 認証済みユーザーは全てのドキュメントを閲覧・編集可能
    - 店舗IDと年月の組み合わせで一意性を保証

  4. インデックス
    - store_idと年月の複合インデックスで高速検索
*/

-- 月次ドキュメント管理テーブルの作成
CREATE TABLE IF NOT EXISTS store_monthly_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  year_month text NOT NULL,
  quote_url text,
  proposal_url text,
  report_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(store_id, year_month)
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_store_monthly_documents_store_id 
  ON store_monthly_documents(store_id);

CREATE INDEX IF NOT EXISTS idx_store_monthly_documents_year_month 
  ON store_monthly_documents(year_month);

CREATE INDEX IF NOT EXISTS idx_store_monthly_documents_store_year_month 
  ON store_monthly_documents(store_id, year_month);

-- RLSの有効化
ALTER TABLE store_monthly_documents ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーは全てのドキュメントを閲覧可能
CREATE POLICY "Authenticated users can view all monthly documents"
  ON store_monthly_documents
  FOR SELECT
  TO authenticated
  USING (true);

-- 認証済みユーザーは月次ドキュメントを挿入可能
CREATE POLICY "Authenticated users can insert monthly documents"
  ON store_monthly_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 認証済みユーザーは月次ドキュメントを更新可能
CREATE POLICY "Authenticated users can update monthly documents"
  ON store_monthly_documents
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 認証済みユーザーは月次ドキュメントを削除可能
CREATE POLICY "Authenticated users can delete monthly documents"
  ON store_monthly_documents
  FOR DELETE
  TO authenticated
  USING (true);

-- updated_atを自動更新するトリガー
CREATE OR REPLACE FUNCTION update_store_monthly_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_store_monthly_documents_updated_at_trigger 
  ON store_monthly_documents;

CREATE TRIGGER update_store_monthly_documents_updated_at_trigger
  BEFORE UPDATE ON store_monthly_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_store_monthly_documents_updated_at();
