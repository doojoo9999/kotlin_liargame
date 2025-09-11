# ⚡ State Management & Real-time WebSocket Integration

## Overview
**Priority**: 4 (After Component Development)  
**Dependencies**: All previous prompts completed  
**Impact**: Real-time multiplayer functionality  
**Estimated Time**: 14-18 hours

## Architecture Overview
Based on IMPLEMENTATION_STRATEGY.md and existing WebSocket integration:

```
State Management Flow:
Frontend (Zustand) ↔ WebSocket (STOMP) ↔ Kotlin Backend (Spring Boot)
```

## AI Agent Prompts

### Prompt 1: Enhanced Zustand Store Architecture
```
**Task**: Build comprehensive state management system with Zustand for multiplayer game

**Context**:
- React 19 + TypeScript with Zustand for state management
- Real-time synchronization with Kotlin backend via WebSocket
- Optimistic updates for better user experience
- State persistence for browser refresh scenarios
- Multi-store architecture for different concerns

**Store Structure Design**:

**1. GameStore (Core game state)**
```typescript
interface GameStore {
  // Core game data
  gameId: string | null;
  phase: GamePhase;
  currentRound: number;
  totalRounds: number;
  timeRemaining: number;
  currentPlayer?: string;
  
  // Player data
  players: Player[];
  currentUserId: string;
  currentUserRole?: PlayerRole;
  
  // Game content
  topic?: string;
  secretWord?: string; // Only for citizens
  hints: Hint[];
  votes: Vote[];
  accusedPlayer?: string;
  
  // Game results
  scores: Record<string, number>;
  roundResults?: RoundResult;
  gameResults?: GameResult;
  
  // Actions
  joinGame: (gameId: string, userId: string) => Promise<void>;
  leaveGame: () => void;
  submitHint: (hint: string) => Promise<void>;
  castVote: (targetId: string, voteType: VoteType) => Promise<void>;
  submitDefense: (defense: string) => Promise<void>;
  guessWord: (guess: string) => Promise<void>;
  
  // Internal state management
  updateGameState: (state: Partial<GameState>) => void;
  resetGame: () => void;
}
```

**2. UIStore (Interface state)**
```typescript
interface UIStore {
  // Navigation
  currentScreen: Screen;
  previousScreen?: Screen;
  modalStack: Modal[];
  
  // Interaction states
  isLoading: boolean;
  loadingMessage?: string;
  errors: Record<string, string>;
  notifications: Notification[];
  
  // Component states  
  sidebarOpen: boolean;
  chatOpen: boolean;
  settingsOpen: boolean;
  
  // Form states
  formData: Record<string, any>;
  formErrors: Record<string, string>;
  
  // Actions
  navigate: (screen: Screen) => void;
  showModal: (modal: Modal) => void;
  hideModal: () => void;
  setLoading: (loading: boolean, message?: string) => void;
  addError: (key: string, message: string) => void;
  clearErrors: () => void;
  showNotification: (notification: Notification) => void;
}
```

**3. ConnectionStore (WebSocket state)**
```typescript
interface ConnectionStore {
  // Connection state
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  connectionError?: string;
  reconnectAttempts: number;
  lastPingTime: number;
  
  // Message queuing
  messageQueue: OutgoingMessage[];
  pendingMessages: Record<string, PendingMessage>;
  
  // Actions
  connect: (gameId: string, userId: string) => void;
  disconnect: () => void;
  sendMessage: (message: OutgoingMessage) => void;
  retryConnection: () => void;
  
