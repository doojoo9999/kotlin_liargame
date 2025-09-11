# AI-Actionable Implementation Prompts for Liar Game Frontend

## PRIORITY 1 - CRITICAL CSS FIXES

### PROMPT 1A: Fix Tailwind CSS Configuration and Import Issues
**Context:** Critical CSS styling failure - components render but no styling applied
**Objective:** Restore Tailwind CSS functionality and UI component styling

**Task:**
```typescript
// Issue: Tailwind CSS classes not applying, UI components unstyled
// Current state: Button, Card, Input components exist but render without styling
// Expected: Professional gaming UI with gradients, shadows, animations

// 1. Verify and fix PostCSS configuration
// Check: D:\workspaces\kotlin_liargame\frontend\postcss.config.js
// Check: D:\workspaces\kotlin_liargame\frontend\tailwind.config.js
// Check: D:\workspaces\kotlin_liargame\frontend\src\index.css

// 2. Fix CSS variable definitions
// Ensure HSL color variables are properly defined and accessible
// Check CSS custom properties in :root and .dark selectors

// 3. Verify Vite build configuration
// Check: D:\workspaces\kotlin_liargame\frontend\vite.config.ts
// Ensure PostCSS plugin is properly configured

// 4. Test CSS processing pipeline
// Run: npm run dev
// Verify CSS files are processed and served correctly
// Check browser dev tools for CSS load errors
```

**Acceptance Criteria:**
- [ ] Tailwind classes apply correctly (bg-gradient-to-br, shadow-lg, etc.)
- [ ] CSS variables resolve properly (hsl(var(--primary)))
- [ ] Dark mode switching works
- [ ] Button variants display correctly with gradients
- [ ] Card components show shadows and borders

**Files to Check/Modify:**
- `D:\workspaces\kotlin_liargame\frontend\postcss.config.js`
- `D:\workspaces\kotlin_liargame\frontend\tailwind.config.js`
- `D:\workspaces\kotlin_liargame\frontend\src\index.css`
- `D:\workspaces\kotlin_liargame\frontend\vite.config.ts`

---

### PROMPT 1B: Fix UI Component Import/Export Issues
**Context:** Button, Card, Input components exist but may have import/export problems
**Objective:** Ensure all UI components are properly accessible and functional

**Task:**
```typescript
// Issue: UI components may have broken import/export chains
// Files to verify:
// - D:\workspaces\kotlin_liargame\frontend\src\components\ui\*.tsx
// - D:\workspaces\kotlin_liargame\frontend\src\lib\utils.ts

// 1. Verify component exports
// Check each UI component file for proper export statements
// Ensure React.forwardRef is used correctly

// 2. Check utility function imports
// Verify @/lib/utils import path works correctly
// Check cn() function from clsx and tailwind-merge

// 3. Fix TypeScript path mapping
// Check: D:\workspaces\kotlin_liargame\frontend\tsconfig.json
// Ensure @/* paths resolve correctly

// 4. Test component rendering
// Create simple test page to verify each component renders with styling
```

