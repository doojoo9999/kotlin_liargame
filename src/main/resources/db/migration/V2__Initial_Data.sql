-- Initial data for Liar Game application
-- Subjects and Words for gameplay

-- Insert subjects
INSERT INTO subjects (name, description, is_active) VALUES
('동물', '다양한 동물들에 관한 주제', true),
('음식', '음식과 요리에 관한 주제', true),
('스포츠', '각종 스포츠와 운동에 관한 주제', true),
('영화', '영화와 영화배우에 관한 주제', true),
('여행', '여행지와 관광명소에 관한 주제', true),
('직업', '다양한 직업과 직종에 관한 주제', true),
('취미', '취미활동과 여가생활에 관한 주제', true),
('교통수단', '다양한 교통수단에 관한 주제', true),
('가전제품', '생활 가전제품에 관한 주제', true),
('학교', '학교생활과 교육에 관한 주제', true);

-- Insert words for 동물 subject
INSERT INTO words (subject_id, word, difficulty_level, is_active) VALUES
((SELECT id FROM subjects WHERE name = '동물'), '강아지', 1, true),
((SELECT id FROM subjects WHERE name = '동물'), '고양이', 1, true),
((SELECT id FROM subjects WHERE name = '동물'), '토끼', 1, true),
((SELECT id FROM subjects WHERE name = '동물'), '사자', 1, true),
((SELECT id FROM subjects WHERE name = '동물'), '호랑이', 1, true),
((SELECT id FROM subjects WHERE name = '동물'), '코끼리', 1, true),
((SELECT id FROM subjects WHERE name = '동물'), '기린', 1, true),
((SELECT id FROM subjects WHERE name = '동물'), '원숭이', 1, true),
((SELECT id FROM subjects WHERE name = '동물'), '펭귄', 2, true),
((SELECT id FROM subjects WHERE name = '동물'), '캥거루', 2, true),
((SELECT id FROM subjects WHERE name = '동물'), '코알라', 2, true),
((SELECT id FROM subjects WHERE name = '동물'), '판다', 2, true);

-- Insert words for 음식 subject
INSERT INTO words (subject_id, word, difficulty_level, is_active) VALUES
((SELECT id FROM subjects WHERE name = '음식'), '김치찌개', 1, true),
((SELECT id FROM subjects WHERE name = '음식'), '불고기', 1, true),
((SELECT id FROM subjects WHERE name = '음식'), '비빔밥', 1, true),
((SELECT id FROM subjects WHERE name = '음식'), '냉면', 1, true),
((SELECT id FROM subjects WHERE name = '음식'), '삼겹살', 1, true),
((SELECT id FROM subjects WHERE name = '음식'), '치킨', 1, true),
((SELECT id FROM subjects WHERE name = '음식'), '피자', 1, true),
((SELECT id FROM subjects WHERE name = '음식'), '햄버거', 1, true),
((SELECT id FROM subjects WHERE name = '음식'), '파스타', 2, true),
((SELECT id FROM subjects WHERE name = '음식'), '스테이크', 2, true),
((SELECT id FROM subjects WHERE name = '음식'), '초밥', 2, true),
((SELECT id FROM subjects WHERE name = '음식'), '라멘', 2, true);

-- Insert words for 스포츠 subject
INSERT INTO words (subject_id, word, difficulty_level, is_active) VALUES
((SELECT id FROM subjects WHERE name = '스포츠'), '축구', 1, true),
((SELECT id FROM subjects WHERE name = '스포츠'), '야구', 1, true),
((SELECT id FROM subjects WHERE name = '스포츠'), '농구', 1, true),
((SELECT id FROM subjects WHERE name = '스포츠'), '배구', 1, true),
((SELECT id FROM subjects WHERE name = '스포츠'), '테니스', 1, true),
((SELECT id FROM subjects WHERE name = '스포츠'), '골프', 1, true),
((SELECT id FROM subjects WHERE name = '스포츠'), '수영', 1, true),
((SELECT id FROM subjects WHERE name = '스포츠'), '태권도', 1, true),
((SELECT id FROM subjects WHERE name = '스포츠'), '복싱', 2, true),
((SELECT id FROM subjects WHERE name = '스포츠'), '유도', 2, true),
((SELECT id FROM subjects WHERE name = '스포츠'), '펜싱', 2, true),
((SELECT id FROM subjects WHERE name = '스포츠'), '양궁', 2, true);