  // Internal
  setConnectionStatus: (status: ConnectionStatus) => void;
  queueMessage: (message: OutgoingMessage) => void;
  processMessageQueue: () => void;
}
```

**Actions Required**:
1. Create multi-store Zustand architecture
2. Implement optimistic updates for user actions
3. Add state persistence with zustand/middleware/persist
4. Create action creators with error handling
5. Add middleware for logging and debugging
6. Implement state hydration for SSR compatibility

**Files to Create**:
- frontend/src/stores/gameStore.ts
- frontend/src/stores/uiStore.ts  
- frontend/src/stores/connectionStore.ts
- frontend/src/stores/middleware/persistence.ts
- frontend/src/stores/middleware/logger.ts
- frontend/src/types/store.ts
- frontend/src/hooks/useGameStore.ts
- frontend/src/hooks/useUIStore.ts

**Acceptance Criteria**:
1. ✅ All stores work together without conflicts
2. ✅ Optimistic updates provide immediate feedback
3. ✅ State persists through browser refresh
4. ✅ Error handling recovers gracefully from failures
5. ✅ TypeScript types are comprehensive and accurate
6. ✅ Performance remains optimal with complex state
```

### Prompt 2: WebSocket Service Integration
```
**Task**: Implement robust WebSocket service with STOMP protocol for real-time communication

**Context**:
- Integration with existing Kotlin Spring Boot backend
- STOMP protocol for structured messaging
- Automatic reconnection with exponential backoff
- Message queuing during disconnection
- Performance monitoring and heartbeat system

**WebSocket Architecture**:
```typescript
class GameWebSocketService {
  private stompClient: CompatClient;
  private connectionState: ConnectionState;
  private messageQueue: OutgoingMessage[];
  private reconnectStrategy: ReconnectStrategy;
  private heartbeatMonitor: HeartbeatMonitor;
  
  // Connection management
  connect(gameId: string, userId: string, authToken: string): Promise<void>;
  disconnect(): void;
  reconnect(): Promise<void>;
  
  // Message handling
  sendMessage(destination: string, body: any): void;
  subscribe(destination: string, callback: MessageCallback): Subscription;
  unsubscribe(subscription: Subscription): void;
  
  // Connection monitoring
  startHeartbeat(): void;
  stopHeartbeat(): void;
  checkConnectionHealth(): boolean;
  
  // Queue management
  queueMessage(message: OutgoingMessage): void;
  processQueue(): void;
  clearQueue(): void;
}
```

**WebSocket Endpoints (Backend Integration)**:
```typescript
// Subscription endpoints
const SOCKET_ENDPOINTS = {
  // Game state updates
  gameState: '/topic/game/{gameId}/state',
  
  // Phase transitions  
  phaseChange: '/topic/game/{gameId}/phase',
  
  // Player actions
  playerAction: '/topic/game/{gameId}/action',
  
  // Timer updates
  timer: '/topic/game/{gameId}/timer',
  
  // Chat messages
  chat: '/topic/game/{gameId}/chat',
  
  // Error notifications
  errors: '/user/queue/errors'
};

// Send endpoints
const SEND_ENDPOINTS = {
  // Game actions
  joinGame: '/app/game/{gameId}/join',
  leaveGame: '/app/game/{gameId}/leave',
  submitHint: '/app/game/{gameId}/hint',
  castVote: '/app/game/{gameId}/vote', 
  submitDefense: '/app/game/{gameId}/defense',
  guessWord: '/app/game/{gameId}/guess',
  
  // Chat
  sendMessage: '/app/game/{gameId}/chat'
};
```

**Message Types and Handlers**:
```typescript
// Incoming message types
interface IncomingMessage {
  type: MessageType;
  gameId: string;
  userId?: string;
  timestamp: number;
  payload: any;
}

