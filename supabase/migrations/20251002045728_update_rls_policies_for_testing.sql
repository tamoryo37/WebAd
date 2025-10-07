/*
  # Update RLS Policies for Testing

  ## Changes
  - Update all RLS policies to allow anonymous access for testing purposes
  - Change policies from `authenticated` to `anon` to allow unauthenticated access
  - This enables viewing and managing data without authentication

  ## Security Note
  - For production use, these policies should be restricted to authenticated users only
  - Current setup is for development/testing purposes
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view stores" ON stores;
DROP POLICY IF EXISTS "Authenticated users can insert stores" ON stores;
DROP POLICY IF EXISTS "Authenticated users can update stores" ON stores;
DROP POLICY IF EXISTS "Authenticated users can delete stores" ON stores;

DROP POLICY IF EXISTS "Authenticated users can view campaigns" ON campaigns;
DROP POLICY IF EXISTS "Authenticated users can insert campaigns" ON campaigns;
DROP POLICY IF EXISTS "Authenticated users can update campaigns" ON campaigns;
DROP POLICY IF EXISTS "Authenticated users can delete campaigns" ON campaigns;

DROP POLICY IF EXISTS "Authenticated users can view campaign progress" ON campaign_progress;
DROP POLICY IF EXISTS "Authenticated users can insert campaign progress" ON campaign_progress;
DROP POLICY IF EXISTS "Authenticated users can update campaign progress" ON campaign_progress;
DROP POLICY IF EXISTS "Authenticated users can delete campaign progress" ON campaign_progress;

DROP POLICY IF EXISTS "Authenticated users can view budget tracking" ON budget_tracking;
DROP POLICY IF EXISTS "Authenticated users can insert budget tracking" ON budget_tracking;
DROP POLICY IF EXISTS "Authenticated users can update budget tracking" ON budget_tracking;
DROP POLICY IF EXISTS "Authenticated users can delete budget tracking" ON budget_tracking;

DROP POLICY IF EXISTS "Authenticated users can view campaign alerts" ON campaign_alerts;
DROP POLICY IF EXISTS "Authenticated users can insert campaign alerts" ON campaign_alerts;
DROP POLICY IF EXISTS "Authenticated users can update campaign alerts" ON campaign_alerts;
DROP POLICY IF EXISTS "Authenticated users can delete campaign alerts" ON campaign_alerts;

DROP POLICY IF EXISTS "Authenticated users can view monthly dashboard" ON monthly_dashboard;
DROP POLICY IF EXISTS "Authenticated users can insert monthly dashboard" ON monthly_dashboard;
DROP POLICY IF EXISTS "Authenticated users can update monthly dashboard" ON monthly_dashboard;
DROP POLICY IF EXISTS "Authenticated users can delete monthly dashboard" ON monthly_dashboard;

-- Create new policies that allow anonymous access
CREATE POLICY "Allow anonymous access to stores"
  ON stores FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous access to campaigns"
  ON campaigns FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous access to campaign_progress"
  ON campaign_progress FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous access to budget_tracking"
  ON budget_tracking FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous access to campaign_alerts"
  ON campaign_alerts FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous access to monthly_dashboard"
  ON monthly_dashboard FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
