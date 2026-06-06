-- surveys テーブルに入店時のドリンク選択を追加（リフトアップ計測用）
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS entry_drink TEXT;
