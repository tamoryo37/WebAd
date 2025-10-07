/*
  # Add Store Images Table

  1. New Tables
    - `store_images`
      - `id` (uuid, primary key)
      - `store_id` (uuid, foreign key to stores)
      - `image_type` (text) - 月次報告、見積書、提案書など
      - `month` (date) - YYYY-MM形式で月を表す
      - `image_url` (text) - 画像のURL
      - `file_name` (text) - 元のファイル名
      - `file_size` (integer) - ファイルサイズ（バイト）
      - `mime_type` (text) - MIMEタイプ
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `store_images` table
    - Add policy for public access (since there's no auth in this system)
*/

CREATE TABLE IF NOT EXISTS store_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  image_type text NOT NULL,
  month date NOT NULL,
  image_url text NOT NULL,
  file_name text NOT NULL,
  file_size integer DEFAULT 0,
  mime_type text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE store_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view store images"
  ON store_images FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert store images"
  ON store_images FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update store images"
  ON store_images FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete store images"
  ON store_images FOR DELETE
  USING (true);

CREATE INDEX IF NOT EXISTS idx_store_images_store_id ON store_images(store_id);
CREATE INDEX IF NOT EXISTS idx_store_images_month ON store_images(month);
CREATE INDEX IF NOT EXISTS idx_store_images_type ON store_images(image_type);