# Liar Game Frontend Implementation Requirements

## Executive Summary

This document provides comprehensive implementation requirements for the Liar Game frontend based on the 7-phase game flow system. It defines state management, real-time synchronization, game balance parameters, and player interaction patterns needed to create an engaging social deduction experience.

## 1. Game State Management Architecture

### 1.1 Core Game State Schema

```typescript
interface GameFlowState {
  // Phase Management
  currentPhase: GamePhase;
  phaseStartTime: number;
  phaseDuration: number;
  phaseTimeRemaining: number;
  nextPhaseScheduled: boolean;
  
  // Round Management  
  currentRound: number;
  totalRounds: number;
  roundStartTime: number;
  
  // Scoring System
  targetPoints: number;
  playerScores: PlayerScore[];
  roundScoreChanges: ScoreChange[];
  
  // Turn Management
  currentTurnPlayerId: string | null;
  turnOrder: string[];
  turnIndex: number;
  
  // Voting System
  activeVotes: Vote[];
  voteResults: VoteResult[];
  accusedPlayerId: string | null;
  
  // Game State
  winner: string | null;
  isGameComplete: boolean;
  canStartNextRound: boolean;
  
  // Player Interaction
  hints: Hint[];
  chatMessages: ChatMessage[];
  typingPlayers: string[];
  
  // Error Handling
  lastError: string | null;
  connectionIssues: boolean;
  syncStatus: 'synced' | 'syncing' | 'error';
}

enum GamePhase {
  WAITING = 'WAITING',
  SPEECH = 'SPEECH', 
  VOTING_FOR_LIAR = 'VOTING_FOR_LIAR',
  DEFENDING = 'DEFENDING',
  VOTING_FOR_SURVIVAL = 'VOTING_FOR_SURVIVAL', 
  GUESSING_WORD = 'GUESSING_WORD',
  GAME_OVER = 'GAME_OVER'
}

interface PlayerScore {
  playerId: string;
  nickname: string;
  totalScore: number;
  roundScore: number;
  accuracy: number;
  correctVotes: number;
  totalVotes: number;
  gamesWon: number;
}

interface ScoreChange {
  playerId: string;
  change: number;
  reason: ScoringReason;
  timestamp: number;
}

enum ScoringReason {
  LIAR_ELIMINATED_CORRECT = 'LIAR_ELIMINATED_CORRECT', // +3
  LIAR_ELIMINATED_WRONG = 'LIAR_ELIMINATED_WRONG',     // +0
  INNOCENT_ELIMINATED_GUILTY = 'INNOCENT_ELIMINATED_GUILTY', // -1
  INNOCENT_ELIMINATED_INNOCENT = 'INNOCENT_ELIMINATED_INNOCENT', // +1
  LIAR_SURVIVED = 'LIAR_SURVIVED',                     // +6
  TOPIC_GUESS_CORRECT = 'TOPIC_GUESS_CORRECT',         // +3
  TOPIC_GUESS_WRONG = 'TOPIC_GUESS_WRONG'             // +0
}
```

### 1.2 Player State Management

```typescript
interface PlayerGameState {
  // Identity & Role
  playerId: string;
  nickname: string;
  role: PlayerRole;
  isHost: boolean;
  
  // Game Status
  isAlive: boolean;
  isReady: boolean;
  isOnline: boolean;
  state: PlayerState;
  
  // Turn Management
  hasGivenHint: boolean;
  hintSubmitted: string | null;
  hintSubmissionTime: number | null;
  
  // Voting
  votedFor: string | null;
  survivalVote: SurvivalVoteChoice | null;
  votingHistory: VoteHistory[];
  
  // Performance Tracking
  sessionStats: PlayerSessionStats;
  
  // UI State
  isTyping: boolean;
  lastActivity: number;
  connectionLatency: number;
}

enum PlayerRole {
  CITIZEN = 'CITIZEN',
  LIAR = 'LIAR'
}

enum PlayerState {
  WAITING = 'WAITING',
  ACTIVE = 'ACTIVE', 
  GIVING_HINT = 'GIVING_HINT',
  VOTED = 'VOTED',
  ACCUSED = 'ACCUSED',
  DEFENDING = 'DEFENDING',
  ELIMINATED = 'ELIMINATED'
}

enum SurvivalVoteChoice {
  GUILTY = 'GUILTY',
  INNOCENT = 'INNOCENT'
}

interface PlayerSessionStats {
  roundsAsLiar: number;
  roundsAsCitizen: number;
  successfulLiarRounds: number;
  correctVotes: number;
  totalVotes: number;
  averageHintTime: number;
  wordsGuessedCorrectly: number;
}
```

