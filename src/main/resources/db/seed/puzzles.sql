-- Sample puzzle seeds for local development
INSERT INTO puzzles (id, title, width, height, status, content_style, text_likeness_score, uniqueness_flag, difficulty_score, created_at, modified_at)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Smile Cat', 15, 15, 'APPROVED', 'GENERIC_PIXEL', 0.08, TRUE, 4.2, NOW(), NOW()),
    ('22222222-2222-2222-2222-222222222222', 'Typo City', 20, 20, 'APPROVED', 'LETTERFORM', 0.72, TRUE, 5.8, NOW(), NOW()),
    ('33333333-3333-3333-3333-333333333333', 'Space Rocket', 25, 25, 'OFFICIAL', 'GENERIC_PIXEL', 0.12, TRUE, 6.5, NOW(), NOW());

INSERT INTO puzzle_hints (puzzle_id, rows, cols, version)
VALUES
    ('11111111-1111-1111-1111-111111111111', '[[1,1],[3]]', '[[2],[2]]', 1),
    ('22222222-2222-2222-2222-222222222222', '[[5],[7]]', '[[4],[6]]', 1)
ON CONFLICT (puzzle_id) DO NOTHING;

INSERT INTO puzzle_solutions (puzzle_id, grid_data, checksum)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'c21hY2tnZ2dn', 'checksum-1111'),
    ('22222222-2222-2222-2222-222222222222', 'c3RyZWV0c3RyZWV0', 'checksum-2222')
ON CONFLICT (puzzle_id) DO NOTHING;
