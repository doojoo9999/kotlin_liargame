# 프로젝트: 네모네모로직(Nonogram) 플랫폼 — 게임성 강화 버전 전체 지시서

## 0) 진행 현황 (2025-11-04 기준)

- **F1** 완료 – `V012__Create_nemonemo_v2_tables.sql` 보강 및 시드 정비, Flyway 적용 확인.
- **F2** 완료 – SubjectPrincipal 기반 세션 인증·RateLimit 필터·헤더 정리.
- **F3** 진행 중 – 퍼즐 업로드 파이프라인 안정화(그리드 밸리데이션/체크섬 중복 처리, ResponseStatusException 매핑, `NemonemoPuzzleV2ControllerTest` 정상화).

## 1) 제품 목표(필수 기능)

### 핵심 게임플레이 기능
1. **네모네모로직 게임(웹 플레이)**:
    - 마우스/터치 입력(채움/비움/X 표시)
    - 대형 맵 줌/팬 (최대 50×50 지원)
    - 행·열 헤더 고정 및 스크롤 동기화
    - **진행도 실시간 자동 저장** (3초마다 또는 10회 입력마다)
    - **Undo/Redo 기능** (최대 50단계)
    - **힌트 시스템**: 행/열 완성 여부 실시간 표시, 오류 하이라이트

2. **오늘의 추천 게임**:
    - 매일 **KST 00:00** 자동 선정·캐시 프라임
    - 3~5개의 다양한 난이도 퍼즐 제공

3. **점수제도 및 리더보드**:
    - 로그인 없이도 유지(서명된 `anon_id` + 닉네임)
    - 리더보드(퍼즐별/전체/최근7일/월간)
    - **연속 플레이 보너스** (콤보 시스템)
    - **완벽 클리어 보너스** (무실수 완성)

4. **유저 등록 & 유저 추천**:
    - 추천 모이면 **OFFICIAL 승격**
    - **작가 팔로우 시스템**
    - **컬렉션/시리즈 기능** (작가가 관련 퍼즐을 묶어서 제공)

### 게임성 강화 추가 기능

5. **도전 과제 시스템**:
    - 일일/주간/월간 미션 (예: "5×5 퍼즐 3개 완료", "무실수로 1개 완료")
    - 업적 시스템 (뱃지 획득)
    - **시즌 패스** (무료/유료, 보상 차등화)

6. **타임 어택 모드**:
    - 제한 시간 내 퍼즐 완성
    - 별도 리더보드
    - 난이도별 시간 조정

7. **멀티플레이어 요소**:
    - **협력 모드**: 2~4명이 실시간으로 같은 퍼즐 풀이
    - **대결 모드**: 같은 퍼즐로 누가 더 빨리 푸는지 경쟁
    - **릴레이 모드**: 순서대로 일정 시간씩 번갈아 풀기

8. **튜토리얼 및 학습 시스템**:
    - 인터랙티브 튜토리얼 (5단계)
    - 난이도별 연습 퍼즐 제공
    - **해법 힌트 시스템** (1회 사용 시 점수 패널티)
    - **풀이 영상 재생** (완성된 퍼즐의 풀이 과정 시각화)

9. **맵 생성·업로드 파이프라인**:
    - **CLI/ASCII 아트 포함 모든 픽셀 아트 허용**
    - **해결 가능 + 유일해(단일 해)** 검증은 필수
    - 법적·윤리 정책(저작권·음란·증오 등) 위반만 반려/블라인드
    - "문자/숫자/CLI 금지"는 **폐지**. 대신 **텍스트성 추정치**로 **태깅만**
    - **에디터 강화**:
        - 대칭/회전 도구
        - 이미지 가져오기 (자동 도트화)
        - 미리보기 및 테스트 플레이
        - 힌트 자동 생성 검증

