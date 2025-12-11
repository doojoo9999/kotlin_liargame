-- DNF 원본 직업/전직/스킬 테이블 생성
create table if not exists dnf_raw_jobs (
    job_id varchar(64) primary key,
    job_name varchar(128) not null
);

create table if not exists dnf_raw_job_grows (
    job_id varchar(64) not null,
    job_grow_id varchar(64) not null,
    job_name varchar(128) not null,
    job_grow_name varchar(128) not null,
    primary key (job_id, job_grow_id)
);

create table if not exists dnf_raw_skills (
    id varchar(128) primary key,             -- jobGrowId:skillId 복합키
    job_id varchar(64) not null,
    job_grow_id varchar(64) not null,
    job_name varchar(128) not null,
    job_grow_name varchar(128) not null,
    skill_id varchar(64) not null,
    skill_name varchar(256) not null,
    skill_type varchar(64),
    max_level integer,
    required_level integer,
    base_cool_time double precision,
    option_desc varchar(2048),
    detail_json text,
    level_rows_json text
);

create index if not exists idx_dnf_raw_skills_job_grow on dnf_raw_skills(job_grow_id);
create index if not exists idx_dnf_raw_skills_skill_id on dnf_raw_skills(skill_id);
