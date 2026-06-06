-- アンケート回答（理解度スコア）
CREATE TABLE IF NOT EXISTS surveys (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  nickname   TEXT,
  rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_surveys_session ON surveys (session_id);
CREATE INDEX IF NOT EXISTS idx_surveys_created ON surveys (created_at DESC);
