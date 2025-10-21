# 複数Bot運用ガイド

このプロジェクトは1つのWebhookエンドポイントで複数のLINE Botを運用できます。

## 現在対応しているBot

### 1. 占い師Bot (@079patur)
- **機能**: AI占い、相談機能
- **ファイル**: `netlify/functions/bots/fortune-teller.js`
- **環境変数**:
  - `FORTUNE_BOT_USER_ID`
  - `FORTUNE_BOT_CHANNEL_ACCESS_TOKEN`
  - `FORTUNE_BOT_CHANNEL_SECRET`

### 2. ビジネスコンサルBot
- **機能**: ステップメール（準備中）
- **ファイル**: `netlify/functions/bots/business-consultant.js`
- **環境変数**:
  - `BUSINESS_BOT_USER_ID`
  - `BUSINESS_BOT_CHANNEL_ACCESS_TOKEN`
  - `BUSINESS_BOT_CHANNEL_SECRET`

## セットアップ手順

### 1. Bot User IDの取得方法

Bot User IDは、LINE Developers Consoleでは直接表示されませんが、以下の方法で取得できます：

#### 方法A: Webhook URLでテストメッセージを送信
1. Botに任意のメッセージを送信
2. Netlify Functionsのログを確認
3. Webhookの`destination`フィールドに表示されるIDがBot User ID

#### 方法B: LINE Messaging API SDKを使用
```javascript
// Webhookイベントから取得
console.log('Destination (Bot User ID):', body.destination)
```

### 2. 環境変数の設定

Netlifyダッシュボードで以下の環境変数を設定：

#### 占い師Bot
```
FORTUNE_BOT_USER_ID=U1234567890abcdef...
FORTUNE_BOT_CHANNEL_ACCESS_TOKEN=your-fortune-bot-access-token
FORTUNE_BOT_CHANNEL_SECRET=your-fortune-bot-secret
```

#### ビジネスコンサルBot
```
BUSINESS_BOT_USER_ID=U0987654321fedcba...
BUSINESS_BOT_CHANNEL_ACCESS_TOKEN=your-business-bot-access-token
BUSINESS_BOT_CHANNEL_SECRET=your-business-bot-secret
```

### 3. Webhook URLの設定

**重要**: 両方のBotで同じWebhook URLを使用します。

```
https://your-netlify-site.netlify.app/.netlify/functions/line-webhook
```

各BotのLINE Developers Consoleで：
1. Messaging API設定 → Webhook設定
2. Webhook URLを上記に設定
3. Webhookの利用を**有効**にする

## アーキテクチャ

```
LINE Webhook Request
       ↓
line-webhook.js (Router)
       ↓
[destinationで判別]
       ↓
   ┌───┴───┐
   ↓       ↓
fortune  business
-teller  -consultant
  .js      .js
```

### 処理フロー

1. **Webhookリクエスト受信**
   - すべてのBotからのリクエストが `line-webhook.js` に届く

2. **Bot判別**
   - `body.destination` (Bot User ID) を確認
   - 対応するBotハンドラーを選択

3. **処理実行**
   - 各Bot専用のハンドラーでイベントを処理
   - 各Botは独自のLINE Clientインスタンスを使用

## 新しいBotの追加方法

### 1. Botハンドラーファイルを作成

`netlify/functions/bots/your-new-bot.js` を作成：

```javascript
import { Client } from '@line/bot-sdk'
import { getOrCreateUser, saveActivityLog } from '../utils/supabase.js'

let client = null

export function initializeClient(config) {
  client = new Client(config)
  return client
}

async function handleMessageEvent(event) {
  // メッセージ処理のロジック
}

export async function handleEvents(webhookEvents) {
  const results = await Promise.all(
    webhookEvents.map(async (webhookEvent) => {
      // イベント処理
    })
  )
  return results
}
```

### 2. メインwebhookに追加

`netlify/functions/line-webhook.js` の `BOTS` オブジェクトに追加：

```javascript
import * as yourNewBot from './bots/your-new-bot.js'

const BOTS = {
  // ... 既存のBot ...
  yourBot: {
    userId: process.env.YOUR_BOT_USER_ID,
    config: {
      channelAccessToken: process.env.YOUR_BOT_CHANNEL_ACCESS_TOKEN,
      channelSecret: process.env.YOUR_BOT_CHANNEL_SECRET
    },
    handler: yourNewBot
  }
}
```

### 3. 環境変数を追加

Netlifyダッシュボードで：
- `YOUR_BOT_USER_ID`
- `YOUR_BOT_CHANNEL_ACCESS_TOKEN`
- `YOUR_BOT_CHANNEL_SECRET`

## 後方互換性

古い環境変数（`LINE_CHANNEL_ACCESS_TOKEN`, `LINE_CHANNEL_SECRET`）も引き続きサポートしています。
これらが設定されている場合、占い師Botのフォールバックとして使用されます。

## トラブルシューティング

### Bot User IDがわからない

1. 一時的に `line-webhook.js` でログ出力を追加：
```javascript
console.log('Destination:', body.destination)
```

2. Botにメッセージを送信

3. Netlify Functionsのログを確認

### メッセージが届かない

1. Webhook URLが正しく設定されているか確認
2. 環境変数が正しく設定されているか確認
3. Netlify Functionsのログでエラーを確認

### 間違ったBotが応答する

1. `FORTUNE_BOT_USER_ID` と `BUSINESS_BOT_USER_ID` が正しいか確認
2. ログで `destination` と設定値を比較

## 開発のヒント

- 各Botは完全に独立しているため、異なる機能を実装できます
- 共通のユーティリティ（Supabase, OpenAIなど）は `utils/` フォルダで共有
- 各Botのテストは、それぞれのLINE Bot アカウントから行います
