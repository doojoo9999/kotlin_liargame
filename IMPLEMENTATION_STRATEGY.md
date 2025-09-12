# Detailed Frontend Implementation Strategy

## 2. State Management with Zustand

### Enhanced Game Store Structure

```typescript
// Enhanced game store with comprehensive state management
interface EnhancedGameState extends GameState {
  // UI State
  ui: {
    activeModal: string | null;
    sidebarCollapsed: boolean;
    chatVisible: boolean;
    notificationsEnabled: boolean;
    theme: 'light' | 'dark' | 'system';
  };
  
  // Performance State
  performance: {
    connectionLatency: number;
    lastMessageTimestamp: number;
    missedHeartbeats: number;
  };
  
  // Game History
  history: {
    actions: GameAction[];
    phases: PhaseTransition[];
    votes: VoteHistory[];
    chatHistory: ChatMessage[];
  };
  
  // Enhanced Actions
  actions: {
    // UI Actions
    toggleSidebar: () => void;
    openModal: (modal: string) => void;
    closeModal: () => void;
    
    // Game Actions with Optimistic Updates
    submitHintOptimistic: (hint: string) => Promise<void>;
    votePlayerOptimistic: (playerId: string) => Promise<void>;
    
    // History Management
    addToHistory: (action: GameAction) => void;
    clearHistory: () => void;
    
    // Performance Monitoring
    updateLatency: (latency: number) => void;
  };
}
```

### Store Implementation Pattern

```typescript
// stores/enhancedGameStore.ts
export const useEnhancedGameStore = create<EnhancedGameState>()(
  devtools(
    persist(
      (set, get) => ({
        // ... existing game state
        
        // Enhanced UI state
        ui: {
          activeModal: null,
          sidebarCollapsed: false,
          chatVisible: true,
          notificationsEnabled: true,
          theme: 'system' as const,
        },
        
        // Optimistic updates for better UX
        submitHintOptimistic: async (hint: string) => {
          const tempId = `temp-${Date.now()}`;
          const currentPlayer = get().currentPlayer;
          
          // Optimistic update
          set(state => ({
            hints: [...state.hints, {
              id: tempId,
              playerId: currentPlayer?.id || '',
              playerName: currentPlayer?.nickname || '',
              hint,
              timestamp: Date.now(),
              pending: true
            }]
          }));
          
          try {
            await gameApi.submitHint(hint);
            // Replace optimistic update with real data
            set(state => ({
              hints: state.hints.map(h => 
                h.id === tempId 
                  ? { ...h, pending: false }
                  : h
              )
            }));
          } catch (error) {
            // Rollback optimistic update
            set(state => ({
              hints: state.hints.filter(h => h.id !== tempId)
            }));
            throw error;
          }
        },
        
        // Performance monitoring
        updateLatency: (latency: number) => {
          set(state => ({
            performance: {
              ...state.performance,
              connectionLatency: latency,
              lastMessageTimestamp: Date.now()
            }
          }));
        }
      }),
      {
        name: 'enhanced-game-store',
        partialize: (state) => ({
          // Only persist essential UI preferences
          ui: {
            theme: state.ui.theme,
            notificationsEnabled: state.ui.notificationsEnabled
          }
        })
      }
    ),
    { name: 'enhanced-game-store' }
  )
);
```

## 3. API Integration with React Query

### Game API Service Layer

```typescript
// services/gameApiService.ts
export class GameApiService {
  private client = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: 10000,
  });

  // Hint submission with retry logic
  async submitHint(gameNumber: number, hint: string): Promise<HintSubmissionResponse> {
    return this.withRetry(async () => {
      const response = await this.client.post(`/games/${gameNumber}/hints`, {
        hint,
        timestamp: Date.now()
      });
      return response.data;
    });
  }

  // Vote submission with optimistic updates
  async submitVote(gameNumber: number, targetPlayerId: string): Promise<VoteResponse> {
    return this.withRetry(async () => {
      const response = await this.client.post(`/games/${gameNumber}/votes`, {
        targetPlayerId,
        timestamp: Date.now()
      });
      return response.data;
    });
  }

  // Generic retry mechanism
  private async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (i === maxRetries) break;
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
    
    throw lastError!;
  }
}

export const gameApiService = new GameApiService();
```