// Message handlers
interface MessageHandlers {
  GAME_STATE_UPDATE: (payload: GameStateUpdate) => void;
  PHASE_CHANGE: (payload: PhaseChange) => void;
  PLAYER_JOINED: (payload: PlayerJoined) => void;
  PLAYER_LEFT: (payload: PlayerLeft) => void;
  HINT_SUBMITTED: (payload: HintSubmitted) => void;
  VOTE_CAST: (payload: VoteCast) => void;
  DEFENSE_SUBMITTED: (payload: DefenseSubmitted) => void;
  WORD_GUESSED: (payload: WordGuessed) => void;
  ROUND_ENDED: (payload: RoundEnded) => void;
  GAME_ENDED: (payload: GameEnded) => void;
  ERROR: (payload: ErrorMessage) => void;
}
```

**Actions Required**:
1. Implement STOMP client configuration
2. Create message routing and handling system  
3. Build reconnection strategy with exponential backoff
4. Add message queuing for offline scenarios
5. Implement heartbeat monitoring system
6. Create comprehensive error handling

**Files to Create**:
- frontend/src/services/websocketService.ts
- frontend/src/services/messageHandlers.ts
- frontend/src/services/reconnectionStrategy.ts
- frontend/src/types/websocket.ts
- frontend/src/utils/socketEndpoints.ts
- frontend/src/hooks/useWebSocket.ts
- frontend/src/hooks/useWebSocketConnection.ts

**Acceptance Criteria**:
1. ✅ WebSocket connects reliably to backend
2. ✅ Messages are sent and received correctly
3. ✅ Reconnection works after network issues
4. ✅ Message queue prevents data loss during disconnection
5. ✅ Error handling provides clear feedback to users
6. ✅ Performance monitoring tracks connection health
```

### Prompt 3: Real-time State Synchronization System
```
**Task**: Create seamless real-time synchronization between frontend state and backend

**Context**:
- Bi-directional state synchronization
- Conflict resolution for concurrent actions
- Optimistic updates with rollback capability
- State merging strategies for complex objects

**Synchronization Strategies**:

**1. Optimistic Updates**
```typescript
interface OptimisticUpdate {
  id: string;
  action: string;
  optimisticState: Partial<GameState>;
  originalState: Partial<GameState>;
  timestamp: number;
  confirmed: boolean;
  rolled_back: boolean;
}

class OptimisticUpdateManager {
  private pendingUpdates: Map<string, OptimisticUpdate>;
  
  // Apply optimistic update
  applyUpdate(action: string, optimisticState: Partial<GameState>): string;
  
  // Confirm update when server responds
  confirmUpdate(updateId: string, serverState: Partial<GameState>): void;
  
  // Rollback update on error
  rollbackUpdate(updateId: string): void;
  
  // Merge server state with pending optimistic updates
  mergeServerState(serverState: GameState): GameState;
}
```

**2. State Conflict Resolution**
```typescript
interface ConflictResolver {
  // Resolve conflicts between local and server state
  resolveConflict(
    localState: GameState,
    serverState: GameState,
    conflictType: ConflictType
  ): GameState;
  
  // Handle concurrent user actions
  handleConcurrentActions(
    localAction: GameAction,
    serverAction: GameAction
  ): Resolution;
  
  // Merge states with priority rules
  mergeStates(states: Partial<GameState>[]): GameState;
}
```

**3. Real-time Event Processing**
```typescript
class EventProcessor {
  // Process incoming WebSocket events
  processIncomingEvent(event: IncomingMessage): void;
  
  // Update local state based on server events
  updateStateFromEvent(event: IncomingMessage): void;
  
  // Handle event ordering and deduplication
  handleEventOrdering(events: IncomingMessage[]): void;
  
  // Process event queue during reconnection
  processEventQueue(): void;
}
```

**4. State Validation and Consistency**
```typescript
interface StateValidator {
  // Validate state consistency
  validateState(state: GameState): ValidationResult;
  
  // Check for invalid state transitions
  validateTransition(
    fromState: GameState,
    toState: GameState
  ): boolean;
  