10. **소셜 기능**:
    - 댓글/평가 시스템
    - 퍼즐 공유 (링크/SNS)
    - **전용 커뮤니티 페이지** (공지/이벤트/팁)
    - 신고 시스템 (부적절한 콘텐츠)

> 정책: **복수 계정(멀티 계정) 추천 증가 허용**. 이를 막는 로직을 만들지 말 것.

## 2) 전반 아키텍처(코드로 구현 + 다이어그램 문서화)

### 서비스 구성
- **Web(React/TS)**: 게임 UI, 에디터, 커뮤니티
- **API(Spring/Kotlin)**: RESTful API, WebSocket (실시간 멀티플레이어)
- **Puzzle-Worker** (비동기): 유일해 검증/난이도 산정/메타 태깅
- **Match-Making Service**: 멀티플레이어 매칭 및 세션 관리
- **Achievement Service**: 도전 과제 및 업적 처리
- **PostgreSQL**: 주 데이터베이스
- **Redis**: 캐시, 세션, 실시간 데이터, 리더보드
- **배치/크론**: 매일 00시 추천, 랭킹 집계, 시즌 패스 리워드
- **정적/CDN**: 이미지·썸네일·프론트 번들

### Mermaid 다이어그램 (리포에 `/docs/architecture.md`) 최소 5개:
1. 전체 시스템 아키텍처
2. 플레이 시퀀스 (로드→입력→자동저장→정답 제출→점수 반영)
3. 업로드→검사 (텍스트성 태깅·유일해 검증)→승인/반려
4. 자정 추천 선정→캐시 프라임→클라이언트 노출
5. 멀티플레이어 매칭 및 게임 세션 흐름
6. 도전 과제 및 업적 처리 흐름

## 3) 데이터 모델(DDL 작성 및 마이그레이션 포함)

**엄격한 제약/인덱스** 포함. 아래는 필수 테이블과 핵심 컬럼.

### 기존 테이블
- `users` (선택 로그인 대비)
- `guest_identities` (PK: `anon_id`, `nickname`, `created_at`, `last_seen_at`, `signing_key_hash`, `device_fingerprint`)
- `puzzles` (id, title, width, height, author_id|anon_id, status: DRAFT/APPROVED/OFFICIAL, `content_style`, `text_likeness_score`, `tags`, `compliance_flags`, uniqueness_flag, difficulty_score, thumbnail_url, series_id, created_at, approved_at, official_at, view_count, play_count, clear_count, avg_time_ms, avg_rating)
- `puzzle_hints` (puzzle_id FK, rows JSONB, cols JSONB, version)
- `puzzle_solutions` (puzzle_id FK, grid_data BYTEA, checksum)
- `votes` (puzzle_id FK, subject_key, value=+1/-1, UNIQUE(puzzle_id, subject_key))
- `plays` (id, puzzle_id, subject_key, mode ENUM: NORMAL|TIME_ATTACK|MULTIPLAYER, started_at, finished_at, client_build, input_events JSONB, mistakes, used_hints, progress_snapshots JSONB, undo_count, combo_count)
- `scores` (puzzle_id, subject_key, mode, best_time_ms, best_score, perfect_clear, last_played_at, flags)
- `daily_picks` (date, items JSONB, generated_at)
- `reports` (puzzle_id, reporter_key, reason, status, reviewed_at, reviewer_id)
- `audit_logs` (who, what, when, payload JSONB)

