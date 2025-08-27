-- chat_message 테이블의 type 제약 조건 수정하여 SYSTEM 타입 허용

-- 기존 체크 제약 조건 제거 (있는 경우)
ALTER TABLE chat_message DROP CONSTRAINT IF EXISTS chat_message_type_check;

-- 새로운 체크 제약 조건 추가 (모든 ChatMessageType enum 값 허용)
ALTER TABLE chat_message ADD CONSTRAINT chat_message_type_check
    CHECK (type IN ('HINT', 'DISCUSSION', 'DEFENSE', 'POST_ROUND', 'SYSTEM'));
