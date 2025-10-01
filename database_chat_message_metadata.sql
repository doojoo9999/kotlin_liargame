-- Migration: add sender metadata snapshot to chat messages
-- This script preserves chat history after players leave a game by storing
-- the originating user id and nickname alongside each message and decoupling
-- the foreign key from the player row.

ALTER TABLE chat_message ADD COLUMN IF NOT EXISTS player_user_id BIGINT;
ALTER TABLE chat_message ADD COLUMN IF NOT EXISTS player_nickname_snapshot VARCHAR(100);

-- Backfill existing records with the current player information
UPDATE chat_message AS cm
SET player_user_id = p.user_id,
    player_nickname_snapshot = p.nickname
FROM player AS p
WHERE cm.player_id = p.id
  AND (cm.player_user_id IS NULL OR cm.player_nickname_snapshot IS NULL OR cm.player_nickname_snapshot = '');

-- Ensure system messages have a readable nickname
UPDATE chat_message
SET player_nickname_snapshot = 'SYSTEM'
WHERE player_id IS NULL
  AND (player_nickname_snapshot IS NULL OR player_nickname_snapshot = '');

-- Allow the player_id foreign key to be nulled when archiving chat history
ALTER TABLE chat_message
    ALTER COLUMN player_id DROP NOT NULL;
