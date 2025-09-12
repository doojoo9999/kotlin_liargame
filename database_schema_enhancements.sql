-- =============================================
-- Database Schema Enhancements for Complete Game Flow
-- =============================================

-- 1. Score History and Tracking Tables
-- =============================================

CREATE TABLE score_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    game_number INT NOT NULL,
    user_id BIGINT NOT NULL,
    round INT NOT NULL,
    base_score INT NOT NULL DEFAULT 0,
    bonus_score INT NOT NULL DEFAULT 0,
    total_score INT NOT NULL DEFAULT 0,
    cumulative_score INT NOT NULL DEFAULT 0,
    reason VARCHAR(500),
    outcome VARCHAR(50) NOT NULL,
    awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_score_history_game_round (game_number, round),
    INDEX idx_score_history_user (user_id),
    INDEX idx_score_history_outcome (outcome)
);

CREATE TABLE player_statistics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    
    -- Game participation stats
    total_games_played INT DEFAULT 0,
    games_won INT DEFAULT 0,
    games_lost INT DEFAULT 0,
    
    -- Role-specific stats
    rounds_as_citizen INT DEFAULT 0,
    rounds_as_liar INT DEFAULT 0,
    successful_citizen_rounds INT DEFAULT 0,
    successful_liar_rounds INT DEFAULT 0,
    
    -- Voting accuracy
    total_votes_cast INT DEFAULT 0,
    accurate_votes INT DEFAULT 0,
    voting_accuracy_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Performance metrics
    average_score_per_game DECIMAL(6,2) DEFAULT 0.00,
    highest_single_game_score INT DEFAULT 0,
    fastest_hint_time_seconds INT,
    consistency_score DECIMAL(5,2) DEFAULT 0.00,
    
    -- Streaks and achievements
    current_win_streak INT DEFAULT 0,
    longest_win_streak INT DEFAULT 0,
    perfect_accuracy_rounds INT DEFAULT 0,
    
    -- Timestamps
    first_game_at TIMESTAMP NULL,
    last_game_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_player_stats_user (user_id),
    INDEX idx_player_stats_accuracy (voting_accuracy_rate),
    INDEX idx_player_stats_avg_score (average_score_per_game)
);

-- 2. Moderator Commentary and Game Flow
-- =============================================

CREATE TABLE moderator_commentary (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    game_number INT NOT NULL,
    phase VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    importance VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    context_data JSON,
    trigger_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_moderator_game_phase (game_number, phase),
    INDEX idx_moderator_importance (importance),
    INDEX idx_moderator_created (created_at)
);

CREATE TABLE game_flow_transitions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    game_number INT NOT NULL,
    from_phase VARCHAR(50) NOT NULL,
    to_phase VARCHAR(50) NOT NULL,
    trigger_type VARCHAR(50) NOT NULL,
    transition_reason TEXT,
    duration_in_phase_seconds INT,
    players_ready_count INT,
    total_players_count INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_flow_game (game_number),
    INDEX idx_flow_transition (from_phase, to_phase),
    INDEX idx_flow_trigger (trigger_type)
);

-- 3. Enhanced Game Statistics and Analytics
-- =============================================

CREATE TABLE game_statistics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    game_number INT NOT NULL UNIQUE,
    
    -- Basic game info
    total_duration_seconds BIGINT DEFAULT 0,
    total_rounds INT DEFAULT 0,
    average_round_duration DECIMAL(8,2) DEFAULT 0,
    
    -- Gameplay metrics
    total_hints_given INT DEFAULT 0,
    total_votes_cast INT DEFAULT 0,
    accurate_votes_count INT DEFAULT 0,
    liars_identified_count INT DEFAULT 0,
    citizens_eliminated_count INT DEFAULT 0,
    
    -- Phase durations
    avg_hint_phase_duration DECIMAL(8,2) DEFAULT 0,
    avg_voting_phase_duration DECIMAL(8,2) DEFAULT 0,
    avg_defense_phase_duration DECIMAL(8,2) DEFAULT 0,
    avg_survival_vote_duration DECIMAL(8,2) DEFAULT 0,
    
    -- Outcome tracking
    final_outcome VARCHAR(50) NOT NULL,
    victory_type VARCHAR(50),
    winning_score INT,
    score_spread INT, -- Difference between highest and lowest scores
    
    -- Player engagement
    player_retention_rate DECIMAL(5,2) DEFAULT 100.00,
    chat_messages_sent INT DEFAULT 0,
    timeout_incidents INT DEFAULT 0,
    
    -- Timestamps
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_game_stats_outcome (final_outcome),
    INDEX idx_game_stats_duration (total_duration_seconds),
    INDEX idx_game_stats_completed (completed_at)
);

