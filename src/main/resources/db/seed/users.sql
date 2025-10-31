-- Sample accounts for integration testing
INSERT INTO users (id, email, password_hash, nickname, role, created_at)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'guest@example.com', '$2y$10$examplehash', 'GuestUser', 'USER', NOW()),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'author@example.com', '$2y$10$examplehash', 'PuzzleAuthor', 'AUTHOR', NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO guest_identities (anon_id, nickname, created_at, last_seen_at, signing_key_hash)
VALUES
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'AnonCat', NOW(), NOW(), 'hash-ccc')
ON CONFLICT (anon_id) DO NOTHING;
