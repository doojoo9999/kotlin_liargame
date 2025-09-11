# 🎮 Game Flow Implementation System

## Overview
**Priority**: 2 (After CSS fixes)  
**Dependencies**: 01-CRITICAL_CSS_FIXES.md must be completed  
**Impact**: Core gameplay functionality  
**Estimated Time**: 12-16 hours

## Game Phase Architecture
Based on GAME_FLOW_DESIGN.md and GAME_FLOW_TECHNICAL_GUIDE.md specifications:

```
Game Phases: WAITING → SPEECH → VOTING_FOR_LIAR → DEFENDING → VOTING_FOR_SURVIVAL → GUESSING_WORD → GAME_OVER
```

## AI Agent Prompts

### Prompt 1: Core Game State Machine Implementation
```
**Task**: Build centralized game state management system with phase transitions

**Context**:
- React 19 + TypeScript with Zustand state management
- 7 distinct game phases with specific timing and rules
- Real-time synchronization with Kotlin backend via WebSocket
- Phase transitions must be deterministic and trackable

**Game Phases to Implement**:
1. **WAITING** (대기) - Players joining lobby
2. **SPEECH** (힌트 타임) - Sequential hint giving, 45s per player  
3. **VOTING_FOR_LIAR** (라이어 지목) - Vote for suspected liar, 60s
4. **DEFENDING** (라이어 변론) - Accused player defense, 90s
5. **VOTING_FOR_SURVIVAL** (생존 투표) - Final elimination vote, 45s
6. **GUESSING_WORD** (정답 추측) - Liar guesses the word, 30s
7. **GAME_OVER** (게임 종료) - Results and scoring

**Required State Structure**:
```typescript
interface GameState {
  gameId: string;
  phase: GamePhase;
  currentRound: number;
  totalRounds: number;
  timeRemaining: number;
  currentPlayer?: string; // For SPEECH phase
  players: Player[];
  gameData: {
    topic: string;
    secretWord?: string; // Only for citizens
    hints: Hint[];
    votes: Vote[];
    accusedPlayer?: string;
    results?: GameResults;
  };
  scores: Record<string, number>;
}
```

**Actions Required**:
1. Create Zustand store for game state management
2. Implement phase transition logic with validation
3. Build timer management system for each phase
4. Create phase-specific data structures
5. Add optimistic updates for user actions
6. Implement error recovery for network issues

**Files to Create/Modify**:
- frontend/src/stores/gameStore.ts
- frontend/src/types/game.ts
- frontend/src/utils/gamePhases.ts
- frontend/src/hooks/useGameState.ts

**Acceptance Criteria**:
1. ✅ GameStore manages all 7 phases correctly
2. ✅ Phase transitions occur automatically with proper timing
3. ✅ Timer countdown works for each phase duration
4. ✅ State persists during browser refresh
5. ✅ TypeScript types are comprehensive and accurate
```

### Prompt 2: Game Phase Components Architecture
```
**Task**: Create specialized React components for each game phase

**Context**:
- Each phase requires unique UI and interaction patterns
- Components must be responsive and accessible
- Korean UX specifications from UX_FLOW_DESIGN.md
- Mobile-first design with touch optimization

**Component Hierarchy**:
```
GameFlowManager (Main Container)
├── ModeratorCommentary (Contextual guidance)
├── GamePhaseIndicator (Progress & timer)
├── PlayerStatusPanel (Left sidebar)
├── GameActionInterface (Center - phase-specific)
│   ├── WaitingPhase
│   ├── HintPhase (Speech)
│   ├── VotingPhase (Voting for liar)
│   ├── DefensePhase (Defending)
│   ├── SurvivalVotePhase
│   ├── GuessPhase (Word guessing)
│   └── ResultsPhase
├── ActivityFeed (Right sidebar)
└── GameChat (Right sidebar)
```

**Phase-Specific Requirements**:

**HintPhase (힌트 타임)**:
- Turn indicator showing current speaker
- 45-second countdown timer
- Hint input with 20-character limit
- Word filtering to prevent revealing secret word
- Auto-submission on timeout

**VotingPhase (라이어 지목)**:
- Player portraits with voting buttons
- Cannot vote for self
- Real-time vote progress (hidden counts)
- 60-second timer with warnings

**DefensePhase (라이어 변론)**:
- Accused player highlighted
- Text input for defense statement
- Q&A interface for other players
- 90-second timer

**Actions Required**:
1. Create base GameFlowManager container
2. Implement each phase component with specific logic
3. Add phase transition animations
4. Implement responsive layouts for mobile/desktop
5. Add accessibility features (ARIA labels, keyboard navigation)
6. Create moderator commentary system

**Files to Create**:
- frontend/src/components/game/GameFlowManager.tsx
- frontend/src/components/game/phases/WaitingPhase.tsx
- frontend/src/components/game/phases/HintPhase.tsx
- frontend/src/components/game/phases/VotingPhase.tsx
- frontend/src/components/game/phases/DefensePhase.tsx
- frontend/src/components/game/phases/SurvivalVotePhase.tsx
- frontend/src/components/game/phases/GuessPhase.tsx
- frontend/src/components/game/phases/ResultsPhase.tsx
- frontend/src/components/game/ModeratorCommentary.tsx

**Acceptance Criteria**:
1. ✅ All 7 phase components render correctly
2. ✅ Phase-specific interactions work as designed
3. ✅ Timer displays and countdown functions properly
4. ✅ Mobile responsive design tested on multiple devices
5. ✅ Korean text displays correctly with proper fonts
6. ✅ Accessibility features work with screen readers
```

