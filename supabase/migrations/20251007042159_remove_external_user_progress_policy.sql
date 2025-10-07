/*
  # 外部ユーザー向けcampaign_progressポリシーの削除と再作成

  ## 問題
    "External users can view progress for assigned campaigns"ポリシーが
    usersテーブルを直接参照していて権限エラーを起こしている

  ## 解決策
    古いポリシーを削除し、get_user_role()関数を使う新しいポリシーに統一
*/

-- 古いポリシーを削除
DROP POLICY IF EXISTS "External users can view progress for assigned campaigns" ON campaign_progress;

-- 外部ユーザー向けのポリシーを再作成（関数を使用）
CREATE POLICY "External users can view progress for assigned campaigns"
  ON campaign_progress FOR SELECT
  TO authenticated
  USING (
    CASE 
      WHEN get_user_role() = 'external' THEN
        EXISTS (
          SELECT 1 FROM campaigns c
          WHERE c.id = campaign_progress.campaign_id
            AND c.person_in_charge = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
      ELSE true
    END
  );
