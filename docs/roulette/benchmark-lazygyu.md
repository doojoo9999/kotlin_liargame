# LazyGyu Marble Roulette Benchmark

## High-Level Summary
- Web-based roulette mini-game that simulates marbles falling through Box2D courses until they reach a goal line.
- Players configure participant names, winner selection rules, optional skills, auto-recording, and select from multiple themed stages.
- Rendering occurs on a single `<canvas>` element with camera zoom/pan, scoreboard overlay, minimap, and particle/skill effects.
- Game exposes a `window.roullete` controller object and a lightweight `window.options` store that the inline UI script manipulates.

## Technology Stack & Architecture
- **Bundler**: Parcel (presence of `parcelRequire`, `import.meta.resolve`, hashed asset names).
- **Rendering**: HTML canvas, manual drawing of entities/marbles/effects. No React or DOM-based scene graph.
- **Physics**: Box2D WebAssembly (`Box2D.simd.*`) dynamically imported via module loader with SIMD fallback detection.
- **Code Structure**:
  - `class D extends EventTarget`: primary game controller; orchestrates physics, rendering loop, camera, UI objects, events.
  - `class C`: physics adapter; translates map definitions into Box2D bodies and maintains marble bodies.
  - `class M`: renderer; manages canvas responsiveness and draws entities/effects/winner panel.
  - `class _`: camera; smooth interpolation between targets and manages zoom.
  - `class E`: right-side scoreboard overlay with scrolling, wheel-to-scroll, double-click copy.
  - `class T`: minimap overlay reflecting stage layout and camera viewport.
  - `class w` & `class V`: particle manager for celebratory confetti.
  - `class S`: visual ring effect when a marble uses a skill.
- **Asset Pipeline**: Uses `import.meta.resolve` to load stage-specific avatar images (`챔루`, `쿠빈`).
- **Global API**: `window.roullete` exposes control methods (`start`, `setMarbles`, `setMap`, `setAutoRecording`, `setWinningRank`, `getMaps`, etc.) consumed by inline script.

## Gameplay Flow
1. **Initialization**: Inline script waits for `window.roullete.isReady`. Names are restored from `localStorage` (`mbr_names`).
2. **Input Preparation**: User types names (comma or newline). Blur event normalizes entries (`name/weight*count` format).
3. **Configuration**: Choose map, toggle auto-recording and skills, pick winner strategy (first/last/custom rank), optionally adjust custom rank.
4. **Start**: Clicking `Start` (enabled only when at least one valid name exists) hides settings/donation panel, triggers analytics, optionally starts `MediaRecorder`, activates physics, and begins animation loop.
5. **Race Resolution**: Marbles fall, skills may trigger, winners are detected when crossing stage `goalY`. Once configured number of winners achieved, controller fires `"goal"` event, stops recording (after 1s), triggers confetti, shows winner panel.
6. **Post-Round**: After 3s delay settings are revealed again; scoreboard retains placements; double-click copies rankings to clipboard; `Shake` button is shown if marbles become stagnant.

## Input Handling & Weighting Rules
- `getNames` splits on commas/newlines, trims, and filters empty strings.
- `parseName` supports:
  - `Name/weight` to set relative weight (higher = heavier marble, effectively slower skill cooldown).
  - `Name*count` to duplicate entries.
  - Combination `Name/3*2` allowed.
- Blur normalization deduplicates identical `name/weight` keys by aggregating counts.
- `Window.roullete.setMarbles`:
  - Parses entries, maps to internal objects with weight normalized between 0.1 and 1.0 (`weight` linearly mapped from min/max user weights).
  - Randomly assigns marble IDs/slots using shuffled indices.
  - Each marble gets color via hue rotation and initial spawn position based on total count.
- `window.options.winningRank` holds zero-based rank. UI toggles (`First`, `Last`, numeric input) adjust this while updating CSS `.active` states.

## Stage & Map Design
- Maps defined in JS `const m = [...]`, each with `title`, `goalY`, `zoomY`, and `entities` array describing Box2D shapes.
- **Wheel of fortune**: Symmetric vertical course with alternating paddles and oscillating kinematic bars near finish; end zone includes rotating blockers.
- **BubblePop**: Tall track with narrow corridors, bubble-shaped obstacles, and kinematic rotating bars mid-course; uses static circle triggers producing `life:1` disappearing elements on contact.
- **Pot of greed**: Wide bowl with multiple bounce pads, spinner obstacles, and dense array of static circles near finish to randomize order.
- **Yoru ni Kakeru**: Long multi-section course with moving platforms, conveyors, decorative lights, and stage-specific color palette; highest `goalY` (~248) requiring extensive camera tracking.
- Shapes include `polyline`, `box`, `circle`, with optional `bloomColor`. Kinematic bodies use predefined angular velocities to stir marbles.

