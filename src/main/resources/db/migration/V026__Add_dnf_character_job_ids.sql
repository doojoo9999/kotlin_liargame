alter table if exists dnf_characters
    add column if not exists job_id varchar(80);

alter table if exists dnf_characters
    add column if not exists job_grow_id varchar(80);
