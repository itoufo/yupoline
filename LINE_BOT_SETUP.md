# LINE Bot セットアップガイド

このガイドでは、AI占い師LINE Botの設定方法を説明します。

## 前提条件

- LINE Developers アカウント
- Supabase プロジェクト
- OpenAI API キー
- Netlify アカウント

## 1. LINE Messaging API チャネルの作成

### 1.1 LINE Developers Console にアクセス

1. [LINE Developers Console](https://developers.line.biz/console/) にログイン
2. プロバイダーを作成（既存のものを使用も可）
3. 新しいチャネルを作成
   - チャネルタイプ: **Messaging API**
   - チャネル名: Yupoline（任意）
   - チャネル説明: AI占い師Bot
   - 大業種・小業種: 適切なものを選択
   - メールアドレス: あなたのメールアドレス

### 1.2 チャネル設定

**Messaging API設定タブ**で以下を設定：

1. **Webhook URL** を設定
   ```
   https://your-netlify-site.netlify.app/.netlify/functions/line-webhook
   ```
   - デプロイ後のNetlify URLを使用
   - 「Webhookの利用」を **有効** にする

2. **応答メッセージ**
   - 「応答メッセージ」を **無効** にする（Botが自動応答するため）
   - 「あいさつメッセージ」は **有効** のままでOK

3. **チャネルアクセストークン**
   - 「発行」ボタンをクリックしてトークンを発行
   - このトークンを保存（後で環境変数に設定）

4. **チャネルシークレット**
   - Basic settings タブから取得
   - このシークレットを保存（後で環境変数に設定）

### 1.3 LIFF アプリの追加

**LIFF タブ**で LIFF アプリを追加：

1. 「追加」ボタンをクリック
2. 設定内容：
   - LIFF app name: Yupoline App
   - Size: **Full**
   - Endpoint URL: `https://your-netlify-site.netlify.app/`
   - Scope: `profile`, `openid`
   - Bot link feature: **On (Normal)**（推奨）

3. LIFF IDをコピー（`VITE_LIFF_ID`として使用）

## 2. データベースのセットアップ

### 2.1 Supabase SQL Editor で実行

1. [Supabase Dashboard](https://app.supabase.com/) にログイン
2. プロジェクトを選択
3. SQL Editor を開く
4. `database/schema.sql` の内容を実行

```sql
-- schema.sql の内容を貼り付けて実行
```

### 2.2 必要な認証情報を取得

**Project Settings → API** から以下を取得：

- `Project URL` → `SUPABASE_URL` / `VITE_SUPABASE_URL`
- `anon public` key → `VITE_SUPABASE_ANON_KEY`
- `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`（⚠️ 機密情報）

## 3. OpenAI API キーの取得

1. [OpenAI Platform](https://platform.openai.com/) にログイン
2. API Keys ページへ移動
3. 「Create new secret key」をクリック
4. キーをコピーして保存（`OPENAI_API_KEY`として使用）

## 4. 環境変数の設定

### 4.1 ローカル環境（開発用）

`.env` ファイルを作成：

```bash
cp .env.example .env
```

`.env` を編集して実際の値を設定：

```env
# LINE LIFF設定（フロントエンド用）
VITE_LIFF_ID=1234567890-AbCdEfGh

# Supabase設定（フロントエンド用）
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# LINE Messaging API設定（サーバーサイド用）
LINE_CHANNEL_ACCESS_TOKEN=your-channel-access-token
LINE_CHANNEL_SECRET=your-channel-secret

# Supabase設定（サーバーサイド用）
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI API設定
OPENAI_API_KEY=sk-...
```

### 4.2 Netlify環境（本番用）

Netlify Dashboard で環境変数を設定：

1. Site settings → Environment variables
2. 「Add a variable」で以下を追加：

| Key | Value |
|-----|-------|
| `VITE_LIFF_ID` | LIFFアプリのID |
| `VITE_SUPABASE_URL` | SupabaseプロジェクトURL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINEチャネルアクセストークン |
| `LINE_CHANNEL_SECRET` | LINEチャネルシークレット |
| `SUPABASE_URL` | SupabaseプロジェクトURL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `OPENAI_API_KEY` | OpenAI APIキー |

## 5. デプロイ

### 5.1 Netlify にデプロイ

```bash
# ビルド
npm run build

# Netlify CLIでデプロイ
netlify deploy --prod
```

または、GitHubと連携して自動デプロイを設定。

### 5.2 Webhook URLの確認

デプロイ後、Webhook URLを確認：

```
https://your-site-name.netlify.app/.netlify/functions/line-webhook
```

このURLをLINE Developers ConsoleのWebhook URLに設定。

### 5.3 Webhookの検証

LINE Developers Consoleで「検証」ボタンをクリック。成功すればOK。

## 6. リッチメニューの設定（オプション）

リッチメニューを設定すると、ユーザーが簡単に機能にアクセスできます。

### 6.1 リッチメニュー画像の作成

推奨サイズ: 2500 x 1686px または 2500 x 843px

画像には以下のボタンを配置：
- 🔮 無料鑑定
- 💬 無料相談

### 6.2 LINE Official Account Manager で設定

1. [LINE Official Account Manager](https://manager.line.biz/) にログイン
2. アカウントを選択
3. 「リッチメニュー」→「作成」
4. 画像をアップロード
5. タップ領域を設定
   - 左側: アクション「テキスト」→「無料鑑定」
   - 右側: アクション「テキスト」→「無料相談」

## 7. テスト

### 7.1 友だち追加

LINE Developers Console の「Messaging API」タブからQRコードを取得し、友だち追加。

### 7.2 動作確認

1. **初回メッセージ**: ウェルカムメッセージが表示される
2. **「無料鑑定」をタップ**: AI占い師が鑑定を実行
3. **「無料相談」をタップ**: 相談モードが開始
4. **通常のメッセージ**: 相談モードで応答

## 8. トラブルシューティング

### Webhookエラー

- Netlify Functionsのログを確認: `netlify functions:log`
- 環境変数が正しく設定されているか確認
- Supabaseの接続をテスト

### AIの応答がない

- OpenAI APIキーが有効か確認
- APIの利用制限に達していないか確認
- Netlify Functionsのログでエラーを確認

### データベースエラー

- Supabaseのテーブルが正しく作成されているか確認
- RLS（Row Level Security）が適切に設定されているか確認
- Service Role Keyを使用しているか確認（Anon Keyではアクセス制限がある）

## 9. セキュリティ考慮事項

1. **環境変数の管理**
   - `.env` ファイルは `.gitignore` に追加済み
   - Service Role Key は絶対に公開しない

2. **Webhook署名検証**
   - 本番環境では署名検証を実装（TODO）

3. **Rate Limiting**
   - OpenAI APIの使用量を監視
   - 必要に応じてユーザーごとの利用制限を実装

## まとめ

これで、AI占い師LINE Botのセットアップが完了です！

ユーザーは以下の機能を利用できます：
- 🔮 **無料鑑定**: GPT-4oを使った占い
- 💬 **無料相談**: 優しい占い師との対話
- 📊 **自動プロファイリング**: 会話から性格や悩みを分析
- 💾 **会話履歴の保存**: パーソナライズされた応答
