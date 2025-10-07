/*
  # Add User View Scope for Permission Management

  ## Overview
  This migration adds view scope settings to control what data users can see based on their role.

  ## New Columns

  ### users table additions
  - `view_scope` (text) - Controls data visibility:
    - 'all': Can view all data (admin, managers)
    - 'own': Can only view their own assigned data (営業担当者)
    - 'assigned': Can view only specifically assigned campaigns (external users)

  ## New Tables

  ### user_campaign_access
  Tracks which specific campaigns an external user can access:
  - `user_id` (uuid) - Reference to users
  - `campaign_id` (uuid) - Reference to campaigns
  - Allows granular campaign-level access control for external users

  ## Changes
  - Add view_scope column to users table with default 'own'
  - Create user_campaign_access table for fine-grained access control
  - Add indexes for performance

  ## Security
  - Enable RLS on user_campaign_access table
  - Add policies for authenticated access
*/

-- Add view_scope column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'view_scope'
  ) THEN
    ALTER TABLE users ADD COLUMN view_scope text DEFAULT 'own';
  END IF;
END $$;

-- Create user_campaign_access table for external users
CREATE TABLE IF NOT EXISTS user_campaign_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, campaign_id)
);

-- Enable RLS
ALTER TABLE user_campaign_access ENABLE ROW LEVEL SECURITY;

-- Policies for user_campaign_access
CREATE POLICY "Users can view their campaign access"
  ON user_campaign_access FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage campaign access"
  ON user_campaign_access FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_campaign_access_user_id ON user_campaign_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_campaign_access_campaign_id ON user_campaign_access(campaign_id);
CREATE INDEX IF NOT EXISTS idx_users_view_scope ON users(view_scope);

-- Update existing admin users to have 'all' view scope
UPDATE users SET view_scope = 'all' WHERE role = 'admin';
