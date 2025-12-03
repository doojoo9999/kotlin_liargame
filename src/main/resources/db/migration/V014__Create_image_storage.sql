CREATE TABLE IF NOT EXISTS stored_image (
    id BIGSERIAL PRIMARY KEY,
    slug VARCHAR(32) NOT NULL UNIQUE,
    content_type VARCHAR(120) NOT NULL,
    size BIGINT NOT NULL,
    data BYTEA NOT NULL,
    original_filename VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    modified_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ip_address VARCHAR(40),
    session_id VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_stored_image_created_at ON stored_image (created_at);