-- Insert words for 영화 subject
INSERT INTO words (subject_id, word, difficulty_level, is_active) VALUES
((SELECT id FROM subjects WHERE name = '영화'), '어벤져스', 1, true),
((SELECT id FROM subjects WHERE name = '영화'), '타이타닉', 1, true),
((SELECT id FROM subjects WHERE name = '영화'), '겨울왕국', 1, true),
((SELECT id FROM subjects WHERE name = '영화'), '기생충', 1, true),
((SELECT id FROM subjects WHERE name = '영화'), '극한직업', 1, true),
((SELECT id FROM subjects WHERE name = '영화'), '명량', 1, true),
((SELECT id FROM subjects WHERE name = '영화'), '신과함께', 1, true),
((SELECT id FROM subjects WHERE name = '영화'), '범죄도시', 1, true),
((SELECT id FROM subjects WHERE name = '영화'), '인터스텔라', 2, true),
((SELECT id FROM subjects WHERE name = '영화'), '인셉션', 2, true),
((SELECT id FROM subjects WHERE name = '영화'), '매트릭스', 2, true),
((SELECT id FROM subjects WHERE name = '영화'), '쇼생크탈출', 2, true);

-- Insert words for 여행 subject
INSERT INTO words (subject_id, word, difficulty_level, is_active) VALUES
((SELECT id FROM subjects WHERE name = '여행'), '제주도', 1, true),
((SELECT id FROM subjects WHERE name = '여행'), '부산', 1, true),
((SELECT id FROM subjects WHERE name = '여행'), '경주', 1, true),
((SELECT id FROM subjects WHERE name = '여행'), '강릉', 1, true),
((SELECT id FROM subjects WHERE name = '여행'), '일본', 1, true),
((SELECT id FROM subjects WHERE name = '여행'), '중국', 1, true),
((SELECT id FROM subjects WHERE name = '여행'), '태국', 1, true),
((SELECT id FROM subjects WHERE name = '여행'), '베트남', 1, true),
((SELECT id FROM subjects WHERE name = '여행'), '프랑스', 2, true),
((SELECT id FROM subjects WHERE name = '여행'), '이탈리아', 2, true),
((SELECT id FROM subjects WHERE name = '여행'), '스위스', 2, true),
((SELECT id FROM subjects WHERE name = '여행'), '호주', 2, true);

-- Insert words for 직업 subject
INSERT INTO words (subject_id, word, difficulty_level, is_active) VALUES
((SELECT id FROM subjects WHERE name = '직업'), '의사', 1, true),
((SELECT id FROM subjects WHERE name = '직업'), '간호사', 1, true),
((SELECT id FROM subjects WHERE name = '직업'), '선생님', 1, true),
((SELECT id FROM subjects WHERE name = '직업'), '경찰관', 1, true),
((SELECT id FROM subjects WHERE name = '직업'), '소방관', 1, true),
((SELECT id FROM subjects WHERE name = '직업'), '요리사', 1, true),
((SELECT id FROM subjects WHERE name = '직업'), '운전기사', 1, true),
((SELECT id FROM subjects WHERE name = '직업'), '프로그래머', 1, true),
((SELECT id FROM subjects WHERE name = '직업'), '변호사', 2, true),
((SELECT id FROM subjects WHERE name = '직업'), '회계사', 2, true),
((SELECT id FROM subjects WHERE name = '직업'), '건축가', 2, true),
((SELECT id FROM subjects WHERE name = '직업'), '디자이너', 2, true);

-- Insert words for 취미 subject
INSERT INTO words (subject_id, word, difficulty_level, is_active) VALUES
((SELECT id FROM subjects WHERE name = '취미'), '독서', 1, true),
((SELECT id FROM subjects WHERE name = '취미'), '영화감상', 1, true),
((SELECT id FROM subjects WHERE name = '취미'), '음악감상', 1, true),
((SELECT id FROM subjects WHERE name = '취미'), '게임', 1, true),
((SELECT id FROM subjects WHERE name = '취미'), '요리', 1, true),
((SELECT id FROM subjects WHERE name = '취미'), '운동', 1, true),
((SELECT id FROM subjects WHERE name = '취미'), '여행', 1, true),
((SELECT id FROM subjects WHERE name = '취미'), '사진촬영', 1, true),
((SELECT id FROM subjects WHERE name = '취미'), '그림그리기', 2, true),
((SELECT id FROM subjects WHERE name = '취미'), '악기연주', 2, true),
((SELECT id FROM subjects WHERE name = '취미'), '등산', 2, true),
((SELECT id FROM subjects WHERE name = '취미'), '낚시', 2, true);

