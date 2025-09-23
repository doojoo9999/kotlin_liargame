-- Performance optimization indexes for Liar Game backend
-- These indexes improve query performance for common operations

-- Game entity indexes
CREATE INDEX IF NOT EXISTS idx_game_state_created ON game(game_state, created_at);
CREATE INDEX IF NOT EXISTS idx_game_created_at ON game(created_at);
CREATE INDEX IF NOT EXISTS idx_game_state_updated ON game(game_state, last_updated);
CREATE INDEX IF NOT EXISTS idx_game_host_id ON game(host_id);

-- Player entity indexes  
CREATE INDEX IF NOT EXISTS idx_player_user_game ON player(user_id, game_id);
CREATE INDEX IF NOT EXISTS idx_player_game_id ON player(game_id);
CREATE INDEX IF NOT EXISTS idx_player_user_id ON player(user_id);
CREATE INDEX IF NOT EXISTS idx_player_is_online ON player(is_online);

-- Chat message indexes
CREATE INDEX IF NOT EXISTS idx_chat_game_timestamp ON chat_message(game_number, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_game_id ON chat_message(game_number);
CREATE INDEX IF NOT EXISTS idx_chat_created_at ON chat_message(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_user_id ON chat_message(user_id);

-- User entity indexes
CREATE INDEX IF NOT EXISTS idx_user_nickname ON user_entity(nickname);
CREATE INDEX IF NOT EXISTS idx_user_created_at ON user_entity(created_at);
CREATE INDEX IF NOT EXISTS idx_user_last_login ON user_entity(last_login_at);

-- Vote record indexes
CREATE INDEX IF NOT EXISTS idx_vote_game_voter ON vote_record(game_number, voter_id);
CREATE INDEX IF NOT EXISTS idx_vote_game_target ON vote_record(game_number, target_id);
CREATE INDEX IF NOT EXISTS idx_vote_round ON vote_record(round_number);

-- Subject and word indexes
CREATE INDEX IF NOT EXISTS idx_subject_category ON subject(category);
CREATE INDEX IF NOT EXISTS idx_subject_difficulty ON subject(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_word_subject ON word(subject_id);
CREATE INDEX IF NOT EXISTS idx_word_difficulty ON word(difficulty_level);

-- User token indexes (for sessions)
CREATE INDEX IF NOT EXISTS idx_user_token_token ON user_token(token);
CREATE INDEX IF NOT EXISTS idx_user_token_user_id ON user_token(user_id);
CREATE INDEX IF NOT EXISTS idx_user_token_created_at ON user_token(created_at);
CREATE INDEX IF NOT EXISTS idx_user_token_expires_at ON user_token(expires_at);

-- Profanity request indexes
CREATE INDEX IF NOT EXISTS idx_profanity_status ON profanity_request(status);
CREATE INDEX IF NOT EXISTS idx_profanity_created_at ON profanity_request(created_at);
CREATE INDEX IF NOT EXISTS idx_profanity_user_id ON profanity_request(requested_by);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_game_state_players ON game(game_state, game_participants);
CREATE INDEX IF NOT EXISTS idx_player_online_game ON player(is_online, game_id);
CREATE INDEX IF NOT EXISTS idx_chat_recent ON chat_message(game_number, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_active ON user_entity(last_login_at DESC) WHERE last_login_at IS NOT NULL;

-- Performance indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_game_admin_monitoring ON game(game_state, created_at, last_updated);
CREATE INDEX IF NOT EXISTS idx_player_admin_stats ON player(created_at, cumulative_score);
CREATE INDEX IF NOT EXISTS idx_chat_admin_monitoring ON chat_message(created_at, message_type);

-- Indexes for statistics and reporting
CREATE INDEX IF NOT EXISTS idx_game_completion_stats ON game(game_state, created_at, last_updated) 
    WHERE game_state IN ('ENDED', 'TERMINATED');
CREATE INDEX IF NOT EXISTS idx_player_performance ON player(cumulative_score DESC, games_played DESC);
CREATE INDEX IF NOT EXISTS idx_word_usage_stats ON word(subject_id, created_at);

-- Clean up any duplicate indexes (PostgreSQL specific)
-- Note: These commands are safe to run as they only drop if exists
DO $$
BEGIN
    -- Drop any existing duplicate indexes that might conflict
    DROP INDEX IF EXISTS game_state_idx;
    DROP INDEX IF EXISTS player_user_idx;
    DROP INDEX IF EXISTS chat_game_idx;
    DROP INDEX IF EXISTS user_nickname_idx;
    DROP INDEX IF EXISTS vote_game_idx;
EXCEPTION WHEN OTHERS THEN
    -- Ignore errors if indexes don't exist
    NULL;
END $$;