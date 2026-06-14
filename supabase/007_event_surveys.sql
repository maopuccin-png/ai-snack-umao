CREATE TABLE IF NOT EXISTS event_surveys (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id  UUID,
  nickname    TEXT,
  rating      INTEGER CHECK (rating BETWEEN 1 AND 5),
  course_good INTEGER CHECK (course_good BETWEEN 1 AND 5),
  impression  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);
