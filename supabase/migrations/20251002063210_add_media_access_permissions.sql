/*
  # Add Media Access Permissions to Users

  1. New Table
    - `user_media_access`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `media` (text) - メディア名 (LINE, YDA, YSA, GVN, GDN, GSN, Logicad, META, X)
      - `has_access` (boolean) - アクセス権限
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on table
    - Add policies for public access (system without auth for now)

  3. Changes
    - Create unique constraint on (user_id, media)
*/

CREATE TABLE IF NOT EXISTS user_media_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  media text NOT NULL,
  has_access boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, media)
);

ALTER TABLE user_media_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view user media access"
  ON user_media_access FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert user media access"
  ON user_media_access FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update user media access"
  ON user_media_access FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete user media access"
  ON user_media_access FOR DELETE
  USING (true);

CREATE INDEX IF NOT EXISTS idx_user_media_access_user_id ON user_media_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_media_access_media ON user_media_access(media);