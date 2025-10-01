-- Allow WAITING_ROOM chat messages to persist
ALTER TABLE chat_message DROP CONSTRAINT IF EXISTS chat_message_type_check;

ALTER TABLE chat_message ADD CONSTRAINT chat_message_type_check
    CHECK (type IN ('HINT', 'DISCUSSION', 'DEFENSE', 'POST_ROUND', 'WAITING_ROOM', 'SYSTEM'));