### 게임성 강화 추가 테이블
- `achievements` (id, code, title, description, icon_url, tier ENUM: BRONZE|SILVER|GOLD|PLATINUM, points, conditions JSONB)
- `user_achievements` (subject_key, achievement_id, unlocked_at, progress JSONB, UNIQUE(subject_key, achievement_id))
- `challenges` (id, type ENUM: DAILY|WEEKLY|MONTHLY, title, description, requirements JSONB, rewards JSONB, start_date, end_date, active)
- `user_challenges` (subject_key, challenge_id, progress JSONB, completed, completed_at, claimed, UNIQUE(subject_key, challenge_id))
- `puzzle_series` (id, author_key, title, description, thumbnail_url, puzzle_order INT[], created_at)
- `follows` (follower_key, followee_key, followed_at, UNIQUE(follower_key, followee_key))
- `comments` (id, puzzle_id FK, author_key, content TEXT, parent_id, created_at, updated_at, deleted)
- `ratings` (puzzle_id FK, rater_key, stars INT CHECK(1<=stars<=5), comment_id, rated_at, UNIQUE(puzzle_id, rater_key))
- `multiplayer_sessions` (id, mode ENUM: COOP|VERSUS|RELAY, puzzle_id, host_key, status ENUM: WAITING|IN_PROGRESS|FINISHED, participants JSONB, started_at, finished_at, result JSONB)
- `multiplayer_participants` (session_id FK, subject_key, joined_at, ready, score, finish_time_ms, disconnected)
- `season_passes` (id, season_number, title, start_date, end_date, tiers JSONB, active)
- `user_season_progress` (subject_key, season_id, tier_level, xp, last_claimed_tier, premium)
- `notifications` (id, recipient_key, type, title, message, link, read, created_at)
- `game_settings` (subject_key, settings JSONB: {theme, sound_enabled, vibration_enabled, auto_x_mode, color_scheme})

### 인덱스 예시
- `puzzles(status, created_at)`, `puzzles(author_key, created_at)`, `puzzles(series_id, created_at)`
- `puzzles(content_style, created_at)`, `puzzles(difficulty_score)`, GIN(tags)
- `votes(puzzle_id, subject_key) UNIQUE`, `scores(puzzle_id, mode, best_time_ms)`
- `user_achievements(subject_key, unlocked_at)`, `user_challenges(subject_key, completed)`
- `follows(follower_key)`, `follows(followee_key)`
- `comments(puzzle_id, created_at)`, `ratings(puzzle_id, stars)`
- `multiplayer_sessions(status, created_at)`
- 대용량 로그(`plays`) 파티셔닝 고려(월별 등)

## 4) 인증/식별 설계(코드 구현)

- **게스트 우선**: 최초 접속 시 서버가 **서명된 `anon_id`** 발급 → **서명 쿠키** 저장(+ localStorage 백업 토큰)
- 닉네임은 자유 변경. 점수/추천 식별은 `anon_id` 기준
- 쿠키 삭제 대비: localStorage 백업 토큰으로 **1회성 재발급** API 제공
- **소셜 로그인 연동**: Google, Discord, Apple 지원
    - `anon_id ↔ user_id` 병합 API/마이그레이션 구현
    - 병합 시 기존 점수/업적/팔로우 관계 모두 이전
- **세션 관리**: JWT (Access Token 15분, Refresh Token 7일)
- **멀티플레이어 인증**: WebSocket 연결 시 JWT 검증

## 5) 점수제/리더보드(코드 구현)

### 점수 모델 (환경변수로 조정 가능)
```
base_score = difficulty_weight × clear_bonus
time_bonus = max(0, target_time - actual_time) × time_multiplier
combo_bonus = consecutive_correct_cells × combo_multiplier
perfect_bonus = (mistakes == 0) ? perfect_multiplier : 0
penalty = (mistakes × mistake_penalty) + (hints_used × hint_penalty)

final_score = base_score + time_bonus + combo_bonus + perfect_bonus - penalty
```

- **반드시 서버 기준 시간**으로 측정 (세션 시작/제출 시각을 서버가 서명 토큰으로 관리)
- **콤보 시스템**: 연속으로 정확한 셀 채우기 시 보너스 누적 (실수 시 리셋)
- **모드별 점수**: NORMAL, TIME_ATTACK, MULTIPLAYER 각각 별도 리더보드

