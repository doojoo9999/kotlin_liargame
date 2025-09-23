-- 게임 테이블에 마지막 활동 시간 컬럼 추가
ALTER TABLE game ADD COLUMN last_activity_at TIMESTAMP;

-- 기존 게임들의 마지막 활동 시간을 생성 시간으로 초기화
UPDATE game SET last_activity_at = created_at WHERE last_activity_at IS NULL;
