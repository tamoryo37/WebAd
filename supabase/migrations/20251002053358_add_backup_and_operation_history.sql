/*
  # Add Backup and Operation History Tables

  ## New Tables
  
  ### data_backups
  - `id` (uuid, primary key) - Unique identifier for each backup
  - `backup_name` (text) - Name of the backup
  - `backup_date` (timestamptz) - When the backup was created
  - `backup_data` (jsonb) - Complete backup data in JSON format
  - `table_counts` (jsonb) - Record counts for each table
  - `created_at` (timestamptz) - Creation timestamp
  
  ### operation_history
  - `id` (uuid, primary key) - Unique identifier for each operation
  - `operation_type` (text) - Type of operation (insert, update, delete, backup, restore)
  - `table_name` (text) - Which table was affected
  - `record_id` (text) - ID of the affected record
  - `operation_data` (jsonb) - Details of the operation
  - `operation_date` (timestamptz) - When the operation occurred
  - `created_at` (timestamptz) - Creation timestamp
  
  ## Security
  - Enable RLS on both tables
  - Add policies for anonymous access (for testing)
*/

-- Create data_backups table
CREATE TABLE IF NOT EXISTS data_backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_name text NOT NULL,
  backup_date timestamptz DEFAULT now(),
  backup_data jsonb NOT NULL,
  table_counts jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create operation_history table
CREATE TABLE IF NOT EXISTS operation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type text NOT NULL,
  table_name text NOT NULL,
  record_id text,
  operation_data jsonb DEFAULT '{}',
  operation_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_operation_history_date ON operation_history(operation_date DESC);
CREATE INDEX IF NOT EXISTS idx_operation_history_table ON operation_history(table_name);
CREATE INDEX IF NOT EXISTS idx_data_backups_date ON data_backups(backup_date DESC);

-- Enable RLS
ALTER TABLE data_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_history ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access
CREATE POLICY "Allow anonymous access to data_backups"
  ON data_backups FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous access to operation_history"
  ON operation_history FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
