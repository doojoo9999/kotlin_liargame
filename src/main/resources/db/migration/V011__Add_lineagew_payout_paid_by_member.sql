ALTER TABLE linw_payouts
    ADD COLUMN paid_by_member_id BIGINT NULL;

ALTER TABLE linw_payouts
    ADD CONSTRAINT fk_linw_payouts_paid_by_member
        FOREIGN KEY (paid_by_member_id)
            REFERENCES linw_members(id);

CREATE INDEX idx_linw_payouts_paid_by_member
    ON linw_payouts(paid_by_member_id);