CREATE TABLE round_outcomes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    game_number INT NOT NULL,
    round_number INT NOT NULL,
    outcome_type VARCHAR(50) NOT NULL,
    
    -- Round-specific data
    accused_player_id BIGINT,
    accused_was_liar BOOLEAN DEFAULT FALSE,
    accused_was_eliminated BOOLEAN DEFAULT FALSE,
    
    -- Voting data
    total_votes_in_round INT DEFAULT 0,
    majority_achieved BOOLEAN DEFAULT FALSE,
    vote_distribution JSON, -- Store vote counts per player
    
    -- Performance data
    hints_quality_average DECIMAL(3,2) DEFAULT 0,
    voting_confidence_average DECIMAL(3,2) DEFAULT 0,
    defense_effectiveness_score DECIMAL(3,2),
    
    -- Timing
    round_duration_seconds INT DEFAULT 0,
    hint_phase_duration INT DEFAULT 0,
    voting_phase_duration INT DEFAULT 0,
    defense_phase_duration INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_round_outcome (game_number, round_number),
    INDEX idx_round_outcome_type (outcome_type),
    INDEX idx_round_accused (accused_player_id)
);

-- 4. Enhanced Player Performance Tracking
-- =============================================

CREATE TABLE player_round_performance (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    game_number INT NOT NULL,
    round_number INT NOT NULL,
    user_id BIGINT NOT NULL,
    
    -- Role and status
    was_liar BOOLEAN DEFAULT FALSE,
    was_accused BOOLEAN DEFAULT FALSE,
    was_eliminated BOOLEAN DEFAULT FALSE,
    
    -- Performance metrics
    hint_given VARCHAR(200),
    hint_quality_score DECIMAL(3,2) DEFAULT 0,
    hint_relevance_score DECIMAL(3,2) DEFAULT 0,
    hint_time_taken_seconds INT,
    
    -- Voting behavior
    voted_for_player_id BIGINT,
    vote_confidence DECIMAL(3,2) DEFAULT 0,
    vote_was_accurate BOOLEAN,
    voting_time_taken_seconds INT,
    
    -- Defense performance (if applicable)
    defense_text TEXT,
    defense_effectiveness DECIMAL(3,2),
    defense_duration_seconds INT,
    
    -- Survival voting (if applicable) 
    survival_vote VARCHAR(20), -- 'ELIMINATE' or 'SAVE'
    survival_vote_time_seconds INT,
    
    -- Round scoring
    base_score INT DEFAULT 0,
    bonus_score INT DEFAULT 0,
    total_round_score INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_player_round (game_number, round_number, user_id),
    INDEX idx_perf_game_round (game_number, round_number),
    INDEX idx_perf_user (user_id),
    INDEX idx_perf_role (was_liar, was_accused)
);

-- 5. Game Timer and Phase Management
-- =============================================