### Prompt 3: Timer Management and Synchronization System
```
**Task**: Implement robust timer system with server synchronization

**Context**:
- Each game phase has specific duration requirements
- Timers must stay synchronized across all players
- Handle network disconnections gracefully
- Provide visual countdown with warning indicators

**Phase Timing Requirements**:
```typescript
const PHASE_TIMINGS = {
  WAITING: 0,           // No timer, manual start
  SPEECH: 45,           // 45 seconds per player
  VOTING_FOR_LIAR: 60,  // 60 seconds total
  DEFENDING: 90,        // 90 seconds for defense
  VOTING_FOR_SURVIVAL: 45, // 45 seconds final vote
  GUESSING_WORD: 30,    // 30 seconds for liar to guess
  GAME_OVER: 30         // 30 seconds to show results
};
```

**Features Required**:
1. **Server Synchronization**: Time remaining sent from backend
2. **Visual Countdown**: Prominent timer display with color changes
3. **Warning System**: Visual/audio alerts at 10s and 5s remaining
4. **Auto-submission**: Automatic action when time expires
5. **Network Resilience**: Handle disconnection/reconnection
6. **Multi-player Sync**: All players see same countdown

**Timer Component Specifications**:
- Large, visible countdown display
- Color coding: Green (>30s), Yellow (10-30s), Red (<10s)
- Progress bar visualization
- Sound alerts (optional, user preference)
- Haptic feedback on mobile devices

**Actions Required**:
1. Create timer service for countdown management
2. Implement server time synchronization
3. Build visual timer components with animations
4. Add warning notifications system
5. Create auto-submission logic for each phase
6. Handle edge cases (network delays, browser tab inactive)

**Files to Create**:
- frontend/src/services/timerService.ts
- frontend/src/components/game/Timer.tsx
- frontend/src/components/game/TimerWarning.tsx
- frontend/src/hooks/useTimer.ts
- frontend/src/utils/timeSync.ts

**Acceptance Criteria**:
1. ✅ Timer displays accurately across all devices
2. ✅ Warning alerts trigger at correct intervals
3. ✅ Auto-submission works for all phases
4. ✅ Server sync maintains accuracy within 1 second
5. ✅ Timer continues correctly after network reconnection
6. ✅ Accessibility features work for vision-impaired users
```

### Prompt 4: Scoring System Integration
```
**Task**: Implement comprehensive scoring calculation and display system

**Context**:
- Complex scoring matrix based on game outcomes
- Real-time score updates after each round
- Victory condition checking (first to 10 points)
- Score persistence and leaderboard integration

**Scoring Rules from GAME_FLOW_DESIGN.md**:

**Scenario 1: Liar Correctly Identified and Eliminated**
- Citizens who voted correctly: +3 points
- Citizens who voted incorrectly: +0 points  
- Eliminated Liar: +0 points

**Scenario 2: Innocent Player Eliminated**
- All Liars: +4 points each
- Citizens who voted to eliminate: -1 point each
- Citizens who voted to save: +1 point each

**Scenario 3: Liar Survives Vote**
- Surviving Liar: +6 points
- Citizens: +0 points

**Scenario 4: Topic Guessing Bonus**
- Liar guesses topic correctly: +3 bonus points

**Actions Required**:
1. Create scoring calculation engine
2. Implement real-time score updates
3. Build victory condition checking
4. Create score display components
5. Add score animation and celebration effects
6. Implement score persistence

**Score Display Requirements**:
- Current round scores prominently displayed
- Running total for each player
- Victory progress indicators
- Score change animations (+3, -1, etc.)
- Leaderboard ranking

**Files to Create**:
- frontend/src/services/scoringService.ts
- frontend/src/components/game/ScoreBoard.tsx
- frontend/src/components/game/ScoreUpdate.tsx
- frontend/src/hooks/useScoring.ts
- frontend/src/utils/scoreCalculations.ts

**Acceptance Criteria**:
1. ✅ All scoring scenarios calculate correctly
2. ✅ Score updates appear immediately after rounds
3. ✅ Victory conditions trigger proper game end
4. ✅ Score animations enhance user experience
5. ✅ Scores persist through browser refresh
6. ✅ Accessibility support for score announcements
```

