# Project Overview

## System Architecture
- Monorepo with a Kotlin/Spring Boot backend under `src/main/kotlin/org/example/kotlin_liargame` and frontend workspaces under `apps/` (legacy Liar Game client in `apps/liar-game/`).
- Domain packages (`auth`, `chat`, `game`, `subject`, `user`, `word`, `profanity`) expose REST controllers, DTOs, repositories, and services; cross-cutting helpers live in `global/` (exception handling, session, messaging, security) and `tools/` (Swagger, schedulers, WebSocket).
- Persistence uses Postgres in production with HikariCP, Testcontainers for integration tests, and H2 for local bootstrapping. Redis (`spring-session-data-redis`) stores sessions and hot game state recovery via `GameStateService`.
- Real-time traffic flows through STOMP over WebSocket on `/ws`, with `/app` as the application prefix and `/topic` broker destinations managed by `GameMessagingService`.

## Game Lifecycle
- Lifecycle phases follow `GamePhase`: `WAITING_FOR_PLAYERS → SPEECH → VOTING_FOR_LIAR → DEFENDING → VOTING_FOR_SURVIVAL → GUESSING_WORD → GAME_OVER`.
- `GameService` manages room creation and joins, `GameProgressService` advances phases, `VotingService` and `EnhancedVotingService` count ballots, and `GameResultService` persists outcomes.
- Countdown and readiness flows use `/api/v1/game/{gameNumber}/countdown/*` and `/ready` endpoints, while `GameCleanupService` prunes stale rooms and sessions.

## Core HTTP & WebSocket Interfaces
- REST base path is `/api/v1`. Representative routes:
  - Auth: `/auth/login`, `/auth/logout`, `/auth/check`, `/auth/admin/login`, plus admin maintenance endpoints such as `/auth/admin/cleanup/stale-games`.
  - Game: `/game/create`, `/game/join`, `/game/start`, `/game/hint`, `/game/vote`, `/game/vote/final`, `/game/guess-word`, `/game/rooms`, `/game/{gameNumber}`, `/game/recover-state/{gameNumber}`.
  - Chat: `/chat/send`, `/chat/history`, `/chat/post-round/{gameNumber}`, `/chat/speech/complete`.
  - Subject & Word curation: `/subject/applysubj`, `/subject/delsubj/{id}`, `/subject/listsubj`, `/subject/approve-pending`.
- STOMP destinations broadcast to `/topic/game/{gameNumber}/state`, `/events`, `/moderator`, and per-user `/topic/game/{gameNumber}/*` channels. Clients publish via `/app/game/{gameNumber}/vote`, `/app/game/{gameNumber}/guess-topic`, and related mappings and must refresh sessions through `/ws` heartbeats.

## Frontend Experience & Design
- React 19 + Vite with Zustand stores (`apps/liar-game/src/stores`) and feature-driven directories under `src/components`, `src/pages`, and `src/services`.
- UI design prioritises accessibility (keyboard navigation, screen-reader labels), progressive disclosure of hints, and responsive layouts at 768px, 1024px, and 1280px breakpoints.
- Moderator commentary, game actions, player status, and activity feed components follow a clear visual hierarchy and reuse shared tokens from `src/lib`.

## Testing & Operations
- `./gradlew test` runs JUnit 5 suites with MockK and selective Testcontainers support. Use slice tests (`@WebMvcTest`, `@DataJpaTest`) for fast feedback before full-context simulations like `LiarGameFullFlowSimulationTest`.
- Frontend quality gates include `npm run lint`, `npm run test:run`, and `npm run test:coverage` (~80% statement baseline). Playwright journeys live in `apps/liar-game/tests` with reports from `npm run test:e2e:report`.
- Observability uses Spring Actuator, Prometheus metrics, and structured logging via Logstash encoder; keep dashboards aligned when adding new endpoints.

## Environment & Configuration
- Default profiles load from `src/main/resources/application.yml`; override with `SPRING_PROFILES_ACTIVE` (dev, prod) and supply secrets through untracked `.env.local` files mirrored from `env-base.js`.
- Redis and Postgres URLs should be declared per profile; developers can fall back to local Docker (`docker compose up redis postgres`) or H2 for quick smoke tests.
- Swagger UI is available through `SwaggerConfig` when the `dev` profile is active, offering live inspection of the documented endpoints.
