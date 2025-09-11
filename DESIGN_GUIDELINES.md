# Liar Game Frontend Design Guidelines

## Executive Summary

This document provides comprehensive design guidelines for the Liar Game frontend, addressing current styling issues and establishing a robust design system for all 7 game phases. The guidelines focus on mobile-first responsive design, accessibility compliance (WCAG 2.1 AA), and creating an engaging user experience.

## Current State Analysis

### Issues Identified
- **Component Import Issues**: UI components from `@/components/ui/` not properly rendering
- **Missing Visual Hierarchy**: Card, Button, and Input components lacking proper styling
- **Broken CSS Integration**: PostCSS/Tailwind not processing custom component styles
- **Path Resolution Problems**: Import paths not resolving correctly

### Working Elements
- Tailwind CSS utility classes are functional
- Framer Motion animations are working
- Basic React component structure is correct
- CSS custom properties are defined

## Design Token System

### Color Palette

```css
:root {
  /* Primary Game Colors */
  --game-primary: 220 91% 45%;        /* Blue primary */
  --game-secondary: 270 91% 55%;      /* Purple secondary */
  --game-accent: 16 100% 66%;         /* Orange accent */
  
  /* Phase-Specific Colors */
  --waiting-primary: 142 76% 36%;     /* Green for waiting */
  --speech-primary: 217 91% 60%;      /* Blue for speech */
  --voting-primary: 25 95% 53%;       /* Orange for voting */
  --defending-primary: 0 84% 60%;     /* Red for defending */
  --survival-primary: 271 91% 65%;    /* Purple for survival */
  --guessing-primary: 45 93% 47%;     /* Yellow for guessing */
  --game-over-primary: 142 76% 36%;   /* Green for results */
  
  /* Semantic Colors */
  --success: 142 76% 36%;
  --warning: 45 93% 47%;
  --error: 0 84% 60%;
  --info: 217 91% 60%;
  
  /* Neutral Colors */
  --background: 0 0% 100%;
  --foreground: 222 84% 5%;
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
  --border: 214 32% 91%;
  --input: 214 32% 91%;
  
  /* Interactive States */
  --focus-ring: 217 91% 60%;
  --hover-overlay: 0 0% 0% / 0.05;
  --active-overlay: 0 0% 0% / 0.1;
}

/* Dark Mode Support */
[data-theme="dark"] {
  --background: 222 84% 5%;
  --foreground: 210 40% 98%;
  --muted: 217 33% 17%;
  --muted-foreground: 215 20% 65%;
  --border: 217 33% 17%;
  --input: 217 33% 17%;
  --hover-overlay: 255 255 255 / 0.05;
  --active-overlay: 255 255 255 / 0.1;
}
```

### Typography Scale

```css
/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.625;

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Spacing System

```css
/* Spacing Scale (based on 4px grid) */
--space-1: 0.25rem;    /* 4px */
--space-2: 0.5rem;     /* 8px */
--space-3: 0.75rem;    /* 12px */
--space-4: 1rem;       /* 16px */
--space-5: 1.25rem;    /* 20px */
--space-6: 1.5rem;     /* 24px */
--space-8: 2rem;       /* 32px */
--space-10: 2.5rem;    /* 40px */
--space-12: 3rem;      /* 48px */
--space-16: 4rem;      /* 64px */
--space-20: 5rem;      /* 80px */
--space-24: 6rem;      /* 96px */

/* Border Radius */
--radius-sm: 0.125rem;  /* 2px */
--radius: 0.25rem;      /* 4px */
--radius-md: 0.375rem;  /* 6px */
--radius-lg: 0.5rem;    /* 8px */
--radius-xl: 0.75rem;   /* 12px */
--radius-2xl: 1rem;     /* 16px */
--radius-full: 9999px;
```

## Responsive Breakpoints

### Mobile-First Approach

```css
/* Breakpoint System */
--breakpoint-sm: 640px;   /* Small devices */
--breakpoint-md: 768px;   /* Medium devices */
--breakpoint-lg: 1024px;  /* Large devices */
--breakpoint-xl: 1280px;  /* Extra large devices */
--breakpoint-2xl: 1536px; /* Ultra wide devices */

/* Container Sizes */
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1400px;
```

### Layout Guidelines

```css
/* Mobile Layout (default) */
.game-layout {
  padding: var(--space-4);
  gap: var(--space-4);
}

