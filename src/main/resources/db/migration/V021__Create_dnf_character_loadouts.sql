-- 캐릭터 장착 정보/버프 장비/타임라인 캐시 테이블
create table if not exists dnf_character_loadouts (
    character_id varchar(80) primary key references dnf_characters (character_id) on delete cascade,
    server_id varchar(40) not null,
    timeline_json text,
    status_json text,
    equipment_json text,
    avatar_json text,
    creature_json text,
    flag_json text,
    mist_assimilation_json text,
    skill_style_json text,
    buff_equipment_json text,
    buff_avatar_json text,
    buff_creature_json text,
    updated_at timestamptz not null default now()
);

create index if not exists idx_dnf_character_loadouts_server on dnf_character_loadouts(server_id);