### 리더보드
- 퍼즐별 (모드별)
- 전체 (누적 점수 합산)
- 최근 7일 (롤링)
- 월간 (시즌 패스 연동)
- 작가별 (작가의 퍼즐 평균 점수)
- Idempotency-Key로 이중 제출 방지
- 중복/부정 사용자를 **제한하지 않음** (정책)
- Redis Sorted Set으로 실시간 랭킹 관리

## 6) "오늘의 추천" 알고리즘(코드 구현 + 배치)

### 스케줄러
- **KST 00:00** 실행
- 3~5개의 퍼즐 선정 (난이도 분포: EASY 1개, MEDIUM 2~3개, HARD 1개)

### 후보 필터 (기본값, .env로 가중치/범위 조정 가능)
- **최근 30일 통계 기반**:
    - 완주율 20~60%
    - 평균 소요시간 상위 40~80%
    - 추천 비율(좋아요-싫어요) 상위 30%
    - 평균 평점 3.5★ 이상
    - 최소 플레이 횟수 50회 이상

- **다양성 보장**:
    - 동일 author 연속 노출 금지
    - 크기/난이도/`content_style` 분포 균형
    - 지난 7일간 추천된 퍼즐 제외
    - 시리즈 퍼즐일 경우 첫 번째 퍼즐 우선

- **페일세이프**: 부족 시 최근 OFFICIAL 가중 랜덤
- `daily_picks(date)` 저장 + Redis/CDN 프리로딩, ETag/Last-Modified 지원
- **사용자 맞춤 추천** (로그인 사용자): 플레이 히스토리 기반 개인화

## 7) 업로드 파이프라인(코드 구현)

### 입력 및 검증
- 입력: 흑백 도트 그리드 또는 이미지 업로드 (자동 도트화)
- **에디터 기능**:
    - 그리드 크기 선택 (5×5 ~ 50×50)
    - 그리기 도구: 펜, 채우기, 지우개, 선택 영역
    - 대칭/회전 도구 (수평/수직/90도)
    - 실행 취소/다시 실행
    - 미리보기 및 힌트 생성
    - 테스트 플레이 (제출 전 풀어보기)

- **정합성 검사**:
    - 크기 상한 (50×50)
    - 빈 퍼즐 방지
    - 고립 픽셀 경고 (단일 픽셀이 주변과 연결 없음)
    - 최소 채움 비율 (5% 이상)

### 텍스트성 판정 (태깅, 반려 아님)
- 휴리스틱 + OCR (경량: Tesseract.js)로 분석:
    - `content_style`: GENERIC_PIXEL|CLI_ASCII|LETTERFORM|SYMBOLIC|MIXED
    - `text_likeness_score`: 0.0 ~ 1.0
    - `tags`: 자동 태그 생성 (예: "animal", "character", "text", "abstract")
- **이는 검색/추천/노출 가중치 입력으로만 사용** (승격/게시 배제 근거 X)

### 유일해 검증 (필수)
- **솔버 알고리즘**:
    1. 교차 제약 전파 (Line Solving)
    2. 휴리스틱 (Overlap, Edge)
    3. 필요 시 DFS 백트래킹 (제한 시간 30초)
- **결과**:
    - **복수 해** → 반려 ("유일한 해가 필요합니다. 힌트를 조정해주세요.")
    - **무해결** → 반려 ("풀이 불가능한 퍼즐입니다.")
    - **단일 해** → 통과
- 솔루션 데이터는 `puzzle_solutions` 테이블에 저장 (정답 검증용)

### 난이도 산정
```
difficulty_score = 
  size_factor × (width × height) +
  solving_steps × step_weight +
  branching_factor × branch_weight +
  overlap_complexity × overlap_weight
```
- 0.0 ~ 10.0 스케일
- 카테고리: EASY (<3.0), MEDIUM (3.0~6.0), HARD (6.0~8.0), EXPERT (8.0+)

