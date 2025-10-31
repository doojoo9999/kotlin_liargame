# ADR-001: Tech Stack Selection

## Status
Accepted — 2024-10-09

## Context
Nemonemo must deliver a responsive puzzle experience, rich community features, and near real-time multiplayer. The repository already embraces Kotlin + Spring Boot for backend services and React-based frontends for other game experiences. Consistency with existing deployments, developer expertise, and shared tooling are critical to reduce onboarding cost and to reuse infrastructure (CI/CD, monitoring).

## Decision
- **Backend**: Kotlin 1.9 with Spring Boot 3.2, Spring Data JPA, Spring WebFlux/WebSocket. This aligns with existing codebases and offers first-class coroutine support, validation, and security primitives.
- **Data Stores**: PostgreSQL for relational data and Redis for caching, leaderboards, and Pub/Sub in multiplayer flows.
- **Frontend**: React 19 (with Vite 7 toolchain) using TypeScript, TanStack Query, Zustand, Tailwind, and Radix UI. This provides SPA performance, component reusability, and compatibility with existing UI libraries.
- **Worker / Async**: Dedicated Spring Boot puzzle-worker consuming tasks via Redis Streams/Kafka for solver workloads.
- **Infrastructure**: Docker Compose for local development, containerized services for deployment, and S3-compatible object storage for assets.

## Consequences
- Common stack across apps improves maintainability, but increases coupling and requires careful modularization to avoid monolith drift.
- High concurrency requirements mean we must tune Redis and Postgres, and adopt connection pooling best practices (Hikari, R2DBC where needed).
- Developers familiar with the previous projects can transition quickly; however, onboarding new hires still necessitates documentation and guardrails for advanced Kotlin/Spring patterns.
