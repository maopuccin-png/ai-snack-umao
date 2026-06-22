-- RLSを全テーブルで有効化
-- アプリはservice_role_keyを使うのでRLSをバイパスし、動作に影響なし
-- anonキー経由の直接アクセスをすべてブロックする

ALTER TABLE messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE tips              ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys           ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins          ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_surveys     ENABLE ROW LEVEL SECURITY;

-- ポリシーなし = anon/authenticatedロールは読み書き不可
-- service_roleはRLSをバイパスするため引き続き全操作可能
