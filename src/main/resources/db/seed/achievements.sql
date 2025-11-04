-- Achievement definitions
INSERT INTO achievements (id, code, title, description, icon_url, tier, points, conditions)
VALUES
    ('44444444-4444-4444-4444-444444444444', 'FIRST_CLEAR', '첫 클리어', '처음으로 퍼즐을 완주했습니다.', NULL, 'BRONZE', 50, '{"type":"CLEAR","count":1}'),
    ('55555555-5555-5555-5555-555555555555', 'PERFECT_DAY', '완벽한 하루', '실수 없이 퍼즐 3개를 완료했습니다.', NULL, 'SILVER', 150, '{"type":"PERFECT_CLEAR","count":3}'),
    ('66666666-6666-6666-6666-666666666666', 'MARATHON', '마라톤', '일주일 동안 연속으로 플레이했습니다.', NULL, 'GOLD', 300, '{"type":"STREAK","days":7}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_achievements (subject_key, achievement_id, unlocked_at, progress)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '1 day', '{"count":1}'::jsonb),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '55555555-5555-5555-5555-555555555555', NOW() - INTERVAL '2 days', '{"count":3}'::jsonb)
ON CONFLICT (subject_key, achievement_id) DO NOTHING;

INSERT INTO challenges (id, type, title, description, requirements, rewards, start_date, end_date, active)
VALUES
    ('77777777-aaaa-bbbb-cccc-777777777777', 'DAILY', '오늘의 워밍업', '퍼즐 한 개를 완료하세요.', '{"target":1}'::jsonb, '{"xp":50,"ticket":1}'::jsonb, CURRENT_DATE, CURRENT_DATE, TRUE),
    ('88888888-bbbb-cccc-dddd-888888888888', 'WEEKLY', '주간 도전자', '이번 주에 퍼즐을 5개 완료하세요.', '{"target":5}'::jsonb, '{"xp":150}'::jsonb, date_trunc('week', CURRENT_DATE)::date, (date_trunc('week', CURRENT_DATE) + INTERVAL '6 days')::date, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_challenges (subject_key, challenge_id, progress, completed, completed_at, claimed)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '77777777-aaaa-bbbb-cccc-777777777777', '{"current":1}'::jsonb, TRUE, NOW() - INTERVAL '12 hours', TRUE),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '88888888-bbbb-cccc-dddd-888888888888', '{"current":3}'::jsonb, FALSE, NULL, FALSE)
ON CONFLICT (subject_key, challenge_id) DO NOTHING;

INSERT INTO season_passes (id, season_number, title, start_date, end_date, tiers, active)
VALUES
    ('99999999-aaaa-bbbb-cccc-999999999999', 1, '시즌 1: 논리의 서막', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '45 days', '{"tiers":[{"level":1,"xp":0},{"level":2,"xp":200},{"level":3,"xp":450}]}'::jsonb, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_season_progress (subject_key, season_id, tier_level, xp, last_claimed_tier, premium, updated_at)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '99999999-aaaa-bbbb-cccc-999999999999', 2, 260, 1, FALSE, NOW() - INTERVAL '6 hours'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '99999999-aaaa-bbbb-cccc-999999999999', 1, 120, NULL, TRUE, NOW() - INTERVAL '2 hours')
ON CONFLICT (subject_key, season_id) DO NOTHING;
