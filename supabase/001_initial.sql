-- チャットメッセージ（ユーザー発言 + AI応答）
CREATE TABLE IF NOT EXISTS messages (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID        NOT NULL,
  nickname   TEXT,
  mood       TEXT,
  role       TEXT        NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT        NOT NULL,
  character_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_session ON messages (session_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages (created_at DESC);

-- 投げ銭イベント
CREATE TABLE IF NOT EXISTS tips (
  id         UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID    NOT NULL,
  nickname   TEXT,
  amount     INTEGER NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tips_session ON tips (session_id);

-- キャラクター設定（管理画面での上書き用）
CREATE TABLE IF NOT EXISTS character_settings (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  title        TEXT NOT NULL,
  emoji        TEXT NOT NULL,
  color        TEXT NOT NULL,
  bg_color     TEXT NOT NULL,
  join_line    TEXT DEFAULT '',
  intro        TEXT DEFAULT '',
  system_prompt TEXT DEFAULT '',
  updated_at   TIMESTAMPTZ DEFAULT now()
);