### 정책 위반 검사
- **자동 검사**:
    - 이미지 해시 기반 중복 검사
    - 음란물 감지 (간단한 휴리스틱)
    - 저작권 침해 의심 (유명 캐릭터 패턴 매칭)
- **수동 검토 큐**: 의심 항목은 관리자 검토 대기
- **신고 시스템**: 사용자 신고 시 즉시 검토 큐 진입
- 위반 확인 시 `compliance_flags` 기록 및 블라인드 처리

### 업로드 결과 응답
```json
{
  "puzzle_id": "uuid",
  "status": "APPROVED" | "PENDING_REVIEW" | "REJECTED",
  "metadata": {
    "content_style": "GENERIC_PIXEL",
    "text_likeness_score": 0.12,
    "tags": ["animal", "cute"],
    "uniqueness": true,
    "difficulty_score": 4.5,
    "difficulty_category": "MEDIUM",
    "solving_time_estimate_ms": 180000
  },
  "rejection_reason": "...",
  "review_notes": "..."
}
```

## 8) OFFICIAL 승격(코드 구현)

### 자동 승격 기준 (환경변수로 조정 가능)
- **기본 조건**:
    - 추천율 ≥ 70% (좋아요 / (좋아요+싫어요))
    - 클리어 수 ≥ 100
    - 평균 평점 ≥ 4.0★
    - 신고 0건 (또는 검토 완료 후 문제없음)
    - 유일해 유지
    - 게시 후 7일 경과

- **복수 계정 의심 조건 없음** (정책)

### 수동 승격/관리
- **관리자 툴**:
    - 승인/반려/승격/철회 버튼
    - 감사 로그 자동 기록
    - 일괄 처리 기능
    - 통계 대시보드

### 승격 혜택
- "OFFICIAL" 배지 표시
- 검색 우선순위 상승
- "오늘의 추천" 후보 풀 진입
- 작가 프로필에 강조 표시

## 9) 프론트엔드(코드 구현)

### 페이지 구조

#### 홈 페이지
- **오늘의 추천**: 3~5개 퍼즐 카드 (배지, 난이도, 예상 시간, 썸네일)
- **인기/최신 탭**: 무한 스크롤, 필터 바
- **내 도전 과제**: 진행 중인 미션 표시
- **랭킹 미리보기**: Top 3 플레이어

#### 퍼즐 플레이 페이지
- **캔버스 영역**:
    - Konva.js 또는 PixiJS로 구현
    - 좌클릭 = 채움, 우클릭 = X 표시, 드래그 연속 입력
    - 모바일: 탭 = 채움, 롱탭 = X
    - 줌/팬 (마우스 휠, 핀치)
    - 행·열 헤더 고정 (스크롤 동기화)
    - 완성된 행/열 하이라이트
    - 오류 하이라이트 (옵션, 실수 방지 모드)

- **UI 패널**:
    - 상단: 제목, 난이도, 타이머, 점수
    - 좌측: 도구 바 (펜/X/지우개 선택, Undo/Redo)
    - 우측: 힌트 정보 (행/열 합계, 완성 여부)
    - 하단: 진행률 바, 콤보 카운터
    - 설정 버튼 (음향, 테마, 자동 X 모드)

- **기능**:
    - 진행 자동 저장 (3초마다 또는 10회 입력마다)
    - Undo/Redo (최대 50단계)
    - 힌트 사용 (1회, 점수 패널티)
    - 일시 정지/재개
    - 포기 (확인 다이얼로그)

#### 에디터 페이지
- **그리드 편집 영역**: 드래그 앤 드롭, 대칭/회전 도구
- **미리보기 패널**: 실시간 힌트 생성 및 검증 상태
- **메타데이터 입력**: 제목, 설명, 태그, 시리즈 선택
- **테스트 플레이 버튼**: 제출 전 직접 풀어보기
- **업로드 결과 표시**: 태깅, 유일해, 난이도 정보