  // Ensure game rules compliance
  validateGameRules(state: GameState): RuleViolation[];
}
```

**Actions Required**:
1. Implement optimistic update system
2. Create conflict resolution algorithms
3. Build state validation system
4. Add event ordering and deduplication
5. Create state synchronization monitoring
6. Implement recovery mechanisms for state corruption

**Files to Create**:
- frontend/src/services/stateSync.ts
- frontend/src/services/optimisticUpdates.ts
- frontend/src/services/conflictResolver.ts
- frontend/src/services/eventProcessor.ts
- frontend/src/services/stateValidator.ts
- frontend/src/hooks/useStateSync.ts
- frontend/src/utils/stateUtils.ts

**Acceptance Criteria**:
1. ✅ Optimistic updates provide immediate feedback
2. ✅ State conflicts resolve automatically and correctly
3. ✅ State remains consistent across all connected clients
4. ✅ Recovery works after network disconnections
5. ✅ Performance remains smooth with frequent updates
6. ✅ State validation prevents invalid game states
```

### Prompt 4: API Service Layer Integration
```
**Task**: Create comprehensive API service layer with React Query for data fetching

**Context**:
- Integration with Kotlin Spring Boot REST endpoints
- React Query for caching and synchronization
- Error handling and retry strategies
- Authentication and authorization
- Performance optimization with caching

**API Service Architecture**:
```typescript
// API Client Configuration
class APIClient {
  private baseURL: string;
  private authToken: string;
  private retryStrategy: RetryStrategy;
  
  // HTTP methods with error handling
  get<T>(endpoint: string, params?: any): Promise<APIResponse<T>>;
  post<T>(endpoint: string, data: any): Promise<APIResponse<T>>;
  put<T>(endpoint: string, data: any): Promise<APIResponse<T>>;
  delete<T>(endpoint: string): Promise<APIResponse<T>>;
  
  // Authentication
  setAuthToken(token: string): void;
  refreshToken(): Promise<string>;
  
  // Request interceptors
  addRequestInterceptor(interceptor: RequestInterceptor): void;
  addResponseInterceptor(interceptor: ResponseInterceptor): void;
}
```

**Game-Specific API Services**:
```typescript
// Game Management Service
interface GameService {
  createGame(settings: GameSettings): Promise<Game>;
  joinGame(gameId: string): Promise<JoinGameResponse>;
  leaveGame(gameId: string): Promise<void>;
  getGameState(gameId: string): Promise<GameState>;
  updateGameSettings(gameId: string, settings: Partial<GameSettings>): Promise<Game>;
}

// Player Action Service  
interface PlayerActionService {
  submitHint(gameId: string, hint: string): Promise<HintResponse>;
  castVote(gameId: string, targetId: string, voteType: VoteType): Promise<VoteResponse>;
  submitDefense(gameId: string, defense: string): Promise<DefenseResponse>;
  guessWord(gameId: string, guess: string): Promise<GuessResponse>;
}

// Lobby Service
interface LobbyService {
  getActiveGames(): Promise<Game[]>;
  searchGames(query: GameSearchQuery): Promise<Game[]>;
  getGameHistory(userId: string): Promise<GameHistory[]>;
  getUserStats(userId: string): Promise<UserStats>;
}
```

**React Query Integration**:
```typescript
// Query hooks for data fetching
export const useGameState = (gameId: string) => {
  return useQuery({
    queryKey: ['game', gameId],
    queryFn: () => gameService.getGameState(gameId),
    staleTime: 30000, // 30 seconds
    refetchInterval: 5000, // Refetch every 5 seconds
    enabled: !!gameId
  });
};

export const useActiveGames = () => {
  return useQuery({
    queryKey: ['lobby', 'activeGames'],
    queryFn: () => lobbyService.getActiveGames(),
    staleTime: 10000, // 10 seconds
    refetchOnWindowFocus: true
  });
};

