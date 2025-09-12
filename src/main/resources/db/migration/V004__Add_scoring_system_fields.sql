-- Add scoring system fields for target points and cumulative player scores

-- Add targetPoints field to game table
ALTER TABLE game 
ADD COLUMN target_points INTEGER NOT NULL DEFAULT 10;

-- Add comment for clarity
COMMENT ON COLUMN game.target_points IS '점수 기반 승리 조건을 위한 목표 점수';

-- Add cumulativeScore field to player table  
ALTER TABLE player
ADD COLUMN cumulative_score INTEGER NOT NULL DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN player.cumulative_score IS '플레이어의 누적 점수 (라운드 간 보존)';