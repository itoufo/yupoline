-- 配信メッセージテーブル
CREATE TABLE IF NOT EXISTS yupoline_broadcast_messages (
  id BIGSERIAL PRIMARY KEY,
  bot_type VARCHAR(50) NOT NULL, -- 'fortune' or 'business'
  title VARCHAR(255) NOT NULL, -- 管理用のタイトル
  message_text TEXT NOT NULL, -- 配信するメッセージ本文
  message_type VARCHAR(50) DEFAULT 'text', -- 'text', 'flex', 'template' など
  message_data JSONB, -- メッセージの詳細データ（Flex MessageやTemplateの場合）
  target_type VARCHAR(50) DEFAULT 'all', -- 'all', 'specific', 'segment'
  target_users JSONB, -- 特定ユーザーへの配信の場合、LINE User IDの配列
  target_filter JSONB, -- セグメント配信の場合のフィルター条件
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'scheduled', 'sending', 'completed', 'failed'
  scheduled_at TIMESTAMP WITH TIME ZONE, -- 予約配信の日時（NULLの場合は即時配信）
  sent_at TIMESTAMP WITH TIME ZONE, -- 実際に送信開始した日時
  completed_at TIMESTAMP WITH TIME ZONE, -- 送信完了した日時
  total_target_count INTEGER DEFAULT 0, -- 配信対象者数
  sent_count INTEGER DEFAULT 0, -- 送信成功数
  failed_count INTEGER DEFAULT 0, -- 送信失敗数
  created_by VARCHAR(255), -- 作成者
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 配信ログテーブル（個別の送信履歴）
CREATE TABLE IF NOT EXISTS yupoline_broadcast_logs (
  id BIGSERIAL PRIMARY KEY,
  broadcast_message_id BIGINT NOT NULL,
  line_user_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL, -- 'success', 'failed'
  error_message TEXT, -- エラーがあった場合のメッセージ
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (broadcast_message_id) REFERENCES yupoline_broadcast_messages(id) ON DELETE CASCADE,
  FOREIGN KEY (line_user_id) REFERENCES yupoline_users(line_user_id) ON DELETE CASCADE
);

-- 管理者テーブル（簡易認証用）
CREATE TABLE IF NOT EXISTS yupoline_admins (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL, -- bcryptでハッシュ化
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_broadcast_messages_bot_type ON yupoline_broadcast_messages(bot_type);
CREATE INDEX IF NOT EXISTS idx_broadcast_messages_status ON yupoline_broadcast_messages(status);
CREATE INDEX IF NOT EXISTS idx_broadcast_messages_scheduled_at ON yupoline_broadcast_messages(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_broadcast_logs_broadcast_id ON yupoline_broadcast_logs(broadcast_message_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_logs_line_user_id ON yupoline_broadcast_logs(line_user_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_logs_sent_at ON yupoline_broadcast_logs(sent_at);

-- 自動更新トリガー
DROP TRIGGER IF EXISTS update_broadcast_messages_updated_at ON yupoline_broadcast_messages;
CREATE TRIGGER update_broadcast_messages_updated_at BEFORE UPDATE ON yupoline_broadcast_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admins_updated_at ON yupoline_admins;
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON yupoline_admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- デフォルト管理者の作成（パスワード: admin123 のハッシュ）
-- 本番環境では必ず変更してください！
INSERT INTO yupoline_admins (username, password_hash, email)
VALUES ('admin', '$2b$10$rKvVJH3O7qFY7qY7qFY7qOqFY7qFY7qFY7qFY7qFY7qFY7qFY7qF', 'admin@example.com')
ON CONFLICT (username) DO NOTHING;

COMMENT ON TABLE yupoline_broadcast_messages IS '配信メッセージ（予約配信含む）';
COMMENT ON TABLE yupoline_broadcast_logs IS '配信ログ（個別の送信履歴）';
COMMENT ON TABLE yupoline_admins IS '管理者アカウント';
