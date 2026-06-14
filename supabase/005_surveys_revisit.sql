-- surveys テーブルに再訪意向スコアを追加
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS revisit INTEGER CHECK (revisit BETWEEN 1 AND 5);