### React Query Integration

```typescript
// hooks/useGameQueries.ts
export const useGameQueries = (gameNumber: number) => {
  // Game state query with real-time updates
  const gameStateQuery = useQuery({
    queryKey: ['game', gameNumber, 'state'],
    queryFn: () => gameApiService.getGameState(gameNumber),
    refetchInterval: 5000, // Fallback polling
    staleTime: 2000,
  });

  // Players query
  const playersQuery = useQuery({
    queryKey: ['game', gameNumber, 'players'],
    queryFn: () => gameApiService.getPlayers(gameNumber),
    refetchInterval: 10000,
  });

  // Mutations with optimistic updates
  const submitHintMutation = useMutation({
    mutationFn: (hint: string) => gameApiService.submitHint(gameNumber, hint),
    onMutate: async (hint) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['game', gameNumber, 'hints']);
      
      // Snapshot current state
      const previousHints = queryClient.getQueryData(['game', gameNumber, 'hints']);
      
      // Optimistically update
      queryClient.setQueryData(['game', gameNumber, 'hints'], (old: any) => [
        ...old,
        {
          id: `temp-${Date.now()}`,
          playerId: 'current',
          hint,
          timestamp: Date.now(),
          pending: true
        }
      ]);
      
      return { previousHints };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousHints) {
        queryClient.setQueryData(['game', gameNumber, 'hints'], context.previousHints);
      }
    },
    onSuccess: () => {
      // Refetch to get server state
      queryClient.invalidateQueries(['game', gameNumber, 'hints']);
    }
  });

  return {
    gameState: gameStateQuery.data,
    players: playersQuery.data,
    isLoading: gameStateQuery.isLoading || playersQuery.isLoading,
    error: gameStateQuery.error || playersQuery.error,
    submitHint: submitHintMutation.mutate,
    isSubmittingHint: submitHintMutation.isPending
  };
};
```

## 4. WebSocket Integration Enhancement

### Resilient WebSocket Hook

