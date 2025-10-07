/*
  # RPC関数を作成してAdmin用データアクセス

  ## 新規関数
    - get_tenant_users() - テナント内のすべてのユーザーを取得
    - get_tenant_media_platforms() - テナント内のメディアを取得

  ## 理由
    RLSポリシーの無限再帰を避けるため、SECURITY DEFINERで
    RLSをバイパスする関数を作成
*/

-- テナント内のユーザーを取得する関数
CREATE OR REPLACE FUNCTION get_tenant_users()
RETURNS TABLE (
  id uuid,
  email text,
  role text,
  tenant_id uuid,
  created_at timestamptz,
  updated_at timestamptz
) 
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    u.id,
    u.email,
    u.role,
    u.tenant_id,
    u.created_at,
    u.updated_at
  FROM users u
  WHERE u.tenant_id = (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  )
  ORDER BY u.created_at DESC;
$$;

-- テナント内のメディアプラットフォームを取得する関数
CREATE OR REPLACE FUNCTION get_tenant_media_platforms()
RETURNS TABLE (
  id uuid,
  tenant_id uuid,
  name text,
  code text,
  description text,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  created_by uuid
) 
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    mp.id,
    mp.tenant_id,
    mp.name,
    mp.code,
    mp.description,
    mp.is_active,
    mp.created_at,
    mp.updated_at,
    mp.created_by
  FROM media_platforms mp
  WHERE mp.tenant_id = (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  )
  ORDER BY mp.created_at DESC;
$$;

-- 関数に実行権限を付与
GRANT EXECUTE ON FUNCTION get_tenant_users() TO authenticated;
GRANT EXECUTE ON FUNCTION get_tenant_media_platforms() TO authenticated;
