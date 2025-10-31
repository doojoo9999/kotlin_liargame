# Nemonemo Testing Strategy

본 문서는 `docs/nemonemo/TEST_PLAN.md`에서 정의한 시나리오를 실행하기 위한 테스트 접근법을 구체화합니다.

## 1. 테스트 피라미드

| 레벨 | 도구 | 커버리지 목표 | 비고 |
|------|------|---------------|------|
| 단위(Unit) | JUnit 5, MockK, Kotest | 핵심 도메인 로직 80% 이상 | 퍼즐 솔버, 점수 계산, 난이도 추정, 추천 알고리즘 |
| 통합(Integration) | Spring Boot Test, Testcontainers | 주요 플로우 60% 이상 | Postgres + Redis 연동, OAuth 시뮬레이션, WebSocket 핸드셰이크 |
| E2E | Playwright, Pact (Consumer) | 핵심 사용자 플로우 10+ | 게임 플레이, 업로드, 멀티플레이어, 배치 결과 검증 |
| 성능/부하 | Gatling, k6 | SLA 준수 | 1000 CCU, WebSocket 대역폭 테스트 |

## 2. 백엔드 테스트

- **퍼즐 솔버**: 파라미터화 테스트로 다양한 그리드 크기와 난이도 케이스 검증. 시간 제한은 `assertTimeout`.
- **점수 엔진**: Combination 기반 테스트 데이터 생성기(`ScoreScenarioFactory`)로 경계값(콤보 단절, 힌트 페널티) 확인.
- **추천 알고리즘**: 고정된 fixture 데이터를 사용하여 필터링/가중치가 정확히 적용되는지 검증.
- **레이트 리밋**: Spring MVC Test + Bucket4j mock으로 429 응답 확인.

### 통합 테스트
- Postgres/Redis는 Testcontainers로 기동. Flyway 마이그레이션 자동 수행.
- WebSocket 테스트는 `StompSession` 기반 통합 테스트로 ready, cell mark, finish 시나리오 검증.
- OCR/이미지 분석은 WireMock으로 대체 (성공/타임아웃/오류 케이스 포함).

### 보안 테스트
- JWT 위변조는 `Nimbus JOSE` 라이브러리로 잘못된 서명/만료 토큰 주입.
- CSRF/쿠키 보호는 MockMvc로 Double Submit Cookie 검증.
- 제출 무결성은 시작/종료 시각 조작 요청으로 400/403 응답을 기대.

## 3. 프론트엔드 테스트

- **UNIT**: Vitest + React Testing Library
  - 게임 캔버스는 Konva mock을 사용하여 셀 상태 전환을 검증.
  - 상태 스토어(Zustand)는 테스트 전후 reset helper를 사용.
  - 폼 관련 로직은 Zod schema를 통해 구체적인 에러 메시지 확인.
- **E2E**: Playwright
  - 멀티플레이어는 2개의 브라우저 컨텍스트를 생성하여 서로 상호작용.
  - 타임머신 테스트 (`page.addInitScript`)로 날짜/시간 조작.
  - 네트워크 모킹을 통해 배치 결과나 추천 목록 변경을 시뮬레이션.

## 4. CI 파이프라인

1. **Lint & Format**: `npm run lint`, `./gradlew ktlintCheck`.
2. **Unit Tests**: `./gradlew test`, `npm run test -- --run`.
3. **Integration Tests**: `./gradlew integrationTest`.
4. **E2E (Nightly)**: `pnpm playwright test --project=chromium`.
5. **Security Static Analysis**: `./gradlew dependencyCheckAnalyze`.
6. **Coverage Thresholds**: Kotlin 80%, TypeScript 75%. 빌드 실패 기준.

## 5. 테스트 데이터 관리

- `src/main/resources/db/seed/`의 샘플 데이터는 통합 테스트와 스테이징 환경에서 재사용.
- Faker 기반 데이터 팩토리로 대량 테스트 시 생성.
- 민감 데이터는 절대 저장하지 않으며, 시드에 포함된 이메일/ID는 더미 값 사용.

## 6. 자동화 도구

- GitHub Actions 워크플로: `ci.yml`, `nightly-e2e.yml`.
- Playwright Trace Viewer 업로드로 실패 케이스 분석.
- Gatling 시뮬레이션 결과는 Grafana Loki/Tempo로 수집.

## 7. 요약

테스트 전략은 고품질 퍼즐 경험과 멀티플레이어 안정성을 보장하기 위한 체계적인 접근을 제공한다. 계획된 테스트 시나리오가 모두 구현될 때까지 우선순위는 1) 퍼즐 솔버 정확도, 2) 점수 무결성, 3) 멀티플레이어 실시간 동기화에 둔다.