/* Tablet Layout */
@media (min-width: 768px) {
  .game-layout {
    padding: var(--space-6);
    gap: var(--space-6);
  }
}

/* Desktop Layout */
@media (min-width: 1024px) {
  .game-layout {
    padding: var(--space-8);
    gap: var(--space-8);
    max-width: var(--container-xl);
    margin: 0 auto;
  }
}
```

## Game Phase Component Specifications

### 1. WAITING_FOR_PLAYERS Phase

#### Component Hierarchy
```
WaitingRoomPage
├── RoomHeader
│   ├── RoomInfo (name, code, settings)
│   └── PlayerCounter (3/8 players)
├── PlayerGrid
│   ├── PlayerCard (each player)
│   │   ├── Avatar
│   │   ├── Nickname
│   │   ├── StatusIndicator (ready/waiting/offline)
│   │   └── HostBadge (if host)
│   └── EmptySlot (for remaining slots)
├── GameSettings (host only)
│   ├── MaxPlayersSlider
│   ├── TimeLimitSelect
│   └── CategorySelect
├── GameRules (collapsible)
└── ActionPanel
    ├── ReadyToggle
    ├── StartGameButton (host, when ready)
    └── LeaveRoomButton
```

#### Mobile Layout (320px+)
```css
.waiting-room {
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  gap: var(--space-4);
  padding: var(--space-4);
  min-height: 100vh;
}

.player-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}

.player-card {
  aspect-ratio: 1;
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  border: 2px solid hsl(var(--border));
  background: hsl(var(--card));
}
```

#### Tablet Layout (768px+)
```css
@media (min-width: 768px) {
  .waiting-room {
    grid-template-columns: 2fr 1fr;
    grid-template-rows: auto 1fr auto;
    gap: var(--space-6);
    padding: var(--space-6);
  }
  
  .player-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-4);
  }
}
```

#### Desktop Layout (1024px+)
```css
@media (min-width: 1024px) {
  .player-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-6);
  }
  
  .game-settings {
    position: sticky;
    top: var(--space-6);
    align-self: start;
  }
}
```

### 2. SPEECH Phase

#### Component Hierarchy
```
SpeechPhase
├── PhaseHeader
│   ├── PhaseTitle ("힌트 제공 단계")
│   ├── RoundInfo (Round 1/3)
│   └── Timer (countdown)
├── TurnIndicator
│   ├── CurrentSpeaker (highlighted)
│   └── TurnOrder (circular or linear)
├── RoleCard
│   ├── YourRole (citizen/liar)
│   └── TopicWord (revealed/hidden)
├── ChatArea
│   ├── MessageList
│   └── MessageInput (only for current speaker)
└── HintHistory
    └── PreviousHints (scrollable list)
```

#### Mobile Layout
```css
.speech-phase {
  display: grid;
  grid-template-rows: auto auto auto 1fr auto;
  gap: var(--space-4);
  height: 100vh;
  padding: var(--space-4);
}

.turn-indicator {
  display: flex;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3);
  overflow-x: auto;
}

.current-speaker {
  position: relative;
  transform: scale(1.1);
  z-index: 10;
}

.current-speaker::before {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: var(--radius-full);
  background: linear-gradient(45deg, 
    hsl(var(--game-primary)), 
    hsl(var(--game-secondary)));
  animation: pulse 2s infinite;
}
```

#### Animation Specifications
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes speakerFocus {
  from {
    transform: scale(1);
    box-shadow: 0 0 0 0 hsl(var(--game-primary) / 0.7);
  }
  to {
    transform: scale(1.05);
    box-shadow: 0 0 0 8px hsl(var(--game-primary) / 0);
  }
}

.speaking-animation {
  animation: speakerFocus 1s ease-out;
}
```

### 3. VOTING_FOR_LIAR Phase

#### Component Hierarchy
```
VotingPhase
├── PhaseHeader
│   ├── PhaseTitle ("라이어 투표")
│   └── Timer
├── VotingProgress
│   ├── ProgressBar (votes submitted)
│   └── VotedPlayersList
├── PlayerVotingGrid
│   ├── VotablePlayerCard (each player)
│   │   ├── Avatar
│   │   ├── Nickname
│   │   ├── HintSummary
│   │   └── VoteButton
│   └── YourVoteIndicator
└── HintReview (expandable)
    └── HintTimeline
```

