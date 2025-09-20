# Nemonemo ERD Draft

## 1. Entities Overview
- **nemonemo_puzzle**: Canonical puzzle definition, including metadata, dimensions, solution encoding, and creation source.
- **nemonemo_puzzle_hint**: Precomputed row/column hints derived from the solution matrix.
- **nemonemo_puzzle_release**: Schedules when a puzzle becomes available to players, grouped by weekly pack or special event.
- **nemonemo_creator_submission**: Tracks creator-submitted puzzles through review and approval workflow.
- **nemonemo_session**: Active or completed playthrough tied to a user; stores timing, accuracy, and status.
- **nemonemo_session_snapshot**: Autosave payloads capturing grid state for resume functionality.
- **nemonemo_leaderboard_entry**: Aggregated completion metrics per user per release/week.
- **nemonemo_announcement**: Optional broadcast notices surfaced in dashboard.

## 2. Relationships
- `nemonemo_puzzle` 1 — * `nemonemo_puzzle_hint` (one puzzle has many hints; separated for fast lookup and caching).
- `nemonemo_puzzle` 1 — * `nemonemo_puzzle_release` (a puzzle can be published multiple times).
- `nemonemo_creator_submission` 1 — 1 `nemonemo_puzzle` (post-approval snapshot of source submission).
- `liargame_user` (external reference) 1 — * `nemonemo_session`.
- `nemonemo_session` 1 — * `nemonemo_session_snapshot`.
- `nemonemo_puzzle_release` 1 — * `nemonemo_session` (session references the release context for leaderboard scoring).
- `nemonemo_puzzle_release` 1 — * `nemonemo_leaderboard_entry`.

## 3. Attribute Sketch

### nemonemo_puzzle
- `id` (PK, UUID)
- `code` (unique short identifier for sharing)
- `title`
- `description`
- `width`, `height`
- `solution_blob` (bytea; packed bits)
- `difficulty` (enum: EASY/MEDIUM/HARD/EXPERT)
- `estimated_minutes`
- `source_type` (enum: CREATOR/OFFICIAL/IMPORT)
- `creator_user_id` (nullable FK to `liargame_user`)
- `created_at`, `updated_at`

### nemonemo_puzzle_hint
- `id` (PK)
- `puzzle_id` (FK)
- `axis` (enum: ROW/COLUMN)
- `position_index`
- `hint_values` (jsonb array of integers)

### nemonemo_creator_submission
- `id` (PK)
- `creator_user_id` (FK)
- `puzzle_payload` (jsonb of draft grid)
- `status` (enum: DRAFT/REVIEW/REJECTED/APPROVED)
- `reviewer_user_id` (FK)
- `review_notes`
- `submitted_at`, `reviewed_at`

### nemonemo_puzzle_release
- `id` (PK)
- `puzzle_id` (FK)
- `release_pack` (string)
- `release_at` (timestamp)
- `expires_at` (timestamp, nullable)
- `display_order`
- `is_featured` (boolean)

### nemonemo_session
- `id` (PK, UUID)
- `user_id` (FK)
- `puzzle_id` (FK)
- `release_id` (FK)
- `status` (enum: IN_PROGRESS/COMPLETED/ABANDONED)
- `started_at`
- `completed_at`
- `mistake_count`
- `hint_used`
- `final_score`
- `duration_seconds`
- `client_version`

### nemonemo_session_snapshot
- `id` (PK)
- `session_id` (FK)
- `cell_states` (bytea or jsonb)
- `captured_at`

### nemonemo_leaderboard_entry
- `id` (PK)
- `release_id` (FK)
- `user_id` (FK)
- `rank`
- `score`
- `duration_seconds`
- `accuracy`
- `created_at`

### nemonemo_announcement
- `id` (PK)
- `title`
- `body`
- `visible_from`
- `visible_until`
- `cta_url`
- `created_by`
- `created_at`

## 4. Notes & Open Items
- Evaluate storing hints within the puzzle table vs. separate table based on query performance tests.
- Determine whether leaderboard entries should be materialized nightly or computed on read; current design assumes write-time materialization via async worker.
- Pending integration contract for referencing `liargame_user` (likely via shared user id UUID).
- Consider partitioning `nemonemo_session_snapshot` on `captured_at` to manage growth.

## 5. Next Steps
- Validate naming conventions with DBA.
- Produce actual ER diagram (e.g., dbdiagram.io export) once schema stabilizes.
- Align enums with Kotlin `enum class` definitions during implementation phase.