## Physics, Skills & Progression
- Each marble (`class b`) tracks position via Box2D, color (HSL by index), skill cooldown, and stuck timer.
- **Skill system**:
  - Only one skill type implemented: `Impact`, which applies `impact` impulse to nearby marbles (shockwave) when random chance hits after cooldown.
  - Skill availability toggled via `window.options.useSkills`; UI checkbox updates this flag.
- **Stuck Detection**:
  - If marble's position barely changes (`lenSq` threshold) for >5s, `physics.shakeMarble` applies random impulse; `_changeShakeAvailable` toggles UI button when no movement for >3s globally.
  - Manual `Shake` button dispatches only when `_shakeAvailable` true, but the handler is currently empty (bug/unfinished feature).
- **Camera logic**:
  - Follows current target marble (first unresolved) with smooth interpolation. Zooms in when target approaches `zoomY`.
  - Minimap UI can override camera via pointer to re-center; click resets lock.
- **Time scaling**: `_calcTimeScale` slows simulation (`Math.max(0.2, ...)`) near finish to highlight winner.

## UI Components
- **Settings Drawer** (bottom-left, fixed):
  - Map selector (`select#sltMap`) auto-populated from `getMaps`.
  - Auto recording & skill toggles (checkboxes).
  - Winner selection button group plus numeric input for custom rank.
  - Names textarea with placeholder example `짱구*5, ...`.
  - Actions row: notice button, shuffle, start.
  - Responsive adjustments for narrow screens (media query).
- **In-Game Controls**:
  - `#inGame` banner with `Shake!` button shown only when `shakeAvailable` event toggled true; hidden otherwise.
- **Notice Modal**:
  - Korean legal notice; tracked via `localStorage["lastViewedNotification"]`. Displayed on load unless previously dismissed; accessible via megaphone button.
- **Toast Messages**:
  - Generic `<div class="toast">` appended to body for short-lived notifications (e.g., clipboard copy message), auto-translated if translator available.
- **Canvas Overlays**:
  - Scoreboard on right side with winners vs remaining count and auto-scroll. Mouse wheel manual scroll, double-click copies rankings.
  - Minimap (top-left) showing stage outline, marble positions, and camera viewport; also handles pointer move to reposition camera.
  - Winner banner overlay with name & color on race completion.

## Recording & Sharing
- Utilizes `MediaRecorder` on canvas `captureStream()` to capture MP4 (`video/mp4`, ~6 Mbps). Auto download triggered via temporary `<a>` element with timestamped filename.
- Auto-recording toggle defaults to ON; start triggers recorder before physics begins. Stop occurs 1 second after winner determined.
- Scoreboard double-click copies TSV with rank/name/winner indicator to clipboard using `navigator.clipboard`.

## Internationalization
- Supports English and Korean via simple translation map `n`. Uses `data-trans` attributes to replace `innerText` or attributes (like placeholders) upon DOMContentLoaded.
- Language detection from `navigator.language`, falling back to English.
- Dynamic elements (toast, map options) request translation via exposed `window.translateElement`.

## Observed Limitations & Quirks
- `Shake` button handler performs no action beyond guard; likely unfinished functionality.
- Skill system only includes a single `Impact` ability with random chance tied to normalised weight; lacks visual feedback beyond ring effect; no UI for configuring individual skills.
- Weighted names rely on manual numeric syntax; no validation feedback for malformed input (entries quietly dropped).
- Auto-recording requires secure context and MediaRecorder support; no fallback provided for unsupported browsers.
- Stage list hard-coded; no persistence of selected map between sessions.
- UI/UX: Settings panel hides during race, leaving limited in-game controls (only `Shake`), and there is no explicit restart; user must re-open settings after delay.
- Performance: Canvas re-renders entire scene every frame; may struggle on lower-power devices with large marble counts.

## Key Takeaways for New Implementation
- Core experience revolves around physics-driven randomness, quick setup, and broadcaster-friendly overlays (names, winner banner, recording).
- Enhancement opportunities include richer skill variety, interactive shake mechanics, saved presets, live audience interaction, and improved mobile controls.
- Architecture is canvas-first; replicating feel requires efficient physics (Box2D or alternative) and camera/minimap/scoreboard layers integrated in render loop.

