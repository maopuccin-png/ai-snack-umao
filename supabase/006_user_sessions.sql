-- ユーザー来訪履歴（セッション記憶のため）
CREATE TABLE IF NOT EXISTS user_sessions (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    TEXT NOT NULL,
  session_id UUID,
  topics     TEXT,
  mood       TEXT,
  entry_drink TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions (user_id, created_at DESC);
