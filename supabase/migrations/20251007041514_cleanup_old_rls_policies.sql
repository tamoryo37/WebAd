/*
  # 古いRLSポリシーのクリーンアップ

  テスト用の緩いポリシーを削除し、本番用のポリシーのみ残す
*/

-- usersテーブルの古いポリシーを全て削除
DROP POLICY IF EXISTS "Anyone can view users" ON users;
DROP POLICY IF EXISTS "Anyone can insert users" ON users;
DROP POLICY IF EXISTS "Anyone can update users" ON users;
DROP POLICY IF EXISTS "Anyone can delete users" ON users;
DROP POLICY IF EXISTS "Users can view own record" ON users;
DROP POLICY IF EXISTS "Users can view other users" ON users;
DROP POLICY IF EXISTS "Users can update own record" ON users;
DROP POLICY IF EXISTS "Users can insert own record" ON users;

-- 本番用のポリシーのみ残っていることを確認
-- (fix_users_rls_policy_final.sqlで作成されたポリシー)
