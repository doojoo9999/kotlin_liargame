# Repository Guidelines

## Project Structure & Module Organization
- Backend Kotlin code sits in `src/main/kotlin/org/example/kotlin_liargame`, split into domain packages (`auth`, `chat`, `game`, `subject`, `user`) with configs and assets in `src/main/resources`.
- Tests mirror that tree in `src/test/kotlin`; shared fixtures and YAML overrides live in `src/test/resources`.
- The React client resides in `frontend/` (`src/components`, `src/pages`, `src/stores`, `src/api`, `src/services`), while supporting docs stay in `docs/` and top-level `*_GUIDE.md` files.

## Build, Test, and Development Commands
- `./gradlew bootRun` starts the backend with the `dev` profile; `./gradlew build` produces the runnable jar.
- `./gradlew test` runs the JUnit 5 + MockK suite and should pass before every push.
- `cd frontend && npm install` prepares the UI. Use `npm run dev` locally, `npm run lint` for ESLint, `npm run test:run` for unit tests, `npm run test:e2e` for Playwright flows, and `npm run build` for the production bundle.

## Coding Style & Naming Conventions
- Kotlin files follow four-space indentation, `PascalCase` classes, `camelCase` members, lowercase package names, and constructor injection for Spring beans.
- React components use `PascalCase` filenames, hooks/utilities use `camelCase`, and colocated tests or stories should live beside the source.
- Run `npm run lint` before committing and rely on the shared IDE Kotlin formatting profile to keep spacing consistent.

## Testing Guidelines
- Backend tests end with `*Test.kt`, live under the matching package, rely on MockK, and should prefer slice annotations like `@DataJpaTest` before booting the full context.
- Use Testcontainers only for Postgres-specific scenarios; otherwise stub repositories or services to keep suites fast.
- Frontend specs use Vitest with Testing Library (`*.test.ts`/`*.test.tsx`), Playwright journeys live in `frontend/tests` with reports from `npm run test:e2e:report`, and coverage should stay near 80% via `npm run test:coverage`.

## Commit & Pull Request Guidelines
- Follow the observed `type: summary` format (`feat: lobby matchmaking updates`); English or Korean subjects are both acceptable.
- Reference related issues (`fix: adjust vote tally (#142)`) and keep commits focused on one logical change.
- PR descriptions should outline changes, list verification commands (`./gradlew test`, `npm run test:run`, etc.), include screenshots for UI updates, and update docs when behavior shifts.

## Environment & Configuration Tips
- Copy sanitized defaults from `src/main/resources/application.yml` and `env-base.js`, keep secrets in untracked `.env.local`, and add templates like `application-example.yml` when new settings appear.
- Activate Spring profiles with `SPRING_PROFILES_ACTIVE` and surface new WebSocket topics through `frontend/src/api/websocket.ts` so clients stay aligned.
