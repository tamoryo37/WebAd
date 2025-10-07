/*
  # メディアマスターテーブルの作成

  ## 新規テーブル
    - `media_platforms`
      - `id` (uuid, primary key)
      - `tenant_id` (uuid, foreign key to tenants)
      - `name` (text) - メディア名
      - `code` (text) - メディアコード（LINE, YDA, YSA, GVN, GDN, GSN, Logicad, META, Xなど）
      - `description` (text) - 説明
      - `is_active` (boolean) - アクティブ状態
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `created_by` (uuid, foreign key to auth.users)

  ## セキュリティ
    - RLSを有効化
    - テナント内のユーザーが閲覧可能
    - admin/staffが作成・更新・削除可能

  ## インデックス
    - tenant_id
    - code（一意制約付き）
*/

CREATE TABLE IF NOT EXISTS media_platforms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  code text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(tenant_id, code)
);

ALTER TABLE media_platforms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view media platforms in their tenant"
  ON media_platforms FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT u.tenant_id FROM users u
      WHERE u.id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert media platforms in their tenant"
  ON media_platforms FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT u.tenant_id FROM users u
      WHERE u.id = auth.uid()
        AND u.role IN ('admin', 'staff', 'system_admin')
    )
  );

CREATE POLICY "Admins can update media platforms in their tenant"
  ON media_platforms FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT u.tenant_id FROM users u
      WHERE u.id = auth.uid()
        AND u.role IN ('admin', 'staff', 'system_admin')
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT u.tenant_id FROM users u
      WHERE u.id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete media platforms in their tenant"
  ON media_platforms FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT u.tenant_id FROM users u
      WHERE u.id = auth.uid()
        AND u.role IN ('admin', 'system_admin')
    )
  );

CREATE INDEX IF NOT EXISTS idx_media_platforms_tenant_id ON media_platforms(tenant_id);
CREATE INDEX IF NOT EXISTS idx_media_platforms_code ON media_platforms(code);
CREATE INDEX IF NOT EXISTS idx_media_platforms_is_active ON media_platforms(is_active);

-- 既存のメディアデータをインポート
INSERT INTO media_platforms (tenant_id, name, code, is_active, created_at)
SELECT 
  '00000000-0000-0000-0000-000000000001' as tenant_id,
  media as name,
  media as code,
  true as is_active,
  now() as created_at
FROM (
  SELECT DISTINCT unnest(ARRAY['LINE', 'YDA', 'YSA', 'GVN', 'GDN', 'GSN', 'Logicad', 'META', 'X']) as media
) m
WHERE NOT EXISTS (
  SELECT 1 FROM media_platforms mp 
  WHERE mp.tenant_id = '00000000-0000-0000-0000-000000000001' 
    AND mp.code = m.media
);
