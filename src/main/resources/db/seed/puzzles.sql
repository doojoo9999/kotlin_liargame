--- Sample puzzle seeds for local development
INSERT INTO puzzles (
    id,
    title,
    description,
    width,
    height,
    status,
    content_style,
    text_likeness_score,
    uniqueness_flag,
    difficulty_score,
    author_id,
    created_at,
    modified_at
)
VALUES
    (
        '11111111-1111-1111-1111-111111111111',
        'Smile Cat',
        '웃고 있는 고양이 일러스트를 모티브로 한 초급 퍼즐입니다.',
        15,
        15,
        'APPROVED',
        'GENERIC_PIXEL',
        0.08,
        TRUE,
        4.2,
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        NOW(),
        NOW()
    ),
    (
        '22222222-2222-2222-2222-222222222222',
        'Typo City',
        '도시 전경을 글자 형태로 표현한 중급 난이도 퍼즐입니다.',
        20,
        20,
        'APPROVED',
        'LETTERFORM',
        0.72,
        TRUE,
        5.8,
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        NOW(),
        NOW()
    ),
    (
        '33333333-3333-3333-3333-333333333333',
        'Space Rocket',
        '우주를 향해 날아가는 로켓을 담은 고급 난이도 퍼즐입니다.',
        25,
        25,
        'OFFICIAL',
        'GENERIC_PIXEL',
        0.12,
        TRUE,
        6.5,
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        NOW(),
        NOW()
    );

INSERT INTO puzzle_hints (puzzle_id, rows, cols, version)
VALUES
    ('11111111-1111-1111-1111-111111111111', '[[1,1],[3]]', '[[2],[2]]', 1),
    ('22222222-2222-2222-2222-222222222222', '[[5],[7]]', '[[4],[6]]', 1),
    ('33333333-3333-3333-3333-333333333333', '[[4,2],[1,1,1]]', '[[2,1],[3,2]]', 1)
ON CONFLICT (puzzle_id) DO NOTHING;

INSERT INTO puzzle_solutions (puzzle_id, grid_data, checksum)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'c21hY2tnZ2dn', 'checksum-1111'),
    ('22222222-2222-2222-2222-222222222222', 'c3RyZWV0c3RyZWV0', 'checksum-2222')
ON CONFLICT (puzzle_id) DO NOTHING;

INSERT INTO puzzle_tags (puzzle_id, tag_value)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'cute'),
    ('11111111-1111-1111-1111-111111111111', 'animal'),
    ('22222222-2222-2222-2222-222222222222', 'city'),
    ('33333333-3333-3333-3333-333333333333', 'space')
ON CONFLICT DO NOTHING;

INSERT INTO daily_picks (pick_date, items, generated_at)
VALUES
    (CURRENT_DATE, '["11111111-1111-1111-1111-111111111111","22222222-2222-2222-2222-222222222222","33333333-3333-3333-3333-333333333333"]', NOW())
ON CONFLICT (pick_date) DO UPDATE
    SET items = EXCLUDED.items,
        generated_at = NOW();

INSERT INTO plays (
    id, puzzle_id, subject_key, mode, started_at, finished_at, client_build,
    input_events, mistakes, used_hints, progress_snapshots, undo_count, combo_count
)
VALUES
    ('77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'NORMAL',
     NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '8 minutes', 'web-2024.10',
     '[]'::jsonb, 0, 0, '{"cells":[]}'::jsonb, 2, 5),
    ('88888888-8888-8888-8888-888888888888', '22222222-2222-2222-2222-222222222222',
     'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'NORMAL',
     NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '20 minutes', 'web-2024.10',
     '[]'::jsonb, 1, 1, '{"cells":[]}'::jsonb, 4, 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO scores (puzzle_id, subject_key, mode, best_time_ms, best_score, perfect_clear, last_played_at, flags)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'NORMAL', 180000, 1850, TRUE, NOW(), 'combo:5'),
    ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'NORMAL', 240000, 1600, FALSE, NOW(), 'streak:2')
ON CONFLICT (puzzle_id, subject_key, mode) DO UPDATE
    SET best_time_ms = EXCLUDED.best_time_ms,
        best_score = EXCLUDED.best_score,
        perfect_clear = EXCLUDED.perfect_clear,
        last_played_at = NOW();

INSERT INTO notifications (id, recipient_key, type, title, message, link, read)
VALUES
    ('99999999-9999-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'SYSTEM', '오늘의 추천이 도착했습니다', '신규 퍼즐이 준비됐어요!', '/nemonemo/', FALSE),
    ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ACHIEVEMENT', '업적 달성', '완벽한 하루 업적을 달성했습니다.', NULL, TRUE)
ON CONFLICT (id) DO NOTHING;