## 2. Real-Time Synchronization Requirements

### 2.1 WebSocket Message Protocol

```typescript
// Outgoing Messages (Client → Server)
interface ClientGameMessage {
  type: ClientMessageType;
  gameNumber: number;
  playerId: string;
  timestamp: number;
  payload: any;
}

enum ClientMessageType {
  JOIN_GAME = 'JOIN_GAME',
  LEAVE_GAME = 'LEAVE_GAME',
  SET_READY = 'SET_READY',
  SUBMIT_HINT = 'SUBMIT_HINT',
  CAST_VOTE = 'CAST_VOTE',
  CAST_SURVIVAL_VOTE = 'CAST_SURVIVAL_VOTE',
  SUBMIT_DEFENSE = 'SUBMIT_DEFENSE',
  GUESS_TOPIC = 'GUESS_TOPIC',
  SEND_CHAT = 'SEND_CHAT',
  START_TYPING = 'START_TYPING',
  STOP_TYPING = 'STOP_TYPING',
  REQUEST_GAME_STATE = 'REQUEST_GAME_STATE',
  VOTE_PLAY_AGAIN = 'VOTE_PLAY_AGAIN'
}

// Incoming Messages (Server → Client)
interface ServerGameMessage {
  type: ServerMessageType;
  gameNumber: number;
  timestamp: number;
  payload: any;
}

enum ServerMessageType {
  GAME_STATE_UPDATE = 'GAME_STATE_UPDATE',
  PHASE_CHANGE = 'PHASE_CHANGE',
  PLAYER_JOINED = 'PLAYER_JOINED',
  PLAYER_LEFT = 'PLAYER_LEFT',
  PLAYER_READY = 'PLAYER_READY',
  TIMER_UPDATE = 'TIMER_UPDATE',
  HINT_SUBMITTED = 'HINT_SUBMITTED',
  VOTE_CAST = 'VOTE_CAST',
  VOTE_RESULTS = 'VOTE_RESULTS',
  PLAYER_ACCUSED = 'PLAYER_ACCUSED',
  DEFENSE_SUBMITTED = 'DEFENSE_SUBMITTED',
  TOPIC_GUESS = 'TOPIC_GUESS',
  SCORE_UPDATE = 'SCORE_UPDATE',
  ROUND_END = 'ROUND_END',
  GAME_END = 'GAME_END',
  CHAT_MESSAGE = 'CHAT_MESSAGE',
  TYPING_UPDATE = 'TYPING_UPDATE',
  ERROR_MESSAGE = 'ERROR_MESSAGE',
  SYNC_STATE = 'SYNC_STATE'
}
```

### 2.2 Critical Synchronization Points

```typescript
interface SynchronizationRequirements {
  // Phase Transitions (Server Authoritative)
  phaseChanges: {
    broadcastDelay: 0; // Immediate
    clientBuffering: 500; // ms buffer for UI updates
    rollbackSupport: true;
  };
  
  // Timer Synchronization
  timers: {
    serverSyncInterval: 10000; // Sync every 10 seconds
    clientTickInterval: 1000; // Update every second
    maxDrift: 2000; // Max 2 second drift before correction
    autoCorrection: true;
  };
  
  // Vote Collection
  voting: {
    realTimeUpdates: true;
    showLiveCount: true; // Show vote count without revealing votes
    batchSubmission: false; // Individual vote submission
    voteChangeAllowed: true; // Until phase ends
  };
  
  // Chat & Hints
  communication: {
    immediateDelivery: true;
    typingIndicators: true;
    messageHistory: 50; // Keep last 50 messages
    profanityFilter: true;
  };
  
  // Error Recovery
  recovery: {
    autoReconnect: true;
    maxReconnectAttempts: 5;
    stateRecovery: true;
    dataResync: true;
  };
}
```

## 3. Game Balance & Timing Specifications

### 3.1 Phase Duration Parameters

