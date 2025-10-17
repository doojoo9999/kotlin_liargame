# 네모네모 개발 계획 (Codex CLI 협업)

> 현재 진행 단계: **Phase 2 - 퍼즐 엔진 & 에디터 개발** (Phase 1 산출물 초안 완료)

## 1. 프로젝트 개요
- 서비스 위치: `https://domain.com/nemonemo`
- 개발 배경: 기존 라이어게임(`https://domain.com/liargame`)에서 축적한 운영/기술 자산을 활용해 네모네모 로직(노노그램) 기반 퍼즐 게임을 확장한다.
- 핵심 가치: 직관적인 퍼즐 플레이 UX, 기존 계정/랭킹 연동, 지속 가능한 퍼즐 공급 파이프라인.

## 2. 목표 및 성공 지표
- **핵심 KPI**
  - 출시 1개월 내 DAU 1,000명
  - 월간 퍼즐 클리어 10,000건
  - 평균 세션 이탈률 30% 이하
- **연동 목표**
  - 라이어게임 계정/지갑/포인트 시스템과 단일 로그인 유지
  - 주간 신규 퍼즐 20개 이상 등록 자동화

## 3. 범위 및 주요 기능
- **퍼즐 플레이**: 좌표 힌트 기반 격자 채우기, 오답 감지, 힌트, 자동 저장, 아이템.
- **퍼즐 관리**: 관리자 에디터, 퍼즐 검수 플로우, 난이도/태그 관리, 퍼즐 버전 이력.
- **진행/랭킹**: 클리어 시간·정확도·힌트 사용량을 기반으로 점수 산정, 시즌 랭킹/업적.
- **사회적 기능**: 친구 초대, 퍼즐 공유, 관전 모드(후속 단계).
- **운영 도구**: 관리 대시보드, 공지/이벤트 배포, 로그/분석 수집, 퍼즐 공급 관리.

## 4. 기술 스택 방향성
- **백엔드**: Kotlin + Spring Boot, JPA/QueryDSL, Redis 캐시, WebSocket(SockJS+STOMP) 또는 RSocket, Flyway 마이그레이션, Testcontainers.
- **프론트엔드**: React + Vite + TypeScript, Zustand, Canvas/SVG 기반 격자 렌더링, React Query, WebSocket 클라이언트 재사용, Tailwind CSS 도입 검토.
- **인프라/CI**: Docker 로컬 실행, GitHub Actions 빌드·테스트, S3 + CloudFront 정적 배포, 스테이징/프로덕션 분리.

## 5. Codex CLI 협업 원칙
- **맥락 확보**: 변경 전 관련 소스/문서 읽기, 필요 시 `rg`, `sed`, `./gradlew`, `npm` 명령 사용.
- **작업 단위화**: 각 프롬프트마다 구체적인 목표, 영향 범위, 검증 명령을 명시한다.
- **검증 우선**: 가능한 한 `./gradlew test`, `npm run lint`, `npm run test:run` 등 명령으로 자동 검증 후 결과 요약.
- **문서화**: 기능/설계 변화는 `docs/nemonemo` 혹은 관련 README에 반영.
- **버전 관리**: 작업 완료 후 `git status`, `git diff` 요약 공유, 필요 시 커밋 메시지 템플릿(예: `feat: ...`) 제안.
- **피드백 루프**: AI의 판단 불확실 시 사용자에게 질문하여 가설 검증 후 진행.

## 6. 단계별 개발 로드맵 (AI 수행 지침 포함)

### Phase 0. 리서치 & 기획 (1주)
- 과업: 경쟁사 UX 분석, 사용자 스토리 정의, IA/와이어프레임 초안 작성.
- Codex 지침: 관련 레퍼런스 조사 시 공개 자료만 요약, 요구사항 문서 초안 작성(`docs/nemonemo/requirements.md` 등), 사용자가 제공하는 추가 자료 반영.
- 산출물: 요구사항 정의서, UX 플로우 다이어그램, 기술 검토 메모.

### Phase 1. 시스템 설계 & 기반 구축 (2주)
- 과업: 데이터 모델/ERD, API 스펙(OpenAPI), 프로젝트 스캐폴딩, 공통 라이브러리 추출, CI 확장.
- Codex 지침: Kotlin/React 디렉터리 구조 준수, 새 모듈 시 `settings.gradle` 및 빌드 설정 동기화, Swagger 설정 추가, GitHub Actions 워크플로 수정 시 YAML 검증.
- 산출물: ERD 문서, OpenAPI 스펙, 초기 코드베이스, CI 파이프라인 PR 초안.

