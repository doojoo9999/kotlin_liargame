-- Initial schema for Liar Game application

-- Base entity fields are included in each table
-- created_at and updated_at are handled by BaseEntity

-- Users table with game statistics
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    nickname VARCHAR(50) NOT NULL UNIQUE,
    profile_img_url VARCHAR(500) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_authenticated BOOLEAN NOT NULL DEFAULT false,
    has_token_issued BOOLEAN NOT NULL DEFAULT false,
    password VARCHAR(255),
    
    -- Game statistics fields
    total_games INTEGER NOT NULL DEFAULT 0,
    total_wins INTEGER NOT NULL DEFAULT 0,
    total_losses INTEGER NOT NULL DEFAULT 0,
    liar_games INTEGER NOT NULL DEFAULT 0,
    liar_wins INTEGER NOT NULL DEFAULT 0,
    citizen_games INTEGER NOT NULL DEFAULT 0,
    citizen_wins INTEGER NOT NULL DEFAULT 0,
    ranking_points INTEGER NOT NULL DEFAULT 1000,
    highest_ranking_points INTEGER NOT NULL DEFAULT 1000,
    total_playtime_seconds BIGINT NOT NULL DEFAULT 0,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- User tokens table
CREATE TABLE user_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Subjects table
CREATE TABLE subjects (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Words table
CREATE TABLE words (
    id BIGSERIAL PRIMARY KEY,
    subject_id BIGINT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    word VARCHAR(100) NOT NULL,
    difficulty_level INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(subject_id, word)
);

-- Games table
CREATE TABLE games (
    id BIGSERIAL PRIMARY KEY,
    game_id VARCHAR(100) NOT NULL UNIQUE,
    room_name VARCHAR(100) NOT NULL,
    max_players INTEGER NOT NULL DEFAULT 8,
    current_players INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'WAITING',
    subject_id BIGINT REFERENCES subjects(id),
    liar_word VARCHAR(100),
    correct_word VARCHAR(100),
    current_round INTEGER NOT NULL DEFAULT 0,
    max_rounds INTEGER NOT NULL DEFAULT 3,
    round_time_seconds INTEGER NOT NULL DEFAULT 60,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Game subjects table (for game-specific subject assignments)
CREATE TABLE game_subjects (
    id BIGSERIAL PRIMARY KEY,
    game_id BIGINT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    subject_id BIGINT NOT NULL REFERENCES subjects(id),
    word VARCHAR(100) NOT NULL,
    liar_word VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Players table
CREATE TABLE players (
    id BIGSERIAL PRIMARY KEY,
    game_id BIGINT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nickname VARCHAR(50) NOT NULL,
    is_liar BOOLEAN NOT NULL DEFAULT false,
    is_ready BOOLEAN NOT NULL DEFAULT false,
    join_order INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id, user_id)
);

-- Chat messages table
CREATE TABLE chat_messages (
    id BIGSERIAL PRIMARY KEY,
    game_id BIGINT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id),
    nickname VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    message_type VARCHAR(20) NOT NULL DEFAULT 'CHAT',
    round_number INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Game histories table
CREATE TABLE game_histories (
    id BIGSERIAL PRIMARY KEY,
    game_id VARCHAR(100) NOT NULL,
    room_name VARCHAR(100) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    liar_word VARCHAR(100) NOT NULL,
    correct_word VARCHAR(100) NOT NULL,
    total_players INTEGER NOT NULL,
    liar_user_id BIGINT NOT NULL,
    liar_nickname VARCHAR(50) NOT NULL,
    game_result VARCHAR(30) NOT NULL,
    winner_team VARCHAR(20) NOT NULL,
    game_duration_seconds BIGINT NOT NULL,
    total_rounds INTEGER NOT NULL,
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP NOT NULL,
    game_data TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Player actions table
CREATE TABLE player_actions (
    id BIGSERIAL PRIMARY KEY,
    game_history_id BIGINT NOT NULL REFERENCES game_histories(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    round_number INTEGER NOT NULL,
    action_type VARCHAR(20) NOT NULL,
    content TEXT,
    action_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Vote records table
CREATE TABLE vote_records (
    id BIGSERIAL PRIMARY KEY,
    game_history_id BIGINT NOT NULL REFERENCES game_histories(id) ON DELETE CASCADE,
    voter_user_id BIGINT NOT NULL,
    voter_nickname VARCHAR(50) NOT NULL,
    voted_user_id BIGINT NOT NULL,
    voted_nickname VARCHAR(50) NOT NULL,
    vote_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_users_nickname ON users(nickname);
CREATE INDEX idx_users_ranking_points ON users(ranking_points DESC);
CREATE INDEX idx_users_is_active ON users(is_active);

CREATE INDEX idx_user_tokens_user_id ON user_tokens(user_id);
CREATE INDEX idx_user_tokens_token ON user_tokens(token);
CREATE INDEX idx_user_tokens_expires_at ON user_tokens(expires_at);

CREATE INDEX idx_words_subject_id ON words(subject_id);
CREATE INDEX idx_words_is_active ON words(is_active);

CREATE INDEX idx_games_game_id ON games(game_id);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_created_at ON games(created_at);

CREATE INDEX idx_players_game_id ON players(game_id);
CREATE INDEX idx_players_user_id ON players(user_id);
CREATE INDEX idx_players_is_liar ON players(is_liar);

CREATE INDEX idx_chat_messages_game_id ON chat_messages(game_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

CREATE INDEX idx_game_histories_game_id ON game_histories(game_id);
CREATE INDEX idx_game_histories_liar_user_id ON game_histories(liar_user_id);
CREATE INDEX idx_game_histories_started_at ON game_histories(started_at);
CREATE INDEX idx_game_histories_game_result ON game_histories(game_result);

CREATE INDEX idx_player_actions_game_history_id ON player_actions(game_history_id);
CREATE INDEX idx_player_actions_user_id ON player_actions(user_id);
CREATE INDEX idx_player_actions_action_type ON player_actions(action_type);

CREATE INDEX idx_vote_records_game_history_id ON vote_records(game_history_id);
CREATE INDEX idx_vote_records_voter_user_id ON vote_records(voter_user_id);
CREATE INDEX idx_vote_records_voted_user_id ON vote_records(voted_user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_tokens_updated_at BEFORE UPDATE ON user_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_words_updated_at BEFORE UPDATE ON words FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_game_subjects_updated_at BEFORE UPDATE ON game_subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_game_histories_updated_at BEFORE UPDATE ON game_histories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_player_actions_updated_at BEFORE UPDATE ON player_actions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vote_records_updated_at BEFORE UPDATE ON vote_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();