```typescript
interface PhaseTimingConfig {
  [GamePhase.SPEECH]: {
    baseDuration: 45; // seconds per player
    playerCountMultiplier: 1.0;
    maxDuration: 300; // 5 minutes total max
    warningThresholds: [30, 10, 5]; // seconds
  };
  
  [GamePhase.VOTING_FOR_LIAR]: {
    baseDuration: 60;
    playerCountBonus: 5; // +5 seconds per player above 4
    maxDuration: 120;
    minimumParticipation: 0.75; // 75% must vote
    warningThresholds: [30, 10];
  };
  
  [GamePhase.DEFENDING]: {
    baseDuration: 90;
    questionTime: 30; // Per question asked
    maxQuestions: 3;
    maxTotalDuration: 180;
    warningThresholds: [60, 30, 10];
  };
  
  [GamePhase.VOTING_FOR_SURVIVAL]: {
    baseDuration: 45;
    playerCountBonus: 0;
    maxDuration: 60;
    defaultVote: 'INNOCENT'; // If no vote cast
    warningThresholds: [20, 10, 5];
  };
  
  [GamePhase.GUESSING_WORD]: {
    baseDuration: 30;
    maxGuesses: 1;
    showHintsToLiar: true;
    warningThresholds: [15, 5];
  };
}
```

### 3.2 Scoring Balance Model

```typescript
interface ScoringParameters {
  // Victory Conditions
  targetPoints: 10;
  maxRounds: 8;
  tiebreaker: 'sudden_death';
  
  // Point Values
  scoring: {
    liarEliminatedCorrect: 3;    // Citizens who voted correctly
    liarEliminatedWrong: 0;      // Citizens who voted incorrectly
    innocentEliminatedGuilty: -1; // Citizens who voted to eliminate innocent
    innocentEliminatedInnocent: 1; // Citizens who voted to save innocent
    liarSurvived: 6;             // Liar survived elimination vote
    liarSurvivedOthers: 2;       // Other liars when one liar survives
    topicGuessCorrect: 3;        // Liar guesses topic correctly
    topicGuessWrong: 0;          // Liar guesses incorrectly
  };
  
  // Dynamic Adjustments
  balanceModifiers: {
    playerCount: {
      4: { liarBonus: 1.2, citizenPenalty: 0.9 };
      5: { liarBonus: 1.1, citizenPenalty: 0.95 };
      6: { liarBonus: 1.0, citizenPenalty: 1.0 };
      7: { liarBonus: 0.9, citizenPenalty: 1.05 };
      8: { liarBonus: 0.8, citizenPenalty: 1.1 };
    };
    
    roundProgression: {
      early: { multiplier: 0.8 }; // Rounds 1-2
      middle: { multiplier: 1.0 }; // Rounds 3-5  
      late: { multiplier: 1.2 };   // Rounds 6+
    };
  };
}
```

## 4. Player Interaction Patterns

### 4.1 Role-Based UI Specifications

```typescript
interface RoleBasedUIConfig {
  [PlayerRole.CITIZEN]: {
    // Information Display
    showTopic: true;
    showSpecificWord: true;
    showOtherHints: true;
    
    // Interaction Capabilities
    canGiveHints: true;
    canVoteForLiar: true;
    canAskDefenseQuestions: true;
    canVoteForSurvival: true;
    
    // UI Elements
    hintInputPlaceholder: "주제와 관련된 힌트를 주세요";
    hintGuidance: "정답 단어를 직접 포함하지 마세요";
    votingGuidance: "가장 의심스러운 플레이어를 선택하세요";
    
    // Visual Indicators
    roleIndicator: "시민";
    roleColor: "#4CAF50";
    roleIcon: "👤";
  };
  
  [PlayerRole.LIAR]: {
    // Information Display
    showTopic: true;
    showSpecificWord: false;
    showOtherHints: true;
    
    // Interaction Capabilities  
    canGiveHints: true;
    canVoteForLiar: true;
    canDefendSelf: true;
    canGuessWord: true;
    
    // UI Elements
    hintInputPlaceholder: "다른 플레이어의 힌트를 보고 추측해서 힌트를 주세요";
    hintGuidance: "자연스럽게 섞여들도록 힌트를 주세요";
    votingGuidance: "의심을 다른 사람에게 돌리세요";
    wordGuessPlaceholder: "정답이라고 생각하는 단어를 입력하세요";
    
    // Visual Indicators
    roleIndicator: "라이어";
    roleColor: "#F44336";
    roleIcon: "🎭";
    
    // Special Features
    showHintAnalysis: true; // Show what hints might mean
    showVotingStrategy: true; // Suggest voting strategies
  };
}
```

