# Party Roulette – Product Design

## Vision & Audience
- Deliver a broadcast-friendly roulette experience that feels more like a party game than a simple random picker.
- Primary users are stream hosts and content creators who want interactive raffles or penalty draws with persistent progression across rounds.
- Secondary users are event facilitators who need a clean overlay and quick reset between repeated matches.

## Experience Pillars
1. **Spectacle First** – The roulette spin is a showpiece: bold visuals, stage themes, dramatic slow-down, and camera-ready overlays.
2. **Game Layer** – Each spin is influenced by items, hazards, and stage effects so repeated rounds stay unpredictable.
3. **Streamer QoL** – Fast participant management, hotkeys for reveals, copy-to-clipboard results, optional “overlay mode” for capture cards.
4. **Progression** – Players earn points/crowns across rounds; streaks and achievements keep the audience invested.

## Session Flow
1. **Lobby Setup**
   - Enter or import participant names (supports duplication & weight controls).
   - Save/load presets for recurring casts (local storage).
   - Pick a stage (theme decides background, music cue, and event deck).
2. **Pre-Spin Prep**
   - Draw 1–2 random event cards from the stage deck (e.g., “Lucky Boost”, “Sabotage”, “Double Down”).
   - Optionally pin or reroll events before locking in.
   - Confirm scoring rules (points for 1st/2nd/3rd, streak bonuses).
3. **Spin & Resolve**
   - Animated wheel with easing, sparks, and stage FX.
   - Winners resolved without replacement to produce Top N ranking (default 3).
   - Events modify odds in real time (weight multipliers, bans, position swaps).
4. **Results & Progression**
   - Winner spotlight with confetti, scoreboard update, optional auto-play SFX.
   - Results copied to clipboard or exported as JSON for bots.
   - Streak tracker highlights consecutive podium finishes.
5. **Between Rounds**
   - Quick-adjust participation (toggle active, add guests).
   - Stage can rotate; events deck reshuffles each round.
   - Overlay mode toggles for clean feed (only wheel + winners).

## Feature Breakdown (MVP vs Stretch)
| Area | MVP Scope | Stretch Ideas |
| --- | --- | --- |
| Participant management | Text input with real-time parsing, duplicate handling, weight sliders, tags for status | External CSV import, cloud presets |
| Stages | 3 curated themes (Neon Arcade, Haunted Carnival, Starship Hangar) each with palette + event deck | Stage editor, animated backgrounds, custom music upload |
| Events/Items | 6–8 predefined cards that tweak weights or exclude contestants | Audience voting, chat-triggered cards, persistent inventory |
| Wheel presentation | SVG/Canvas wheel, easing animation, sparks, camera shake | 3D WebGL wheel, dynamic lighting, per-stage shaders |
| Scoring | Points table (configurable), streak detector, podium history | Season leaderboard, achievements, Twitch chat integration |
| Overlay mode | Toggle hides controls, adapts layout for 16:9 capture | Browser Source sharing, OBS control API |
| Audio | Stage BGM loop and SFX cues (spin start, slow-down, victory) | Voice lines, per-player custom intros |

## System Design
```ts
type StageId = 'neon-arcade' | 'haunted-carnival' | 'starship-hangar';

interface Participant {
  id: string;
  name: string;
  baseWeight: number;      // user-defined slider (0.5 – 3.0)
  isActive: boolean;
  streak: number;          // consecutive podium finishes
  points: number;
}

interface EventCard {
  id: string;
  title: string;
  description: string;
  effect: 'weight-multiplier' | 'ban' | 'bonus' | 'swap' | 'chain';
  magnitude: number;
  target: 'random' | 'top-weight' | 'manual';
  duration: 'round';
}

interface StageDefinition {
  id: StageId;
  name: string;
  palette: {
    background: string;
    accent: string;
    text: string;
  };
  music: string; // asset path
  eventDeck: EventCard[];
}

interface SpinSettings {
  podiumSize: 3;
  spinDurationMs: number;
  easing: 'outCubic' | 'outQuint';
}
```

### Probability Flow
1. Start from participants with `isActive`.
2. Apply base weights.
3. Apply stage/event modifiers to produce `effectiveWeight`.
4. For each podium slot:
   - Normalize weights to probability distribution.
   - Draw using alias method (precomputed per round for performance).
   - Remove selected participant (no replacement) and repeat for next slot.

### Scoring Logic
- Default: 1st = 5 pts, 2nd = 3 pts, 3rd = 1 pt.
- Streak Bonus: +2 pts if same participant wins consecutive rounds.
- Optional modifier: Stage-specific bonus (e.g., Haunted Carnival awards +1 pt to 3rd place).

## UI Composition
```
┌───────────────────────────┬───────────────────────────────┐
│ Control Dock              │ Stage Canvas                  │
│ - Participants list       │ - Roulette wheel (SVG/canvas) │
│ - Stage & event cards     │ - Animated background         │
│ - Spin settings           │ - Countdown + sparks          │
│ - Scoreboard preview      │ - Podium reveal overlay       │
└───────────────────────────┴───────────────────────────────┘

Overlay Mode (F11):
┌──────────────────────────────────────────────────────────────┐
│ Wheel centered, HUD widgets (timer, event badges, podium).   │
│ Transparent background to blend with stream scene.           │
└──────────────────────────────────────────────────────────────┘
```

## Technical Approach
- **Framework**: Vite + React + TypeScript for rapid UI composition and state control.
- **State Management**: Zustand for lightweight global store (participants, stage, events, round history).
- **Wheel Rendering**: SVG with `requestAnimationFrame`-driven rotation; using GSAP-like custom easing util.
- **Audio**: Web Audio API for mixing BGM & SFX with volume sliders.
- **Persistence**: `localStorage` for participants presets and last stage; optional `IndexedDB` for history export (stretch).
- **Testing**: Vitest + React Testing Library for core utilities (probability distribution, scoring, cards).
- **Styling**: TailwindCSS with CSS variables per stage theme; overlay mode uses CSS container queries.

## Implementation Roadmap
1. **Foundations (Iteration 1 / MVP)**
   - Scaffold Vite app with routing disabled (single-screen).
   - Zustand store with participants, stage, events, history.
   - Participant editor (input parsing, weight slider, active toggle).
   - Stage selector & static event cards.
   - Wheel component with spin animation and deterministic outcome selection.
   - Results overlay & scoreboard update.

2. **Game Layer Enhancements (Iteration 2)**
   - Event card picker UI with reroll/lock.
   - Weight modifiers + ban logic integrated into spin computation.
   - Streak tracking + scoreboard badges.
   - Audio system with stage BGM & SFX toggles.

3. **Streamer Tools (Iteration 3)**
   - Overlay mode & hotkey support.
   - Copy-to-clipboard summary + JSON export.
   - Preset management and auto-save.
   - Optional OBS-friendly query string to auto-load presets.

4. **Polish & Stretch**
   - Particle effects, stage-specific backgrounds.
   - Additional event types and deck editing.
   - Live service hooks (websocket to ingest chat votes).

## Success Metrics
- A host can set up a round with 20 participants in under 60 seconds.
- Spin outcome feels fair yet theatrical; audience perceives tangible impact from events.
- Streamers can switch to overlay mode and back without touching OBS layout.
- Round history is reusable (copy/export) for recaps or VOD descriptions.

