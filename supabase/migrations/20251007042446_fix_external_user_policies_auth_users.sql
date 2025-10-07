/*
  # 外部ユーザー向けポリシーの完全修正

  ## 問題
    外部ユーザー向けポリシーがusersテーブルのemailを参照していた
    これによりpermission deniedエラーが発生

  ## 解決策
    auth.usersテーブルのみを参照するように修正
*/

-- budget_trackingの外部ユーザーポリシーを修正
DROP POLICY IF EXISTS "External users can view budget for assigned campaigns" ON budget_tracking;

CREATE POLICY "External users can view budget for assigned campaigns"
  ON budget_tracking FOR SELECT
  TO authenticated
  USING (
    CASE 
      WHEN get_user_role() = 'external' THEN
        EXISTS (
          SELECT 1 FROM campaigns c
          JOIN auth.users u ON u.email = c.person_in_charge
          WHERE c.id = budget_tracking.campaign_id
            AND u.id = auth.uid()
        )
      ELSE true
    END
  );

-- campaign_progressの外部ユーザーポリシーを修正
DROP POLICY IF EXISTS "External users can view progress for assigned campaigns" ON campaign_progress;

CREATE POLICY "External users can view progress for assigned campaigns"
  ON campaign_progress FOR SELECT
  TO authenticated
  USING (
    CASE 
      WHEN get_user_role() = 'external' THEN
        EXISTS (
          SELECT 1 FROM campaigns c
          JOIN auth.users u ON u.email = c.person_in_charge
          WHERE c.id = campaign_progress.campaign_id
            AND u.id = auth.uid()
        )
      ELSE true
    END
  );
