-- Add mother_raid_id to group multiple cohorts under one shareable ID
ALTER TABLE dnf_raids
ADD COLUMN IF NOT EXISTS mother_raid_id UUID;

-- Default mother_raid_id to self for existing data
UPDATE dnf_raids
SET mother_raid_id = id
WHERE mother_raid_id IS NULL;

-- If names follow "<base> <n>기" pattern, group them by the earliest raid as mother
WITH normalized AS (
    SELECT
        id,
        COALESCE(
            NULLIF(TRIM(regexp_replace(name, '\\s*\\d+\\s*기\\s*$', '', 'i')), ''),
            name
        ) AS base_name,
        created_at
    FROM dnf_raids
), mothers AS (
    SELECT
        n.id,
        n.base_name,
        (SELECT id FROM normalized n2 WHERE n2.base_name = n.base_name ORDER BY n2.created_at ASC LIMIT 1) AS mother_id
    FROM normalized n
)
UPDATE dnf_raids r
SET mother_raid_id = m.mother_id
FROM mothers m
WHERE r.id = m.id
  AND m.mother_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dnf_raids_mother_raid_id ON dnf_raids(mother_raid_id);