### 4.2 Interactive Element Specifications

```typescript
interface InteractionElements {
  // Hint Submission
  hintInput: {
    maxLength: 20;
    realTimeValidation: true;
    bannedWords: string[]; // Dynamic based on topic
    submitButton: "힌트 제출";
    editableUntilSubmitted: true;
    showCharacterCount: true;
    autoFocus: true; // When it's player's turn
  };
  
  // Voting Interface
  playerVoting: {
    layout: 'grid' | 'list';
    showPlayerAvatars: true;
    showVoteConfidence: false; // Hide from other players
    requireConfirmation: true;
    allowVoteChange: true;
    showVoteCount: true; // Total votes cast
    visualFeedback: 'highlight' | 'animation';
  };
  
  // Defense Interface
  defensePanel: {
    maxCharacters: 200;
    timeIndicator: true;
    submitButton: "변론 제출";
    autoSave: true; // Save as typing
    showQuestionQueue: true; // Questions from other players
  };
  
  // Chat System
  chatInterface: {
    maxMessageLength: 100;
    showTypingIndicators: true;
    messageHistory: 50;
    autoScroll: true;
    timestampFormat: 'HH:mm';
    profanityFilter: true;
    roleBasedColors: true;
  };
  
  // Topic Guessing (Liar Only)
  topicGuess: {
    inputType: 'text';
    maxLength: 50;
    submitButton: "정답 제출";
    showPreviousHints: true;
    allowOneGuess: true;
    confirmationRequired: true;
  };
}
```

## 5. Data Flow & State Updates

### 5.1 State Update Patterns

```typescript
interface StateUpdateFlow {
  // Phase Transitions
  phaseChange: {
    trigger: 'server' | 'timer' | 'action_complete';
    preUpdate: (newPhase: GamePhase) => void;
    updateState: (phaseData: any) => void;
    postUpdate: (oldPhase: GamePhase, newPhase: GamePhase) => void;
    uiUpdate: (phase: GamePhase) => void;
  };
  
  // Player Actions
  playerAction: {
    validate: (action: PlayerAction) => boolean;
    optimisticUpdate: (action: PlayerAction) => void;
    sendToServer: (action: PlayerAction) => Promise<void>;
    handleResponse: (response: ServerResponse) => void;
    handleError: (error: Error) => void;
    rollback: (action: PlayerAction) => void;
  };
  
  // Score Updates
  scoreUpdate: {
    calculateRoundScore: (votes: Vote[], elimination: Elimination) => ScoreChange[];
    updatePlayerScores: (changes: ScoreChange[]) => void;
    checkVictoryCondition: (scores: PlayerScore[]) => string | null;
    animateScoreChanges: (changes: ScoreChange[]) => void;
    updateLeaderboard: (scores: PlayerScore[]) => void;
  };
  
  // Timer Management
  timerUpdate: {
    serverSync: (serverTime: number, phase: GamePhase) => void;
    clientTick: () => void;
    handleTimeout: (phase: GamePhase) => void;
    showWarnings: (timeRemaining: number) => void;
    pauseResume: (paused: boolean) => void;
  };
}
```

### 5.2 Error Handling & Recovery

```typescript
interface ErrorHandlingStrategy {
  // Connection Errors
  connectionError: {
    autoReconnect: true;
    maxAttempts: 5;
    backoffStrategy: 'exponential';
    showUserNotification: true;
    gracefulDegradation: {
      allowOfflineMode: false;
      cacheLastState: true;
      showConnectionStatus: true;
    };
  };
  
  // Game State Errors
  stateDesync: {
    detection: 'checksum' | 'heartbeat';
    autoResync: true;
    fallbackToServerState: true;
    notifyUser: true;
  };
  
  // User Input Errors
  inputValidation: {
    clientSideValidation: true;
    serverSideConfirmation: true;
    showInlineErrors: true;
    allowRetry: true;
    maxRetryAttempts: 3;
  };
  
  // Critical Errors
  criticalError: {
    showErrorBoundary: true;
    allowGameRestart: true;
    preservePlayerProgress: true;
    reportToServer: true;
    fallbackToLobby: true;
  };
}
```

## 6. Performance Requirements

### 6.1 Rendering Optimization

