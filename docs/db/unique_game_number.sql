-- 게임 번호 중복을 막기 위한 UNIQUE 제약 추가 스크립트
-- Postgres/MySQL에서 실행 가능합니다. 이미 제약이 있으면 실패하므로 한 번만 적용하십시오.

ALTER TABLE game
    ADD CONSTRAINT uq_game_game_number UNIQUE (game_number);

-- PlayerEntity에 낙관적 잠금을 사용하기 위한 version 컬럼 추가
ALTER TABLE player
    ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
