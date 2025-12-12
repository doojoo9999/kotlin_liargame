alter table if exists dnf_raw_skills
    add column if not exists skill_desc text,
    add column if not exists skill_desc_detail text,
    add column if not exists desc_special_json text,
    add column if not exists consume_item_json text,
    add column if not exists level_info_json text;