CREATE TABLE game_timers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    game_number INT NOT NULL,
    phase VARCHAR(50) NOT NULL,
    
    -- Timer configuration
    base_duration_seconds INT NOT NULL,
    actual_duration_seconds INT,
    extensions_used INT DEFAULT 0,
    extension_seconds INT DEFAULT 0,
    
    -- Timer events
    started_at TIMESTAMP NOT NULL,
    scheduled_end_at TIMESTAMP NOT NULL,
    actual_end_at TIMESTAMP,
    ended_by_trigger VARCHAR(50), -- 'TIMEOUT', 'COMPLETION', 'MANUAL', etc.
    
    -- Performance tracking
    warning_sent_at TIMESTAMP, -- When 10-second warning was sent
    urgency_sent_at TIMESTAMP, -- When 5-second warning was sent
    players_ready_when_ended INT DEFAULT 0,
    
    INDEX idx_timer_game (game_number),
    INDEX idx_timer_phase (phase),
    INDEX idx_timer_active (scheduled_end_at, actual_end_at)
);

CREATE TABLE phase_configurations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    phase VARCHAR(50) NOT NULL UNIQUE,
    
    -- Default timing
    base_duration_seconds INT NOT NULL,
    min_duration_seconds INT NOT NULL,
    max_duration_seconds INT NOT NULL,
    
    -- Dynamic adjustments
    per_player_adjustment_seconds INT DEFAULT 0,
    round_progression_modifier DECIMAL(3,2) DEFAULT 1.00,
    
    -- Features enabled
    allows_extensions BOOLEAN DEFAULT TRUE,
    allows_early_completion BOOLEAN DEFAULT TRUE,
    sends_warnings BOOLEAN DEFAULT TRUE,
    warning_at_seconds INT DEFAULT 10,
    urgency_at_seconds INT DEFAULT 5,
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 6. Post-Game Flow and Options
-- =============================================

CREATE TABLE post_game_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    original_game_number INT NOT NULL,
    session_token VARCHAR(100) NOT NULL UNIQUE,
    
    -- Session info
    host_user_id BIGINT NOT NULL,
    total_players INT NOT NULL,
    players_remaining INT NOT NULL,
    
    -- Options and choices
    play_again_votes INT DEFAULT 0,
    return_lobby_votes INT DEFAULT 0,
    view_stats_votes INT DEFAULT 0,
    consensus_required BOOLEAN DEFAULT TRUE,
    consensus_achieved BOOLEAN DEFAULT FALSE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, CONSENSUS_REACHED, EXPIRED, DISBANDED
    expires_at TIMESTAMP NOT NULL,
    
    -- Result
    chosen_action VARCHAR(50), -- PLAY_AGAIN, RETURN_LOBBY, DISBANDED
    new_game_number INT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_post_game_token (session_token),
    INDEX idx_post_game_original (original_game_number),
    INDEX idx_post_game_status (status, expires_at)
);

CREATE TABLE post_game_player_choices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    post_game_session_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    chosen_action VARCHAR(50) NOT NULL,
    choice_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_post_game_choice (post_game_session_id, user_id),
    FOREIGN KEY (post_game_session_id) REFERENCES post_game_sessions(id) ON DELETE CASCADE,
    INDEX idx_post_choice_user (user_id),
    INDEX idx_post_choice_action (chosen_action)
);

-- 7. Achievement and Badge System
-- =============================================

CREATE TABLE achievements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- SCORING, SOCIAL, GAMEPLAY, SPECIAL
    difficulty VARCHAR(20) DEFAULT 'MEDIUM', -- EASY, MEDIUM, HARD, LEGENDARY
    
    -- Requirements (JSON format for flexibility)
    requirements JSON NOT NULL,
    reward_points INT DEFAULT 0,
    reward_title VARCHAR(100),
    
    -- Metadata
    icon_url VARCHAR(200),
    is_active BOOLEAN DEFAULT TRUE,
    is_secret BOOLEAN DEFAULT FALSE, -- Hidden until unlocked
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_achievement_category (category),
    INDEX idx_achievement_difficulty (difficulty)
);

