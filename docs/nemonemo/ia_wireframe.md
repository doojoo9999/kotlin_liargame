# Nemonemo IA & Wireframe Outline

## 1. Information Architecture
- **Public**
  - Landing (`/`): Hero, feature summary, CTA to play/sign in, weekly highlights.
  - Learn (`/learn`): Interactive tutorial overview, FAQ.
  - Patch Notes (`/updates`): Release log, events.
- **Authenticated Player**
  - Dashboard (`/home`): Active puzzle resume, streak widget, leaderboard teaser.
  - Puzzle Library (`/puzzles`)
    - Featured (weekly pack)
    - Categories (difficulty, theme)
    - Search results
  - Puzzle Detail (`/puzzles/:id`): Metadata, start/resume actions.
  - Puzzle Play (`/play/:sessionId`): Grid, hints, timer, progress.
  - Profile (`/profile`): Stats, achievements, point balance.
- **Creator/Admin**
  - Editor (`/admin/editor`): Create/edit puzzle.
  - Review Queue (`/admin/review`): Pending submissions, approval actions.
  - Schedule (`/admin/schedule`): Calendar view, release automation.
  - Reports (`/admin/reports`): Completion analytics, error logs.

## 2. Primary User Flows
1. **First-Time Player Onboarding**
   - Landing → Sign in (SSO) → Tutorial puzzle → Completion summary → Dashboard.
2. **Returning Player Session Resume**
   - Landing → Auto-redirect to Dashboard → Resume puzzle → Completion → Leaderboard view.
3. **Weekly Pack Discovery**
   - Dashboard → Weekly pack card → Puzzle detail → Queue next puzzle.
4. **Creator Submission**
   - Dashboard → Admin switch → Editor create puzzle → Run validation → Submit for review.
5. **Operator Publishing**
   - Review queue → Approve puzzle → Schedule slot → Confirmation.

## 3. Wireframe Narratives
- **Landing Page**
  - Header: Logo, navigation (Learn, Updates, Sign in), CTA button.
  - Hero band: Background illustration, messaging, primary CTA.
  - Feature columns: "+Fresh puzzles", "Cross-game rewards", "Play anywhere".
  - Social proof strip: DAU stat, testimonial.
  - Footer: Links, language selector.
- **Dashboard**
  - Top bar: User avatar, streak indicator, point balance button.
  - Main column: "Continue Playing" card with progress bar, timer.
  - Secondary column: Weekly pack list, leaderboard snippet, announcements tile.
  - Bottom ribbon: Quick links to Learn, Profile, Feedback.
- **Puzzle Library**
  - Filter sidebar (difficulty, size, theme).
  - Grid list of puzzle cards with thumbnail, completion state, estimated time.
  - Persistent search bar at top.
- **Puzzle Play Screen**
  - Header: Timer, hint counter, undo/redo, settings menu.
  - Left rail: Row hints with completion ticks.
  - Center: Responsive grid canvas; pointer/keyboard support.
  - Right rail: Column hints, note panel, error toggles.
  - Bottom: Action buttons (Check, Give up, Save & Exit), progress feedback.
- **Tutorial Overlay**
  - Stepper overlay with highlight callouts.
  - Inline tips explaining fill vs. mark, contradiction detection, lives.
- **Admin Editor**
  - Split view: Grid builder (left) and hint preview (right).
  - Toolbar: Pencil, eraser, fill from image (future), difficulty estimator.
  - Metadata form: Title, tags, difficulty, estimated time.
  - Validation console: errors/warnings, publish readiness indicator.
- **Schedule Calendar**
  - Week view with slots; drag-and-drop puzzles onto calendar.
  - Detail drawer showing assigned puzzle, release channel, fallback options.

## 4. Wireframe References & Next Steps
- Produce low-fidelity sketches in Figma (link TBD) aligned with the narrative above.
- Validate layout with responsive breakpoints (mobile 375px, tablet 768px, desktop 1440px).
- Confirm admin IA with operations stakeholders; adjust navigation if more roles emerge.
