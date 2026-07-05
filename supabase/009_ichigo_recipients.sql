CREATE TABLE IF NOT EXISTS ichigo_recipients (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id  UUID,
  recipient   TEXT        NOT NULL, -- Discord ID or wallet address
  amount      INTEGER     DEFAULT 1,
  sent        BOOLEAN     DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ichigo_recipients ENABLE ROW LEVEL SECURITY;