**Acceptance Criteria:**
- [ ] All UI components export correctly
- [ ] @/lib/utils imports work
- [ ] @/components/ui/* imports work  
- [ ] TypeScript compilation succeeds
- [ ] Components render with proper styling

**Files to Check:**
- `D:\workspaces\kotlin_liargame\frontend\src\components\ui\button.tsx`
- `D:\workspaces\kotlin_liargame\frontend\src\components\ui\card.tsx`
- `D:\workspaces\kotlin_liargame\frontend\src\components\ui\input.tsx`
- `D:\workspaces\kotlin_liargame\frontend\src\lib\utils.ts`
- `D:\workspaces\kotlin_liargame\frontend\tsconfig.app.json`

---

### PROMPT 1C: Verify and Fix CSS-in-JS Integration  
**Context:** Ensure Tailwind CSS works properly with React components
**Objective:** Validate complete CSS styling pipeline

**Task:**
```typescript
// 1. Create component testing page
// Create: D:\workspaces\kotlin_liargame\frontend\src\pages\ComponentTest.tsx
// Test all UI components with various props

// Example test component:
const ComponentTest = () => {
  return (
    <div className="p-8 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Test Card</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="default">Default Button</Button>
          <Button variant="vote">Vote Button</Button>
          <Button variant="danger">Danger Button</Button>
        </CardContent>
      </Card>
    </div>
  );
};

// 2. Add to router for testing
// Temporarily add route to test components

// 3. Run visual validation
// Use npm run test:visual or manual testing
// Capture screenshots for comparison
```

**Acceptance Criteria:**
- [ ] Test page loads without errors
- [ ] All button variants show correct styling
- [ ] Card components display with shadows and borders
- [ ] Responsive classes work on mobile/desktop
- [ ] Dark mode toggle works correctly

**Files to Create/Modify:**
- `D:\workspaces\kotlin_liargame\frontend\src\pages\ComponentTest.tsx`
- Update router configuration temporarily

---

## PRIORITY 2 - CORE GAME COMPONENTS

### PROMPT 2A: Implement Game Phase Manager System
**Context:** 7-phase game flow requiring different UI for each phase
**Objective:** Create centralized phase management with proper state handling

**Task:**
```typescript
// Create: D:\workspaces\kotlin_liargame\frontend\src\components\game\GamePhaseManager.tsx

interface GamePhaseManagerProps {
  currentPhase: GamePhase;
  gameState: GameState;
  playerRole: PlayerRole;
  onPhaseAction: (action: GameAction) => void;
}

// Implement phase routing:
const PHASE_COMPONENTS = {
  WAITING_FOR_PLAYERS: WaitingPhase,
  SPEECH: SpeechPhase, 
  VOTING_FOR_LIAR: VotingPhase,
  DEFENDING: DefensePhase,
  VOTING_FOR_SURVIVAL: SurvivalVotePhase,
  GUESSING_WORD: GuessingPhase,
  GAME_OVER: GameOverPhase
} as const;

// Features needed:
// 1. Phase transition animations (Framer Motion)
// 2. Error boundary for each phase
// 3. Loading states between phases
// 4. Accessibility announcements for phase changes
// 5. Timer display component
// 6. Player status panel (always visible)
// 7. Connection status indicator
```

**Acceptance Criteria:**
- [ ] Phase transitions work smoothly
- [ ] Each phase renders appropriate UI
- [ ] Timer displays correctly for timed phases
- [ ] Phase changes announced for screen readers
- [ ] Error boundaries catch phase-specific errors
- [ ] Loading states shown during transitions

**Related Files:**
- Create `D:\workspaces\kotlin_liargame\frontend\src\components\game\GamePhaseManager.tsx`
- Create `D:\workspaces\kotlin_liargame\frontend\src\components\game\phases\*.tsx`
- Update `D:\workspaces\kotlin_liargame\frontend\src\types\gameFlow.ts`

---

### PROMPT 2B: Implement Speech/Hint Phase Component
**Context:** Turn-based hint sharing with real-time chat
**Objective:** Create interactive hint sharing interface with proper turn management

**Task:**
```typescript
// Create: D:\workspaces\kotlin_liargame\frontend\src\components\game\phases\SpeechPhase.tsx

interface SpeechPhaseProps {
  currentTurn: string; // player ID
  players: Player[];
  isMyTurn: boolean;
  topic: string;
  word?: string; // undefined for liar
  timeRemaining: number;
  hints: HintMessage[];
  onSubmitHint: (hint: string) => void;
  onStartTyping: () => void;
  onStopTyping: () => void;
}

// Features to implement:
// 1. Turn indicator with spotlight effect
// 2. Hint input field (only active on player's turn)
// 3. Hint history display with timestamps
// 4. Role card showing word/topic
// 5. Real-time typing indicators
// 6. Timer with visual progress bar
// 7. Turn order display (circular or linear)
// 8. Hint validation (length, content)

// UI Layout:
// ┌─────────────────────────────────────┐
// │  Timer: 30s    Phase: Speech        │
// ├─────────────────────────────────────┤
// │  Your Word: [ELEPHANT]  🐘         │
// ├─────────────────────────────────────┤
// │  Turn Order: You → Alice → Bob      │
// ├─────────────────────────────────────┤
// │  Previous Hints:                    │
// │  • Alice: "Large gray animal"       │
// │  • Bob: "Has a trunk"               │
// ├─────────────────────────────────────┤
// │  [Input: Enter your hint...] [Send] │
// └─────────────────────────────────────┘
```

**Acceptance Criteria:**
- [ ] Current player highlighted clearly
- [ ] Input only enabled on player's turn
- [ ] Hint history displays chronologically
- [ ] Timer shows visual countdown
- [ ] Word/topic card displays correctly
- [ ] Typing indicators work
- [ ] Turn transitions are smooth
- [ ] Mobile layout is usable

**Dependencies:**
- WebSocket integration for real-time hints
- Zustand store for game state
- Framer Motion for animations

---

### PROMPT 2C: Implement Voting Phase Component
**Context:** Two voting phases - voting for liar and voting for survival
**Objective:** Create reusable voting interface with clear candidate selection

**Task:**
```typescript
// Create: D:\workspaces\kotlin_liargame\frontend\src\components\game\phases\VotingPhase.tsx

interface VotingPhaseProps {
  votingType: 'LIAR' | 'SURVIVAL';
  candidates: Player[];
  hasVoted: boolean;
  votingProgress: VotingProgress;
  timeRemaining: number;
  onVote: (targetId: string) => void;
  onConfirmVote: () => void;
}

// Features to implement:
// 1. Player cards with hint summaries
// 2. Vote confirmation dialog
// 3. Voting progress indicator
// 4. Hint review panel (collapsible)
// 5. Vote locking mechanism
// 6. Visual feedback for vote submission
// 7. Anonymous vs. public voting modes

// Voting UI Layout:
// ┌─────────────────────────────────────┐
// │  Vote for the Liar (3/5 voted)     │
// ├─────────────────────────────────────┤
// │  ┌───────┐ ┌───────┐ ┌───────┐     │
// │  │ Alice │ │ Bob   │ │ Carol │     │
// │  │  🤔   │ │  😐   │ │  😅   │     │
// │  │ [Vote]│ │ [Vote]│ │ [Vote]│     │
// │  └───────┘ └───────┘ └───────┘     │
// ├─────────────────────────────────────┤
// │  📝 Review Hints                    │
// │  ▼ Click to expand hint history     │
// └─────────────────────────────────────┘

// Confirmation Dialog:
// ┌─────────────────────────────────────┐
// │  Confirm Vote                       │
// │  Vote for Alice as the liar?        │
// │  ⚠️ This cannot be undone          │
// │  [Cancel] [Confirm Vote]            │
// └─────────────────────────────────────┘
```

**Acceptance Criteria:**
- [ ] Player cards display correctly
- [ ] Vote confirmation prevents accidents
- [ ] Progress indicator updates in real-time
- [ ] Hint review is easily accessible
- [ ] Voted state shows clearly
- [ ] Timer pressure is visible
- [ ] Mobile cards are touch-friendly

---

### PROMPT 2D: Implement Defense Phase Component  
**Context:** Accused player gets to defend themselves
**Objective:** Create focused defense interface highlighting the accused player

**Task:**
```typescript
// Create: D:\workspaces\kotlin_liargame\frontend\src\components\game\phases\DefensePhase.tsx

interface DefensePhaseProps {
  accusedPlayer: Player;
  isAccused: boolean;
  defenseTime: number;
  accusationSummary: AccusationSummary;
  onSubmitDefense: (defense: string) => void;
}

// Features to implement:
// 1. Accused player spotlight effect
// 2. Defense text input (only for accused)
// 3. Accusation summary display
// 4. Hint evidence display
// 5. Character limit and guidance
// 6. Dramatic timer with pressure effects
// 7. Read-only mode for other players

// Defense UI Layout:
// ┌─────────────────────────────────────┐
// │  🔴 Alice is Accused! 🔴           │
// │  Defense Time: 45 seconds           │
// ├─────────────────────────────────────┤
// │  Accusation Summary:                │
// │  • Voted by: Bob, Carol, Dave       │
// │  • Suspicious hints: "Big ears"     │
// │  • Vote count: 3/5                  │
// ├─────────────────────────────────────┤
// │  Alice's Previous Hints:            │
// │  • "Large animal"                   │
// │  • "Has big ears"                   │
// │  • "Lives in Africa"                │
// ├─────────────────────────────────────┤
// │  📝 Your Defense (Alice only):      │
// │  [Text Area: Explain yourself...]   │
// │  Characters: 145/500                │
// │  [Submit Defense]                   │
// └─────────────────────────────────────┘
```

**Acceptance Criteria:**
- [ ] Accused player clearly highlighted
- [ ] Defense input only for accused player
- [ ] Accusation details clearly displayed
- [ ] Previous hints easily reviewable
- [ ] Character limit enforced
- [ ] Timer creates appropriate pressure
- [ ] Other players see defense in real-time

---

## PRIORITY 3 - WEBSOCKET INTEGRATION

### PROMPT 3A: Enhance WebSocket Connection Hook
**Context:** Existing useWebSocketConnection.ts needs integration with game components
**Objective:** Improve WebSocket reliability and error handling

**Task:**
```typescript
// Enhance: D:\workspaces\kotlin_liargame\frontend\src\hooks\useWebSocketConnection.ts

// Issues to address:
// 1. Add connection recovery strategies
// 2. Implement exponential backoff
// 3. Add offline detection
// 4. Improve error categorization
// 5. Add connection quality indicators
// 6. Implement message queuing for offline scenarios

// Enhanced connection management:
interface ConnectionConfig {
  reconnectAttempts: number;
  reconnectDelay: number;
  heartbeatInterval: number;
  connectionTimeout: number;
  offlineThreshold: number;
}

// Add connection quality monitoring:
interface ConnectionQuality {
  latency: number;
  stability: 'excellent' | 'good' | 'poor' | 'critical';
  lastHeartbeat: Date;
  reconnectCount: number;
}

// Implement message queue for reliability:
interface QueuedMessage {
  id: string;
  type: string;
  payload: any;
  timestamp: Date;
  retryCount: number;
}
```

**Acceptance Criteria:**
- [ ] Automatic reconnection with exponential backoff
- [ ] Offline/online detection
- [ ] Message queuing during disconnection
- [ ] Connection quality indicators
- [ ] Graceful error handling
- [ ] Toast notifications for connection issues

**Files to Modify:**
- `D:\workspaces\kotlin_liargame\frontend\src\hooks\useWebSocketConnection.ts`
- `D:\workspaces\kotlin_liargame\frontend\src\api\websocket.ts`

---

### PROMPT 3B: Implement Game Action Service
**Context:** Need service layer for game actions with WebSocket integration
**Objective:** Create typed, reliable game action handlers

**Task:**
```typescript
// Create: D:\workspaces\kotlin_liargame\frontend\src\services\gameActionService.ts

interface GameActionService {
  // Player actions
  joinGame(gameNumber: number, playerInfo: PlayerInfo): Promise<void>;
  leaveGame(): Promise<void>;
  setReady(ready: boolean): Promise<void>;
  
  // Game flow actions
  submitHint(hint: string): Promise<void>;
  castVote(targetPlayerId: string): Promise<void>;
  submitDefense(defense: string): Promise<void>;
  guessWord(word: string): Promise<void>;
  
  // Chat actions
  sendChatMessage(message: string, type: ChatType): Promise<void>;
  startTyping(): void;
  stopTyping(): void;
  
  // Host actions
  startGame(): Promise<void>;
  kickPlayer(playerId: string): Promise<void>;
  changeGameSettings(settings: GameSettings): Promise<void>;
}

// Features:
// 1. Request/response correlation
// 2. Timeout handling
// 3. Retry logic for failed actions
// 4. Optimistic updates
// 5. Action validation
// 6. Error categorization
// 7. Analytics tracking
```

**Acceptance Criteria:**
- [ ] All game actions have typed interfaces
- [ ] Timeout handling for long operations
- [ ] Retry logic for network failures
- [ ] Optimistic UI updates
- [ ] Comprehensive error handling
- [ ] Action logging for debugging

---

## PRIORITY 4 - STATE MANAGEMENT ENHANCEMENT

### PROMPT 4A: Enhance Game Store with Selectors
**Context:** Improve Zustand store performance and organization
**Objective:** Add memoized selectors and optimize state structure

**Task:**
```typescript
// Enhance: D:\workspaces\kotlin_liargame\frontend\src\store\gameStore.ts

// Add selector patterns:
export const gameSelectors = {
  // Player selectors
  getCurrentPlayer: (state: GameState) => 
    state.players.find(p => p.id === state.currentPlayerId),
  
  getPlayerByTurn: (state: GameState) => 
    state.players.find(p => p.id === state.currentTurnPlayer),
  
  getActivePlayers: (state: GameState) => 
    state.players.filter(p => p.isOnline),
  
  // Game state selectors  
  getTimeRemaining: (state: GameState) => state.timer.timeRemaining,
  
  getVotingProgress: (state: GameState) => ({
    total: state.players.length,
    voted: state.votes.length,
    percentage: (state.votes.length / state.players.length) * 100
  }),
  
  // Chat selectors
  getPhaseMessages: (state: GameState, phase: GamePhase) =>
    state.chatMessages.filter(msg => msg.phase === phase),
  
  getHintMessages: (state: GameState) =>
    state.chatMessages.filter(msg => msg.type === 'HINT'),
};

// Performance optimizations:
// 1. Use shallow equality for arrays
// 2. Implement state normalization
// 3. Add computed properties
// 4. Optimize WebSocket event handlers
```

**Acceptance Criteria:**
- [ ] Selectors prevent unnecessary re-renders
- [ ] State structure is normalized
- [ ] Performance monitoring shows improvements
- [ ] Memory usage is optimized
- [ ] Developer experience is improved

---

### PROMPT 4B: Implement Game Settings Store
**Context:** Need persistent game settings and preferences
**Objective:** Create settings store with localStorage persistence

**Task:**
```typescript
// Create: D:\workspaces\kotlin_liargame\frontend\src\store\settingsStore.ts

interface SettingsState {
  // UI preferences
  theme: 'light' | 'dark' | 'auto';
  language: 'ko' | 'en';
  
  // Game preferences
  enableSounds: boolean;
  enableVibration: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large';
  
  // Accessibility
  highContrast: boolean;
  screenReaderMode: boolean;
  keyboardNavigation: boolean;
  
  // Performance
  enableAnimations: boolean;
  maxChatMessages: number;
  autoReconnect: boolean;
  
  // Privacy
  showOnlineStatus: boolean;
  allowAnalytics: boolean;
}

// Features:
// 1. localStorage persistence
// 2. Settings validation
// 3. Migration for settings schema changes
// 4. Real-time settings application
// 5. Settings export/import
// 6. Default settings restoration
```

**Acceptance Criteria:**
- [ ] Settings persist across sessions
- [ ] Settings apply immediately
- [ ] Settings validation prevents invalid states
- [ ] Migration handles schema changes
- [ ] Settings can be reset to defaults

---

## PRIORITY 5 - UI/UX ENHANCEMENT

### PROMPT 5A: Implement Responsive Layout System
**Context:** Mobile-first design with breakpoint-specific layouts
**Objective:** Create adaptive layouts for different screen sizes

**Task:**
```typescript
// Create: D:\workspaces\kotlin_liargame\frontend\src\components\layout\ResponsiveGameLayout.tsx

interface ResponsiveGameLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

// Breakpoint system:
const breakpoints = {
  mobile: '(max-width: 640px)',
  tablet: '(min-width: 641px) and (max-width: 1024px)', 
  desktop: '(min-width: 1025px)',
} as const;

// Layout configurations:
// Mobile: Stack layout, collapsible sidebar, bottom actions
// Tablet: Two-column layout, persistent sidebar
// Desktop: Three-column layout, all panels visible

// Features:
// 1. CSS Grid-based layouts
// 2. Collapsible sidebars on mobile
// 3. Bottom sheet actions on mobile
// 4. Responsive typography scaling
// 5. Touch-friendly spacing
// 6. Orientation change handling
```

**Acceptance Criteria:**
- [ ] Layouts adapt smoothly to screen size changes
- [ ] Touch targets are minimum 44px on mobile
- [ ] Text remains readable at all sizes
- [ ] Navigation is accessible on all devices
- [ ] Orientation changes handled gracefully

---

### PROMPT 5B: Implement Animation System
**Context:** Enhance user experience with smooth transitions
**Objective:** Create consistent animation patterns using Framer Motion

**Task:**
```typescript
// Create: D:\workspaces\kotlin_liargame\frontend\src\components\animation\GameAnimations.tsx

// Animation presets:
export const gameAnimations = {
  // Page transitions
  pageSlide: {
    initial: { x: 300, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -300, opacity: 0 },
    transition: { duration: 0.3, ease: "easeInOut" }
  },
  
  // Phase transitions
  phaseChange: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { duration: 0.5, ease: "backOut" }
  },
  
  // Player actions
  playerHighlight: {
    animate: { 
      boxShadow: [
        "0 0 0 0 rgba(59, 130, 246, 0.7)",
        "0 0 0 20px rgba(59, 130, 246, 0)",
      ]
    },
    transition: { duration: 1.5, repeat: Infinity }
  },
  
  // Notifications
  toast: {
    initial: { y: 50, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -50, opacity: 0 }
  }
};

// Accessibility considerations:
// 1. Respect prefers-reduced-motion
// 2. Provide alternative feedback
// 3. Keep animations under 0.5s for interactions
// 4. Use transform over position changes
```

**Acceptance Criteria:**
- [ ] Animations enhance UX without being distracting
- [ ] Reduced motion preference is respected
- [ ] Animations perform at 60fps
- [ ] Loading states have appropriate animations
- [ ] Hover and focus states are animated

---

### PROMPT 5C: Implement Accessibility Features
**Context:** WCAG 2.1 AA compliance and game-specific accessibility
**Objective:** Make the game accessible to users with disabilities

**Task:**
```typescript
// Create: D:\workspaces\kotlin_liargame\frontend\src\components\accessibility\GameAccessibility.tsx

// Features to implement:
// 1. Screen reader announcements
interface AnnouncementService {
  announcePhaseChange(phase: GamePhase): void;
  announcePlayerTurn(playerName: string): void;
  announceVoteResult(result: VoteResult): void;
  announceGameEnd(winner: string): void;
}

// 2. Keyboard navigation
interface KeyboardNavigation {
  focusNextPlayer(): void;
  focusPreviousPlayer(): void;
  activateCurrentElement(): void;
  openQuickActions(): void;
}

// 3. High contrast mode
interface HighContrastTheme {
  primary: string;
  secondary: string;
  danger: string;
  success: string;
  background: string;
  text: string;
}

// 4. Audio cues (optional)
interface AudioFeedback {
  playPhaseChange(): void;
  playTurnStart(): void;
  playVoteSubmitted(): void;
  playGameEnd(): void;
}

// Implementation requirements:
// - All interactive elements must be keyboard accessible
// - ARIA labels and descriptions for game elements
// - Focus management during phase transitions
// - Color contrast ratios meeting WCAG AA standards
// - Alternative text for all visual indicators
```

**Acceptance Criteria:**
- [ ] Screen reader users can play the full game
- [ ] All interactions work with keyboard only
- [ ] Color contrast meets WCAG AA standards
- [ ] Focus management works during transitions
- [ ] Audio alternatives provided for visual cues

---

## TESTING AND VALIDATION PROMPTS

### PROMPT TEST-1: Component Integration Testing
**Context:** Ensure all components work together correctly
**Objective:** Create comprehensive integration tests

**Task:**
```typescript
// Create: D:\workspaces\kotlin_liargame\frontend\src\tests\integration\GameFlow.test.tsx

// Test scenarios:
// 1. Complete game flow from lobby to results
// 2. WebSocket disconnection and reconnection
// 3. Phase transitions with real data
// 4. Error boundary activation and recovery
// 5. Mobile viewport interactions
// 6. Accessibility compliance

describe('Game Flow Integration', () => {
  it('completes full game from lobby to results', async () => {
    // Mock WebSocket responses
    // Test each phase transition
    // Verify state updates
    // Check UI updates
  });
  
  it('handles disconnection gracefully', async () => {
    // Simulate network disconnection
    // Verify offline UI
    // Test reconnection
    // Verify state recovery
  });
  
  it('works with keyboard navigation', async () => {
    // Test full game flow with keyboard only
    // Verify focus management
    // Check ARIA announcements
  });
});
```

**Acceptance Criteria:**
- [ ] All integration tests pass
- [ ] Test coverage > 80%
- [ ] E2E tests cover critical paths
- [ ] Performance tests validate 60fps
- [ ] Accessibility tests pass automated scans

---

### PROMPT TEST-2: Visual Regression Testing
**Context:** Ensure UI consistency across changes
**Objective:** Set up automated visual testing with Playwright

**Task:**
```typescript
// Enhance: D:\workspaces\kotlin_liargame\frontend\tests\visual\*.spec.ts

// Test cases to add:
// 1. All game phases on different devices
// 2. Dark/light theme switching
// 3. Error states and loading states
// 4. Responsive breakpoint transitions
// 5. Animation states and transitions
// 6. High contrast mode

test.describe('Visual Regression Tests', () => {
  test('game phases render correctly', async ({ page }) => {
    // Test each phase with mock data
    // Capture screenshots
    // Compare with baselines
  });
  
  test('responsive layouts work', async ({ page }) => {
    // Test multiple viewport sizes
    // Verify layout adaptations
    // Check touch target sizes
  });
  
  test('accessibility features display correctly', async ({ page }) => {
    // Test high contrast mode
    // Verify focus indicators
    // Check ARIA elements
  });
});
```

**Acceptance Criteria:**
- [ ] Visual regression tests catch UI changes
- [ ] Tests run on multiple browsers
- [ ] Screenshots are consistent
- [ ] Responsive tests cover key breakpoints
- [ ] Accessibility tests validate compliance

---

## DEPLOYMENT AND OPTIMIZATION PROMPTS

### PROMPT DEPLOY-1: Production Build Optimization
**Context:** Optimize build for production deployment
**Objective:** Minimize bundle size and maximize performance

**Task:**
```typescript
// Update: D:\workspaces\kotlin_liargame\frontend\vite.config.ts

export default defineConfig({
  // Add production optimizations:
  build: {
    // Code splitting strategy
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-button', '@radix-ui/react-card'],
          game: ['zustand', '@stomp/stompjs'],
          animations: ['framer-motion']
        }
      }
    },
    
    // Bundle analysis
    analyze: process.env.ANALYZE === 'true',
    
    // Performance budgets
    chunkSizeWarningLimit: 1000,
  },
  
  // Progressive Web App features
  plugins: [
    // Add PWA plugin for offline support
    // Add bundle analyzer
    // Add performance monitoring
  ]
});

// Performance targets:
// - First Contentful Paint < 1.5s
// - Time to Interactive < 3s
// - Bundle size < 500KB gzipped
// - Lighthouse score > 90
```

**Acceptance Criteria:**
- [ ] Bundle size under performance budget
- [ ] Code splitting reduces initial load
- [ ] Progressive loading implemented
- [ ] PWA features work offline
- [ ] Lighthouse scores meet targets

---

Each prompt is designed to be:
1. **Self-contained** - Complete context and requirements
2. **Actionable** - Clear tasks with specific file paths
3. **Testable** - Acceptance criteria for validation
4. **Incremental** - Can be implemented independently
5. **Maintainable** - Follows project architecture patterns

The prompts build upon the existing codebase structure and address the critical CSS issues first, then implement core game functionality, enhance with advanced features, and finally optimize for production deployment.