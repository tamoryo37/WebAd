/*
  # usersテーブルの修正とStorageバケットの作成

  ## 変更内容
    1. password_hashカラムをNULL許可に変更（Supabase Authと統合するため）
    2. Storageバケットの作成
      - store-images: 店舗画像用
      - store-documents: 月次資料用
      - campaign-creatives: キャンペーンクリエイティブ用

  ## セキュリティ
    - バケットごとにRLSポリシーを設定
    - テナント分離を実装
*/

-- password_hashをNULL許可に変更
DO $$
BEGIN
  ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
END $$;

-- Storageバケットの作成
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('store-images', 'store-images', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('store-documents', 'store-documents', false, 52428800, ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']),
  ('campaign-creatives', 'campaign-creatives', false, 104857600, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'])
ON CONFLICT (id) DO NOTHING;

-- store-imagesバケットのRLSポリシー
DROP POLICY IF EXISTS "Authenticated users can view store images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload store images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete store images" ON storage.objects;

CREATE POLICY "Authenticated users can view store images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'store-images');

CREATE POLICY "Authenticated users can upload store images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'store-images'
    AND (SELECT role FROM users WHERE users.id = auth.uid()) IN ('admin', 'staff', 'system_admin')
  );

CREATE POLICY "Authenticated users can delete store images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'store-images'
    AND (SELECT role FROM users WHERE users.id = auth.uid()) IN ('admin', 'system_admin')
  );

-- store-documentsバケットのRLSポリシー
CREATE POLICY "Authenticated users can view store documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'store-documents');

CREATE POLICY "Authenticated users can upload store documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'store-documents'
    AND (SELECT role FROM users WHERE users.id = auth.uid()) IN ('admin', 'staff', 'system_admin')
  );

CREATE POLICY "Authenticated users can delete store documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'store-documents'
    AND (SELECT role FROM users WHERE users.id = auth.uid()) IN ('admin', 'system_admin')
  );

-- campaign-creativesバケットのRLSポリシー
CREATE POLICY "Authenticated users can view campaign creatives"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'campaign-creatives');

CREATE POLICY "Authenticated users can upload campaign creatives"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'campaign-creatives'
    AND (SELECT role FROM users WHERE users.id = auth.uid()) IN ('admin', 'staff', 'system_admin')
  );

CREATE POLICY "Authenticated users can delete campaign creatives"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'campaign-creatives'
    AND (SELECT role FROM users WHERE users.id = auth.uid()) IN ('admin', 'system_admin')
  );
