ALTER TABLE dnf_raids
    ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_dnf_raids_public_created

    ON dnf_raids (is_public, created_at DESC);

ALTER TABLE dnf_raids
    ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_dnf_raids_public_created
    ON dnf_raids (is_public, created_at DESC);