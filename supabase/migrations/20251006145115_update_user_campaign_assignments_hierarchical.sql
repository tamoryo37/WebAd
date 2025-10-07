/*
  # ユーザー割り当ての階層化機能

  1. テーブル更新
    - `user_campaign_assignments`テーブルに階層関連のカラムを追加
      - `role` (text) - ユーザーの役割（admin, manager, member）
      - `managed_users` (text[]) - 管理対象のユーザーメールアドレス配列
      - `is_admin` (boolean) - 管理者フラグ
  
  2. 役割の説明
    - admin: 全てのキャンペーンを閲覧可能、全ユーザーの設定を管理可能
    - manager: 割り当てられたメンバーのキャンペーンを閲覧可能
    - member: 自分が担当者のキャンペーンのみ閲覧可能
  
  3. セキュリティ
    - 既存のRLSポリシーを維持
    - 管理者のみが他のユーザーの設定を閲覧・更新可能
*/

ALTER TABLE user_campaign_assignments 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'member',
ADD COLUMN IF NOT EXISTS managed_users text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

CREATE POLICY "Admins can view all assignments"
  ON user_campaign_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_campaign_assignments
      WHERE user_email = auth.jwt()->>'email' AND is_admin = true
    )
  );

CREATE POLICY "Admins can update all assignments"
  ON user_campaign_assignments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_campaign_assignments
      WHERE user_email = auth.jwt()->>'email' AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_campaign_assignments
      WHERE user_email = auth.jwt()->>'email' AND is_admin = true
    )
  );

CREATE POLICY "Admins can insert assignments"
  ON user_campaign_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_campaign_assignments
      WHERE user_email = auth.jwt()->>'email' AND is_admin = true
    )
  );

CREATE POLICY "Admins can delete assignments"
  ON user_campaign_assignments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_campaign_assignments
      WHERE user_email = auth.jwt()->>'email' AND is_admin = true
    )
  );

UPDATE user_campaign_assignments
SET is_admin = true, role = 'admin', can_view_all = true
WHERE user_email = 'ryo.tamoto@osushi-inc.com';
