alter table if exists dnf_raw_skills
    add column if not exists enhancement_json text,
    add column if not exists evolution_json text;
