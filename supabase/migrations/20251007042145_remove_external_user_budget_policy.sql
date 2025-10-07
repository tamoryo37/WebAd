/*
  # 外部ユーザー向けbudget_trackingポリシーの削除

  ## 問題
    "External users can view budget for assigned campaigns"ポリシーが
    usersテーブルを直接参照していて権限エラーを起こしている

  ## 解決策
    古いポリシーを削除し、get_user_role()関数を使う新しいポリシーに統一
*/

-- 古いポリシーを削除
DROP POLICY IF EXISTS "External users can view budget for assigned campaigns" ON budget_tracking;

-- 外部ユーザー向けのポリシーを再作成（関数を使用）
CREATE POLICY "External users can view budget for assigned campaigns"
  ON budget_tracking FOR SELECT
  TO authenticated
  USING (
    CASE 
      WHEN get_user_role() = 'external' THEN
        EXISTS (
          SELECT 1 FROM campaigns c
          WHERE c.id = budget_tracking.campaign_id
            AND c.person_in_charge = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
      ELSE true
    END
  );
