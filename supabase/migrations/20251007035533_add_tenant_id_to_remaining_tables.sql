/*
  # 残りのテーブルにtenant_idを追加

  以下のテーブルにtenant_idを追加:
  - chatwork_notification_settings
  - backup_settings  
  - monthly_dashboard
  - operation_history
*/

-- chatwork_notification_settingsにtenant_idを追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chatwork_notification_settings' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE chatwork_notification_settings ADD COLUMN tenant_id uuid REFERENCES tenants(id);
    UPDATE chatwork_notification_settings SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
    ALTER TABLE chatwork_notification_settings ALTER COLUMN tenant_id SET NOT NULL;
  END IF;
END $$;

-- backup_settingsにtenant_idを追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'backup_settings' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE backup_settings ADD COLUMN tenant_id uuid REFERENCES tenants(id);
    UPDATE backup_settings SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
    ALTER TABLE backup_settings ALTER COLUMN tenant_id SET NOT NULL;
  END IF;
END $$;

-- monthly_dashboardのtenant_idを確認・追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'monthly_dashboard' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE monthly_dashboard ADD COLUMN tenant_id uuid REFERENCES tenants(id);
    UPDATE monthly_dashboard SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
    ALTER TABLE monthly_dashboard ALTER COLUMN tenant_id SET NOT NULL;
  ELSE
    UPDATE monthly_dashboard SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
  END IF;
END $$;

-- operation_historyのtenant_idを確認・追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'operation_history' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE operation_history ADD COLUMN tenant_id uuid REFERENCES tenants(id);
    UPDATE operation_history SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
    ALTER TABLE operation_history ALTER COLUMN tenant_id SET NOT NULL;
  ELSE
    UPDATE operation_history SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
  END IF;
END $$;

-- data_backupsにtenant_idを追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'data_backups' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE data_backups ADD COLUMN tenant_id uuid REFERENCES tenants(id);
    UPDATE data_backups SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
    ALTER TABLE data_backups ALTER COLUMN tenant_id SET NOT NULL;
  ELSE
    UPDATE data_backups SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
  END IF;
END $$;

-- dummy_data_setsにtenant_idを追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dummy_data_sets' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE dummy_data_sets ADD COLUMN tenant_id uuid REFERENCES tenants(id);
    UPDATE dummy_data_sets SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
    ALTER TABLE dummy_data_sets ALTER COLUMN tenant_id SET NOT NULL;
  ELSE
    UPDATE dummy_data_sets SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
  END IF;
END $$;

-- user_campaign_assignmentsにtenant_idを追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_campaign_assignments' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE user_campaign_assignments ADD COLUMN tenant_id uuid REFERENCES tenants(id);
    UPDATE user_campaign_assignments SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
    ALTER TABLE user_campaign_assignments ALTER COLUMN tenant_id SET NOT NULL;
  ELSE
    UPDATE user_campaign_assignments SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
  END IF;
END $$;
