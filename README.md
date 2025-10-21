# Yupoline - AI占い師 LINE Bot

Vite + Reactで構築されたLIFFアプリと、OpenAI GPT-4oを使用したAI占い師LINE Botの統合アプリケーションです。

## 主な機能

### LINE Bot機能
- 🔮 **無料鑑定**: GPT-4oを使った本格的な占い
- 💬 **無料相談**: 優しい占い師との対話型相談
- 📊 **自動プロファイリング**: 会話からユーザーの性格や悩みを分析
- 💾 **会話履歴の保存**: パーソナライズされた応答
- ✨ **コンテキスト理解**: 過去の会話を踏まえた深い洞察

### LIFF アプリ機能
- LINE LIFFによるユーザー認証
- ユーザープロフィールの取得と表示
- Supabaseへのユーザーデータ保存
- アクティビティログの記録
- LINEへのメッセージ送信

## 技術スタック

- **フロントエンド**: Vite + React
- **LIFF SDK**: LINE Front-end Framework
- **AI**: OpenAI GPT-4o
- **LINE Bot**: LINE Messaging API SDK
- **バックエンド**: Supabase (PostgreSQL)
- **サーバーレス**: Netlify Functions
- **ホスティング**: Netlify

## プロジェクト構造

```
yupoline/
├── src/                           # フロントエンドソース（Vite + React）
│   ├── main.jsx                  # アプリケーションエントリーポイント
│   ├── App.jsx                   # メインアプリケーションコンポーネント
│   ├── index.css                 # グローバルスタイル
│   ├── components/               # Reactコンポーネント
│   │   ├── UserProfile.jsx      # ユーザープロフィール表示
│   │   ├── Actions.jsx          # アクションボタン
│   │   ├── DataDisplay.jsx      # データ表示
│   │   ├── Loading.jsx          # ローディング表示
│   │   └── ErrorMessage.jsx     # エラーメッセージ
│   ├── hooks/                    # カスタムフック
│   │   └── useLiff.js           # LIFF初期化フック
│   └── lib/                      # ライブラリとユーティリティ
│       ├── config.js            # 環境変数設定
│       └── supabase.js          # Supabaseクライアント
├── netlify/                      # Netlify Functions（サーバーレス）
│   └── functions/
│       ├── line-webhook.js      # LINE Bot Webhook
│       └── utils/
│           ├── supabase.js      # Supabase操作
│           └── openai.js        # OpenAI統合
├── database/                     # データベーススキーマ
│   └── schema.sql               # Supabaseテーブル定義
├── public/                       # 静的ファイル（旧実装）
├── index.html                    # メインHTML
├── vite.config.js               # Vite設定
├── netlify.toml                 # Netlify設定
├── package.json                 # NPM設定
├── .env.example                 # 環境変数テンプレート
├── LINE_BOT_SETUP.md           # LINE Bot セットアップガイド
└── README.md                    # このファイル
```

## セットアップ

> **📋 LINE Bot セットアップ**: LINE Bot機能の詳細なセットアップ手順については、[LINE_BOT_SETUP.md](./LINE_BOT_SETUP.md) を参照してください。

### クイックスタート

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
2. SQL Editorで `database/schema.sql` の内容を実行してテーブルを作成

データベースには以下のテーブルが作成されます：
- `yupoline_users` - ユーザー情報
- `user_profiles` - ユーザープロファイリングデータ
- `conversations` - 会話履歴
- `conversation_sessions` - 会話セッション管理
- `yupoline_activity_logs` - アクティビティログ

3. Project Settings → API から以下を取得:
   - Project URL
   - anon/public key
   - service_role key（LINE Bot用）

### 3. OpenAI API設定

1. [OpenAI Platform](https://platform.openai.com/) にログイン
2. API Keys ページで新しいキーを作成
3. キーをコピーして保存（環境変数 `OPENAI_API_KEY` に設定）

### 4. ローカル開発

```bash
# 依存関係のインストール
npm install

# 環境変数ファイルの作成（初回のみ）
cp .env.example .env
# .env を編集して実際の値を設定

# 開発サーバーの起動
npm run dev
```

ブラウザで http://localhost:5173 にアクセス

### 5. Netlifyデプロイ

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
   - Publish directory: `dist`

#### 環境変数の設定

Netlify ダッシュボードで以下の環境変数を設定:

**フロントエンド用（LIFF アプリ）**
- `VITE_LIFF_ID`: LINE LIFF ID
- `VITE_SUPABASE_URL`: Supabase Project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anon key

**サーバーサイド用（LINE Bot）**
- `LINE_CHANNEL_ACCESS_TOKEN`: LINE チャネルアクセストークン
- `LINE_CHANNEL_SECRET`: LINE チャネルシークレット
- `SUPABASE_URL`: Supabase Project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `OPENAI_API_KEY`: OpenAI API キー

設定方法:
1. Site settings → Environment variables
2. Add a variable で各変数を追加

### 6. LINE Bot Webhook設定

1. LINE Developers Consoleで Webhook URLを設定:
   ```
   https://your-netlify-site.netlify.app/.netlify/functions/line-webhook
   ```
2. Webhookの利用を **有効** にする
3. 応答メッセージを **無効** にする

### 7. LIFF設定の更新

NetlifyのデプロイURLを取得したら、LINE Developers ConsoleでLIFFアプリのエンドポイントURLを更新してください。

## 使い方

### LINE Bot（占い師機能）

1. LINE Botを友だち追加
2. トークでメッセージを送信
   - 「無料鑑定」をタップ → AI占い師が鑑定を実行
   - 「無料相談」をタップ → 相談モードで対話開始
   - 通常のメッセージ → 相談として応答
3. AI占い師があなたに合わせた応答を生成

### LIFF アプリ

1. LINEアプリでLIFF URLを開く
2. ログインしてプロフィール取得
3. 各種機能を利用
   - **プロフィール取得**: LINEプロフィール情報を取得してSupabaseに保存
   - **メッセージ送信**: LINEトークにメッセージを送信
   - **LIFFを閉じる**: LIFFウィンドウを閉じる

## データベーススキーマ

詳細は `database/schema.sql` を参照してください。

### 主要テーブル

#### yupoline_users
ユーザーの基本情報を保存

#### yupoline_user_profiles
ユーザーのプロファイリングデータ（性格、関心事、悩みなど）を保存

#### yupoline_conversations
会話履歴を保存（鑑定・相談の記録）

#### yupoline_conversation_sessions
会話セッションの管理（アクティブな相談セッション）

#### yupoline_activity_logs
ユーザーアクティビティログ

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