#### Voting Card Design
```css
.voting-card {
  position: relative;
  padding: var(--space-4);
  border-radius: var(--radius-xl);
  border: 2px solid hsl(var(--border));
  background: hsl(var(--card));
  transition: all 0.2s ease;
  cursor: pointer;
}

.voting-card:hover {
  border-color: hsl(var(--voting-primary));
  transform: translateY(-2px);
  box-shadow: 0 8px 25px hsl(var(--voting-primary) / 0.15);
}

.voting-card.selected {
  border-color: hsl(var(--voting-primary));
  background: hsl(var(--voting-primary) / 0.05);
  transform: scale(1.02);
  box-shadow: 0 0 0 4px hsl(var(--voting-primary) / 0.2);
}

.vote-button {
  width: 100%;
  margin-top: var(--space-3);
  background: linear-gradient(135deg, 
    hsl(var(--voting-primary)), 
    hsl(var(--voting-primary) / 0.8));
}
```

### 4. DEFENDING Phase

#### Component Hierarchy
```
DefendingPhase
├── PhaseHeader
│   ├── PhaseTitle ("변론 단계")
│   └── Timer
├── AccusedPlayer
│   ├── PlayerSpotlight
│   ├── AccusationSummary
│   └── VoteCount
├── DefenseArea
│   ├── DefenseInput (accused player only)
│   └── DefenseHistory
└── SpectatorView
    └── DefenseObserver (other players)
```

#### Spotlight Effect
```css
.accused-spotlight {
  position: relative;
  padding: var(--space-6);
  border-radius: var(--radius-2xl);
  background: radial-gradient(
    circle at center,
    hsl(var(--background)),
    hsl(var(--muted) / 0.5)
  );
  border: 3px solid hsl(var(--defending-primary));
  box-shadow: 
    0 0 0 8px hsl(var(--defending-primary) / 0.1),
    0 20px 40px hsl(var(--defending-primary) / 0.2);
}

.accused-spotlight::before {
  content: '';
  position: absolute;
  inset: -12px;
  border-radius: var(--radius-2xl);
  background: conic-gradient(
    hsl(var(--defending-primary)),
    hsl(var(--defending-primary) / 0.5),
    hsl(var(--defending-primary))
  );
  animation: rotate 3s linear infinite;
  z-index: -1;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

### 5. VOTING_FOR_SURVIVAL Phase

#### Component Hierarchy
```
SurvivalVotingPhase
├── PhaseHeader
│   ├── PhaseTitle ("최종 투표")
│   └── Timer
├── AccusedSummary
│   ├── PlayerInfo
│   └── DefenseSummary
├── VotingOptions
│   ├── ExecuteButton
│   └── SpareButton
├── VotingProgress
│   └── RealTimeResults (optional)
└── ConfirmationDialog
```

#### Critical Decision UI
```css
.survival-voting {
  text-align: center;
  padding: var(--space-8) var(--space-4);
}

.voting-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6);
  margin: var(--space-8) 0;
}

.execute-button {
  padding: var(--space-6) var(--space-8);
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  background: linear-gradient(135deg, 
    hsl(var(--error)), 
    hsl(var(--error) / 0.8));
  border: 3px solid hsl(var(--error));
  box-shadow: 0 8px 25px hsl(var(--error) / 0.3);
}

.spare-button {
  padding: var(--space-6) var(--space-8);
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  background: linear-gradient(135deg, 
    hsl(var(--success)), 
    hsl(var(--success) / 0.8));
  border: 3px solid hsl(var(--success));
  box-shadow: 0 8px 25px hsl(var(--success) / 0.3);
}
```

### 6. GUESSING_WORD Phase

#### Component Hierarchy
```
GuessingPhase
├── PhaseHeader
│   ├── PhaseTitle ("단어 추측")
│   └── Timer
├── LiarSpotlight
│   ├── LiarInfo
│   └── LastChanceMessage
├── HintReview
│   ├── AllHints (categorized)
│   └── HintAnalysis
├── GuessingArea (liar only)
│   ├── WordInput
│   └── SubmitGuess
└── SpectatorArea (others)
    └── GuessingObserver
```

#### Final Guess Interface
```css
.guessing-area {
  text-align: center;
  padding: var(--space-8);
  background: linear-gradient(135deg,
    hsl(var(--guessing-primary) / 0.1),
    hsl(var(--guessing-primary) / 0.05));
  border-radius: var(--radius-2xl);
  border: 2px dashed hsl(var(--guessing-primary));
}

