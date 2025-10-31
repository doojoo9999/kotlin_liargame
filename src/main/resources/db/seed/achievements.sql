-- Achievement definitions
INSERT INTO achievements (id, code, title, description, icon_url, tier, points, conditions)
VALUES
    ('44444444-4444-4444-4444-444444444444', 'FIRST_CLEAR', '첫 클리어', '처음으로 퍼즐을 완주했습니다.', NULL, 'BRONZE', 50, '{"type":"CLEAR","count":1}'),
    ('55555555-5555-5555-5555-555555555555', 'PERFECT_DAY', '완벽한 하루', '실수 없이 퍼즐 3개를 완료했습니다.', NULL, 'SILVER', 150, '{"type":"PERFECT_CLEAR","count":3}'),
    ('66666666-6666-6666-6666-666666666666', 'MARATHON', '마라톤', '일주일 동안 연속으로 플레이했습니다.', NULL, 'GOLD', 300, '{"type":"STREAK","days":7}')
ON CONFLICT (id) DO NOTHING;
