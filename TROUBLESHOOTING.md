# トラブルシューティングガイド

## データが見えない問題

### 問題: ログインしてもデータが表示されない

#### 原因
1. **ユーザーIDの不一致**: `users`テーブルのIDと`auth.users`のIDが異なる
2. **RLSポリシーの問題**: Row Level Securityポリシーが正しく設定されていない
3. **テナントIDの不一致**: ユーザーとデータのテナントIDが一致していない

#### 解決方法

##### 1. ユーザーIDの確認と修正

```sql
-- IDが一致しているか確認
SELECT
  u.id as users_table_id,
  au.id as auth_users_id,
  u.email,
  CASE WHEN u.id = au.id THEN '✓ 一致' ELSE '✗ 不一致' END as status
FROM users u
JOIN auth.users au ON au.email = u.email;

-- 不一致の場合は修正（マイグレーションで実施済み）
-- fix_user_id_sync_with_auth.sql を参照
```

##### 2. RLSポリシーの確認

```sql
-- 現在のRLSポリシーを確認
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('campaigns', 'stores', 'users')
ORDER BY tablename, policyname;
```

##### 3. テナントIDの確認

```sql
-- ユーザーのテナントIDを確認
SELECT id, email, tenant_id, role
FROM users
WHERE email = 'your-email@example.com';

-- データのテナントIDを確認
SELECT tenant_id, COUNT(*)
FROM campaigns
GROUP BY tenant_id;
```

##### 4. アクセス可能なデータの確認

```sql
-- 特定ユーザーがアクセスできるはずのデータ
WITH user_info AS (
  SELECT id, tenant_id, role
  FROM users
  WHERE email = 'your-email@example.com'
)
SELECT
  'campaigns' as table_name,
  COUNT(*) as accessible_count
FROM campaigns c, user_info u
WHERE c.tenant_id = u.tenant_id

UNION ALL

SELECT
  'stores' as table_name,
  COUNT(*) as accessible_count
FROM stores s, user_info u
WHERE s.tenant_id = u.tenant_id;
```

### 実装済みの修正

以下の修正が既に実装されています:

1. **fix_user_id_sync_with_auth.sql**: `users`テーブルと`auth.users`のID同期
2. **fix_rls_infinite_recursion.sql**: RLSポリシーの無限再帰問題を修正
3. **add_tenant_id_to_remaining_tables.sql**: 全テーブルへのtenant_id追加

## その他の一般的な問題

### ビルドエラー

```bash
# キャッシュをクリアして再ビルド
rm -rf node_modules dist
npm install
npm run build
```

### 環境変数が反映されない

1. `.env`ファイルが存在するか確認
2. 環境変数の形式を確認（`VITE_`プレフィックスが必要）
3. 開発サーバーを再起動

```bash
# .envファイルの内容確認
cat .env

# 開発サーバーの再起動
npm run dev
```

### Supabase接続エラー

1. Supabase URLとAnon Keyが正しいか確認
2. Supabaseプロジェクトがアクティブか確認
3. ネットワーク接続を確認

```javascript
// src/lib/supabase.tsで接続テスト
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
```

### RLSポリシーエラー

エラーメッセージ例:
- `new row violates row-level security policy`
- `permission denied for table`

解決方法:
1. ユーザーのロールを確認
2. テナントIDが正しく設定されているか確認
3. RLSポリシーのロジックを確認

```sql
-- RLSが有効か確認
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- ポリシーの詳細を確認
SELECT * FROM pg_policies
WHERE tablename = 'your_table_name';
```

## デバッグ用クエリ

### 現在ログイン中のユーザー情報

```sql
SELECT
  auth.uid() as current_user_id,
  u.email,
  u.role,
  u.tenant_id,
  u.assigned_media
FROM users u
WHERE u.id = auth.uid();
```

### アクセス可能なリソース数

```sql
SELECT
  (SELECT COUNT(*) FROM campaigns) as campaigns,
  (SELECT COUNT(*) FROM stores) as stores,
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM budget_tracking) as budget_tracking,
  (SELECT COUNT(*) FROM campaign_progress) as campaign_progress;
```

### エラーログの確認

Supabaseダッシュボード:
1. プロジェクト > Logs
2. Database > Query Performance
3. Authentication > Users

ブラウザ:
1. 開発者ツール > Console
2. Network タブでAPIリクエストを確認
3. Application タブでローカルストレージを確認

## サポート連絡先

問題が解決しない場合:
1. Supabaseダッシュボードでログを確認
2. ブラウザのコンソールエラーをコピー
3. 実行したクエリとエラーメッセージを記録
4. サポートチームに連絡

---

**最終更新**: 2025年10月7日
