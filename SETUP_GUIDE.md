# Yupoline セットアップガイド

このガイドに従って、AI占い師LINE Botを0から構築します。

## 📋 必要なもの

- LINEアカウント
- GitHubアカウント
- Netlifyアカウント（無料）
- Supabaseアカウント（無料）
- OpenAI APIアカウント（有料）

---

## ステップ1: Supabaseのセットアップ

### 1.1 プロジェクトの作成

1. [Supabase](https://supabase.com/) にアクセスしてログイン
2. 「New Project」をクリック
3. プロジェクト情報を入力：
   - **Name**: `yupoline`（任意）
   - **Database Password**: 強力なパスワードを設定（メモしておく）
   - **Region**: `Northeast Asia (Tokyo)` を推奨
4. 「Create new project」をクリック
5. プロジェクトの作成を待つ（1-2分）

### 1.2 データベーステーブルの作成

1. 左サイドバーから「SQL Editor」をクリック
2. 「New Query」をクリック
3. `database/schema.sql` の内容をコピー＆ペースト
4. 「Run」ボタンをクリックして実行
5. 「Success」と表示されればOK

### 1.3 API認証情報の取得

1. 左サイドバーから「Project Settings」をクリック
2. 「API」タブを選択
3. 以下の情報をメモ帳にコピー：
   ```
   Project URL: https://xxxxx.supabase.co
   anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

⚠️ **重要**: `service_role key` は絶対に公開しないでください！

---

## ステップ2: OpenAI APIのセットアップ

### 2.1 アカウントの作成

1. [OpenAI Platform](https://platform.openai.com/) にアクセス
2. アカウントを作成（既存のアカウントでログイン）
3. 支払い方法を設定（クレジットカード登録）

### 2.2 APIキーの作成

1. 左サイドバーから「API keys」をクリック
2. 「Create new secret key」をクリック
3. キーに名前を付ける：`yupoline-bot`
4. 「Create secret key」をクリック
5. 表示されたキーをコピーしてメモ（**二度と表示されません！**）
   ```
   sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### 2.3 使用量の確認

- [Usage](https://platform.openai.com/usage) ページで使用量を確認できます
- GPT-4oは1000トークンあたり約$0.005〜$0.015程度です

---

## ステップ3: LINE Developersのセットアップ

### 3.1 プロバイダーの作成

1. [LINE Developers Console](https://developers.line.biz/console/) にアクセス
2. LINEアカウントでログイン
3. 「プロバイダー作成」をクリック
4. プロバイダー名を入力：`Yupoline`（任意）
5. 「作成」をクリック

### 3.2 Messaging APIチャネルの作成

1. 作成したプロバイダーをクリック
2. 「チャネルを作成」→「Messaging API」を選択
3. チャネル情報を入力：
   - **チャネル名**: `Yupoline AI占い師`
   - **チャネル説明**: `優しいAI占い師があなたをサポート`
   - **大業種**: `個人`
   - **小業種**: `個人（その他）`
   - **メールアドレス**: あなたのメールアドレス
4. 利用規約に同意して「作成」をクリック

### 3.3 Messaging API設定

「Messaging API設定」タブで以下を設定：

#### チャネルアクセストークンの発行

1. 「チャネルアクセストークン（長期）」セクションで「発行」をクリック
2. 表示されたトークンをコピーしてメモ
   ```
   Bearer xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

#### 応答設定

1. 「応答メッセージ」を **無効** にする
2. 「Webhook」を **有効** にする（後で設定）
3. 「あいさつメッセージ」は **有効** のままでOK

#### Webhook URLの設定

⚠️ **注意**: この設定はNetlifyデプロイ後に行います（ステップ6で実施）

### 3.4 チャネルシークレットの取得

1. 「Basic settings」タブをクリック
2. 「チャネルシークレット」をコピーしてメモ
   ```
   xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### 3.5 LIFFアプリの作成

1. 「LIFF」タブをクリック
2. 「追加」ボタンをクリック
3. LIFF情報を入力：
   - **LIFF app name**: `Yupoline App`
   - **サイズ**: `Full`
   - **エンドポイントURL**: `https://example.com`（一旦仮のURL、後で変更）
   - **Scope**: `profile`と`openid`を選択
   - **Bot link feature**: `On (Normal)`
4. 「追加」をクリック
5. 作成された **LIFF ID** をコピーしてメモ
   ```
   1234567890-AbCdEfGh
   ```

⚠️ **注意**: エンドポイントURLはNetlifyデプロイ後に更新します（ステップ6で実施）

---

## ステップ4: ローカル環境のセットアップ

### 4.1 リポジトリのクローン

```bash
cd ~/Dev
git clone <your-repository-url>
cd yupoline
```

または既存のディレクトリで：

```bash
cd /Users/yuho/Dev/yupoline
```

### 4.2 依存関係のインストール

```bash
npm install
```

### 4.3 環境変数ファイルの作成

```bash
cp .env.example .env
```

### 4.4 .envファイルの編集

`.env` ファイルを開いて、ステップ1〜3で取得した値を設定：

```env
# LINE LIFF設定（フロントエンド用）
VITE_LIFF_ID=1234567890-AbCdEfGh

# Supabase設定（フロントエンド用）
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# LINE Messaging API設定（サーバーサイド用）
LINE_CHANNEL_ACCESS_TOKEN=Bearer xxxxxxxxxxxxxxxxxxxxxx
LINE_CHANNEL_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Supabase設定（サーバーサイド用）
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI API設定
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxx
```

### 4.5 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:5173 にアクセスして動作確認

---

## ステップ5: Netlifyへのデプロイ

### 5.1 GitHubリポジトリの作成

1. [GitHub](https://github.com/) で新しいリポジトリを作成
2. リポジトリ名：`yupoline`
3. PublicまたはPrivateを選択
4. 「Create repository」をクリック

### 5.2 コードをGitHubにプッシュ

```bash
git init
git add .
git commit -m "Initial commit: AI占い師LINE Bot"
git branch -M main
git remote add origin https://github.com/your-username/yupoline.git
git push -u origin main
```

### 5.3 Netlifyでサイトを作成

1. [Netlify](https://app.netlify.com/) にログイン
2. 「Add new site」→「Import an existing project」をクリック
3. 「GitHub」を選択
4. リポジトリ `yupoline` を選択
5. ビルド設定を確認：
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. 「Deploy site」をクリック

### 5.4 Netlifyの環境変数を設定

1. デプロイされたサイトの「Site settings」をクリック
2. 「Environment variables」をクリック
3. 「Add a variable」で以下を追加：

| Key | Value |
|-----|-------|
| `VITE_LIFF_ID` | LIFFアプリのID |
| `VITE_SUPABASE_URL` | SupabaseのProject URL |
| `VITE_SUPABASE_ANON_KEY` | Supabaseのanon key |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINEチャネルアクセストークン |
| `LINE_CHANNEL_SECRET` | LINEチャネルシークレット |
| `SUPABASE_URL` | SupabaseのProject URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabaseのservice_role key |
| `OPENAI_API_KEY` | OpenAI APIキー |

### 5.5 再デプロイ

1. 「Deploys」タブをクリック
2. 「Trigger deploy」→「Deploy site」をクリック
3. デプロイが完了するまで待つ（1-2分）
4. デプロイされたURLをコピー：
   ```
   https://your-site-name.netlify.app
   ```

---

## ステップ6: LINE設定の最終調整

### 6.1 Webhook URLの設定

1. LINE Developers Console の「Messaging API設定」タブを開く
2. 「Webhook URL」に以下を入力：
   ```
   https://your-site-name.netlify.app/.netlify/functions/line-webhook
   ```
3. 「更新」をクリック
4. 「検証」ボタンをクリックして成功を確認

### 6.2 LIFF エンドポイントURLの更新

1. 「LIFF」タブを開く
2. 作成したLIFFアプリの「編集」をクリック
3. 「エンドポイントURL」を更新：
   ```
   https://your-site-name.netlify.app
   ```
4. 「更新」をクリック

### 6.3 QRコードの取得

1. 「Messaging API設定」タブを開く
2. 「QRコード」をクリックしてダウンロード

---

## ステップ7: テスト

### 7.1 友だち追加

1. QRコードをスキャンしてBotを友だち追加
2. ウェルカムメッセージが表示されることを確認

### 7.2 機能テスト

#### 無料鑑定のテスト

1. 「🔮 無料鑑定」ボタンをタップ
2. AI占い師からの鑑定結果が返ってくることを確認

#### 無料相談のテスト

1. 「💬 無料相談」ボタンをタップ
2. 相談メッセージを送信
3. AI占い師からの応答が返ってくることを確認
4. 続けて会話ができることを確認

#### プロファイリングのテスト

1. 3〜5回メッセージをやり取り
2. Supabase Dashboard で `yupoline_user_profiles` テーブルを確認
3. 自動的にプロファイルが作成されていることを確認

---

## ステップ8: リッチメニューの設定（オプション）

### 8.1 画像の準備

- サイズ: 2500 x 1686px または 2500 x 843px
- 推奨レイアウト: 左右2分割
  - 左: 🔮 無料鑑定
  - 右: 💬 無料相談

### 8.2 リッチメニューの作成

1. [LINE Official Account Manager](https://manager.line.biz/) にログイン
2. アカウントを選択
3. 「ホーム」→「トークルーム管理」→「リッチメニュー」
4. 「作成」をクリック
5. 設定：
   - **タイトル**: メニュー
   - **表示期間**: 常に表示
   - **メニューバーのテキスト**: タップして選択
   - **テンプレート**: 大（2分割）を選択
6. 画像をアップロード
7. アクションを設定：
   - 左エリア: 「テキスト」→「無料鑑定」
   - 右エリア: 「テキスト」→「無料相談」
8. 「保存」をクリック

---

## トラブルシューティング

### Webhookが動作しない

**確認事項**:
- Netlify Functions のログを確認: `netlify functions:log line-webhook`
- Webhook URLが正しいか確認
- 環境変数が正しく設定されているか確認

**解決方法**:
1. LINE Developers Console で「検証」ボタンをクリック
2. エラーメッセージを確認
3. Netlify Dashboard の「Functions」タブでログを確認

### AIが応答しない

**確認事項**:
- OpenAI APIキーが有効か
- APIの利用制限に達していないか
- Netlify Functions のタイムアウト設定

**解決方法**:
1. OpenAI Platform で使用量を確認
2. APIキーを再生成して環境変数を更新
3. Netlifyで再デプロイ

### データベースエラー

**確認事項**:
- Supabaseのテーブルが正しく作成されているか
- Service Role Keyを使用しているか

**解決方法**:
1. Supabase Dashboard でテーブルを確認
2. `database/schema.sql` を再実行
3. 環境変数 `SUPABASE_SERVICE_ROLE_KEY` を確認

### LIFFアプリが開かない

**確認事項**:
- LIFF IDが正しいか
- エンドポイントURLが正しいか
- Netlifyが正常にデプロイされているか

**解決方法**:
1. LIFF IDを再確認
2. エンドポイントURLを確認
3. Netlifyでサイトが公開されているか確認

---

## セキュリティのベストプラクティス

1. **環境変数の管理**
   - `.env` ファイルは絶対にGitにコミットしない
   - Service Role Keyは絶対に公開しない

2. **APIキーの保護**
   - OpenAI APIキーは定期的に更新
   - 使用量を監視

3. **Webhook署名検証**
   - 本番環境では署名検証を実装推奨

4. **Rate Limiting**
   - ユーザーごとの利用制限を検討

---

## 料金の目安

### OpenAI API（GPT-4o）
- 入力: 1Mトークンあたり $2.50
- 出力: 1Mトークンあたり $10.00
- **目安**: 1会話あたり約¥1〜5円程度

### Supabase
- 無料プラン: 500MBストレージ、50,000行まで
- **目安**: 小規模運用なら無料枠で十分

### Netlify
- 無料プラン: 100GB/月、Functions 125,000リクエスト/月
- **目安**: 小規模運用なら無料枠で十分

---

## まとめ

これで、AI占い師LINE Botのセットアップが完了しました！

ユーザーは以下の機能を楽しめます：
- 🔮 **無料鑑定**: GPT-4oによる本格的な占い
- 💬 **無料相談**: 優しい占い師との対話
- 📊 **自動プロファイリング**: 個人に合わせた応答
- 💾 **会話履歴**: 過去の会話を踏まえた深い洞察

ご不明な点があれば、GitHubのIssuesでお気軽にお問い合わせください！
