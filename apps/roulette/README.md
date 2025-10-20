# Party Roulette

A broadcast-friendly roulette experience with stage events, power-ups, and a persistent scoreboard. Built with React + TypeScript + Vite.

## Features

- **Stage Themes** – Neon Arcade, Haunted Carnival, and Starship Hangar each add unique palettes and event decks.
- **Event Deck** – Two random cards per round that boost, ban, or reward contenders to keep rounds unpredictable.
- **Wheel Presentation** – Animated conic-gradient wheel with easing, pointer highlight, and stage accent colours.
- **Participant Management** – Bulk paste using `Name/weight` or `Name*count`, fine-tune weights with sliders, bench or remove contenders.
- **Progression** – Automatic scoring (5/3/1 points), streak bonuses, event-based score boosts, and podium recap panels.
- **Overlay Mode** – Hide side panels for a capture-friendly layout mid-stream.

## Scripts

```bash
npm install
npm run dev     # start Vite dev server
npm run build   # production build
npm run preview # preview production build
```

## Input Cheatsheet

```
Streamer/1.2
Guest/0.8
Editor*2
```

- `/` adjusts base weight (chance). Range 0.5–3 via slider.
- `*` multiplies entry count; internally converted into additional weight.

## Roadmap

- Stage-specific audio loops & SFX cues.
- Audience-triggered event cards (chat integrations).
- Persistent presets & multi-round history export.
```
