ALTER TABLE plays
    ADD COLUMN last_submission_key VARCHAR(64),
    ADD COLUMN last_submission_result JSONB;


CREATE TABLE IF NOT EXISTS puzzle_audit_logs (
    id UUID PRIMARY KEY,
    puzzle_id UUID NOT NULL REFERENCES puzzles(id) ON DELETE CASCADE,
    action VARCHAR(40) NOT NULL,
    actor_key UUID NOT NULL,
    payload JSONB,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    modified_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    ip_address VARCHAR(40),
    session_id VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_puzzle_audit_logs_puzzle_created_at
    ON puzzle_audit_logs (puzzle_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_puzzle_audit_logs_actor
    ON puzzle_audit_logs (actor_key, created_at DESC);
