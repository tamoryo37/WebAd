/*
  # Update RLS Policies for Authenticated Users

  1. Changes
    - Drop existing anonymous access policies
    - Create new policies that allow all authenticated users to access all data
    - Apply to all tables: stores, campaigns, campaign_progress, budget_tracking, campaign_alerts, monthly_dashboard, data_backups, operation_history, backup_settings, dummy_data_sets, store_images, users, user_permissions, user_media_access

  2. Security
    - RLS remains enabled on all tables
    - Only authenticated users can access data
    - All authenticated users have full access (SELECT, INSERT, UPDATE, DELETE)
    - This is suitable for prototype/testing environments

  3. Tables Updated
    - stores
    - campaigns
    - campaign_progress
    - budget_tracking
    - campaign_alerts
    - monthly_dashboard
    - data_backups
    - operation_history
    - backup_settings
    - dummy_data_sets
    - store_images
    - users
    - user_permissions
    - user_media_access
*/

-- Drop existing anonymous policies
DROP POLICY IF EXISTS "Allow anonymous access to stores" ON stores;
DROP POLICY IF EXISTS "Allow anonymous access to campaigns" ON campaigns;
DROP POLICY IF EXISTS "Allow anonymous access to campaign_progress" ON campaign_progress;
DROP POLICY IF EXISTS "Allow anonymous access to budget_tracking" ON budget_tracking;
DROP POLICY IF EXISTS "Allow anonymous access to campaign_alerts" ON campaign_alerts;
DROP POLICY IF EXISTS "Allow anonymous access to monthly_dashboard" ON monthly_dashboard;
DROP POLICY IF EXISTS "Allow anonymous access to data_backups" ON data_backups;
DROP POLICY IF EXISTS "Allow anonymous access to operation_history" ON operation_history;
DROP POLICY IF EXISTS "Allow anonymous access to backup_settings" ON backup_settings;
DROP POLICY IF EXISTS "Allow anonymous access to dummy_data_sets" ON dummy_data_sets;
DROP POLICY IF EXISTS "Allow anonymous access to store_images" ON store_images;
DROP POLICY IF EXISTS "Allow anonymous access to users" ON users;
DROP POLICY IF EXISTS "Allow anonymous access to user_permissions" ON user_permissions;
DROP POLICY IF EXISTS "Allow anonymous access to user_media_access" ON user_media_access;

-- Create authenticated user policies for stores
CREATE POLICY "Authenticated users can access stores"
  ON stores FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create authenticated user policies for campaigns
CREATE POLICY "Authenticated users can access campaigns"
  ON campaigns FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create authenticated user policies for campaign_progress
CREATE POLICY "Authenticated users can access campaign_progress"
  ON campaign_progress FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create authenticated user policies for budget_tracking
CREATE POLICY "Authenticated users can access budget_tracking"
  ON budget_tracking FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create authenticated user policies for campaign_alerts
CREATE POLICY "Authenticated users can access campaign_alerts"
  ON campaign_alerts FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create authenticated user policies for monthly_dashboard
CREATE POLICY "Authenticated users can access monthly_dashboard"
  ON monthly_dashboard FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create authenticated user policies for data_backups
CREATE POLICY "Authenticated users can access data_backups"
  ON data_backups FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create authenticated user policies for operation_history
CREATE POLICY "Authenticated users can access operation_history"
  ON operation_history FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create authenticated user policies for backup_settings
CREATE POLICY "Authenticated users can access backup_settings"
  ON backup_settings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create authenticated user policies for dummy_data_sets
CREATE POLICY "Authenticated users can access dummy_data_sets"
  ON dummy_data_sets FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create authenticated user policies for store_images
CREATE POLICY "Authenticated users can access store_images"
  ON store_images FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create authenticated user policies for users
CREATE POLICY "Authenticated users can access users"
  ON users FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create authenticated user policies for user_permissions
CREATE POLICY "Authenticated users can access user_permissions"
  ON user_permissions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create authenticated user policies for user_media_access
CREATE POLICY "Authenticated users can access user_media_access"
  ON user_media_access FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
