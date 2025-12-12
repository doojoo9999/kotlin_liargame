-- 우리가 계산한 딜/버프 점수를 별도로 저장하는 테이블 (dnf_characters.damage는 사용자 수동 입력값 유지)
create table if not exists dnf_calculated_damages (
    id bigserial primary key,
    character_id varchar(80) not null references dnf_characters (character_id) on delete cascade,
    server_id varchar(40) not null,
    dealer_score double precision,
    buffer_score double precision,
    calc_json text,
    calculated_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index if not exists ux_dnf_calculated_damage_character on dnf_calculated_damages(character_id);
create index if not exists idx_dnf_calculated_damage_calculated_at on dnf_calculated_damages(calculated_at);