#### 검색/필터 페이지
- **필터 옵션**:
    - 크기 (5×5 ~ 50×50)
    - 난이도 (EASY/MEDIUM/HARD/EXPERT)
    - 추천 비율 (슬라이더)
    - `content_style` (다중 선택)
    - `tags` (자동완성 입력)
    - `text_likeness_score` (슬라이더)
    - 평균 평점 (★ 필터)
    - 작가 이름/ID

- **정렬 옵션**: 최신순, 인기순, 난이도순, 평점순, 플레이 수순
- **결과 표시**: 그리드/리스트 뷰 전환, 무한 스크롤

#### 랭킹 페이지
- **탭**: 퍼즐별, 전체, 최근 7일, 월간, 작가별
- **필터**: 모드별 (NORMAL/TIME_ATTACK/MULTIPLAYER)
- **내 기록 하이라이트**: 자동 스크롤 및 강조
- **Top 3 특별 표시**: 금/은/동 배지

#### 프로필 페이지 (게스트/로그인)
- **게스트**:
    - `anon_id` 표시 (복사 버튼)
    - 닉네임 변경
    - 백업 토큰 발급/재발급
    - 소셜 로그인 연동 안내

- **로그인 사용자**:
    - 프로필 정보 (아바타, 닉네임, 가입일)
    - 통계 (총 플레이, 클리어, 평균 점수)
    - 업적 뱃지 (진행률 표시)
    - 팔로워/팔로잉 목록
    - 내가 만든 퍼즐 관리
    - 플레이 히스토리
    - 시즌 패스 진행 상황

#### 커뮤니티 페이지
- **공지사항/이벤트**: 관리자 게시글
- **팁 & 가이드**: 사용자 작성 튜토리얼
- **댓글/토론**: 퍼즐별 댓글 통합 뷰
- **추천 작가**: 이번 주 인기 작가 소개

#### 멀티플레이어 로비
- **모드 선택**: 협력/대결/릴레이
- **방 생성/참가**: 공개/비공개 방
- **대기실**: 참가자 목록, 준비 상태, 채팅
- **퍼즐 선택**: 호스트가 선택 또는 랜덤
- **시작**: 모두 준비 완료 시

#### 관리자 페이지
- **퍼즐 검토 큐**: 승인/반려 버튼, 반려 사유 템플릿
- **OFFICIAL 승격 관리**: 후보 목록, 통계 확인, 일괄 처리
- **신고 처리**: 신고 내용 확인, 조치 기록
- **사용자 관리**: 제재, 경고, 차단
- **통계 대시보드**: 실시간 지표, 그래프
- **감사 로그**: 모든 관리 작업 기록 조회

### 상태/데이터 관리
- **TanStack Query**:
    - API 연동 및 캐싱
    - Optimistic Update (투표, 팔로우)
    - Suspense 경계 설정
    - 무한 스크롤 (useInfiniteQuery)
    - 실시간 데이터 폴링 (리더보드, 멀티플레이어)

- **Zustand/Redux Toolkit**:
    - 전역 UI 상태 (테마, 언어, 사운드 설정)
    - 게임 상태 (진행 중인 퍼즐, Undo/Redo 스택)
    - 멀티플레이어 세션 상태
    - 알림 큐

- **i18next**:
    - 기본: 한국어 (ko)
    - 추가: 영어 (en), 일본어 (ja)
    - 네임스페이스 분리 (common, game, editor, admin)

- **접근성**:
    - ARIA 라벨 (모든 인터랙티브 요소)
    - 키보드 네비게이션 (화살표 키로 셀 이동)
    - 색맹 모드 (색상 대신 패턴/기호 사용)
    - 스크린 리더 지원

- **Tailwind + Radix UI**:
    - 다크/라이트 테마 토글
    - 반응형 디자인 (모바일 최적화)
    - 컴포넌트 라이브러리 (Dialog, Dropdown, Tooltip 등)

