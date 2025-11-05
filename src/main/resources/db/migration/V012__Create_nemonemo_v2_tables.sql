-- Nemonemo V2 core content tables
CREATE TABLE IF NOT EXISTS puzzle_series (
    id UUID PRIMARY KEY,
    author_key UUID NOT NULL,
    title VARCHAR(120) NOT NULL,
    description TEXT,
    thumbnail_url VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    modified_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    ip_address VARCHAR(40),
    session_id VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS puzzles (
    id UUID PRIMARY KEY,
    title VARCHAR(120) NOT NULL,
    description TEXT,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    author_anon_id UUID REFERENCES guest_identities(anon_id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL,
    content_style VARCHAR(20) NOT NULL,
    text_likeness_score DOUBLE PRECISION NOT NULL DEFAULT 0,
    uniqueness_flag BOOLEAN NOT NULL DEFAULT FALSE,
    difficulty_score DOUBLE PRECISION,
    thumbnail_url VARCHAR(255),
    series_id UUID REFERENCES puzzle_series(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITHOUT TIME ZONE,
    official_at TIMESTAMP WITHOUT TIME ZONE,
    view_count BIGINT NOT NULL DEFAULT 0,
    play_count BIGINT NOT NULL DEFAULT 0,
    clear_count BIGINT NOT NULL DEFAULT 0,
    review_notes TEXT,
    rejection_reason TEXT,
    reviewed_at TIMESTAMP WITHOUT TIME ZONE,
    reviewer_key UUID,
    avg_time_ms BIGINT,
    avg_rating DOUBLE PRECISION,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    modified_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    ip_address VARCHAR(40),
    session_id VARCHAR(100),
    CONSTRAINT chk_puzzles_dimensions CHECK (width BETWEEN 5 AND 50 AND height BETWEEN 5 AND 50),
    CONSTRAINT chk_puzzles_status CHECK (status IN ('DRAFT','APPROVED','OFFICIAL','REJECTED')),
    CONSTRAINT chk_puzzles_content_style CHECK (content_style IN ('GENERIC_PIXEL','CLI_ASCII','LETTERFORM','SYMBOLIC','MIXED')),
    CONSTRAINT chk_puzzles_author_presence CHECK ((author_id IS NOT NULL) <> (author_anon_id IS NOT NULL)),
    CONSTRAINT chk_puzzles_difficulty CHECK (difficulty_score IS NULL OR difficulty_score >= 0),
    CONSTRAINT chk_puzzles_avg_rating CHECK (avg_rating IS NULL OR (avg_rating >= 0 AND avg_rating <= 5))
);

CREATE TABLE IF NOT EXISTS puzzle_tags (
    puzzle_id UUID NOT NULL REFERENCES puzzles(id) ON DELETE CASCADE,
    tag_value VARCHAR(40) NOT NULL,
    PRIMARY KEY (puzzle_id, tag_value)
);

CREATE TABLE IF NOT EXISTS puzzle_compliance_flags (
    puzzle_id UUID NOT NULL REFERENCES puzzles(id) ON DELETE CASCADE,
    flag_value VARCHAR(40) NOT NULL,
    PRIMARY KEY (puzzle_id, flag_value)
);

CREATE TABLE IF NOT EXISTS puzzle_series_order (
    series_id UUID NOT NULL REFERENCES puzzle_series(id) ON DELETE CASCADE,
    puzzle_id UUID NOT NULL REFERENCES puzzles(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (series_id, puzzle_id)
);

CREATE TABLE IF NOT EXISTS puzzle_hints (
    puzzle_id UUID PRIMARY KEY REFERENCES puzzles(id) ON DELETE CASCADE,
    rows JSONB NOT NULL,
    cols JSONB NOT NULL,
    version INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS puzzle_solutions (
    puzzle_id UUID PRIMARY KEY REFERENCES puzzles(id) ON DELETE CASCADE,
    grid_data BYTEA NOT NULL,
    checksum VARCHAR(128) NOT NULL
);

CREATE TABLE IF NOT EXISTS votes (
    id BIGSERIAL PRIMARY KEY,
    puzzle_id UUID NOT NULL REFERENCES puzzles(id) ON DELETE CASCADE,
    subject_key UUID NOT NULL,
    value INTEGER NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    modified_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    ip_address VARCHAR(40),
    session_id VARCHAR(100),
    CONSTRAINT uq_votes_puzzle_subject UNIQUE (puzzle_id, subject_key),
    CONSTRAINT chk_votes_value CHECK (value IN (-1, 1))
);

CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY,
    puzzle_id UUID NOT NULL REFERENCES puzzles(id) ON DELETE CASCADE,
    author_key UUID NOT NULL,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES comments(id) ON DELETE SET NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    modified_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    ip_address VARCHAR(40),
    session_id VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS ratings (
    id BIGSERIAL PRIMARY KEY,
    puzzle_id UUID NOT NULL REFERENCES puzzles(id) ON DELETE CASCADE,
    rater_key UUID NOT NULL,
    stars INTEGER NOT NULL,
    comment_id UUID REFERENCES comments(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    modified_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    ip_address VARCHAR(40),
    session_id VARCHAR(100),
    CONSTRAINT uq_ratings_puzzle_rater UNIQUE (puzzle_id, rater_key),
    CONSTRAINT chk_ratings_stars CHECK (stars BETWEEN 1 AND 5)
);

-- Play & progression tables
CREATE TABLE IF NOT EXISTS plays (
    id UUID PRIMARY KEY,
    puzzle_id UUID NOT NULL REFERENCES puzzles(id) ON DELETE CASCADE,
    subject_key UUID NOT NULL,
    mode VARCHAR(16) NOT NULL,
    started_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    finished_at TIMESTAMP WITHOUT TIME ZONE,
    client_build VARCHAR(32),
    input_events JSONB,
    mistakes INTEGER NOT NULL DEFAULT 0,
    used_hints INTEGER NOT NULL DEFAULT 0,
    progress_snapshots JSONB,
    undo_count INTEGER NOT NULL DEFAULT 0,
    combo_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    modified_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    ip_address VARCHAR(40),
    session_id VARCHAR(100),
    CONSTRAINT chk_plays_mode CHECK (mode IN ('NORMAL','TIME_ATTACK','MULTIPLAYER')),
    CONSTRAINT chk_plays_counters CHECK (
        mistakes >= 0 AND used_hints >= 0 AND undo_count >= 0 AND combo_count >= 0
    )
);

CREATE TABLE IF NOT EXISTS scores (
    puzzle_id UUID NOT NULL REFERENCES puzzles(id) ON DELETE CASCADE,
    subject_key UUID NOT NULL,
    mode VARCHAR(16) NOT NULL,
    best_time_ms BIGINT,
    best_score INTEGER,
    perfect_clear BOOLEAN NOT NULL DEFAULT FALSE,
    last_played_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    flags TEXT,
    PRIMARY KEY (puzzle_id, subject_key, mode),
    CONSTRAINT chk_scores_mode CHECK (mode IN ('NORMAL','TIME_ATTACK','MULTIPLAYER')),
    CONSTRAINT chk_scores_metrics CHECK (
        (best_time_ms IS NULL OR best_time_ms >= 0) AND
        (best_score IS NULL OR best_score >= 0)
    )
);

CREATE TABLE IF NOT EXISTS daily_picks (
    pick_date DATE PRIMARY KEY,
    items JSONB NOT NULL,
    generated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS follows (
    id BIGSERIAL PRIMARY KEY,
    follower_key UUID NOT NULL,
    followee_key UUID NOT NULL,
    followed_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_follows_pair UNIQUE (follower_key, followee_key)
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY,
    recipient_key UUID NOT NULL,
    type VARCHAR(32) NOT NULL,
    title VARCHAR(120) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(255),
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    modified_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    ip_address VARCHAR(40),
    session_id VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS game_settings (
    subject_key UUID PRIMARY KEY,
    settings JSONB NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- Challenge & achievement tables
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    title VARCHAR(120) NOT NULL,
    description TEXT NOT NULL,
    icon_url VARCHAR(255),
    tier VARCHAR(16) NOT NULL,
    points INTEGER NOT NULL,
    conditions JSONB NOT NULL,
    CONSTRAINT chk_achievements_tier CHECK (tier IN ('BRONZE','SILVER','GOLD','PLATINUM')),
    CONSTRAINT chk_achievements_points CHECK (points >= 0)
);

CREATE TABLE IF NOT EXISTS user_achievements (
    subject_key UUID NOT NULL,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    progress JSONB,
    PRIMARY KEY (subject_key, achievement_id)
);

CREATE TABLE IF NOT EXISTS challenges (
    id UUID PRIMARY KEY,
    type VARCHAR(16) NOT NULL,
    title VARCHAR(120) NOT NULL,
    description TEXT,
    requirements JSONB NOT NULL,
    rewards JSONB NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    active BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT chk_challenges_type CHECK (type IN ('DAILY','WEEKLY','MONTHLY')),
    CONSTRAINT chk_challenges_dates CHECK (end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS user_challenges (
    subject_key UUID NOT NULL,
    challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    progress JSONB NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMP WITHOUT TIME ZONE,
    claimed BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (subject_key, challenge_id)
);

CREATE TABLE IF NOT EXISTS season_passes (
    id UUID PRIMARY KEY,
    season_number INTEGER NOT NULL UNIQUE,
    title VARCHAR(120) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    tiers JSONB NOT NULL,
    active BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS user_season_progress (
    subject_key UUID NOT NULL,
    season_id UUID NOT NULL REFERENCES season_passes(id) ON DELETE CASCADE,
    tier_level INTEGER NOT NULL DEFAULT 0,
    xp BIGINT NOT NULL DEFAULT 0,
    last_claimed_tier INTEGER,
    premium BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (subject_key, season_id),
    CONSTRAINT chk_user_season_progress CHECK (tier_level >= 0 AND xp >= 0)
);

-- Multiplayer tables
CREATE TABLE IF NOT EXISTS multiplayer_sessions (
    id UUID PRIMARY KEY,
    mode VARCHAR(12) NOT NULL,
    puzzle_id UUID NOT NULL REFERENCES puzzles(id) ON DELETE CASCADE,
    host_key UUID NOT NULL,
    status VARCHAR(16) NOT NULL,
    participants JSONB NOT NULL,
    started_at TIMESTAMP WITHOUT TIME ZONE,
    finished_at TIMESTAMP WITHOUT TIME ZONE,
    result JSONB,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_multiplayer_mode CHECK (mode IN ('COOP','VERSUS','RELAY')),
    CONSTRAINT chk_multiplayer_status CHECK (status IN ('WAITING','IN_PROGRESS','FINISHED'))
);

CREATE TABLE IF NOT EXISTS multiplayer_participants (
    session_id UUID NOT NULL REFERENCES multiplayer_sessions(id) ON DELETE CASCADE,
    subject_key UUID NOT NULL,
    joined_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    ready BOOLEAN NOT NULL DEFAULT FALSE,
    score INTEGER,
    finish_time_ms BIGINT,
    disconnected BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (session_id, subject_key),
    CONSTRAINT chk_multiplayer_participant_metrics CHECK (
        (score IS NULL OR score >= 0) AND (finish_time_ms IS NULL OR finish_time_ms >= 0)
    )
);

-- Supporting indexes
CREATE INDEX IF NOT EXISTS idx_puzzles_status ON puzzles(status);
CREATE INDEX IF NOT EXISTS idx_puzzles_official_at ON puzzles(official_at);
CREATE INDEX IF NOT EXISTS idx_puzzle_tags_value ON puzzle_tags(tag_value);
CREATE INDEX IF NOT EXISTS idx_comments_puzzle ON comments(puzzle_id);
CREATE INDEX IF NOT EXISTS idx_ratings_puzzle ON ratings(puzzle_id);
CREATE INDEX IF NOT EXISTS idx_plays_puzzle ON plays(puzzle_id);
CREATE INDEX IF NOT EXISTS idx_plays_subject ON plays(subject_key);
CREATE INDEX IF NOT EXISTS idx_scores_puzzle ON scores(puzzle_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_key);
CREATE INDEX IF NOT EXISTS idx_multiplayer_sessions_status ON multiplayer_sessions(status);
