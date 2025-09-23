-- Database Performance Optimization Script for Liar Game PostgreSQL Database
-- This file contains database-specific optimizations for better query performance

-- Create Indexes for Better Query Performance
-- Game Entity Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_created_at ON game(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_modified_at ON game(modified_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_state ON game(g_state);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_number ON game(game_number);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_owner ON game(game_owner);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_state_created_at ON game(g_state, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_state_modified_at ON game(g_state, modified_at);

-- Player Entity Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_player_user_id ON player(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_player_game_id ON player(game_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_player_role ON player(role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_player_state ON player(state);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_player_joined_at ON player(joined_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_player_cumulative_score ON player(cumulative_score);

-- User Entity Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_nickname ON users(nickname);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_created_at ON users(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_modified_at ON users(modified_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_is_active ON users(is_active);

-- Chat Message Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_message_game_id ON chat_message(game_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_message_timestamp ON chat_message(timestamp);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_message_sender ON chat_message(sender);

-- Subject and Word Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subject_content ON subject(content);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subject_category ON subject(category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_word_content ON word(content);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_word_subject_id ON word(subject_id);

-- Composite Indexes for Common Query Patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_stats_composite 
ON game(g_state, created_at, modified_at) 
WHERE g_state = 'ENDED' AND modified_at IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_player_stats_composite 
ON player(user_id, game_id, role, is_alive, cumulative_score);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_active_games 
ON game(g_state, created_at) 
WHERE g_state IN ('WAITING', 'IN_PROGRESS');

-- Partitioning Strategy for Large Tables (Optional - for high volume)
-- This creates monthly partitions for the game table based on created_at
-- Uncomment and adjust dates as needed for production

/*
-- Create parent table for partitioning
CREATE TABLE IF NOT EXISTS game_partitioned (
    LIKE game INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create monthly partitions (example for 2025)
CREATE TABLE IF NOT EXISTS game_2025_01 PARTITION OF game_partitioned 
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE IF NOT EXISTS game_2025_02 PARTITION OF game_partitioned 
FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- Add more partitions as needed
*/

-- Database Statistics Update
-- Run this periodically to keep query planner statistics updated
ANALYZE;

-- Performance Views for Monitoring

-- View to monitor slow queries
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 20;

-- View to monitor table sizes and usage
CREATE OR REPLACE VIEW table_sizes AS
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_stats 
JOIN pg_tables ON schemaname = pg_stats.schemaname AND tablename = pg_stats.tablename
WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- View to monitor index usage
CREATE OR REPLACE VIEW index_usage AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Database Configuration Recommendations
-- Add these to postgresql.conf for better performance

/*
-- Memory Settings (adjust based on available RAM)
shared_buffers = 256MB                 # 25% of total RAM for small systems
effective_cache_size = 1GB             # 75% of total RAM
work_mem = 4MB                         # Per connection sort/hash memory
maintenance_work_mem = 64MB            # Memory for maintenance operations

-- Checkpoint Settings
checkpoint_completion_target = 0.9     # Smooth checkpoints
wal_buffers = 16MB                     # WAL buffer size
max_wal_size = 1GB                     # Maximum WAL size
min_wal_size = 80MB                    # Minimum WAL size

-- Connection Settings
max_connections = 100                  # Maximum concurrent connections
shared_preload_libraries = 'pg_stat_statements'  # Query statistics

-- Query Planner Settings
random_page_cost = 1.1                # SSD optimized (default 4.0 for HDD)
effective_io_concurrency = 200        # Number of I/O operations
default_statistics_target = 100       # Statistics collection target

-- Logging for Performance Monitoring
log_min_duration_statement = 1000     # Log queries taking > 1 second
log_checkpoints = on                  # Log checkpoint information
log_connections = on                  # Log connections
log_disconnections = on               # Log disconnections
log_lock_waits = on                   # Log lock waits
*/

-- Query Optimization Tips:
-- 1. Always use LIMIT for pagination
-- 2. Use appropriate WHERE clauses with indexed columns
-- 3. Avoid SELECT * in production queries
-- 4. Use connection pooling (HikariCP is already configured)
-- 5. Monitor query execution plans with EXPLAIN ANALYZE
-- 6. Keep statistics updated with ANALYZE

-- Example of optimized query patterns used in the application:

-- Optimized daily statistics query
-- Uses date functions efficiently and proper joins
/*
SELECT 
    DATE(g.created_at) as game_date,
    COUNT(g.id) as total_games,
    COUNT(DISTINCT p.user_id) as unique_players,
    AVG(EXTRACT(EPOCH FROM (g.modified_at - g.created_at)) / 60) as avg_duration_minutes
FROM game g
LEFT JOIN player p ON g.id = p.game_id
WHERE g.g_state = 'ENDED'
  AND g.created_at >= CURRENT_DATE - INTERVAL '30 days'
  AND g.modified_at IS NOT NULL
GROUP BY DATE(g.created_at)
ORDER BY game_date;
*/

-- Optimized peak concurrent games query
-- Uses efficient date filtering and proper indexing
/*
SELECT COUNT(DISTINCT g.id) as peak_concurrent
FROM game g
WHERE g.g_state = 'IN_PROGRESS'
  AND g.created_at >= CURRENT_TIMESTAMP - INTERVAL '1 day';
*/

-- Performance monitoring queries to run periodically:

-- Check for unused indexes
/*
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND schemaname NOT IN ('information_schema', 'pg_catalog')
ORDER BY pg_relation_size(indexrelid) DESC;
*/

-- Check for missing indexes on foreign keys
/*
SELECT 
    t.table_name,
    t.column_name,
    t.constraint_name,
    t.referenced_table_name,
    t.referenced_column_name
FROM information_schema.key_column_usage t
WHERE t.referenced_table_name IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM pg_indexes i 
    WHERE i.tablename = t.table_name 
      AND i.indexdef LIKE '%' || t.column_name || '%'
  );
*/