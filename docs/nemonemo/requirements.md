# Nemonemo Requirements Draft

## 1. Background & Goals
- Launch a web-based Nemonemo (nonogram) puzzle experience at `https://domain.com/nemonemo`.
- Reuse Liar Game accounts, wallet, and points to simplify onboarding and retention.
- Deliver a content pipeline capable of weekly curated puzzle drops while keeping UX approachable for first-time solvers.

## 2. Competitive Benchmark (Public Sources)
- **Conceptis Pic-a-Pix Web**: Offers daily rotating puzzles and account-based progress sync. Strength: clear onboarding with animated tutorial. Gap: limited social play.
- **Nintendo Picross S Series**: Premium console title with mission-based progression. Strength: polished controller UX. Gap: no live updates or user-generated content.
- **Nonogram.com Mobile**: Free-to-play with hint economy and events. Strength: sticky retention loops. Gap: aggressive ad model conflicts with premium positioning.
- **Key Takeaways**: Prioritize interactive tutorial, progressive difficulty ladder, and light social hooks (sharing/leaderboards) while keeping monetization unobtrusive.

## 3. Target Users & Personas
- **Puzzle Enthusiast Mina (Age 29)**: Plays logic puzzles nightly, wants fresh challenges and clear statistics.
- **Casual Gamer Joon (Age 24)**: Visits Liar Game occasionally, expects quick onboarding and cross-game rewards.
- **Creator Hana (Age 32)**: Aspiring puzzle designer interested in submitting puzzles and tracking player feedback.

## 4. Core User Stories
- [Player] As a signed-in player, I want to continue a partially solved puzzle from any device so that I can finish later.
- [Player] As a beginner, I want a guided tutorial puzzle so that I can learn the rules without frustration.
- [Player] As a competitive solver, I want to see my time and accuracy ranking against friends so that I stay motivated.
- [Creator] As a puzzle creator, I want a browser-based editor with validation so that I can publish high-quality puzzles.
- [Operator] As an operator, I want to schedule weekly puzzle packs so that content stays fresh without manual deployment.
- [Operator] As an analyst, I want aggregated completion metrics so that I can monitor KPIs quickly.

## 5. Functional Requirements (MVP)
1. **Authentication**: Support single sign-on with existing Liar Game accounts; anonymous browsing allowed for marketing pages.
2. **Puzzle Catalog**: Browse puzzles by theme, difficulty, release week; search by tags.
3. **Puzzle Session**:
   - Render grid with row/column hints, allow fill/blank/mark interactions.
   - Autosave every 10 seconds and on exit; error highlighting toggle.
   - Offer limited hints consuming Liar Game points.
4. **Progress & Rewards**:
   - Award completion points/time medals synced to shared profile.
   - Weekly leaderboard with filters (friends, global, difficulty).
5. **Content Operations**:
   - Admin-only puzzle editor with live validation and preview.
   - Approval workflow (draft → review → publish) with audit trail.
   - Schedule engine to publish puzzles at predefined times.
6. **Communications**:
   - In-app announcements banner; optional email digest integration.
7. **Support**:
   - Feedback form tied to puzzle ID; simple knowledge base entry points.

## 6. Non-functional Requirements
- **Performance**: Initial puzzle load < 3s on broadband; input latency < 100ms for grid interactions.
- **Reliability**: Autosave durability (no data loss <1% sessions); uptime target 99.5% once live.
- **Accessibility**: Keyboard navigation for grid, high-contrast theme toggle, screen reader hints summary.
- **Localization**: Support Korean/English copy with i18n-ready strings.
- **Analytics**: Track funnel steps (landing, tutorial complete, first clear) and error events via shared analytics SDK.
- **Security**: Authorization enforced per role; puzzle assets stored with signed URLs to prevent leaks pre-release.

## 7. Success Metrics
- Align with KPIs: DAU 1,000, monthly clear 10,000, session drop-off < 30%.
- Additional: Tutorial completion rate ≥ 80%, weekly puzzle pack publication success rate 100%.

## 8. Dependencies & Open Questions
- Confirm availability of Liar Game SSO and points APIs for reuse.
- Decide on hint economy pricing and whether points are cross-game spendable.
- Determine analytics stack alignment with existing observability tooling.
- Await user-provided branding assets for UI wireframes.