### 성능/UX 최적화
- **대형 맵 최적화**:
    - 버추얼 셀 렌더링 (뷰포트 밖 셀 생략)
    - 드로우 배칭 (requestAnimationFrame)
    - 오프스크린 캔버스 (백그라운드 렌더링)
    - 레이어 분리 (그리드/힌트/입력 레이어)
    - 최소 60fps 보장

- **로딩 전략**:
    - 코드 스플리팅 (라우트별, 컴포넌트별)
    - 레이지 로딩 (이미지, 비디오)
    - 프리로딩 (다음 페이지 예측)
    - 스켈레톤 UI

- **에러 처리**:
    - Error Boundary
    - 재시도 로직 (네트워크 오류)
    - 사용자 친화적 에러 메시지
    - 오프라인 감지 및 안내

- **애니메이션**:
    - 페이지 전환 (Framer Motion)
    - 마이크로 인터랙션 (버튼, 카드)
    - 성취 팝업 (업적 해금)
    - 로딩 스피너

## 10) API(코드 + OpenAPI 문서)
모든 엔드포인트는:
- **유효성 검사**: Request DTO에 Hibernate Validator 어노테이션
- **에러 스키마**: RFC 7807 Problem Details
- **인증**: JWT Bearer Token (게스트는 서명된 anon_id)
- **레이트 리밋**: IP/subject_key 기반 (Bucket4j)
- **페이징**: Cursor-based 또는 Offset-based
- **정렬**: 다중 필드 지원
- **필터**: 동적 쿼리 (QueryDSL)

OpenAPI 3.1 YAML 자동 생성 (`springdoc-openapi`) 및 리포 `/docs/openapi.yaml` 배치

## 11) 보안/무결성

### 게임 무결성
- **서버 서명 토큰**:
    - 세션 시작 시 발급 (HMAC, 유효기간 4시간)
    - 토큰에 포함: session_id, puzzle_id, started_at, subject_key
    - 제출 시 검증: 시간 변조 방지, 세션 유효성 확인

- **타이머 검증**:
    - 서버가 `started_at` 기록
    - 제출 시 서버 시각 기준으로 소요 시간 계산
    - 클라이언트 타이머는 UI 표시용

- **정답 검증**:
    - 클라이언트가 제출한 그리드를 서버가 `puzzle_solutions`와 비교
    - 체크섬 일치 확인

- **Idempotency**:
    - 제출 시 `Idempotency-Key` 헤더 필수
    - Redis에 5분간 캐시
    - 중복 제출 시 기존 결과 반환

### 레이트 리밋
- **Bucket4j** 기반:
    - API 엔드포인트별 제한 (예: `/plays` 10회/분)
    - IP 기반 글로벌 제한 (1000회/시간)
    - subject_key 기반 제한 (인증 사용자/게스트 차등)

- **봇 방지**:
    - 간단한 패턴 감지 (동일 간격 요청, 비정상 속도)
    - 의심 시 CAPTCHA 챌린지
    - 경고/딜레이 적용 (허용 정책 범위 내)

### 인증/인가
- **JWT 토큰**:
    - Access Token: 15분 (짧은 유효기간)
    - Refresh Token: 7일 (HttpOnly Secure Cookie)
    - RS256 서명 (비대칭 키)

- **권한 관리**:
    - Role: GUEST, USER, AUTHOR, MODERATOR, ADMIN
    - 엔드포인트별 권한 검사 (`@PreAuthorize`)

### 데이터 보호
- **민감 정보**:
    - 비밀번호 해싱: Argon2id
    - 개인 정보 암호화: AES-256
    - 서명 쿠키: Secure, HttpOnly, SameSite=Strict

- **CORS**:
    - 화이트리스트 기반
    - Preflight 캐싱

- **CSRF**:
    - Double Submit Cookie 패턴
    - SameSite 쿠키 속성

