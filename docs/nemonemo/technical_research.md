# Nemonemo Technical Research Memo

## 1. Backend Considerations
- **Domain Modeling**: Represent puzzles as `Puzzle` aggregate (metadata, size, row/column hints, solution matrix) and `PuzzleRelease` for scheduling. Sessions tracked via `PuzzleSession` with autosave snapshots.
- **Storage Format**: Persist puzzle solution as bitstring (1=filled,0=empty) for efficient diffing; hints stored as precomputed arrays. Evaluate PostgreSQL JSONB for flexible metadata and QueryDSL projections for admin filtering.
- **Validation Pipeline**: Implement solver service to confirm single-solution puzzles. Short term: leverage deterministic depth-first solver with heuristics; long term: explore optimized SAT-based validation if performance degrades.
- **Integration**: Reuse existing Liar Game auth via REST or gRPC gateway. Need API contract for points deduction/hint purchase. Cache frequently accessed puzzle metadata in Redis.
- **Testing Strategy**: Mix of slice tests (`@DataJpaTest`) for repositories and MockK for services. Use Testcontainers Postgres when verifying solver performance on realistic grids.

## 2. Frontend Considerations
- **Rendering**: Prefer Canvas for large grids (30x30+) to keep repaint cost low; fallback to SVG for accessibility overlays. Evaluate react-three-fiber only if 3D effects requested later.
- **State Management**: Combine Zustand (local session state) with React Query (server sync). Maintain immutable history stack for undo/redo with capped size to limit memory growth.
- **Accessibility & Input**: Keyboard navigation (WASD/arrow), shortcut keys for fill/mark, high-contrast theme toggle. Use `focus-visible` styles and semantic ARIA regions around grid.
- **Offline/Autosave**: Mirror backend autosave with IndexedDB cache so users can recover if offline; reconcile once connection restores.
- **Admin Tooling**: Reuse component library from existing frontend if available; otherwise, introduce headless UI primitives for forms and modals.

## 3. Real-time & Messaging
- **WebSocket Channels**: Extend existing SockJS/STOMP setup. Topics: `puzzle.session.{id}`, `leaderboard.weekly`. Ensure backpressure controls and heartbeat tuning.
- **Scaling Plan**: Start with single-node broker; prepare horizontal scaling with Redis Pub/Sub or dedicated message broker (e.g., RabbitMQ) if concurrency > 1k sessions.

## 4. Analytics & Observability
- **Metrics**: Instrument puzzle start/completion, hint usage, error events; align naming with current analytics schema to reuse dashboards.
- **Logging**: Structured JSON logs with puzzle/session IDs. Integrate with existing ELK stack. Highlight solver failures and autosave exceptions.
- **Feature Flags**: Adopt existing toggle service (if available) or introduce `unleash` client for experimental features (e.g., new hint types).

## 5. Security & Compliance
- **Access Control**: Role-based access for admin routes; verify JWT scopes from Liar Game auth service.
- **Data Privacy**: Puzzle submissions stored with creator attribution; ensure deletion flow on request. No PII beyond account IDs.
- **Cheat Prevention**: Validate client moves server-side; rate-limit hint requests; consider obfuscating puzzle solution when sent to client (only hints + delta updates).

## 6. Risks & Follow-ups
- Solver performance on large puzzles → prototype with 25x25 dataset and benchmark.
- Autosave sync conflicts → design conflict resolution (server wins vs. merge) before Phase 2.
- Points economy tuning → collaborate with biz stakeholders on conversion rates.
- Localization pipeline → confirm i18n tooling for backend emails and frontend copy.
