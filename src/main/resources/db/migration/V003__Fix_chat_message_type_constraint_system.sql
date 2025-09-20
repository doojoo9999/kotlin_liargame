-- 채팅 메시지 타입 체크 제약 조건에 SYSTEM 타입 추가
ALTER TABLE chat_message DROP CONSTRAINT IF EXISTS chat_message_type_check;

ALTER TABLE chat_message ADD CONSTRAINT chat_message_type_check
CHECK (type IN ('HINT', 'DISCUSSION', 'DEFENSE', 'POST_ROUND', 'SYSTEM'));