CREATE TABLE player_achievements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    achievement_id BIGINT NOT NULL,
    
    -- Unlock details
    unlocked_in_game INT, -- Game number where it was unlocked
    progress_data JSON, -- Tracking data for multi-step achievements
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Notification status
    notification_sent BOOLEAN DEFAULT FALSE,
    
    UNIQUE KEY uk_player_achievement (user_id, achievement_id),
    FOREIGN KEY (achievement_id) REFERENCES achievements(id),
    INDEX idx_player_ach_user (user_id),
    INDEX idx_player_ach_unlocked (unlocked_at)
);

-- 8. Enhanced Game Entity Alterations
-- =============================================

-- Add new columns to existing game table
ALTER TABLE game ADD COLUMN IF NOT EXISTS moderator_commentary_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE game ADD COLUMN IF NOT EXISTS advanced_scoring_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE game ADD COLUMN IF NOT EXISTS post_game_session_id BIGINT NULL;
ALTER TABLE game ADD COLUMN IF NOT EXISTS game_flow_version VARCHAR(20) DEFAULT '1.0';

-- Add new columns to existing player table  
ALTER TABLE player ADD COLUMN IF NOT EXISTS rounds_won INT DEFAULT 0;
ALTER TABLE player ADD COLUMN IF NOT EXISTS rounds_lost INT DEFAULT 0;
ALTER TABLE player ADD COLUMN IF NOT EXISTS accurate_votes INT DEFAULT 0;
ALTER TABLE player ADD COLUMN IF NOT EXISTS total_votes INT DEFAULT 0;
ALTER TABLE player ADD COLUMN IF NOT EXISTS successful_liar_rounds INT DEFAULT 0;
ALTER TABLE player ADD COLUMN IF NOT EXISTS time_as_liar_seconds INT DEFAULT 0;
ALTER TABLE player ADD COLUMN IF NOT EXISTS average_hint_time_seconds DECIMAL(6,2);
ALTER TABLE player ADD COLUMN IF NOT EXISTS consistency_score DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE player ADD COLUMN IF NOT EXISTS achievements TEXT; -- JSON array of unlocked achievement IDs

-- 9. Indexes for Performance Optimization
-- =============================================

-- Composite indexes for common queries
CREATE INDEX idx_score_history_game_user ON score_history (game_number, user_id);
CREATE INDEX idx_score_history_round_outcome ON score_history (round, outcome);

CREATE INDEX idx_game_stats_outcome_duration ON game_statistics (final_outcome, total_duration_seconds);

CREATE INDEX idx_player_perf_game_user ON player_round_performance (game_number, user_id);
CREATE INDEX idx_player_perf_liar_accused ON player_round_performance (was_liar, was_accused);

CREATE INDEX idx_moderator_game_phase_time ON moderator_commentary (game_number, phase, created_at);

CREATE INDEX idx_flow_game_time ON game_flow_transitions (game_number, created_at);

-- 10. Triggers for Automatic Statistics Updates
-- =============================================

DELIMITER ;;

-- Trigger to update player statistics when score_history is inserted
CREATE TRIGGER tr_update_player_stats_on_score
    AFTER INSERT ON score_history
    FOR EACH ROW
BEGIN
    INSERT INTO player_statistics (user_id, total_games_played, first_game_at, last_game_at)
    VALUES (NEW.user_id, 1, NOW(), NOW())
    ON DUPLICATE KEY UPDATE 
        last_game_at = NOW(),
        updated_at = NOW();
END;;

-- Trigger to update game statistics when round outcomes are recorded
CREATE TRIGGER tr_update_game_stats_on_round
    AFTER INSERT ON round_outcomes  
    FOR EACH ROW
BEGIN
    INSERT INTO game_statistics (game_number, total_rounds, final_outcome)
    VALUES (NEW.game_number, NEW.round_number, 'IN_PROGRESS')
    ON DUPLICATE KEY UPDATE
        total_rounds = GREATEST(total_rounds, NEW.round_number),
        updated_at = NOW();
END;;

DELIMITER ;

-- 11. Initial Configuration Data
-- =============================================