```typescript
// hooks/useResilientWebSocket.ts
export const useResilientWebSocket = (gameNumber: number) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [messageQueue, setMessageQueue] = useState<WebSocketMessage[]>([]);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  
  const wsRef = useRef<GameWebSocketClient | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Connection management with exponential backoff
  const connect = useCallback(async () => {
    if (wsRef.current?.isConnected()) {
      return;
    }
    
    try {
      setConnectionState('connecting');
      
      const ws = new GameWebSocketClient({
        url: API_CONFIG.WS_URL,
        reconnectAttempts: 10,
        reconnectDelay: Math.min(1000 * Math.pow(2, reconnectAttempt), 30000),
      });
      
      // Connection event handlers
      ws.on('CONNECT', () => {
        setConnectionState('connected');
        setReconnectAttempt(0);
        
        // Send queued messages
        messageQueue.forEach(message => {
          ws.send(message.type, message.data);
        });
        setMessageQueue([]);
      });
      
      ws.on('DISCONNECT', ({ code, reason }) => {
        setConnectionState('disconnected');
        
        // Auto-reconnect unless explicitly closed
        if (code !== 1000) {
          scheduleReconnect();
        }
      });
      
      ws.on('ERROR', ({ error }) => {
        setConnectionState('error');
        console.error('WebSocket error:', error);
        scheduleReconnect();
      });
      
      // Game event handlers
      ws.on('GAME_STATE_UPDATE', handleGameStateUpdate);
      ws.on('PLAYER_JOINED', handlePlayerJoined);
      ws.on('PHASE_CHANGE', handlePhaseChange);
      ws.on('CHAT_MESSAGE', handleChatMessage);
      
      await ws.connect(gameNumber);
      wsRef.current = ws;
      
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      setConnectionState('error');
      scheduleReconnect();
    }
  }, [gameNumber, reconnectAttempt, messageQueue]);
  
  // Reconnection scheduling
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (reconnectAttempt < 10) {
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempt), 30000);
      
      reconnectTimeoutRef.current = setTimeout(() => {
        setReconnectAttempt(prev => prev + 1);
        connect();
      }, delay);
    }
  }, [reconnectAttempt, connect]);
  
  // Message sending with queueing
  const sendMessage = useCallback(<T>(type: keyof WebSocketEvents, data: T) => {
    if (wsRef.current?.isConnected()) {
      return wsRef.current.send(type, data);
    } else {
      // Queue message for when connection is restored
      setMessageQueue(prev => [...prev, { type, data, timestamp: Date.now() }]);
      return false;
    }
  }, []);
  
  // Event handlers
  const handleGameStateUpdate = useCallback((data: GameStateUpdate) => {
    const gameStore = useEnhancedGameStore.getState();
    gameStore.handleGameEvent({
      type: 'GAME_STATE_UPDATED',
      payload: data
    });
  }, []);
  
  const handlePhaseChange = useCallback((data: { phase: GamePhase; timeRemaining?: number }) => {
    const gameStore = useEnhancedGameStore.getState();
    gameStore.actions.addToHistory({
      type: 'PHASE_CHANGE',
      phase: data.phase,
      timestamp: Date.now()
    });
  }, []);
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.disconnect();
      }
    };
  }, []);
  
  // Auto-connect on mount
  useEffect(() => {
    connect();
  }, [connect]);
  
  return {
    connectionState,
    reconnectAttempt,
    sendMessage,
    connect,
    disconnect: () => wsRef.current?.disconnect(),
    isConnected: connectionState === 'connected'
  };
};
```

## 5. Moderator Commentary System

### Intelligent Commentary Component