.word-input {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  text-align: center;
  padding: var(--space-4) var(--space-6);
  border: 3px solid hsl(var(--guessing-primary));
  border-radius: var(--radius-xl);
  background: hsl(var(--background));
  min-width: 200px;
}

.submit-guess {
  margin-top: var(--space-6);
  padding: var(--space-4) var(--space-8);
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  background: linear-gradient(135deg,
    hsl(var(--guessing-primary)),
    hsl(var(--guessing-primary) / 0.8));
  animation: submitPulse 1s ease-in-out infinite alternate;
}

@keyframes submitPulse {
  from { transform: scale(1); }
  to { transform: scale(1.05); }
}
```

### 7. GAME_OVER Phase

#### Component Hierarchy
```
GameOverPhase
├── ResultsHeader
│   ├── WinnerAnnouncement
│   └── GameSummary
├── RoleReveal
│   ├── PlayerRoleGrid
│   └── CorrectAnswer
├── GameStatistics
│   ├── ScoreBoard
│   ├── MVP (optional)
│   └── GameTimeline
├── SocialActions
│   ├── ShareResults
│   └── PlayerRating
└── NextActions
    ├── PlayAgainButton
    ├── NewGameButton
    └── ReturnToLobby
```

#### Victory Animation
```css
.victory-announcement {
  text-align: center;
  padding: var(--space-8);
  position: relative;
  overflow: hidden;
}

.victory-announcement::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: repeating-conic-gradient(
    from 0deg,
    hsl(var(--success) / 0.1) 0deg 30deg,
    transparent 30deg 60deg
  );
  animation: celebrate 3s linear infinite;
}

@keyframes celebrate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.role-reveal-card {
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.6s;
}

.role-reveal-card.flipped {
  transform: rotateY(180deg);
}

.card-front,
.card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: var(--radius-xl);
  padding: var(--space-4);
}

.card-back {
  transform: rotateY(180deg);
}
```

## Accessibility Guidelines (WCAG 2.1 AA)

### Color Contrast Requirements
```css
/* Minimum contrast ratios */
.text-normal { /* 4.5:1 minimum */ }
.text-large { /* 3:1 minimum for 18px+ or 14px+ bold */ }

/* High contrast mode */
@media (prefers-contrast: high) {
  :root {
    --border: 0 0% 0%;
    --background: 0 0% 100%;
    --foreground: 0 0% 0%;
  }
}
```

### Focus Management
```css
/* Focus indicators */
.focusable {
  outline: 2px solid transparent;
  outline-offset: 2px;
  transition: outline-color 0.2s ease;
}

.focusable:focus-visible {
  outline-color: hsl(var(--focus-ring));
  box-shadow: 0 0 0 3px hsl(var(--focus-ring) / 0.3);
}

/* Skip links */
.skip-link {
  position: absolute;
  top: var(--space-4);
  left: var(--space-4);
  z-index: 1000;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius);
  transform: translateY(-100px);
  transition: transform 0.2s ease;
}

.skip-link:focus {
  transform: translateY(0);
}
```

### Screen Reader Support
```html
<!-- Live regions for dynamic content -->
<div aria-live="polite" aria-label="게임 상태 업데이트"></div>
<div aria-live="assertive" aria-label="긴급 알림"></div>

<!-- Semantic landmarks -->
<main aria-label="게임 메인 영역">
<aside aria-label="플레이어 목록">
<section aria-label="채팅 영역">

