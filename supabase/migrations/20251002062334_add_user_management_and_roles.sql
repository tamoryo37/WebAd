/*
  # Add User Management and Role-Based Access Control

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `username` (text, unique) - ユーザー名
      - `password_hash` (text) - パスワードのハッシュ
      - `full_name` (text) - フルネーム
      - `email` (text, unique) - メールアドレス
      - `role` (text) - 権限レベル (admin, manager, editor, viewer)
      - `is_active` (boolean) - アクティブ状態
      - `last_login` (timestamptz) - 最終ログイン
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `user_permissions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `resource` (text) - リソース名 (stores, campaigns, etc.)
      - `can_view` (boolean) - 閲覧権限
      - `can_create` (boolean) - 作成権限
      - `can_edit` (boolean) - 編集権限
      - `can_delete` (boolean) - 削除権限
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for public access (system without auth for now)

  3. Roles
    - admin: すべての権限
    - manager: 閲覧、作成、編集権限
    - editor: 閲覧、編集権限
    - viewer: 閲覧権限のみ
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'viewer',
  is_active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  resource text NOT NULL,
  can_view boolean DEFAULT false,
  can_create boolean DEFAULT false,
  can_edit boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, resource)
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view users"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert users"
  ON users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update users"
  ON users FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete users"
  ON users FOR DELETE
  USING (true);

CREATE POLICY "Anyone can view user permissions"
  ON user_permissions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert user permissions"
  ON user_permissions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update user permissions"
  ON user_permissions FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete user permissions"
  ON user_permissions FOR DELETE
  USING (true);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_resource ON user_permissions(resource);

INSERT INTO users (username, password_hash, full_name, email, role, is_active) VALUES
  ('admin', '$2a$10$XqZq0Z9Z9Z9Z9Z9Z9Z9Z9O', '管理者', 'admin@example.com', 'admin', true),
  ('manager', '$2a$10$XqZq0Z9Z9Z9Z9Z9Z9Z9Z9O', 'マネージャー', 'manager@example.com', 'manager', true),
  ('editor', '$2a$10$XqZq0Z9Z9Z9Z9Z9Z9Z9Z9O', '編集者', 'editor@example.com', 'editor', true),
  ('viewer', '$2a$10$XqZq0Z9Z9Z9Z9Z9Z9Z9Z9O', '閲覧者', 'viewer@example.com', 'viewer', true)
ON CONFLICT (username) DO NOTHING;