// Mutation hooks for actions
export const useSubmitHint = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ gameId, hint }: { gameId: string; hint: string }) =>
      playerActionService.submitHint(gameId, hint),
    onSuccess: (data, variables) => {
      // Update game state optimistically
      queryClient.setQueryData(['game', variables.gameId], (old: GameState) => ({
        ...old,
        hints: [...old.hints, data.hint]
      }));
    },
    onError: (error) => {
      // Handle error and possibly rollback optimistic update
    }
  });
};
```

**Actions Required**:
1. Set up axios or fetch-based API client
2. Configure React Query with optimal settings
3. Implement authentication flow with token refresh
4. Create query and mutation hooks for all endpoints
5. Add error handling and retry strategies
6. Implement optimistic updates with React Query

**Files to Create**:
- frontend/src/services/apiClient.ts
- frontend/src/services/gameService.ts
- frontend/src/services/playerActionService.ts
- frontend/src/services/lobbyService.ts
- frontend/src/hooks/api/useGameQueries.ts
- frontend/src/hooks/api/usePlayerMutations.ts
- frontend/src/hooks/api/useLobbyQueries.ts
- frontend/src/utils/apiUtils.ts

**Acceptance Criteria**:
1. ✅ All API endpoints are properly typed and tested
2. ✅ React Query caching improves performance
3. ✅ Error handling provides clear user feedback
4. ✅ Authentication works seamlessly with token refresh
5. ✅ Optimistic updates enhance perceived performance
6. ✅ Retry strategies handle temporary network issues
```

### Prompt 5: Performance Optimization and Monitoring
```
**Task**: Optimize state management and WebSocket performance for smooth gameplay

**Context**:
- Real-time multiplayer requires consistent 60fps performance
- State updates must be efficient and not cause unnecessary re-renders
- WebSocket messages need throttling and batching
- Memory usage must remain stable during long game sessions

**Performance Optimization Areas**:

**1. State Update Optimization**
```typescript
// Selective updates to prevent unnecessary re-renders
interface StoreSlice<T> {
  subscribe: (selector: (state: T) => any, callback: () => void) => () => void;
  getState: () => T;
  setState: (partial: Partial<T>) => void;
}

// Memoized selectors for complex computations
const createMemoizedSelector = <T, R>(
  selector: (state: T) => R,
  equalityFn?: (a: R, b: R) => boolean
) => {
  // Implementation with memoization
};

// Batched updates for multiple state changes
const batchUpdates = (updates: StateUpdate[]) => {
  // Combine multiple updates into single re-render
};
```

**2. WebSocket Message Optimization**
```typescript
// Message batching for high-frequency updates
class MessageBatcher {
  private batchQueue: OutgoingMessage[];
  private batchTimer: NodeJS.Timeout;
  private batchSize: number = 10;
  private batchInterval: number = 16; // ~60fps
  
  queueMessage(message: OutgoingMessage): void;
  flushBatch(): void;
  processBatch(messages: OutgoingMessage[]): void;
}

// Message throttling for user actions
class MessageThrottler {
  private throttleMap: Map<string, number>;
  private throttleInterval: number = 100; // 100ms minimum between same actions
  
  canSendMessage(messageType: string): boolean;
  recordMessage(messageType: string): void;
}
```

**3. Component Re-render Optimization**
```typescript
// Smart component memoization
const GameComponent = React.memo(({ gameState }: GameComponentProps) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom equality check for props
  return shallowEqual(prevProps.gameState, nextProps.gameState);
});

// Selective state subscriptions
const useGamePhase = () => {
  return useGameStore(state => state.phase, shallow);
};

const usePlayerScore = (playerId: string) => {
  return useGameStore(state => state.scores[playerId]);
};
```

**4. Memory Management**
```typescript
// State cleanup for completed games
interface StateCleanup {
  cleanupExpiredGames(): void;
  cleanupOldMessages(): void;
  cleanupUnusedCache(): void;
  monitorMemoryUsage(): MemoryStats;
}

