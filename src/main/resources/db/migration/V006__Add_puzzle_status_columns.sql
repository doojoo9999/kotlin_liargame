ALTER TABLE nemonemo_puzzle
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'DRAFT';

ALTER TABLE nemonemo_puzzle
    ADD COLUMN IF NOT EXISTS difficulty_score DOUBLE PRECISION;

ALTER TABLE nemonemo_puzzle
    ADD COLUMN IF NOT EXISTS validation_checksum VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_nemonemo_puzzle_status ON nemonemo_puzzle(status);
