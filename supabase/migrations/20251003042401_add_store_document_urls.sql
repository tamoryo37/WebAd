/*
  # Add document URL fields to stores table

  1. Changes
    - Add quote_url (見積書URL) field to stores table
    - Add proposal_url (提案書URL) field to stores table
    - Add report_url (レポートURL) field to stores table
  
  2. Notes
    - These fields will store URLs instead of file uploads
    - All fields are optional (nullable)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stores' AND column_name = 'quote_url'
  ) THEN
    ALTER TABLE stores ADD COLUMN quote_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stores' AND column_name = 'proposal_url'
  ) THEN
    ALTER TABLE stores ADD COLUMN proposal_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stores' AND column_name = 'report_url'
  ) THEN
    ALTER TABLE stores ADD COLUMN report_url text;
  END IF;
END $$;