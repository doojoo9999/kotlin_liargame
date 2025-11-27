# Block Blast: Master Development Plan

This file is the single source of truth for the Block Blast web build. It merges the initial design, the recent UI/UX improvements, and the missing core requirements into one execution plan. Objective: ship a premium-feeling, mobile-first R3F game where robust interaction is part of the MVP, not a post-launch patch.

## 1) Core Gameplay (MVP)

### Board
- Logic: 8x8 or 10x10 logical grid (2D array).
- Camera: fixed orthographic, top-down, no zoom/pan.
- Visuals: high-contrast checker/bordered grid, never moves.

### Block Interaction (“hand feel”)
- Touch offset: while dragging on touch, render ~100px above the finger.
- Smart ghost: snaps to nearest grid slot; valid = semi-transparent, invalid = red.
- Pre-clear highlight: flashing lines when a move will clear.
- Magnetic snap: blocks auto-snap to the grid when released near a valid slot.

### Tray (Spawn Area)
- Normalized sizing: all 1x1–3x3 blocks visually fit fixed-size tray slots.
- Spawn logic: 3 blocks at a time, refill only when all 3 are used.
- Game over check: run immediately after refill and after every placement.

### Game Loop & Scoring
- Line clear: full row/col disappears and adds score.
- Combo: consecutive clears raise a multiplier.
- Game over: when none of the current tray blocks fit. Board greys/darks + “No Moves”.

## 2) Technical Architecture
- Frontend: React 18, TypeScript, Vite.
- 3D: Three.js, React Three Fiber, Drei.
- State: Zustand (transient updates for perf).
- Styling: Tailwind for overlay UI, custom shaders for grid/effects.
- Directory skeleton:
  ```
  src/
    game/
      core/          # Pure logic (grid validation, score calculation)
      components/    # R3F components (Board, Block, Tray)
      managers/      # Audio, haptics, input
    ui/              # React DOM UI (HUD, menus)
    assets/          # Sounds, textures
  ```

## 3) Development Phases
- **Phase 1: Foundation (Days 1-2)** — Vite+R3F, orthographic camera, static scene, high-visibility grid, rounded block rendering.
- **Phase 2: Core Interaction (Days 3-4)** — Drag/drop with raycasting, touch offset, smart ghost + snapping, tray scaling/spawning.
- **Phase 3: Game Logic (Days 5-6)** — Grid state, line clear algo, game-over detection, scoring + combo.
- **Phase 4: Juice & Polish (Days 7-8)** — Line-clear particles, combo text, screen flash, SFX (Howler), mobile haptics.

## 4) Newly Added Requirements
- Input normalization for mouse vs touch (offset feature).
- Asset preloading + loading screen.
- Pause/resume when tab visibility changes.
- Local persistence via `localStorage` to avoid progress loss on refresh.

## 5) Next Actions
- Confirm this plan meets expectations.
- Scaffold the project structure immediately per the directory skeleton above.