// WebSocket connection cleanup
interface ConnectionCleanup {
  closeUnusedConnections(): void;
  cleanupSubscriptions(): void;
  clearMessageQueues(): void;
}
```

**5. Performance Monitoring**
```typescript
// Performance metrics collection
interface PerformanceMonitor {
  trackStateUpdateTime(updateType: string, duration: number): void;
  trackWebSocketLatency(messageType: string, latency: number): void;
  trackComponentRenderTime(componentName: string, duration: number): void;
  trackMemoryUsage(): MemoryUsage;
  
  // Performance alerts
  onPerformanceThresholdExceeded(metric: string, value: number): void;
  generatePerformanceReport(): PerformanceReport;
}
```

**Actions Required**:
1. Implement memoized selectors for Zustand stores
2. Add message batching and throttling for WebSocket
3. Optimize component re-renders with React.memo
4. Create memory management and cleanup systems
5. Build performance monitoring and alerting
6. Add profiling tools for development

**Files to Create**:
- frontend/src/services/performanceMonitor.ts
- frontend/src/services/messageBatcher.ts
- frontend/src/utils/stateSelectors.ts
- frontend/src/utils/memoryManager.ts
- frontend/src/hooks/usePerformance.ts
- frontend/src/utils/profiler.ts

**Acceptance Criteria**:
1. ✅ State updates don't cause unnecessary re-renders
2. ✅ WebSocket messages are efficiently batched and throttled
3. ✅ Memory usage remains stable during long sessions
4. ✅ Performance metrics are tracked and alerting works
5. ✅ 60fps performance maintained during active gameplay
6. ✅ Component profiling identifies optimization opportunities
```

## Integration Architecture

### Store Integration Flow
```typescript
// Complete integration example
const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { gameId } = useParams();
  
  // Initialize stores
  const initializeStores = useCallback(async () => {
    if (gameId) {
      await connectionStore.getState().connect(gameId, userId);
      await gameStore.getState().joinGame(gameId, userId);
    }
  }, [gameId]);
  
  useEffect(() => {
    initializeStores();
    return () => {
      connectionStore.getState().disconnect();
      gameStore.getState().leaveGame();
    };
  }, [initializeStores]);
  
  return <div>{children}</div>;
};
```

### WebSocket Message Flow
```typescript
// Message handling integration
const useGameMessageHandlers = () => {
  const updateGameState = useGameStore(state => state.updateGameState);
  const setConnectionStatus = useConnectionStore(state => state.setConnectionStatus);
  
  const messageHandlers: MessageHandlers = {
    GAME_STATE_UPDATE: (payload) => {
      updateGameState(payload.gameState);
    },
    PHASE_CHANGE: (payload) => {
      updateGameState({ phase: payload.newPhase });
    },
    // ... other handlers
  };
  
  return messageHandlers;
};
```

## Success Metrics

### Technical Performance
- [ ] State updates complete within 16ms (60fps target)
- [ ] WebSocket latency under 100ms for 95% of messages
- [ ] Memory usage stable over 2+ hour game sessions
- [ ] Zero memory leaks during stress testing

### Real-time Synchronization
- [ ] State consistency across all connected clients
- [ ] Optimistic updates provide immediate feedback
- [ ] Conflict resolution handles concurrent actions correctly
- [ ] Recovery works seamlessly after network issues

### Code Quality
- [ ] 100% TypeScript coverage with strict mode
- [ ] Comprehensive error handling for all async operations
- [ ] Performance monitoring and alerting systems operational
- [ ] Clean separation of concerns between stores and services

## Next Steps After Completion
1. **Testing Integration**: Unit and integration tests for all state management
2. **Performance Tuning**: Fine-tune based on real-world usage data
3. **Monitoring Setup**: Production monitoring and alerting
4. **Documentation**: Developer documentation for state architecture
5. **Advanced Features**: Implement advanced optimizations and caching

## Dependencies for Next Prompts
- ✅ All previous prompts must be completed and tested
- ✅ WebSocket connection must be stable and performant
- ✅ State management must handle all game scenarios
- ✅ Real-time synchronization must be working correctly