```typescript
interface PerformanceRequirements {
  // Component Updates
  rendering: {
    maxUpdateFrequency: 60; // FPS
    batchUpdates: true;
    lazyLoading: true;
    virtualScrolling: false; // Not needed for 8 players max
    memoization: 'aggressive';
  };
  
  // Memory Management
  memory: {
    maxChatMessages: 50;
    maxGameHistory: 10;
    cacheSize: '10MB';
    garbageCollection: 'automatic';
  };
  
  // Network Optimization
  network: {
    messageCompression: true;
    batchNonCriticalUpdates: true;
    priorityQueuing: true;
    maxLatency: 100; // ms
    maxJitter: 50; // ms
  };
  
  // UI Responsiveness
  responsiveness: {
    maxInputLag: 50; // ms
    animationFramerate: 60; // FPS
    transitionDuration: 300; // ms
    debounceTyping: 500; // ms
  };
}
```

## 7. Accessibility & Usability

### 7.1 Accessibility Requirements

```typescript
interface AccessibilityConfig {
  // Visual Accessibility
  visual: {
    colorBlindSupport: true;
    highContrastMode: true;
    fontSize: 'scalable';
    iconAlternatives: true;
  };
  
  // Audio Accessibility
  audio: {
    soundEffects: 'optional';
    voiceOver: false; // Not required for this game type
    audioDescriptions: false;
  };
  
  // Motor Accessibility
  motor: {
    keyboardNavigation: true;
    customKeyBindings: true;
    clickTargetSize: 44; // pixels minimum
    gestureAlternatives: true;
  };
  
  // Cognitive Accessibility
  cognitive: {
    simpleLanguage: true;
    clearInstructions: true;
    consistentLayout: true;
    errorPrevention: true;
    timeExtensions: 'host_controlled';
  };
}
```

## 8. Implementation Priority Matrix

### 8.1 Critical Path Features (Week 1-2)

1. **Core Game Flow State Machine**
   - Phase transitions (SPEECH → VOTING → DEFENDING → SURVIVAL_VOTE → GAME_OVER)
   - Timer synchronization with server
   - Basic player state management

2. **Essential WebSocket Integration**
   - Real-time phase changes
   - Player join/leave handling
   - Basic error recovery

3. **Minimum Viable Gameplay**
   - Hint submission interface
   - Simple voting interface
   - Score display

### 8.2 Secondary Features (Week 3-4)

1. **Enhanced User Experience**
   - Defense phase implementation
   - Topic guessing for liars
   - Animated score updates
   - Chat functionality

2. **Polish & Balance**
   - Role-based UI differences
   - Timer warnings and visual feedback
   - Improved error messages
   - Performance optimizations

### 8.3 Advanced Features (Week 5+)

1. **Social Features**
   - End game statistics
   - Play again functionality
   - Achievement system
   - Player history tracking

## 9. Testing Requirements

### 9.1 Core Functionality Tests

```typescript
interface TestingRequirements {
  // Unit Tests
  unitTests: {
    stateManagement: 'comprehensive';
    scoreCalculation: 'exhaustive';
    phaseTransitions: 'complete';
    inputValidation: 'thorough';
    coverage: 90; // percent
  };
  
  // Integration Tests
  integrationTests: {
    websocketFlow: 'end-to-end';
    timerSynchronization: 'stress_test';
    multiPlayerScenarios: 'complete';
    errorRecovery: 'comprehensive';
  };
  
  // Performance Tests
  performanceTests: {
    renderingBenchmarks: true;
    memoryLeakDetection: true;
    networkLatencySimulation: true;
    concurrent_users: 8; // Max per game
  };
  
  // User Experience Tests
  uxTests: {
    accessibilityAudit: true;
    usabilityTesting: true;
    crossBrowserCompatibility: true;
    mobileResponsiveness: true;
  };
}
```

## Conclusion

This implementation requirements document provides the technical foundation for developing a sophisticated Liar Game frontend that delivers engaging social deduction gameplay. The specifications ensure:

- **Robust Real-time Gameplay**: WebSocket-based synchronization with error recovery
- **Balanced Game Mechanics**: Carefully tuned scoring and timing systems
- **Excellent User Experience**: Role-based interfaces with accessibility support
- **Scalable Architecture**: Clean state management and performance optimization
- **Comprehensive Testing**: Quality assurance across all game aspects

The modular design allows for iterative development while maintaining code quality and user engagement throughout the implementation process.