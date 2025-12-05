-- DnF Raid Organizer 테이블 생성 스크립트 (PostgreSQL)
-- 필요 시: CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS dnf_raids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(64) NOT NULL,
    name VARCHAR(100) NOT NULL,
    password VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    parent_raid_id UUID,
    CONSTRAINT fk_dnf_raids_parent FOREIGN KEY (parent_raid_id) REFERENCES dnf_raids (id)
);

CREATE INDEX IF NOT EXISTS idx_dnf_raids_user_created ON dnf_raids (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS dnf_characters (
    character_id VARCHAR(80) PRIMARY KEY,
    server_id VARCHAR(40) NOT NULL,
    character_name VARCHAR(100) NOT NULL,
    job_name VARCHAR(100) NOT NULL,
    job_grow_name VARCHAR(100) NOT NULL,
    fame INTEGER NOT NULL,
    adventure_name VARCHAR(100),
    last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dnf_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raid_id UUID NOT NULL REFERENCES dnf_raids (id) ON DELETE CASCADE,
    character_id VARCHAR(80) NOT NULL REFERENCES dnf_characters (character_id),
    damage BIGINT NOT NULL DEFAULT 0,
    buff_power BIGINT NOT NULL DEFAULT 0,
    party_number INTEGER,
    slot_index INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_dnf_party_number CHECK (party_number BETWEEN 1 AND 3 OR party_number IS NULL),
    CONSTRAINT chk_dnf_slot_index CHECK (slot_index BETWEEN 0 AND 3 OR slot_index IS NULL)
);

CREATE INDEX IF NOT EXISTS idx_dnf_participants_raid ON dnf_participants (raid_id);

CREATE TABLE IF NOT EXISTS dnf_stat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL REFERENCES dnf_participants (id) ON DELETE CASCADE,
    damage BIGINT NOT NULL DEFAULT 0,
    buff_power BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dnf_stat_history_participant ON dnf_stat_history (participant_id, created_at);
