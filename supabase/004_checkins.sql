-- 入店時ドリンク選択ログ（リフトアップ計測の入口）
CREATE TABLE IF NOT EXISTS checkins (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL UNIQUE,
  nickname   TEXT,
  entry_drink TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checkins_created ON checkins (created_at DESC);
