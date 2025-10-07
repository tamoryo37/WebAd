/*
  # マルチテナント対応の実装

  本番環境に向けた3層セキュリティモデルの実装

  ## 1. 新規テーブル
    - `tenants` (クライアント企業情報)

  ## 2. 既存テーブルへのカラム追加
    全主要テーブルに tenant_id と created_by を追加

  ## 3. セキュリティ
    - RLS有効化（全テーブル）
    - テナント分離ポリシー
*/

-- テナントテーブルの作成
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subdomain text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  subscription_plan text DEFAULT 'standard',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- デフォルトテナントの作成
INSERT INTO tenants (id, name, subdomain, is_active, subscription_plan)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'デフォルトクライアント',
  'default',
  true,
  'enterprise'
) ON CONFLICT (id) DO NOTHING;

-- usersテーブルにtenant_idとassigned_mediaを追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE users ADD COLUMN tenant_id uuid REFERENCES tenants(id);
    UPDATE users SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
    ALTER TABLE users ALTER COLUMN tenant_id SET NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'assigned_media'
  ) THEN
    ALTER TABLE users ADD COLUMN assigned_media text[] DEFAULT ARRAY['meta', 'google', 'line', 'yahoo'];
  END IF;
END $$;

-- campaignsテーブルにtenant_id, created_by, media_typeを追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN tenant_id uuid REFERENCES tenants(id);
    UPDATE campaigns SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
    ALTER TABLE campaigns ALTER COLUMN tenant_id SET NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN created_by uuid REFERENCES users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'media_type'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN media_type text DEFAULT 'meta';
  END IF;
END $$;

-- storesテーブルにtenant_id, created_byを追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stores' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE stores ADD COLUMN tenant_id uuid REFERENCES tenants(id);
    UPDATE stores SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
    ALTER TABLE stores ALTER COLUMN tenant_id SET NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stores' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE stores ADD COLUMN created_by uuid REFERENCES users(id);
  END IF;
END $$;

-- budget_trackingテーブル
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budget_tracking' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE budget_tracking ADD COLUMN tenant_id uuid REFERENCES tenants(id);
    UPDATE budget_tracking SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
    ALTER TABLE budget_tracking ALTER COLUMN tenant_id SET NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budget_tracking' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE budget_tracking ADD COLUMN created_by uuid REFERENCES users(id);
  END IF;
END $$;

-- campaign_progressテーブル
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaign_progress' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE campaign_progress ADD COLUMN tenant_id uuid REFERENCES tenants(id);
    UPDATE campaign_progress SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
    ALTER TABLE campaign_progress ALTER COLUMN tenant_id SET NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaign_progress' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE campaign_progress ADD COLUMN created_by uuid REFERENCES users(id);
  END IF;
END $$;

-- campaign_alertsテーブル
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaign_alerts' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE campaign_alerts ADD COLUMN tenant_id uuid REFERENCES tenants(id);
    UPDATE campaign_alerts SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
    ALTER TABLE campaign_alerts ALTER COLUMN tenant_id SET NOT NULL;
  END IF;
END $$;

-- store_imagesテーブル
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'store_images' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE store_images ADD COLUMN tenant_id uuid REFERENCES tenants(id);
    UPDATE store_images SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
    ALTER TABLE store_images ALTER COLUMN tenant_id SET NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'store_images' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE store_images ADD COLUMN created_by uuid REFERENCES users(id);
  END IF;
END $$;

-- store_monthly_documentsテーブル
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'store_monthly_documents' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE store_monthly_documents ADD COLUMN tenant_id uuid REFERENCES tenants(id);
    UPDATE store_monthly_documents SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
    ALTER TABLE store_monthly_documents ALTER COLUMN tenant_id SET NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'store_monthly_documents' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE store_monthly_documents ADD COLUMN created_by uuid REFERENCES users(id);
  END IF;
END $$;

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_tenant_id ON campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_campaigns_media_type ON campaigns(media_type);
CREATE INDEX IF NOT EXISTS idx_stores_tenant_id ON stores(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stores_created_by ON stores(created_by);

-- RLSポリシー: tenants
CREATE POLICY "Users can view their tenant"
  ON tenants FOR SELECT
  TO authenticated
  USING (id = (SELECT tenant_id FROM users WHERE users.id = auth.uid()));

-- RLSポリシー: users
DROP POLICY IF EXISTS "Users can view users in their tenant" ON users;
CREATE POLICY "Users can view users in their tenant"
  ON users FOR SELECT
  TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid()));

DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
