# Supabaseデータベースセットアップ

このファイルには、Supabaseで実行する必要があるSQLスクリプトが含まれています。

## テーブル作成

Supabase Dashboard → SQL Editor で以下のSQLを実行してください。

```sql
-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS yupoline_users (
  id BIGSERIAL PRIMARY KEY,
  line_user_id VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  picture_url TEXT,
  status_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- アクティビティログテーブル
CREATE TABLE IF NOT EXISTS yupoline_activity_logs (
  id BIGSERIAL PRIMARY KEY,
  line_user_id VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_users_line_user_id ON yupoline_users(line_user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_line_user_id ON yupoline_activity_logs(line_user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON yupoline_activity_logs(created_at);

-- RLS (Row Level Security) を有効化
ALTER TABLE yupoline_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE yupoline_activity_logs ENABLE ROW LEVEL SECURITY;

-- ポリシー作成（全ユーザーが読み書き可能）
-- 本番環境では適切に制限してください
CREATE POLICY "Enable read access for all users" ON yupoline_users
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON yupoline_users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON yupoline_users
  FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON yupoline_activity_logs
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON yupoline_activity_logs
  FOR INSERT WITH CHECK (true);
```

## テーブル構造の確認

```sql
-- テーブル一覧を確認
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'yupoline_%';

-- yupoline_users のカラムを確認
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'yupoline_users';

-- yupoline_activity_logs のカラムを確認
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'yupoline_activity_logs';
```

## サンプルクエリ

```sql
-- ユーザー一覧を取得
SELECT * FROM yupoline_users ORDER BY created_at DESC;

-- 最近のアクティビティログを取得
SELECT * FROM yupoline_activity_logs ORDER BY created_at DESC LIMIT 100;

-- ユーザーごとのアクティビティ数を取得
SELECT
  u.display_name,
  u.line_user_id,
  COUNT(a.id) as activity_count
FROM yupoline_users u
LEFT JOIN yupoline_activity_logs a ON u.line_user_id = a.line_user_id
GROUP BY u.id, u.display_name, u.line_user_id
ORDER BY activity_count DESC;
```

## トラブルシューティング

### エラー: relation "yupoline_users" already exists

テーブルが既に存在する場合は、削除してから再作成するか、既存のテーブルを使用してください。

```sql
-- テーブルを削除（注意：データも削除されます）
DROP TABLE IF EXISTS yupoline_activity_logs;
DROP TABLE IF EXISTS yupoline_users;
```

### RLSポリシーのエラー

ポリシーが既に存在する場合は、先に削除してから作成してください。

```sql
-- ポリシーを削除
DROP POLICY IF EXISTS "Enable read access for all users" ON yupoline_users;
DROP POLICY IF EXISTS "Enable insert access for all users" ON yupoline_users;
DROP POLICY IF EXISTS "Enable update access for all users" ON yupoline_users;
DROP POLICY IF EXISTS "Enable read access for all users" ON yupoline_activity_logs;
DROP POLICY IF EXISTS "Enable insert access for all users" ON yupoline_activity_logs;
```

## セキュリティに関する注意

上記のRLSポリシーは開発用の簡易的な設定です。本番環境では、適切なセキュリティポリシーを設定してください。

例：ユーザーが自分のデータのみアクセスできるようにする

```sql
-- 自分のデータのみ読み取り可能
CREATE POLICY "Users can read own data" ON yupoline_users
  FOR SELECT USING (line_user_id = current_setting('app.current_user_id', true));

-- 自分のデータのみ更新可能
CREATE POLICY "Users can update own data" ON yupoline_users
  FOR UPDATE USING (line_user_id = current_setting('app.current_user_id', true));
```