-- Insert default phase configurations
INSERT INTO phase_configurations (phase, base_duration_seconds, min_duration_seconds, max_duration_seconds, per_player_adjustment_seconds) VALUES
('WAITING_FOR_PLAYERS', 30, 10, 120, 0),
('SPEECH', 45, 20, 90, 5),
('VOTING_FOR_LIAR', 60, 30, 120, 10),
('DEFENDING', 90, 45, 180, 0),
('VOTING_FOR_SURVIVAL', 45, 20, 90, 5),
('GUESSING_WORD', 60, 30, 120, 0),
('GAME_OVER', 30, 15, 60, 0);

-- Insert sample achievements
INSERT INTO achievements (code, name, description, category, difficulty, requirements, reward_points) VALUES
('FIRST_WIN', 'First Victory', 'Win your first game', 'GAMEPLAY', 'EASY', '{"wins": 1}', 100),
('PERFECT_CITIZEN', 'Perfect Citizen', 'Vote correctly in all rounds of a game as a citizen', 'SCORING', 'MEDIUM', '{"perfect_citizen_game": true}', 250),
('MASTER_LIAR', 'Master of Deception', 'Win 3 games in a row as a liar', 'GAMEPLAY', 'HARD', '{"consecutive_liar_wins": 3}', 500),
('LIGHTNING_HINTS', 'Lightning Fast', 'Give hints in under 10 seconds for 5 consecutive turns', 'SPECIAL', 'MEDIUM', '{"fast_hints": 5}', 200),
('SOCIAL_BUTTERFLY', 'Social Butterfly', 'Send 100 chat messages across all games', 'SOCIAL', 'EASY', '{"chat_messages": 100}', 150);

-- 12. Views for Common Queries
-- =============================================

-- View for player leaderboard
CREATE VIEW player_leaderboard AS
SELECT 
    u.nickname,
    ps.total_games_played,
    ps.games_won,
    ps.games_lost,
    ROUND((ps.games_won * 100.0) / GREATEST(ps.total_games_played, 1), 2) as win_rate,
    ps.average_score_per_game,
    ps.voting_accuracy_rate,
    ps.longest_win_streak,
    ps.updated_at
FROM player_statistics ps
JOIN user u ON u.id = ps.user_id
WHERE ps.total_games_played > 0
ORDER BY ps.average_score_per_game DESC, ps.voting_accuracy_rate DESC;

-- View for game analytics
CREATE VIEW game_analytics AS  
SELECT 
    gs.game_number,
    gs.total_duration_seconds,
    gs.total_rounds,
    gs.final_outcome,
    gs.victory_type,
    gs.winning_score,
    gs.player_retention_rate,
    COUNT(prp.user_id) as total_participants,
    AVG(prp.hint_quality_score) as avg_hint_quality,
    AVG(prp.vote_confidence) as avg_vote_confidence
FROM game_statistics gs
LEFT JOIN player_round_performance prp ON gs.game_number = prp.game_number
GROUP BY gs.game_number, gs.total_duration_seconds, gs.total_rounds, gs.final_outcome, gs.victory_type, gs.winning_score, gs.player_retention_rate;

-- View for moderator commentary analysis
CREATE VIEW commentary_effectiveness AS
SELECT 
    phase,
    importance,
    COUNT(*) as comment_count,
    AVG(LENGTH(content)) as avg_comment_length,
    COUNT(DISTINCT game_number) as games_with_commentary
FROM moderator_commentary 
GROUP BY phase, importance
ORDER BY phase, importance;

-- This comprehensive database schema provides:
-- 1. Complete scoring history and player statistics tracking
-- 2. Moderator commentary storage and analysis
-- 3. Game flow transition logging
-- 4. Enhanced performance metrics and analytics  
-- 5. Post-game session management
-- 6. Achievement and progression systems
-- 7. Optimized indexes for high-performance queries
-- 8. Automatic triggers for real-time statistics updates
-- 9. Analytical views for reporting and insights

-- The schema is designed to scale with high game volume while
-- maintaining referential integrity and query performance.