# デプロイメントガイド

## システム概要

広告運用管理システムは、Supabaseバックエンドと React + Vite フロントエンドで構成されています。

## バックエンド構成 (Supabase)

### データベース

#### テーブル構成（17テーブル + 1テナントテーブル）

1. **tenants** - クライアント企業情報（マルチテナント対応）
2. **users** - ユーザー情報（tenant_id、assigned_media追加）
3. **campaigns** - キャンペーン情報（tenant_id、created_by、media_type追加）
4. **stores** - 店舗情報（tenant_id、created_by追加）
5. **budget_tracking** - 予算トラッキング
6. **campaign_progress** - キャンペーン進捗
7. **campaign_alerts** - アラート情報
8. **store_images** - 店舗画像
9. **store_monthly_documents** - 月次資料
10. **user_campaign_assignments** - ユーザー-キャンペーン割り当て
11. **user_permissions** - ユーザー権限
12. **user_media_access** - 媒体別アクセス権限
13. **backup_settings** - バックアップ設定
14. **data_backups** - バックアップ履歴
15. **chatwork_notification_settings** - ChatWork通知設定
16. **operation_history** - 操作履歴
17. **monthly_dashboard** - 月次ダッシュボード
18. **dummy_data_sets** - ダミーデータ

#### マイグレーション履歴

```bash
20251002035740_create_ad_operation_system.sql
20251002045728_update_rls_policies_for_testing.sql
20251002053358_add_backup_and_operation_history.sql
20251002054521_add_backup_settings_and_dummy_data.sql
20251002061540_add_store_images.sql
20251002062334_add_user_management_and_roles.sql
20251002062838_add_campaign_creative_fields.sql
20251002063210_add_media_access_permissions.sql
20251003035421_allow_authenticated_access.sql
20251003042401_add_store_document_urls.sql
20251003062903_add_monthly_documents_table.sql
20251003064627_add_chatwork_notification_settings.sql
20251006144150_add_user_campaign_assignments.sql
20251006145115_update_user_campaign_assignments_hierarchical.sql
20251006145628_fix_user_assignments_rls.sql
20251006155444_add_external_user_role_v2.sql
add_multi_tenant_support_v2.sql
update_rls_policies_production_v2.sql
fix_users_table_and_create_storage.sql
```

### RLSポリシー（3層セキュリティモデル）

#### レイヤー1: テナント分離
- 全テーブルに `tenant_id` カラムを追加
- ユーザーは自身の所属テナントのデータのみアクセス可能

#### レイヤー2: 所有者制御
- 担当者（staff）は自身が作成したデータ（`created_by = auth.uid()`）のみ編集可能
- 管理者（admin）は自テナント内の全データを編集可能

#### レイヤー3: メディア別アクセス制御
- 担当者は `assigned_media` 配列に含まれるメディアのキャンペーンのみアクセス可能
- 外部ユーザー（external）は割り当てられたキャンペーンのみ閲覧可能

### ストレージバケット

1. **store-images** - 店舗画像（10MB制限、画像形式のみ）
2. **store-documents** - 月次資料（50MB制限、PDF/Excel）
3. **campaign-creatives** - キャンペーンクリエイティブ（100MB制限、画像/動画）

### Edge Functions

1. **campaign-operations** - キャンペーン一括操作
   - エンドポイント: `/functions/v1/campaign-operations`
   - 機能: ステータス一括更新、ヘルスチェック

2. **data-export** - データエクスポート
   - エンドポイント: `/functions/v1/data-export`
   - 機能: CSV/JSON形式でのデータエクスポート

## フロントエンド構成

### ビルド構成

- **React 18** + TypeScript
- **Vite 5** ビルドツール
- **Tailwind CSS** スタイリング
- **Code Splitting**: React.lazy による動的インポート
- **Manual Chunks**: react-vendor、supabase-vendor、utils

### 最適化

- Error Boundary実装
- ロガーシステム
- バリデーションシステム
- カスタムフック（useSupabaseQuery）

## デプロイ手順

### 1. Supabaseプロジェクトの準備

Supabaseプロジェクトは既に設定済みです。以下の情報を確認してください:

- プロジェクトURL: `VITE_SUPABASE_URL`
- Anon Key: `VITE_SUPABASE_ANON_KEY`

### 2. 環境変数の設定

`.env` ファイルを作成（`.env.example` を参照）:

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. フロントエンドのビルド

```bash
# 依存関係のインストール
npm install

# 型チェック
npm run typecheck

# 本番ビルド
npm run build
```

### 4. デプロイ（Vercel/Netlify）

#### Vercel

```bash
# Vercel CLIのインストール
npm i -g vercel

# デプロイ
vercel --prod
```

**Vercel設定:**
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`
- Environment Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

#### Netlify

```bash
# Netlify CLIのインストール
npm i -g netlify-cli

# デプロイ
netlify deploy --prod --dir=dist
```

**Netlify設定:**
- Build command: `npm run build`
- Publish directory: `dist`
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

### 5. 本番環境の検証

デプロイ後、以下を確認してください:

#### 機能確認
- [ ] ログイン/ログアウト機能
- [ ] ダッシュボード表示
- [ ] キャンペーン一覧表示
- [ ] キャンペーン作成・編集
- [ ] 店舗管理機能
- [ ] 権限による表示制御

#### セキュリティ確認
- [ ] テナント分離（他テナントのデータが見えないこと）
- [ ] 権限による操作制限
- [ ] セキュリティヘッダーの設定
- [ ] HTTPS通信

#### パフォーマンス確認
- [ ] ページロード時間（2秒以内）
- [ ] データ取得時間（1秒以内）
- [ ] モバイルデバイスでの表示

## テストユーザー

開発環境では以下のユーザーでテストできます:

```
管理者: admin@example.com
スタッフ（Meta担当）: staff.meta@example.com
スタッフ（Google担当）: staff.google@example.com
外部ユーザー: external@client.com
```

**注意**: 本番環境では、Supabase Authで実際のユーザーを作成してください。

## 監視とメンテナンス

### ログ確認

- フロントエンド: ブラウザコンソール
- バックエンド: Supabase ダッシュボード > Logs
- Edge Functions: Supabase ダッシュボード > Edge Functions > Logs

### バックアップ

システムには自動バックアップ機能が実装されています:
- 設定: 「設定」 > 「データバックアップ」
- 頻度: 日次/週次/月次
- 手動バックアップ: いつでも実行可能

### パフォーマンス監視

- Supabase ダッシュボード > Database > Performance
- Vercel/Netlify Analytics
- ブラウザ開発者ツール > Lighthouse

## トラブルシューティング

### ビルドエラー

```bash
# キャッシュをクリアして再ビルド
rm -rf node_modules dist
npm install
npm run build
```

### 環境変数が反映されない

- Vercel/Netlifyダッシュボードで環境変数を確認
- 再デプロイを実行

### データベース接続エラー

- `.env` ファイルの確認
- Supabaseプロジェクトのステータス確認
- RLSポリシーの確認

## サポート情報

- Supabaseドキュメント: https://supabase.com/docs
- Viteドキュメント: https://vitejs.dev/
- Reactドキュメント: https://react.dev/

---

**最終更新**: 2025年10月7日
**バージョン**: 2.0.0
