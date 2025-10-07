/*
  # Add Campaign Creative Fields

  1. New Columns for campaigns table
    - `chk` (text) - CHK
    - `completion_chk` (text) - 前化CHK
    - `memo` (text) - メモ
    - `before_start_completion_status` (text) - 前日までの前化金額
    - `before_start_completion_amount` (numeric) - 前日までの前化目標
    - `before_start_completion_target` (numeric) - 前日までの未消化
    - `account` (text) - アロケ金額
    - `account_termination` (text) - アロケ都下予算
    - `account_day_forecast` (text) - アロケ日予算

  2. Changes
    - Add columns with default values where appropriate
    - Use IF NOT EXISTS to prevent errors on re-run
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campaigns' AND column_name = 'chk'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN chk text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campaigns' AND column_name = 'completion_chk'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN completion_chk text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campaigns' AND column_name = 'memo'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN memo text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campaigns' AND column_name = 'before_start_completion_status'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN before_start_completion_status text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campaigns' AND column_name = 'before_start_completion_amount'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN before_start_completion_amount numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campaigns' AND column_name = 'before_start_completion_target'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN before_start_completion_target numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campaigns' AND column_name = 'account'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN account text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campaigns' AND column_name = 'account_termination'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN account_termination text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campaigns' AND column_name = 'account_day_forecast'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN account_day_forecast text;
  END IF;
END $$;