```typescript
// components/game/ModeratorCommentary.tsx
interface ModeratorCommentaryProps {
  gamePhase: GamePhase;
  currentTopic?: string;
  currentWord?: string;
  timeRemaining: number;
  isLiar: boolean;
  playerCount: number;
  currentTurnPlayer?: string;
  suspectedPlayer?: string;
  gameHistory?: GameAction[];
}

export const ModeratorCommentary: React.FC<ModeratorCommentaryProps> = ({
  gamePhase,
  currentTopic,
  currentWord,
  timeRemaining,
  isLiar,
  playerCount,
  currentTurnPlayer,
  suspectedPlayer,
  gameHistory = []
}) => {
  // Dynamic commentary based on game state
  const getCommentary = useMemo(() => {
    const context = {
      phase: gamePhase,
      timeLeft: timeRemaining,
      isLiar,
      playerCount,
      currentPlayer: currentTurnPlayer,
      suspected: suspectedPlayer,
      history: gameHistory
    };
    
    return generateContextualCommentary(context);
  }, [gamePhase, timeRemaining, isLiar, playerCount, currentTurnPlayer, suspectedPlayer, gameHistory]);
  
  // Commentary animation state
  const [displayText, setDisplayText] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Typewriter effect for dramatic delivery
  useEffect(() => {
    if (getCommentary.text !== displayText) {
      setIsAnimating(true);
      setDisplayText('');
      
      const words = getCommentary.text.split(' ');
      let currentIndex = 0;
      
      const typeInterval = setInterval(() => {
        if (currentIndex < words.length) {
          setDisplayText(prev => prev + (prev ? ' ' : '') + words[currentIndex]);
          currentIndex++;
        } else {
          clearInterval(typeInterval);
          setIsAnimating(false);
        }
      }, 100);
      
      return () => clearInterval(typeInterval);
    }
  }, [getCommentary.text]);
  
  // Urgency indicator based on time remaining
  const urgencyLevel = useMemo(() => {
    if (timeRemaining > 60) return 'calm';
    if (timeRemaining > 30) return 'moderate';
    if (timeRemaining > 10) return 'urgent';
    return 'critical';
  }, [timeRemaining]);
  
  return (
    <Card className={cn(
      "border-2 transition-all duration-500",
      urgencyLevel === 'calm' && "border-blue-200 bg-blue-50",
      urgencyLevel === 'moderate' && "border-yellow-200 bg-yellow-50",
      urgencyLevel === 'urgent' && "border-orange-200 bg-orange-50",
      urgencyLevel === 'critical' && "border-red-200 bg-red-50 animate-pulse"
    )}>
      <CardContent className="pt-6">
        <div className="flex items-start space-x-4">
          <div className={cn(
            "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center",
            urgencyLevel === 'calm' && "bg-blue-100",
            urgencyLevel === 'moderate' && "bg-yellow-100",
            urgencyLevel === 'urgent' && "bg-orange-100",
            urgencyLevel === 'critical' && "bg-red-100"
          )}>
            <MessageCircle className={cn(
              "w-6 h-6",
              urgencyLevel === 'calm' && "text-blue-600",
              urgencyLevel === 'moderate' && "text-yellow-600",
              urgencyLevel === 'urgent' && "text-orange-600",
              urgencyLevel === 'critical' && "text-red-600"
            )} />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">Moderator</h3>
              {timeRemaining > 0 && (
                <div className={cn(
                  "flex items-center space-x-1 text-sm",
                  urgencyLevel === 'calm' && "text-blue-600",
                  urgencyLevel === 'moderate' && "text-yellow-600",
                  urgencyLevel === 'urgent' && "text-orange-600",
                  urgencyLevel === 'critical' && "text-red-600 font-bold"
                )}>
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(timeRemaining)}</span>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <p className="text-gray-700 leading-relaxed">
                {displayText}
                {isAnimating && <span className="animate-pulse">|</span>}
              </p>
              
              {getCommentary.actions.length > 0 && (
                <div className="bg-white bg-opacity-50 rounded-lg p-3">
                  <h4 className="font-medium text-sm text-gray-600 mb-2">
                    What you can do:
                  </h4>
                  <ul className="space-y-1">
                    {getCommentary.actions.map((action, index) => (
                      <li key={index} className="flex items-center space-x-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-current rounded-full opacity-60" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {getCommentary.hint && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border-l-4 border-blue-400">
                  <div className="flex items-start space-x-2">
                    <Lightbulb className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-700 font-medium">
                      <strong>Tip:</strong> {getCommentary.hint}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Commentary generation logic
function generateContextualCommentary(context: CommentaryContext): Commentary {
  const { phase, timeLeft, isLiar, playerCount, currentPlayer, suspected, history } = context;
  
  switch (phase) {
    case 'WAITING_FOR_PLAYERS':
      return {
        text: `Welcome to Liar Game! We're waiting for ${Math.max(3 - playerCount, 0)} more players to join. Once everyone's ready, I'll explain the rules and assign roles.`,
        actions: ['Wait for more players to join', 'Review the game rules'],
        hint: 'Make sure you understand the rules before starting - it will give you a strategic advantage!'
      };
      
    case 'SPEECH':
      if (isLiar) {
        return {
          text: `You are the liar! You don't know the secret word, but you must blend in. Listen carefully to others' hints and try to figure out what the word might be. Give a hint that sounds plausible but doesn't reveal that you don't know the word.`,
          actions: ['Listen to other players\' hints', 'Give a vague but believable hint', 'Don\'t ask obvious questions'],
          hint: timeLeft < 30 
            ? 'Time is running out! Give your hint now, even if it\'s general.'
            : 'Keep your hint vague and try to mirror the style of other hints you\'ve heard.'
        };
      } else {
        return {
          text: `The topic is "${context.currentTopic}" and the secret word is revealed to you. Give a hint that helps other citizens identify the liar, but don't make it too obvious or the liar might figure out the word!`,
          actions: ['Give a specific but not obvious hint', 'Think about what the liar might say', 'Help other citizens without helping the liar'],
          hint: timeLeft < 30
            ? 'Quick! Give a hint that connects to the word without saying it directly.'
            : 'Think strategically - your hint should help citizens but confuse the liar.'
        };
      }
      
    case 'VOTING_FOR_LIAR':
      return {
        text: `Time to vote! Look for hints that seemed vague, off-topic, or suspiciously general. The liar had to guess what hints to give without knowing the secret word. Who do you think was struggling the most?`,
        actions: ['Analyze each player\'s hint', 'Vote for the most suspicious player', 'Consider who seemed confused'],
        hint: 'Pay attention to timing too - did someone hesitate longer than usual?'
      };
      
    case 'DEFENDING':
      if (suspected) {
        return {
          text: `${suspected} is defending themselves! ${isLiar ? 'This is your chance to convince everyone you\'re innocent' : 'Listen carefully to spot any lies or contradictions'}. The defense can change everything!`,
          actions: isLiar 
            ? ['Defend yourself convincingly', 'Point out why others are more suspicious', 'Stay calm and confident']
            : ['Listen for inconsistencies', 'Prepare for the final vote', 'Consider if you want to change your mind'],
          hint: isLiar 
            ? 'Be specific about your thought process when giving your hint - this shows you knew the word!'
            : 'Does their explanation make sense? Are they being too detailed or too vague?'
        };
      } else {
        return {
          text: 'Someone else is under suspicion. Listen to their defense carefully - are they convincing? Sometimes the most confident defense comes from someone who knows they\'re innocent.',
          actions: ['Listen carefully to the defense', 'Prepare for final voting', 'Reconsider your suspicions'],
          hint: 'A good defense will explain their reasoning clearly and point out why others might be more suspicious.'
        };
      }
      
    case 'VOTING_FOR_SURVIVAL':
      return {
        text: `Final vote time! Based on the defense, do you think ${suspected} is the liar? Vote to eliminate them, or vote to let them survive. Remember: eliminating an innocent citizen helps the liar win!`,
        actions: ['Make your final decision', 'Consider the defense you just heard', 'Vote carefully - this could end the game'],
        hint: 'If you\'re still not sure, think about who gave the most suspicious hint originally.'
      };
      
    case 'GUESSING_WORD':
      if (isLiar) {
        return {
          text: `You survived! Now comes your final challenge - guess the secret word. You've heard everyone's hints, so piece them together. One correct guess and you win the entire game!`,
          actions: ['Think about all the hints you heard', 'Look for common themes', 'Make your best guess'],
          hint: timeLeft < 15 
            ? 'Time is almost up! Make your best guess now!'
            : 'Consider what all the hints had in common - that\'s probably related to the secret word.'
        };
      } else {
        return {
          text: `The suspected liar survived the vote! Now they get one chance to guess the secret word. If they guess correctly, they win. Cross your fingers they get it wrong!`,
          actions: ['Watch and wait', 'Hope they guess incorrectly', 'Prepare for the results'],
          hint: 'There\'s nothing you can do now except wait and see if your hints were misleading enough!'
        };
      }
      
    default:
      return {
        text: 'Welcome to Liar Game! Get ready for a battle of wits, deception, and deduction.',
        actions: ['Pay attention to the rules', 'Stay alert', 'Trust no one completely'],
        hint: 'Remember: in this game, anyone could be lying!'
      };
  }
}

interface Commentary {
  text: string;
  actions: string[];
  hint?: string;
}

interface CommentaryContext {
  phase: GamePhase;
  timeLeft: number;
  isLiar: boolean;
  playerCount: number;
  currentPlayer?: string;
  suspected?: string;
  history: GameAction[];
  currentTopic?: string;
}
```

This implementation provides a comprehensive, intelligent moderator system that guides players through every phase of the game with contextual advice, strategic tips, and clear action items.