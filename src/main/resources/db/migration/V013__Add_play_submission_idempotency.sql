ALTER TABLE plays
    ADD COLUMN last_submission_key VARCHAR(64),
    ADD COLUMN last_submission_result JSONB;
