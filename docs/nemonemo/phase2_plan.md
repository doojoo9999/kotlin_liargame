# Phase 2 Kickoff – 퍼즐 엔진 & 에디터 개발

## 1. 목표 요약
- 퍼즐 생성/검증 서비스 초안 구현 및 단위 테스트 마련.
- 관리자 에디터 UI 스캐폴드 구성 및 라우팅 보호 적용.
- 퍼즐 CRUD API와 검수 워크플로를 위한 기본 도메인 로직 확정.

## 2. 우선 작업 항목
1. **퍼즐 솔버/검증 서비스 초안**
   - 요구사항: 단일 해답 보장 검증, 난이도 추정 메트릭 산출.
   - 산출물: `PuzzleSolverService`, `PuzzleValidationService` 테스트 포함.
2. **퍼즐 관리 API**
   - 요구사항: 퍼즐 등록/수정/승인 플로우, 관리자 권한 체크, 힌트 계산 파이프라인.
   - 산출물: Controller + Service + DTO 설계, OpenAPI 업데이트.
3. **에디터 UI 스캐폴드**
   - 요구사항: React 라우트, Zustand 상태 모델, 격자 편집 컴포넌트 골격.
   - 산출물: `/nemonemo/editor` 페이지, 기본 상호작용, 테스트 스텁.

## 3. 기술 검토 메모
- 격자 크기: 초기 릴리즈 15x15, 20x20 지원, Solver 성능 측정 대상.
- 검증 전략: 백트래킹 + 힌트 기반 브랜치 절삭 → 추후 SAT 접근 대비 비교 지표 수집.
- 힌트 계산: 서버에서 선계산 후 저장, 클라이언트는 전달된 힌트 사용.
- 에디터: Canvas 기반 드로잉 + React 상태, 힌트 실시간 업데이트 위해 Web Worker 고려.

## 4. 검증 계획
- Solver: `@ParameterizedTest` 로 다중 퍼즐 케이스 검증, Testcontainers 로 대형 퍼즐 벤치마크.
- API: MockMvc 슬라이스 테스트 + Testcontainers DB.
- 프론트엔드: vitest + Testing Library 로 에디터 인터랙션 smoke test 작성.

## 5. 의존 이슈
- 에디터 디자인 시안/브랜드 컬러 필요 → 사용자 후속 제공 요청.
- SSO 연동 API 상세 명세 확인 (포인트 소모/보상) → Phase 2 중반 합류.