<!-- Interactive elements -->
<button aria-describedby="button-help" aria-pressed="false">
<div id="button-help" role="tooltip">버튼 도움말</div>
```

### Keyboard Navigation
```typescript
// Tab order management
const focusableElements = [
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

// Arrow key navigation for grids
const handleKeyboardNavigation = (event: KeyboardEvent) => {
  const { key } = event;
  const currentIndex = getCurrentFocusIndex();
  
  switch (key) {
    case 'ArrowRight':
      focusNextElement(currentIndex);
      break;
    case 'ArrowLeft':
      focusPreviousElement(currentIndex);
      break;
    case 'ArrowDown':
      focusElementBelow(currentIndex);
      break;
    case 'ArrowUp':
      focusElementAbove(currentIndex);
      break;
  }
};
```

### Motion and Animation
```css
/* Respect motion preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Provide animation controls */
.animation-toggle {
  position: fixed;
  top: var(--space-4);
  right: var(--space-4);
  z-index: 1000;
}
```

## Performance Optimization

### CSS Performance
```css
/* Use efficient selectors */
.player-card { /* Class selectors are fast */ }
#unique-element { /* ID selectors are fastest */ }

/* Avoid expensive properties */
.optimized-animation {
  transform: translateX(100px); /* GPU accelerated */
  will-change: transform; /* Hint to browser */
}

/* Minimize repaints */
.static-element {
  contain: layout style paint; /* CSS containment */
}
```

### Component Optimization
```typescript
// Memoize expensive components
const PlayerCard = React.memo(({ player }) => {
  return (
    <div className="player-card">
      {/* Component content */}
    </div>
  );
});

// Use React.lazy for code splitting
const GameOverPhase = React.lazy(() => import('./GameOverPhase'));

// Optimize re-renders with useCallback
const handleVote = useCallback((playerId: string) => {
  // Vote logic
}, []);
```

### Bundle Optimization
```typescript
// Dynamic imports for large dependencies
const loadHeavyComponent = async () => {
  const { HeavyComponent } = await import('./HeavyComponent');
  return HeavyComponent;
};

// Tree-shake unused code
import { specific } from 'library'; // Good
import * as library from 'library'; // Avoid
```

## Implementation Priority

### Phase 1: Fix Critical Issues (Week 1)
1. **Component Import Resolution**
   - Fix path mapping in `vite.config.ts`
   - Ensure UI components are properly exported
   - Test component rendering in isolation

2. **Basic Styling Implementation**
   - Apply design tokens to existing components
   - Fix Card, Button, and Input styling
   - Implement responsive layouts

### Phase 2: Core Game Phases (Week 2-3)
1. **Waiting Room Implementation**
   - Player grid with responsive layout
   - Ready state management
   - Real-time updates

2. **Speech Phase Implementation**
   - Turn indicator with animations
   - Chat interface with restrictions
   - Timer component

### Phase 3: Advanced Features (Week 4-5)
1. **Voting Phases Implementation**
   - Interactive voting cards
   - Progress indicators
   - Confirmation dialogs

2. **Results and Animations**
   - Game over screen with role reveal
   - Victory animations
   - Statistics display

### Phase 4: Polish and Accessibility (Week 6)
1. **Accessibility Implementation**
   - Screen reader support
   - Keyboard navigation
   - High contrast mode

2. **Performance Optimization**
   - Animation optimization
   - Bundle size reduction
   - Mobile performance tuning

## Testing Strategy

### Visual Testing
```typescript
// Playwright visual regression tests
test('waiting room layout matches design', async ({ page }) => {
  await page.goto('/game/waiting');
  await expect(page).toHaveScreenshot('waiting-room.png');
});

// Component testing with Storybook
export default {
  title: 'Game/PlayerCard',
  component: PlayerCard,
  parameters: {
    layout: 'centered',
  },
};
```

### Accessibility Testing
```typescript
// Automated a11y testing
import { axe, toHaveNoViolations } from 'jest-axe';

test('waiting room has no accessibility violations', async () => {
  render(<WaitingRoom />);
  const results = await axe(document.body);
  expect(results).toHaveNoViolations();
});
```

### Performance Testing
```typescript
// Bundle size monitoring
test('bundle size is within limits', () => {
  const stats = require('./dist/stats.json');
  const mainChunkSize = stats.chunks.find(chunk => 
    chunk.names.includes('main')
  ).size;
  
  expect(mainChunkSize).toBeLessThan(500000); // 500KB limit
});
```

## Conclusion

These design guidelines provide a comprehensive foundation for implementing a polished, accessible, and performant Liar Game frontend. The mobile-first approach ensures broad device compatibility, while the accessibility features make the game inclusive for all users. The phased implementation plan allows for iterative development and testing, ensuring each component meets the design standards before moving to the next phase.

Key success metrics:
- WCAG 2.1 AA compliance score > 95%
- Mobile performance score > 90% (Lighthouse)
- Bundle size < 500KB (main chunk)
- 60fps animations on target devices
- Cross-browser compatibility (Chrome, Firefox, Safari, Edge)

The design system establishes consistent patterns that can be extended as new features are added, ensuring long-term maintainability and user experience quality.