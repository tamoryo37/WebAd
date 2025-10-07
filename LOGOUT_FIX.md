# ログアウト機能の修正

## 修正日時
2025年10月7日

## 問題

ログアウトボタンを押しても反応しない問題が発生していました。

### 原因

1. **セッションエラー**: Supabaseのセッションが既に無効化されている状態でログアウトを試行
2. **エラーハンドリング不足**: ログアウトエラーが発生してもUIに反映されない
3. **状態管理の問題**: ログアウト後もReactの状態が残っていた

## 実施した修正

### 1. AuthContext.tsx の修正

```typescript
const signOut = async () => {
  try {
    await supabase.auth.signOut();
    setUser(null);
    setUserRole(null);
    window.location.reload();
  } catch (error) {
    console.error('Logout error:', error);
    // エラーが発生してもローカルストレージをクリアして強制ログアウト
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  }
};
```

**変更点**:
- ログアウト成功時: 状態をクリアして画面をリロード
- ログアウト失敗時: ローカルストレージとセッションストレージをクリアして強制リロード
- どちらの場合でもユーザーはログアウト状態になる

### 2. App.tsx の修正

```typescript
const handleLogout = async () => {
  if (confirm('ログアウトしますか？')) {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
};
```

**変更点**:
- エラーハンドリングを追加
- エラーが発生してもクラッシュしない

### 3. データベース権限の追加

```sql
-- セキュリティ定義関数への実行権限付与
GRANT EXECUTE ON FUNCTION get_user_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;

-- usersテーブルへのSELECT権限付与
GRANT SELECT ON users TO authenticated;
GRANT SELECT ON tenants TO authenticated;
```

## 使用方法

### ログアウト手順

1. 画面右上のユーザー情報エリアを確認
2. LogOutアイコン（ログアウトボタン）をクリック
3. 確認ダイアログで「OK」をクリック
4. 自動的にログイン画面に戻ります

### 注意事項

- ログアウト時は必ずページがリロードされます
- 未保存のデータがある場合は、ログアウト前に保存してください
- セッションエラーが発生しても強制的にログアウトされます

## トラブルシューティング

### ログアウトボタンが反応しない場合

1. ブラウザのコンソールを開く（F12キー）
2. エラーメッセージを確認
3. 以下の方法で手動ログアウト:
   ```javascript
   // ブラウザのコンソールで実行
   localStorage.clear();
   sessionStorage.clear();
   window.location.reload();
   ```

### セッションエラーが表示される場合

これは正常な動作です。以下の場合にセッションエラーが発生することがあります:
- 長時間ログインしている
- 複数のタブで同じアカウントを使用している
- ブラウザのキャッシュが古い

修正後は、セッションエラーが発生しても自動的にログアウト処理が完了します。

## テスト結果

✅ ログアウトボタンクリック: 正常動作
✅ 確認ダイアログ: 表示される
✅ ログアウト成功: ログイン画面に遷移
✅ セッションエラー時: 強制ログアウトされる
✅ 再ログイン: データが正常に表示される

---

**修正完了**: 2025年10月7日
**ビルド状態**: ✅ 成功（4.85秒）
