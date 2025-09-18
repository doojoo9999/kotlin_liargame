-- Nemonemo core tables
CREATE TABLE IF NOT EXISTS nemonemo_puzzle (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(24) NOT NULL UNIQUE,
    title VARCHAR(120) NOT NULL,
    description TEXT,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    solution_blob BYTEA NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    estimated_minutes INTEGER NOT NULL,
    source_type VARCHAR(20) NOT NULL,
    creator_user_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    modified_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ip_address VARCHAR(40),
    session_id VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS nemonemo_puzzle_hint (
    id BIGSERIAL PRIMARY KEY,
    puzzle_id BIGINT NOT NULL REFERENCES nemonemo_puzzle(id) ON DELETE CASCADE,
    axis VARCHAR(10) NOT NULL,
    position_index INTEGER NOT NULL,
    hint_values TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nemonemo_puzzle_hint_puzzle ON nemonemo_puzzle_hint(puzzle_id);
CREATE INDEX IF NOT EXISTS idx_nemonemo_puzzle_hint_axis ON nemonemo_puzzle_hint(axis);

CREATE TABLE IF NOT EXISTS nemonemo_creator_submission (
    id BIGSERIAL PRIMARY KEY,
    creator_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    puzzle_payload TEXT NOT NULL,
    status VARCHAR(20) NOT NULL,
    reviewer_user_id BIGINT REFERENCES users(id),
    review_notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    modified_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ip_address VARCHAR(40),
    session_id VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS nemonemo_puzzle_release (
    id BIGSERIAL PRIMARY KEY,
    puzzle_id BIGINT NOT NULL REFERENCES nemonemo_puzzle(id) ON DELETE CASCADE,
    release_pack VARCHAR(40) NOT NULL,
    release_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP,
    display_order INTEGER,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    modified_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ip_address VARCHAR(40),
    session_id VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_nemonemo_puzzle_release_pack ON nemonemo_puzzle_release(release_pack, release_at DESC);

CREATE TABLE IF NOT EXISTS nemonemo_session (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    puzzle_id BIGINT NOT NULL REFERENCES nemonemo_puzzle(id) ON DELETE CASCADE,
    release_id BIGINT REFERENCES nemonemo_puzzle_release(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    mistake_count INTEGER NOT NULL DEFAULT 0,
    hint_used INTEGER NOT NULL DEFAULT 0,
    final_score INTEGER,
    duration_seconds INTEGER,
    client_version VARCHAR(40),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    modified_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ip_address VARCHAR(40),
    session_id VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_nemonemo_session_user ON nemonemo_session(user_id);
CREATE INDEX IF NOT EXISTS idx_nemonemo_session_puzzle ON nemonemo_session(puzzle_id);
CREATE INDEX IF NOT EXISTS idx_nemonemo_session_release ON nemonemo_session(release_id);
CREATE INDEX IF NOT EXISTS idx_nemonemo_session_status ON nemonemo_session(status);

CREATE TABLE IF NOT EXISTS nemonemo_session_snapshot (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES nemonemo_session(id) ON DELETE CASCADE,
    cell_states TEXT NOT NULL,
    captured_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nemonemo_session_snapshot_session ON nemonemo_session_snapshot(session_id, captured_at DESC);

CREATE TABLE IF NOT EXISTS nemonemo_leaderboard_entry (
    id BIGSERIAL PRIMARY KEY,
    release_id BIGINT NOT NULL REFERENCES nemonemo_puzzle_release(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rank INTEGER NOT NULL,
    score INTEGER NOT NULL,
    duration_seconds INTEGER NOT NULL,
    accuracy DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    modified_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ip_address VARCHAR(40),
    session_id VARCHAR(100)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_nemonemo_leaderboard_release_user ON nemonemo_leaderboard_entry(release_id, user_id);

CREATE TABLE IF NOT EXISTS nemonemo_announcement (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(120) NOT NULL,
    body TEXT NOT NULL,
    visible_from TIMESTAMP NOT NULL,
    visible_until TIMESTAMP,
    cta_url VARCHAR(255),
    created_by BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    modified_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ip_address VARCHAR(40),
    session_id VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_nemonemo_announcement_visibility ON nemonemo_announcement(visible_from, visible_until);
