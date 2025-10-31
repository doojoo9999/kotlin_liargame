# ADR-002: Guest-First Authentication

## Status
Accepted — 2024-10-09

## Context
The platform targets casual puzzle players who may churn if forced to register up front. Many features (leaderboards, achievements, recommendations) rely on tracking returning users even without formal accounts. We also support social login later, requiring migration paths between guest and registered identities.

## Decision
- Assign a signed `anon_id` to every first-time visitor using a secure, HttpOnly cookie and mirrored token in localStorage for recovery.
- Store guest metadata (`guest_identities`) including signing key hash and device fingerprint to detect abuse while respecting policy (multi-account recommendation boosting allowed).
- Provide an endpoint to regenerate a lost `anon_id` using the backup token once; throttle to prevent enumeration.
- Allow users to merge a guest identity with social logins (Google, Discord, Apple). On merge we migrate all references (`plays`, `scores`, `follows`, etc.) from `anon_id` to `user_id`.
- Use JWT access (15 min) and refresh (7 day) tokens for authenticated sessions; WebSocket handshakes validate the latest access token.

## Consequences
- Guest data volume grows quickly; we must expire dormant guests periodically or move cold records to cheaper storage.
- Merge logic introduces complexity because every table uses `subject_key`; migrations and transactional safety are essential.
- Recovery endpoints could be abused; we implement rate limiting and auditing to detect suspicious activity.
