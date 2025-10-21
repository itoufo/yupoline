-- ユーザープロファイルテーブル（拡張版）
CREATE TABLE IF NOT EXISTS yupoline_users (
  id BIGSERIAL PRIMARY KEY,
  line_user_id VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  picture_url TEXT,
  status_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ユーザープロファイリングデータ
CREATE TABLE IF NOT EXISTS yupoline_user_profiles (
  id BIGSERIAL PRIMARY KEY,
  line_user_id VARCHAR(255) UNIQUE NOT NULL,
  -- 基本情報
  birth_date DATE,
  gender VARCHAR(50),
  occupation VARCHAR(255),
  -- プロファイリングデータ（AIが分析した情報）
  personality_traits JSONB,
  interests JSONB,
  concerns JSONB,
  communication_style VARCHAR(100),
  -- メタデータ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (line_user_id) REFERENCES yupoline_users(line_user_id) ON DELETE CASCADE
);

-- 会話履歴テーブル
CREATE TABLE IF NOT EXISTS yupoline_conversations (
  id BIGSERIAL PRIMARY KEY,
  line_user_id VARCHAR(255) NOT NULL,
  conversation_type VARCHAR(50) NOT NULL, -- 'fortune_telling' or 'consultation'
  user_message TEXT NOT NULL,
  assistant_message TEXT NOT NULL,
  message_metadata JSONB, -- GPTの応答メタデータ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (line_user_id) REFERENCES yupoline_users(line_user_id) ON DELETE CASCADE
);

-- アクティビティログテーブル（既存）
CREATE TABLE IF NOT EXISTS yupoline_activity_logs (
  id BIGSERIAL PRIMARY KEY,
  line_user_id VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 会話セッション管理
CREATE TABLE IF NOT EXISTS yupoline_conversation_sessions (
  id BIGSERIAL PRIMARY KEY,
  line_user_id VARCHAR(255) NOT NULL,
  session_type VARCHAR(50) NOT NULL, -- 'fortune_telling' or 'consultation'
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'expired'
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  FOREIGN KEY (line_user_id) REFERENCES yupoline_users(line_user_id) ON DELETE CASCADE
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_users_line_user_id ON yupoline_users(line_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_line_user_id ON yupoline_user_profiles(line_user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_line_user_id ON yupoline_conversations(line_user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON yupoline_conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_line_user_id ON yupoline_activity_logs(line_user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON yupoline_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_line_user_id ON yupoline_conversation_sessions(line_user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON yupoline_conversation_sessions(status);

-- 自動更新トリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガーの設定
DROP TRIGGER IF EXISTS update_users_updated_at ON yupoline_users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON yupoline_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON yupoline_user_profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON yupoline_user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