### Prompt 5: Moderator Commentary System
```
**Task**: Build intelligent contextual guidance system for players

**Context**:
- Dynamic commentary based on game state and player role
- Provides strategic guidance for both citizens and liars
- Korean language implementation with proper localization
- Prominent placement in UI with urgency indicators

**Commentary Categories**:

**Phase-Specific Guidance**:
- SPEECH: "Give hints that help citizens but don't reveal the word"
- VOTING: "Vote for the player you think is the liar"
- DEFENDING: "Convince others of your innocence"

**Role-Specific Advice**:
- **Citizens**: "Work together to identify the liar"
- **Liars**: "Blend in and avoid suspicion"

**Contextual Situations**:
- Time running low: "Hurry! Only 10 seconds remaining!"
- High suspicion: "You're receiving many votes"
- Strategic moments: "This is your chance to convince others"

**Actions Required**:
1. Create commentary message database
2. Implement context analysis system
3. Build dynamic message selection logic
4. Create prominent display component
5. Add Korean localization support
6. Implement accessibility features

**Commentary Display Requirements**:
- Large, prominent placement at top of screen
- Color coding for urgency (info, warning, critical)
- Smooth text transitions and animations
- Mobile-optimized responsive design
- Screen reader compatibility

**Files to Create**:
- frontend/src/services/commentaryService.ts
- frontend/src/components/game/ModeratorCommentary.tsx
- frontend/src/data/commentaryMessages.ts
- frontend/src/hooks/useCommentary.ts
- frontend/src/utils/contextAnalysis.ts

**Acceptance Criteria**:
1. ✅ Commentary updates appropriately for each phase
2. ✅ Messages are contextually relevant to game state
3. ✅ Role-specific guidance displays correctly
4. ✅ Korean text renders properly with appropriate fonts
5. ✅ Commentary enhances gameplay without being distracting
6. ✅ Accessibility features work for all users
```

## Integration Requirements

### Backend Communication
Each game phase must integrate with Kotlin backend endpoints:
- Phase transitions via WebSocket messages
- Player actions sent to appropriate REST endpoints
- Real-time state synchronization
- Error handling for network issues

### State Management Integration
- Game flow components must connect to Zustand stores
- Optimistic updates for better user experience
- Rollback mechanisms for failed operations
- Persistence for browser refresh scenarios

### Mobile Optimization
- Touch-friendly interfaces for all phases
- Swipe gestures for navigation where appropriate
- Responsive layouts adapting to screen size
- Performance optimization for mobile devices

## Success Metrics

### Functional Requirements
- [ ] All 7 game phases implemented and working
- [ ] Phase transitions occur smoothly and on time
- [ ] Scoring system calculates correctly for all scenarios
- [ ] Timer synchronization maintains accuracy
- [ ] Moderator commentary provides helpful guidance

### Technical Requirements
- [ ] No TypeScript errors in any phase component
- [ ] Mobile responsive design tested on multiple devices
- [ ] Accessibility compliance (WCAG 2.1 AA)
- [ ] Performance: phase transitions < 300ms
- [ ] Error recovery handles network issues gracefully

### User Experience Requirements
- [ ] Korean text displays correctly throughout
- [ ] Animations and transitions feel smooth
- [ ] Audio/visual feedback enhances engagement
- [ ] Interface is intuitive without external instruction
- [ ] Game flow feels natural and engaging

## Next Steps After Completion
1. **State Management**: Zustand store integration with WebSocket
2. **Real-time Features**: WebSocket event handling for multiplayer
3. **Testing**: Comprehensive test coverage for all game phases
4. **Performance**: Optimization for smooth 60fps gameplay
5. **Polish**: Advanced animations and visual effects

## Dependencies for Next Prompts
- ✅ CSS system from 01-CRITICAL_CSS_FIXES.md must be working
- ✅ UI component library must be functional
- ✅ Game flow system completed before WebSocket integration
- ✅ All phase components ready before state management optimization