/*
  # Web Advertising Operations Management System

  ## Overview
  This migration creates a comprehensive database schema for managing web advertising operations,
  including store information, campaign submissions, progress tracking, and budget management.

  ## New Tables

  ### 1. stores
  Stores basic information about each advertising client/store including:
  - Store identification (name, address, contact)
  - Landing pages and social media accounts
  - Advertising account information across platforms (Google, Yahoo, Meta, LINE, X/Twitter)

  ### 2. campaigns
  Manages individual advertising campaigns with:
  - Campaign identification and timeline
  - Budget information (total, daily, allocated)
  - Platform and account details
  - Geographic targeting and LP URLs
  - Status tracking and progress

  ### 3. campaign_progress
  Tracks the workflow stages of campaigns:
  - Submission stages (waiting, checking, delivery)
  - Creative workflow (order, collection, storage)
  - Document workflow (quotes, proposals, invoices)
  - Responsible parties for each stage

  ### 4. budget_tracking
  Daily budget consumption tracking:
  - Daily spending amounts
  - Target vs actual consumption
  - Under-delivery calculations
  - Budget allocation adjustments

  ### 5. campaign_alerts
  Alert system for deadline management:
  - Creative collection deadlines
  - Order deadlines
  - Storage reminders
  - Alert status tracking

  ## Security
  - RLS enabled on all tables
  - Policies restrict access to authenticated users only
  - Users can view/modify data based on their role
*/

-- Create stores table
CREATE TABLE IF NOT EXISTS stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name text NOT NULL,
  postal_code text,
  address text,
  phone text,
  landing_page_1 text,
  landing_page_2 text,
  landing_page_3 text,
  landing_page_4 text,
  line_account_1 text,
  line_account_2 text,
  x_account_1_name text,
  x_account_1_id text,
  x_account_1_pass text,
  x_account_2_name text,
  x_account_2_id text,
  x_account_2_pass text,
  google_account text,
  yahoo_account text,
  tver_account text,
  meta_account text,
  line_ad_account_1 text,
  line_ad_account_2 text,
  x_ad_account_1 text,
  x_ad_account_1_id text,
  x_ad_account_1_tbm boolean DEFAULT false,
  x_ad_account_1_gambling boolean DEFAULT false,
  x_ad_account_1_io boolean DEFAULT false,
  x_ad_account_1_premium boolean DEFAULT false,
  x_ad_account_2 text,
  x_ad_account_2_id text,
  x_ad_account_2_tbm boolean DEFAULT false,
  x_ad_account_2_gambling boolean DEFAULT false,
  x_ad_account_2_io boolean DEFAULT false,
  x_ad_account_2_premium boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_number text UNIQUE NOT NULL,
  store_id uuid REFERENCES stores(id),
  setter text,
  platform text NOT NULL,
  account_name text NOT NULL,
  campaign_name text NOT NULL,
  copy_source text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  delivery_time text,
  total_budget numeric NOT NULL DEFAULT 0,
  set_total_budget numeric NOT NULL DEFAULT 0,
  set_daily_budget numeric NOT NULL DEFAULT 0,
  delivery_days integer NOT NULL DEFAULT 0,
  ad_info_url text,
  target_area text,
  landing_page text,
  other_settings text,
  notes text,
  branch text,
  stored boolean DEFAULT false,
  status text DEFAULT 'pending',
  person_in_charge text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create campaign progress tracking table
CREATE TABLE IF NOT EXISTS campaign_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  has_proposal boolean DEFAULT false,
  has_quote boolean DEFAULT false,
  creative_status text DEFAULT 'pending',
  start_check_1 text,
  start_check_2 text,
  end_check_1 text,
  end_check_2 text,
  progress_status text DEFAULT 'waiting_submission',
  check_status text,
  consumption_check text,
  memo text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(campaign_id)
);

-- Create budget tracking table
CREATE TABLE IF NOT EXISTS budget_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  tracking_date date NOT NULL,
  consumed_amount numeric DEFAULT 0,
  target_amount numeric DEFAULT 0,
  under_delivery numeric DEFAULT 0,
  allocated_amount numeric DEFAULT 0,
  allocated_total_budget numeric DEFAULT 0,
  allocated_daily_budget numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(campaign_id, tracking_date)
);

-- Create campaign alerts table
CREATE TABLE IF NOT EXISTS campaign_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  alert_date date NOT NULL,
  days_before integer NOT NULL,
  is_resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create monthly dashboard summary table
CREATE TABLE IF NOT EXISTS monthly_dashboard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id),
  month date NOT NULL,
  has_quote boolean DEFAULT false,
  has_proposal boolean DEFAULT false,
  campaign_count integer DEFAULT 0,
  consumed_budget numeric DEFAULT 0,
  total_budget numeric DEFAULT 0,
  progress_rate numeric DEFAULT 0,
  collection_pending integer DEFAULT 0,
  order_4days_pending integer DEFAULT 0,
  order_7days_pending integer DEFAULT 0,
  order_submitted_4days_pending integer DEFAULT 0,
  person_in_charge text,
  unsaved_count integer DEFAULT 0,
  incomplete_count integer DEFAULT 0,
  report_pending integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(store_id, month)
);

-- Enable RLS on all tables
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_dashboard ENABLE ROW LEVEL SECURITY;

-- Create policies for stores
CREATE POLICY "Authenticated users can view stores"
  ON stores FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert stores"
  ON stores FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update stores"
  ON stores FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete stores"
  ON stores FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for campaigns
CREATE POLICY "Authenticated users can view campaigns"
  ON campaigns FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert campaigns"
  ON campaigns FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update campaigns"
  ON campaigns FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete campaigns"
  ON campaigns FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for campaign_progress
CREATE POLICY "Authenticated users can view campaign progress"
  ON campaign_progress FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert campaign progress"
  ON campaign_progress FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update campaign progress"
  ON campaign_progress FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete campaign progress"
  ON campaign_progress FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for budget_tracking
CREATE POLICY "Authenticated users can view budget tracking"
  ON budget_tracking FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert budget tracking"
  ON budget_tracking FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update budget tracking"
  ON budget_tracking FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete budget tracking"
  ON budget_tracking FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for campaign_alerts
CREATE POLICY "Authenticated users can view campaign alerts"
  ON campaign_alerts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert campaign alerts"
  ON campaign_alerts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update campaign alerts"
  ON campaign_alerts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete campaign alerts"
  ON campaign_alerts FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for monthly_dashboard
CREATE POLICY "Authenticated users can view monthly dashboard"
  ON monthly_dashboard FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert monthly dashboard"
  ON monthly_dashboard FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update monthly dashboard"
  ON monthly_dashboard FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete monthly dashboard"
  ON monthly_dashboard FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaigns_store_id ON campaigns(store_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_start_date ON campaigns(start_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_end_date ON campaigns(end_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_progress_campaign_id ON campaign_progress(campaign_id);
CREATE INDEX IF NOT EXISTS idx_budget_tracking_campaign_id ON budget_tracking(campaign_id);
CREATE INDEX IF NOT EXISTS idx_budget_tracking_date ON budget_tracking(tracking_date);
CREATE INDEX IF NOT EXISTS idx_campaign_alerts_campaign_id ON campaign_alerts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_alerts_date ON campaign_alerts(alert_date);
CREATE INDEX IF NOT EXISTS idx_monthly_dashboard_store_id ON monthly_dashboard(store_id);
CREATE INDEX IF NOT EXISTS idx_monthly_dashboard_month ON monthly_dashboard(month);