### Phase 2. 퍼즐 엔진 & 에디터 개발 (3주)
- 과업: 퍼즐 생성/검증 알고리즘, 난이도 계산, CRUD API, 에디터 UI.
- Codex 지침: 알고리즘 단위테스트 작성, MockK/Testing Library 활용, 관리자 라우트 보호, 불필요한 렌더 최소화.
- 산출물: 퍼즐 엔진 코드, 관리자 에디터 페이지, 승인 플로우 문서화.

### Phase 3. 플레이 경험 구현 (4주)
- 과업: 퍼즐 플레이어 UI, 힌트/입력 모드, 진행상태 저장, 실시간 동기화, QA.
- Codex 지침: 반응형 레이아웃 검증, WebSocket 이벤트 명세 문서화, 접근성 체크리스트 작성, 자동 저장 상태 통합 테스트.
- 산출물: 플레이 UI, 게임 세션 API, 실시간 알림 프로토타입, QA 리포트.

### Phase 4. 랭킹/진행/커뮤니티 확장 (2주)
- 과업: 점수 계산 로직, 시즌 관리, 친구/공유 기능, 알림 인프라.
- Codex 지침: Redis/Zustand 상태 동기화 검증, 공유 링크 보안 점검, 알림 설정 템플릿 작성.
- 산출물: 리더보드 UI, 시즌 관리 도구, 공유/초대 흐름 설계 문서.

### Phase 5. 베타 테스트 & 런칭 준비 (2주)
- 과업: 클로즈드 베타, 로그/관제, A/B 실험 준비, 운영 매뉴얼.
- Codex 지침: 로깅/모니터링 설정 문서화, A/B 실험 토글 구현 시 플래그 관리 전략 설명, 운영 문서 템플릿 작성.
- 산출물: 베타 피드백 리포트, 런칭 체크리스트, 운영 가이드.

### Phase 6. 정식 오픈 & 운영 (지속)
- 과업: KPI 모니터링, 시즌별 업데이트, 이벤트, 성능 최적화.
- Codex 지침: 자동 리포트 스크립트 제안, 리그레이션 방지 테스트 추가, 성능 개선 로그 작성.
- 산출물: 운영 리포트, 기능 백로그, 최적화 계획.

## 7. 협업 역할 정의
- **사용자**: 우선순위 결정, 추가 요구사항/피드백 제공, 중요한 비즈니스 의사결정.
- **Codex CLI**: 요구사항 분석, 설계 제안, 코드/문서 작성, 테스트 실행 및 결과 요약, 불확실성 질문.

## 8. 리스크 및 대응 전략
- **퍼즐 생성 난이도**: 자동 알고리즘 정확도 확보 어려움 → 초기에는 수동 제작 + 검수 툴 중심, 생성기는 베타 이후 개선.
- **실시간 동기화 부하**: 대규모 동시 접속 대비 Redis Pub/Sub, 수평 확장 플랜 수립.
- **콘텐츠 고갈**: 크리에이터 커뮤니티/UGC 도입, 퍼즐 큐레이션 자동화 제안.
- **UX 복잡도**: 온보딩 튜토리얼/가이드 영상 기획, 접근성 체크리스트 유지.

## 9. Codex CLI 실행 프롬프트
아래 프롬프트를 Codex CLI에 전달해 단계별 작업을 지시한다. 필요 시 세부 목표/산출물을 수정 후 사용한다.

```
You are Codex CLI collaborating on the Nemonemo puzzle project at https://domain.com/nemonemo. Follow repository conventions (Kotlin backend under src/main/kotlin/org/example/kotlin_liargame, React frontend workspaces inside apps/ such as apps/nemonemo/). For each task:
1. Restate the goal and outline a short plan before coding.
2. Read relevant files with minimal commands (prefer rg, sed, cat). Avoid reverting unrelated changes.
3. Implement changes using Kotlin/React best practices, add concise comments only when logic is non-obvious.
4. Run applicable checks (./gradlew test, npm run lint/test) and summarize results. If a check cannot run, explain why and suggest follow-ups.
5. Summarize modifications referencing file paths and key lines, then propose next actionable steps.

Current roadmap phase: <PHASE>. Focus on the deliverables listed in docs/nemonemo/DEVELOPMENT_PLAN.md for that phase. Clarify uncertainties before proceeding.
```

> `<PHASE>`는 진행 중인 단계(예: `Phase 1 - 시스템 설계 & 기반 구축`)로 교체해 사용한다.
