# @stellive/ui

Stellive fan projects share a single design system.  
This package exposes the JSON design tokens, theme utilities, and lightweight helpers that each game (liar-game, pinball, roulette, sadari, main) can reuse.

## Contents

- `design-tokens.json`: canonical token source (synced from the repository root).
- `src/tokens.ts`: type-safe access to token values.
- `src/theme/*`: helpers for building CSS variables and runtime themes.
- `src/react/*`: optional React bindings for applying themes on mount.

## Developing

```bash
npm install
npm run sync:tokens   # copy root tokens into the package
npm run build         # compile to dist/ and copy JSON for publishing
```

Consumers can import either the JSON or the helpers:

```ts
import { stelliveTokens, getThemePalette } from '@stellive/ui';
import '@stellive/ui/design-tokens.json';
```