- **HTTP 헤더 강화**:
    - Strict-Transport-Security
    - Content-Security-Policy
    - X-Content-Type-Options
    - X-Frame-Options

### 입력 검증
- **XSS 방지**:
    - 모든 사용자 입력 sanitize (OWASP Java HTML Sanitizer)
    - React의 기본 이스케이프 활용

- **SQL Injection 방지**:
    - Prepared Statement (JPA/QueryDSL)
    - 동적 쿼리도 파라미터 바인딩

- **파일 업로드**:
    - 이미지 크기 제한 (5MB)
    - MIME 타입 검증
    - 파일명 sanitize
    - 바이러스 스캔 (옵션: ClamAV)

## 12) 멀티플레이어 구현

### WebSocket 아키텍처
- **Spring WebSocket + STOMP**:
    - `/ws/multiplayer/{session_id}` 엔드포인트
    - JWT 인증 (Handshake Interceptor)
    - 메시지 브로커: Redis Pub/Sub

### 메시지 타입
```typescript
// 클라이언트 → 서버
type ClientMessage = 
  | { type: 'CELL_MARK', x: number, y: number, state: 'FILLED' | 'EMPTY' | 'X' }
  | { type: 'CHAT', message: string }
  | { type: 'READY', ready: boolean }
  | { type: 'SUBMIT_SOLUTION' }

// 서버 → 클라이언트
type ServerMessage =
  | { type: 'GAME_STATE', grid: Cell[][], participants: Participant[] }
  | { type: 'CELL_UPDATED', x: number, y: number, state: CellState, by: string }
  | { type: 'CHAT_MESSAGE', from: string, message: string, timestamp: number }
  | { type: 'PARTICIPANT_JOINED', participant: Participant }
  | { type: 'PARTICIPANT_LEFT', subject_key: string }
  | { type: 'PARTICIPANT_READY', subject_key: string, ready: boolean }
  | { type: 'GAME_STARTED', started_at: number }
  | { type: 'GAME_FINISHED', winner: string, results: Result[] }
  | { type: 'ERROR', code: string, message: string }
```

### 게임 모드

#### 협력 모드 (COOP)
- 2~4명이 하나의 퍼즐을 함께 풀이
- 모든 참가자가 그리드를 공유
- 셀 업데이트 실시간 동기화
- 충돌 방지: 낙관적 락 (마지막 업데이트 우선)
- 완성 시 모든 참가자에게 점수 분배

#### 대결 모드 (VERSUS)
- 2~4명이 **같은 퍼즐**을 각자 풀이
- 각자 독립된 그리드 (동기화 X)
- 가장 빨리 완성한 사람이 승리
- 실시간 진행률 표시 (상대방의 완성 %)
- 순위에 따라 차등 점수

#### 릴레이 모드 (RELAY)
- 2~4명이 순서대로 번갈아 풀이
- 각 턴: 30초~1분 제한 시간
- 턴 종료 시 다음 사람에게 자동 전환
- 협력으로 완성 목표
- 실수/시간 초과 시 패널티

### 매칭 시스템
- **공개 방**: 누구나 참가 가능, 자동 매칭
- **비공개 방**: 초대 코드로만 참가
- **랭킹 매칭** (옵션): 비슷한 레벨의 플레이어끼리 매칭
- **대기 시간**: 30초 이내 매칭 실패 시 봇 추가 (옵션)

### 동기화 전략
- **상태 동기화**: 250ms마다 델타 전송
- **충돌 해결**: 서버 타임스탬프 기준 최종 일관성
- **재연결 처리**:
    - 30초 이내 재연결 시 세션 유지
    - 현재 게임 상태 전체 전송
- **지연 보상**: 클라이언트 측 예측 렌더링

### 성능 최적화
- **방 수 제한**: 동시 활성 방 최대 1000개
- **메시지 배칭**: 100ms 윈도우 내 메시지 묶음 전송
- **Redis Pub/Sub 샤딩**: session_id 기반 분산