-- Insert words for 교통수단 subject
INSERT INTO words (subject_id, word, difficulty_level, is_active) VALUES
((SELECT id FROM subjects WHERE name = '교통수단'), '자동차', 1, true),
((SELECT id FROM subjects WHERE name = '교통수단'), '버스', 1, true),
((SELECT id FROM subjects WHERE name = '교통수단'), '지하철', 1, true),
((SELECT id FROM subjects WHERE name = '교통수단'), '택시', 1, true),
((SELECT id FROM subjects WHERE name = '교통수단'), '기차', 1, true),
((SELECT id FROM subjects WHERE name = '교통수단'), '비행기', 1, true),
((SELECT id FROM subjects WHERE name = '교통수단'), '배', 1, true),
((SELECT id FROM subjects WHERE name = '교통수단'), '자전거', 1, true),
((SELECT id FROM subjects WHERE name = '교통수단'), '오토바이', 2, true),
((SELECT id FROM subjects WHERE name = '교통수단'), '헬리콥터', 2, true),
((SELECT id FROM subjects WHERE name = '교통수단'), '잠수함', 2, true),
((SELECT id FROM subjects WHERE name = '교통수단'), '우주선', 2, true);

-- Insert words for 가전제품 subject
INSERT INTO words (subject_id, word, difficulty_level, is_active) VALUES
((SELECT id FROM subjects WHERE name = '가전제품'), '냉장고', 1, true),
((SELECT id FROM subjects WHERE name = '가전제품'), '세탁기', 1, true),
((SELECT id FROM subjects WHERE name = '가전제품'), '전자레인지', 1, true),
((SELECT id FROM subjects WHERE name = '가전제품'), '에어컨', 1, true),
((SELECT id FROM subjects WHERE name = '가전제품'), '텔레비전', 1, true),
((SELECT id FROM subjects WHERE name = '가전제품'), '청소기', 1, true),
((SELECT id FROM subjects WHERE name = '가전제품'), '선풍기', 1, true),
((SELECT id FROM subjects WHERE name = '가전제품'), '전기밥솥', 1, true),
((SELECT id FROM subjects WHERE name = '가전제품'), '식기세척기', 2, true),
((SELECT id FROM subjects WHERE name = '가전제품'), '건조기', 2, true),
((SELECT id FROM subjects WHERE name = '가전제품'), '공기청정기', 2, true),
((SELECT id FROM subjects WHERE name = '가전제품'), '로봇청소기', 2, true);

-- Insert words for 학교 subject
INSERT INTO words (subject_id, word, difficulty_level, is_active) VALUES
((SELECT id FROM subjects WHERE name = '학교'), '교실', 1, true),
((SELECT id FROM subjects WHERE name = '학교'), '운동장', 1, true),
((SELECT id FROM subjects WHERE name = '학교'), '도서관', 1, true),
((SELECT id FROM subjects WHERE name = '학교'), '급식실', 1, true),
((SELECT id FROM subjects WHERE name = '학교'), '체육관', 1, true),
((SELECT id FROM subjects WHERE name = '학교'), '과학실', 1, true),
((SELECT id FROM subjects WHERE name = '학교'), '음악실', 1, true),
((SELECT id FROM subjects WHERE name = '학교'), '미술실', 1, true),
((SELECT id FROM subjects WHERE name = '학교'), '컴퓨터실', 2, true),
((SELECT id FROM subjects WHERE name = '학교'), '방송실', 2, true),
((SELECT id FROM subjects WHERE name = '학교'), '보건실', 2, true),
((SELECT id FROM subjects WHERE name = '학교'), '교무실', 2, true);

-- Create some sample admin users for testing
INSERT INTO users (nickname, profile_img_url, is_active, is_authenticated, ranking_points, highest_ranking_points) VALUES
('관리자', 'https://example.com/admin.jpg', true, true, 2500, 2500),
('테스트유저1', 'https://example.com/user1.jpg', true, true, 1200, 1350),
('테스트유저2', 'https://example.com/user2.jpg', true, true, 1500, 1600);

-- Add some sample game statistics for test users
UPDATE users SET 
    total_games = 25, 
    total_wins = 15, 
    total_losses = 10,
    liar_games = 8,
    liar_wins = 3,
    citizen_games = 17,
    citizen_wins = 12,
    total_playtime_seconds = 45000
WHERE nickname = '테스트유저1';

UPDATE users SET 
    total_games = 40, 
    total_wins = 28, 
    total_losses = 12,
    liar_games = 13,
    liar_wins = 8,
    citizen_games = 27,
    citizen_wins = 20,
    total_playtime_seconds = 72000
WHERE nickname = '테스트유저2';