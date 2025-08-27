-- 게임 테이블에 time_extension_count 컬럼 추가 및 기존 데이터 마이그레이션

-- 1단계: 컬럼을 nullable로 먼저 추가
ALTER TABLE game ADD COLUMN IF NOT EXISTS time_extension_count integer;

-- 2단계: 기존 레코드들의 null 값을 0으로 업데이트
UPDATE game SET time_extension_count = 0 WHERE time_extension_count IS NULL;

-- 3단계: NOT NULL 제약조건 추가
ALTER TABLE game ALTER COLUMN time_extension_count SET NOT NULL;

-- 4단계: 기본값 설정
ALTER TABLE game ALTER COLUMN time_extension_count SET DEFAULT 0;

-- gameStartDeadline 컬럼도 추가 (이미 nullable이므로 문제없음)
ALTER TABLE game ADD COLUMN IF NOT EXISTS game_start_deadline timestamp;
