-- 스킬별 데미지 산출 결과를 캐싱/분석하기 위한 스냅샷 테이블
create table if not exists dnf_damage_snapshots (
    id bigserial primary key,
    character_id varchar(80) not null references dnf_characters (character_id) on delete cascade,
    server_id varchar(40) not null,
    total_score double precision,
    buffer_score double precision,
    calc_json text, -- topSkills, breakdown 등을 JSON으로 저장
    created_at timestamptz not null default now()
);

create index if not exists idx_dnf_damage_snapshots_character on dnf_damage_snapshots(character_id);
create index if not exists idx_dnf_damage_snapshots_created_at on dnf_damage_snapshots(created_at);
