-- Database Migration Fix for PlayerEntity
-- This script fixes the migration issue with the was_detected column

-- Step 1: Add the column as nullable first
ALTER TABLE player ADD COLUMN IF NOT EXISTS was_detected BOOLEAN;

-- Step 2: Update existing rows with a default value
-- Set to false for all existing players (they weren't detected yet)
UPDATE player SET was_detected = false WHERE was_detected IS NULL;

-- Step 3: Add the NOT NULL constraint
ALTER TABLE player ALTER COLUMN was_detected SET NOT NULL;

-- Optional: If you need to set default value for future inserts
ALTER TABLE player ALTER COLUMN was_detected SET DEFAULT false;

-- Verification query
SELECT COUNT(*) as null_count FROM player WHERE was_detected IS NULL;