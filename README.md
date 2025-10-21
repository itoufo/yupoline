# Yupoline - LIFF App

LIFFアプリとLINE API、Supabaseを統合したWebアプリケーションです。

## 機能

- LINE LIFFによるユーザー認証
- ユーザープロフィールの取得と表示
- Supabaseへのユーザーデータ保存
- アクティビティログの記録
- LINEへのメッセージ送信

## 技術スタック

- **フロントエンド**: HTML, CSS, JavaScript
- **LIFF SDK**: LINE Front-end Framework
- **バックエンド**: Supabase (PostgreSQL)
- **ホスティング**: Netlify

## プロジェクト構造

```
yupoline/
├── public/
│   ├── index.html          # メインHTMLファイル
│   ├── css/
│   │   └── style.css       # スタイルシート
│   ├── js/
│   │   ├── env.js          # 環境変数（ビルド時自動生成）
│   │   ├── config.js       # 環境変数設定
│   │   ├── supabase.js     # Supabaseクライアント
│   │   └── app.js          # メインアプリケーション
│   ├── _headers            # Netlifyヘッダー設定
│   └── _redirects          # Netlifyリダイレクト設定
├── build.js                # ビルドスクリプト
├── netlify.toml            # Netlify設定
├── package.json            # NPM設定
├── .env.example            # 環境変数テンプレート
├── .gitignore              # Git除外設定
└── README.md               # このファイル
```

## セットアップ

### 1. LINE Developers設定

1. [LINE Developers Console](https://developers.line.biz/console/) にアクセス
2. プロバイダーを作成
3. チャネルを作成（LINEログイン）
4. LIFF アプリを追加
   - エンドポイントURL: デプロイ後のNetlify URL
   - サイズ: Full
   - スコープ: `profile`, `openid`
5. LIFF IDをコピー

### 2. Supabase設定

1. [Supabase](https://supabase.com/) でプロジェクトを作成
2. SQL Editorで以下のテーブルを作成:

```sql
-- ユーザーテーブル
CREATE TABLE yupoline_users (
  id BIGSERIAL PRIMARY KEY,
  line_user_id VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  picture_url TEXT,
  status_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- アクティビティログテーブル
CREATE TABLE yupoline_activity_logs (
  id BIGSERIAL PRIMARY KEY,
  line_user_id VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_users_line_user_id ON yupoline_users(line_user_id);
CREATE INDEX idx_activity_logs_line_user_id ON yupoline_activity_logs(line_user_id);
CREATE INDEX idx_activity_logs_created_at ON yupoline_activity_logs(created_at);
```

3. Project Settings → API から以下を取得:
   - Project URL
   - anon/public key

### 3. ローカル開発

```bash
# 依存関係のインストール
npm install

# 環境変数ファイルの作成（初回のみ）
cp .env.example .env
# .env を編集して実際の値を設定

# ビルド（env.jsを生成）
npm run build

# 開発サーバーの起動
npm run dev
```

ブラウザで http://localhost:3000 にアクセス

### 4. Netlifyデプロイ

#### 方法1: Netlify CLI

```bash
# Netlify CLIのインストール
npm install -g netlify-cli

# ログイン
netlify login

# デプロイ
netlify deploy --prod
```

#### 方法2: Git連携

1. GitHubにリポジトリをプッシュ
2. [Netlify](https://app.netlify.com/) でサイトを作成
3. リポジトリを連携
4. ビルド設定:
   - Build command: `npm run build`
   - Publish directory: `public`

#### 環境変数の設定

Netlify ダッシュボードで以下の環境変数を設定:

- `LIFF_ID`: LINE LIFF ID
- `SUPABASE_URL`: Supabase Project URL
- `SUPABASE_ANON_KEY`: Supabase anon key

設定方法:
1. Site settings → Environment variables
2. Add a variable で各変数を追加

**仕組み**:
- ローカル開発: `.env` ファイルから環境変数を読み込み
- Netlify: ダッシュボードで設定した環境変数を使用
- ビルド時に `npm run build` が実行され、環境変数から `public/js/env.js` ファイルが自動生成されます
- このファイルにより、ブラウザ側で環境変数を利用できるようになります

### 5. LIFF設定の更新

NetlifyのデプロイURLを取得したら、LINE Developers ConsoleでLIFFアプリのエンドポイントURLを更新してください。

## 使い方

1. LINEアプリでLIFF URLを開く
2. ログインしてプロフィール取得
3. 各種機能を利用

### 主な機能

- **プロフィール取得**: LINEプロフィール情報を取得してSupabaseに保存
- **メッセージ送信**: LINEトークにメッセージを送信
- **LIFFを閉じる**: LIFFウィンドウを閉じる

## データベーススキーマ

### yupoline_users

| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | BIGSERIAL | 主キー |
| line_user_id | VARCHAR(255) | LINE ユーザーID（ユニーク） |
| display_name | VARCHAR(255) | 表示名 |
| picture_url | TEXT | プロフィール画像URL |
| status_message | TEXT | ステータスメッセージ |
| created_at | TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | 更新日時 |

### yupoline_activity_logs

| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | BIGSERIAL | 主キー |
| line_user_id | VARCHAR(255) | LINE ユーザーID |
| action | VARCHAR(100) | アクション名 |
| metadata | JSONB | 追加情報 |
| created_at | TIMESTAMP | 作成日時 |

## トラブルシューティング

### LIFF初期化エラー

- LIFF IDが正しく設定されているか確認
- Netlifyの環境変数が正しく設定されているか確認
- LIFFアプリのエンドポイントURLが正しいか確認

### Supabase接続エラー

- Supabase URLとanon keyが正しいか確認
- Supabaseのテーブルが作成されているか確認
- RLS (Row Level Security) の設定を確認

### デプロイエラー

- `netlify.toml` の設定を確認
- ビルドコマンドが正しいか確認
- 環境変数が設定されているか確認

## カスタマイズ

### デザインの変更

`public/css/style.css` でカラーテーマや各種スタイルをカスタマイズできます。

### 機能の追加

1. `public/js/app.js` に新しい関数を追加
2. `public/index.html` にUIを追加
3. 必要に応じて `public/js/supabase.js` にデータベース操作を追加

## ライセンス

MIT

## サポート

問題が発生した場合は、issueを作成してください。
