import {create} from 'zustand';
import {devtools, persist} from 'zustand/middleware';
import {gameService} from '../api/gameApi';
import {useAuthStore} from './authStore';
import type {
    CreateGameRequest,
    GameMode,
    GamePhase as BackendGamePhase,
    GameState as BackendGameState,
    GameStateResponse,
} from '../types/backendTypes';
import type {FrontendPlayer} from '../types';
import type {GameRoomInfo, JoinGameRequest} from '../types/api';
import type {ChatMessage, GameEvent, ScoreEntry} from '../types/realtime';

export type RoundUxStage = 'waiting' | 'speech' | 'debate' | 'vote' | 'results';

export interface RoundSummaryEntry {
  round: number;
  topic: string | null;
  suspectedPlayerId?: string | null;
  scoreboard: Array<{
    playerId: string;
    nickname: string;
    score: number;
    isAlive: boolean;
  }>;
  winningTeam?: 'CITIZENS' | 'LIARS' | 'UNKNOWN';
  concludedAt: number;
}

// Unified Player interface
export interface Player extends FrontendPlayer {
  score: number;
}

// Game Timer interface
export interface GameTimer {
  isActive: boolean;
  timeRemaining: number;
  totalTime: number;
  phase: string;
}

// Voting State interface
export interface VotingState {
  isActive: boolean;
  phase: 'LIAR_VOTE' | 'SURVIVAL_VOTE' | null;
  votes: Record<string, string>;
  targetPlayerId?: string;
  results?: {
    votes: Record<string, number>;
    actualLiar?: string;
    winners?: string[];
  };
}

// Game Results interface
export interface GameResults {
  liarId: string;
  liarName: string;
  topic: string;
  votes: Record<string, number>;
  liarWon: boolean;
  roundScores: Record<string, number>;
}

// Hint interface
export interface Hint {
  playerId: string;
  playerName: string;
  hint: string;
  timestamp: number;
}

// Vote interface
export interface Vote {
  voterId: string;
  voterName: string;
  targetId: string;
  targetName: string;
}

// Defense interface
export interface Defense {
  defenderId: string;
  defenderName: string;
  defense: string;
  timestamp: number;
}

// Main Game State interface
export interface GameState {
  // Session Management
  gameId: string | null;
  gameNumber: number | null;
  sessionCode: string | null;
  players: Player[];
  currentPlayer: Player | null;

  // Game Configuration
  maxPlayers: number;
  timeLimit: number;
  currentRound: number;
  totalRounds: number;
  gameMode: GameMode | null;

  // Game Flow
  gamePhase: 'WAITING_FOR_PLAYERS' | 'SPEECH' | 'VOTING_FOR_LIAR' | 'DEFENDING' | 'VOTING_FOR_SURVIVAL' | 'GUESSING_WORD' | 'GAME_OVER';
  currentTurnPlayerId?: string;
  turnOrder: string[];

  // Game Content
  currentTopic: string | null;
  currentWord: string | null;
  currentLiar: string | null;
  isLiar: boolean;

  // Game Data
  hints: Hint[];
  votes: Vote[];
  defenses: Defense[];
  userVote: string | null;
  gameResults: GameResults[] | null;
  scores: Record<string, number>;

  // Real-time Features
  timer: GameTimer;
  voting: VotingState;
  chatMessages: ChatMessage[];
  typingPlayers: Set<string>;

  // Connection State
  isConnected: boolean;
  connectionError: string | null;
  reconnectAttempts: number;

  // UI State
  isLoading: boolean;
  error: string | null;

  // Round UX State
  roundStage: RoundUxStage;
  roundStageEnteredAt: number | null;
  roundHasStarted: boolean;
  roundSummaries: RoundSummaryEntry[];
  currentRoundSummary: RoundSummaryEntry | null;

  // Game List Management
  gameList: GameRoomInfo[];
  gameListLoading: boolean;
  gameListError: string | null;
  availableGameModes: GameMode[];
  currentGameState: GameStateResponse | null;
}

// Actions interface
interface GameActions {
  // Session Actions
  setGameId: (gameId: string) => void;
  setGameNumber: (gameNumber: number) => void;
  setSessionCode: (code: string) => void;
  setCurrentPlayer: (player: Player) => void;
  
  // Player Management
  updatePlayers: (players: Player[]) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;

  // Game Flow
  setGamePhase: (phase: GameState['gamePhase']) => void;
  setGameMode: (mode: GameMode) => void;
  setCurrentTopic: (topic: string) => void;
  setCurrentWord: (word: string) => void;
  setCurrentLiar: (liarId: string) => void;
  setIsLiar: (isLiar: boolean) => void;
  setCurrentTurnPlayer: (playerId: string) => void;
  setTurnOrder: (order: string[]) => void;

  // Game Data
  addHint: (playerId: string, playerName: string, hint: string) => void;
  addVote: (voterId: string, voterName: string, targetId: string, targetName: string) => void;
  addDefense: (defenderId: string, defenderName: string, defense: string) => void;
  setUserVote: (vote: string) => void;
  setGameResults: (results: GameResults[]) => void;
  
  // Score Management
  setScore: (playerId: string, score: number) => void;
  addScore: (playerId: string, delta: number) => void;
  resetScores: () => void;

  // Timer Management
  updateTimer: (timer: Partial<GameTimer>) => void;
  startTimer: (totalTime: number, phase: string) => void;
  stopTimer: () => void;

  // Voting Management
  startVoting: (phase: 'LIAR_VOTE' | 'SURVIVAL_VOTE', targetPlayerId?: string) => void;
  stopVoting: () => void;
  castVote: (playerId: string, targetId: string) => void;
  setVotingResults: (results: VotingState['results']) => void;

  // Chat Management
  addChatMessage: (message: ChatMessage) => void;
  setChatMessages: (messages: ChatMessage[]) => void;
  sendChatMessage: (message: string) => void;
  clearChat: () => void;

  // Typing Indicators
  addTypingPlayer: (playerId: string) => void;
  removeTypingPlayer: (playerId: string) => void;
  clearTypingPlayers: () => void;

  // Connection Management
  setConnectionState: (connected: boolean) => void;
  setConnectionError: (error: string | null) => void;
  setReconnectAttempts: (attempts: number) => void;
  connectWebSocket: () => Promise<void>;
  disconnectWebSocket: () => void;

  // UI State
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Game List Management
  fetchGameList: (page?: number, size?: number) => Promise<void>;
  setGameList: (games: GameRoomInfo[]) => void;
  setGameListLoading: (loading: boolean) => void;
  setGameListError: (error: string | null) => void;

  // Game Mode Management
  fetchGameModes: () => Promise<void>;
  setAvailableGameModes: (modes: GameMode[]) => void;

  // API Actions
  createGame: (gameData: CreateGameRequest) => Promise<GameStateResponse>;
  joinGame: (joinData: JoinGameRequest) => Promise<GameStateResponse>;
  leaveGame: () => Promise<void>;
  startGame: () => Promise<void>;
  toggleReady: () => Promise<void>;
  refreshGameState: () => Promise<void>;
  
  // State Synchronization
  setCurrentGameState: (state: GameStateResponse) => void;
  updateFromGameState: (gameState: GameStateResponse) => void;

  // Event Handlers
  handleGameEvent: (event: GameEvent) => void;
  handleChatMessage: (message: ChatMessage) => void;
  handlePlayerJoined: (player: Player) => void;
  handlePlayerLeft: (playerId: string) => void;
  handlePlayerReady: (playerId: string, ready: boolean) => void;
  handlePhaseChange: (phase: GameState['gamePhase']) => void;
  handleTimerUpdate: (timeRemaining: number) => void;
  handleVoteUpdate: (votes: Record<string, string>) => void;

  // Round UX helpers
  setRoundStage: (stage: RoundUxStage, options?: { force?: boolean }) => void;
  addRoundSummary: (summary: RoundSummaryEntry) => void;
  clearRoundSummaries: () => void;

  // Reset Actions
  resetGame: () => void;
  resetVote: () => void;
  resetGameData: () => void;
}

type UnifiedGameStore = GameState & GameActions;

// Helper function to map backend game state
const mapGamePhase = (
  phase: BackendGamePhase | BackendGameState | string | undefined,
): GameState['gamePhase'] => {
  const defaultPhase: GameState['gamePhase'] = 'WAITING_FOR_PLAYERS';

  if (!phase) {
    return defaultPhase;
  }

  switch (phase) {
    case 'WAITING':
      return 'WAITING_FOR_PLAYERS';
    case 'IN_PROGRESS':
      return 'SPEECH';
    case 'ENDED':
      return 'GAME_OVER';
    default:
      break;
  }

  const allowedPhases: GameState['gamePhase'][] = [
    'WAITING_FOR_PLAYERS',
    'SPEECH',
    'VOTING_FOR_LIAR',
    'DEFENDING',
    'VOTING_FOR_SURVIVAL',
    'GUESSING_WORD',
    'GAME_OVER',
  ];

  return allowedPhases.includes(phase as GameState['gamePhase'])
    ? (phase as GameState['gamePhase'])
    : defaultPhase;
};

const stageOrder: Record<RoundUxStage, number> = {
  waiting: 0,
  speech: 1,
  debate: 2,
  vote: 3,
  results: 4,
};

const mapPhaseToStage = (phase: GameState['gamePhase']): RoundUxStage => {
  switch (phase) {
    case 'SPEECH':
      return 'speech';
    case 'DEFENDING':
      return 'debate';
    case 'VOTING_FOR_LIAR':
    case 'VOTING_FOR_SURVIVAL':
      return 'vote';
    case 'GUESSING_WORD':
    case 'GAME_OVER':
      return 'results';
    case 'WAITING_FOR_PLAYERS':
    default:
      return 'waiting';
  }
};

interface AuthIdentifiers {
  userId: string | null;
  nickname: string | null;
}

const getAuthIdentifiers = (): AuthIdentifiers => {
  const { userId, nickname } = useAuthStore.getState();
  return {
    userId: userId != null ? String(userId) : null,
    nickname: nickname ?? null,
  };
};

const normalizeIdentifier = (value: unknown): string | null => {
  if (value == null) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toString();
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (record.id != null) {
      const normalized = normalizeIdentifier(record.id);
      if (normalized) {
        return normalized;
      }
    }
    if (record.userId != null) {
      const normalized = normalizeIdentifier(record.userId);
      if (normalized) {
        return normalized;
      }
    }
    if (record.nickname != null) {
      const normalized = normalizeIdentifier(record.nickname);
      if (normalized) {
        return normalized;
      }
    }
  }

  return null;
};

const pickFirstIdentifier = (...values: unknown[]): string | null => {
  for (const value of values) {
    const normalized = normalizeIdentifier(value);
    if (normalized) {
      return normalized;
    }
  }
  return null;
};

const findSelfPlayer = (players: Player[], auth: AuthIdentifiers): Player | undefined => {
  return players.find((player) => {
    if (auth.userId && player.userId != null && String(player.userId) === auth.userId) {
      return true;
    }
    if (auth.nickname && player.nickname === auth.nickname) {
      return true;
    }
    return false;
  });
};

const isIdentifierSelf = (value: unknown, players: Player[], auth: AuthIdentifiers): boolean => {
  const normalized = normalizeIdentifier(value);
  if (!normalized) {
    return false;
  }

  if (auth.userId && normalized === auth.userId) {
    return true;
  }

  if (auth.nickname && normalized === auth.nickname) {
    return true;
  }

  const selfPlayer = findSelfPlayer(players, auth);
  if (!selfPlayer) {
    return false;
  }

  if (selfPlayer.id === normalized) {
    return true;
  }

  if (selfPlayer.userId != null && String(selfPlayer.userId) === normalized) {
    return true;
  }

  if (selfPlayer.nickname === normalized) {
    return true;
  }

  return false;
};

// Initial state
const initialState: GameState = {
  // Session
  gameId: null,
  gameNumber: null,
  sessionCode: null,
  players: [],
  currentPlayer: null,

  // Configuration
  maxPlayers: 6,
  timeLimit: 120,
  currentRound: 0,
  totalRounds: 3,
  gameMode: null,

  // Game Flow
  gamePhase: 'WAITING_FOR_PLAYERS',
  currentTurnPlayerId: undefined,
  turnOrder: [],

  // Game Content
  currentTopic: null,
  currentWord: null,
  currentLiar: null,
  isLiar: false,

  // Game Data
  hints: [],
  votes: [],
  defenses: [],
  userVote: null,
  gameResults: null,
  scores: {},

  // Real-time
  timer: {
    isActive: false,
    timeRemaining: 0,
    totalTime: 0,
    phase: '',
  },
  voting: {
    isActive: false,
    phase: null,
    votes: {},
    results: undefined,
  },
  chatMessages: [],
  typingPlayers: new Set(),

  // Connection
  isConnected: false,
  connectionError: null,
  reconnectAttempts: 0,

  // UI
  isLoading: false,
  error: null,

  // Round UX
  roundStage: 'waiting',
  roundStageEnteredAt: null,
  roundHasStarted: false,
  roundSummaries: [],
  currentRoundSummary: null,

  // Game List
  gameList: [],
  gameListLoading: false,
  gameListError: null,
  availableGameModes: [],
  currentGameState: null,
};

// Create the unified store
export const useGameStore = create<UnifiedGameStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Session Actions
        setGameId: (gameId) => set({ gameId }),
        setGameNumber: (gameNumber) => set({ gameNumber }),
        setSessionCode: (sessionCode) => set({ sessionCode }),
        setCurrentPlayer: (currentPlayer) => set({ currentPlayer }),

        // Player Management
        updatePlayers: (players) => set({ players }),
        addPlayer: (player) => set((state) => ({
          players: [...state.players, player]
        })),
        removePlayer: (playerId) => set((state) => ({
          players: state.players.filter(p => p.id !== playerId)
        })),
        updatePlayer: (playerId, updates) => set((state) => ({
          players: state.players.map(p =>
            p.id === playerId ? { ...p, ...updates } : p
          )
        })),

        // Game Flow
        setGamePhase: (gamePhase) => {
          set({ gamePhase });
          const nextStage = mapPhaseToStage(gamePhase);
          get().setRoundStage(nextStage);
        },
        setGameMode: (gameMode) => set({ gameMode }),
        setCurrentTopic: (currentTopic) => set({ currentTopic }),
        setCurrentWord: (currentWord) => set({ currentWord }),
        setCurrentLiar: (currentLiar) => set({ currentLiar }),
        setIsLiar: (isLiar) => set({ isLiar }),
        setCurrentTurnPlayer: (currentTurnPlayerId) => set({ currentTurnPlayerId }),
        setTurnOrder: (turnOrder) => set({ turnOrder }),

        // Game Data
        addHint: (playerId, playerName, hint) => set((state) => ({
          hints: [...state.hints, {
            playerId,
            playerName,
            hint,
            timestamp: Date.now()
          }]
        })),
        addVote: (voterId, voterName, targetId, targetName) => set((state) => ({
          votes: [...state.votes, {
            voterId,
            voterName,
            targetId,
            targetName
          }]
        })),
        addDefense: (defenderId, defenderName, defense) => set((state) => ({
          defenses: [...state.defenses, {
            defenderId,
            defenderName,
            defense,
            timestamp: Date.now()
          }]
        })),
        setUserVote: (userVote) => set({ userVote }),
        setGameResults: (gameResults) => set({ gameResults }),

        // Score Management
        setScore: (playerId, score) => set((state) => ({
          scores: { ...state.scores, [playerId]: score }
        })),
        addScore: (playerId, delta) => {
          const current = get().scores[playerId] ?? 0;
          set((state) => ({
            scores: { ...state.scores, [playerId]: current + delta }
          }));
        },
        resetScores: () => set({ scores: {} }),

        // Timer Management
        updateTimer: (timer) => set((state) => ({
          timer: { ...state.timer, ...timer }
        })),
        startTimer: (totalTime, phase) => set({
          timer: {
            isActive: true,
            timeRemaining: totalTime,
            totalTime,
            phase
          }
        }),
        stopTimer: () => set((state) => ({
          timer: { ...state.timer, isActive: false }
        })),

        // Voting Management
        startVoting: (phase, targetPlayerId) => set({
          voting: {
            isActive: true,
            phase,
            votes: {},
            targetPlayerId,
            results: undefined
          }
        }),
        stopVoting: () => set((state) => ({
          voting: { ...state.voting, isActive: false }
        })),
        castVote: (playerId, targetId) => set((state) => ({
          voting: {
            ...state.voting,
            votes: { ...state.voting.votes, [playerId]: targetId }
          }
        })),
        setVotingResults: (results) => set((state) => ({
          voting: { ...state.voting, results }
        })),

        // Chat Management
        addChatMessage: (message) => set((state) => ({
          chatMessages: [...state.chatMessages, message]
        })),
        setChatMessages: (chatMessages) => set({ chatMessages }),
        sendChatMessage: async (message) => {
          const { gameNumber, isConnected } = get();
          if (!gameNumber || !isConnected) return;

          try {
            const { nickname } = useAuthStore.getState();
            const { websocketService } = await import('../services/websocketService');
            websocketService.sendChatMessage(gameNumber.toString(), message, nickname ?? undefined);
          } catch (error) {
            console.error('Failed to send chat message:', error);
          }
        },
        clearChat: () => set({ chatMessages: [] }),

        // Typing Indicators
        addTypingPlayer: (playerId) => set((state) => ({
          typingPlayers: new Set([...state.typingPlayers, playerId])
        })),
        removeTypingPlayer: (playerId) => set((state) => {
          const newSet = new Set(state.typingPlayers);
          newSet.delete(playerId);
          return { typingPlayers: newSet };
        }),
        clearTypingPlayers: () => set({ typingPlayers: new Set() }),

        // Connection Management
        setConnectionState: (isConnected) => set({ isConnected }),
        setConnectionError: (connectionError) => set({ connectionError }),
        setReconnectAttempts: (reconnectAttempts) => set({ reconnectAttempts }),
        
        connectWebSocket: async () => {
          set({ isConnected: false, connectionError: null });
          try {
            const { websocketService } = await import('../services/websocketService');
            await websocketService.connect();
            set({ isConnected: true });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Connection failed';
            set({ connectionError: errorMessage });
            throw error;
          }
        },

        disconnectWebSocket: async () => {
          try {
            const { websocketService } = await import('../services/websocketService');
            websocketService.disconnect();
          } catch (error) {
            console.error('Error disconnecting WebSocket:', error);
          } finally {
            set({ isConnected: false });
          }
        },

        // UI State
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),

        // Game List Management
        fetchGameList: async (page = 0, size = 10) => {
          set({ gameListLoading: true, gameListError: null });
          try {
            const response = await gameService.getGameList(page, size);
            const gameList = response.gameRooms || response.games || response.data || [];
            set({ gameList, gameListLoading: false });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch game list';
            set({ gameListLoading: false, gameListError: errorMessage });
          }
        },
        setGameList: (gameList) => set({ gameList }),
        setGameListLoading: (gameListLoading) => set({ gameListLoading }),
        setGameListError: (gameListError) => set({ gameListError }),

        // Game Mode Management
        fetchGameModes: async () => {
          try {
            const modes = await gameService.getAvailableGameModes();
            set({ availableGameModes: modes });
          } catch (error) {
            console.error('Failed to fetch game modes:', error);
          }
        },
        setAvailableGameModes: (availableGameModes) => set({ availableGameModes }),

        // API Actions
        createGame: async (gameData) => {
          set({ isLoading: true, error: null });
          try {
            const gameNumber = await gameService.createGame(gameData);
            // After creating, get the game state
            const gameState = await gameService.getGameState(gameNumber);
            set({
              isLoading: false,
              currentGameState: gameState,
              gameNumber: gameState.gameNumber,
              gameId: gameState.gameNumber.toString()
            });
            get().updateFromGameState(gameState);
            return gameState;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create game';
            set({ isLoading: false, error: errorMessage });
            throw error;
          }
        },

        joinGame: async (joinData) => {
          set({ isLoading: true, error: null });
          try {
            const payload = {
              gameNumber: joinData.gameNumber,
              gamePassword: joinData.gamePassword ?? (joinData as any).password ?? undefined,
              nickname: joinData.nickname
            };
            const gameState = await gameService.joinGame(payload);
            set({
              isLoading: false,
              currentGameState: gameState,
              gameNumber: gameState.gameNumber,
              gameId: gameState.gameNumber.toString()
            });
            get().updateFromGameState(gameState);
            return gameState;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to join game';
            set({ isLoading: false, error: errorMessage });
            throw error;
          }
        },

        leaveGame: async () => {
          const { gameNumber } = get();
          if (!gameNumber) return;

          set({ isLoading: true, error: null });
          try {
            await gameService.leaveGame(gameNumber);
            set({ isLoading: false });
            get().resetGame();
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to leave game';
            set({ isLoading: false, error: errorMessage });
            throw error;
          }
        },

        startGame: async () => {
          const { gameNumber } = get();
          if (!gameNumber) return;

          set({ isLoading: true, error: null });
          try {
            const gameState = await gameService.startGame();
            set({ isLoading: false, currentGameState: gameState });
            get().updateFromGameState(gameState);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to start game';
            set({ isLoading: false, error: errorMessage });
            throw error;
          }
        },

        toggleReady: async () => {
          const { gameNumber } = get();
          if (!gameNumber) return;

          set({ isLoading: true, error: null });
          try {
            const gameState = await gameService.toggleReady(gameNumber);
            set({ isLoading: false, currentGameState: gameState });
            get().updateFromGameState(gameState);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to toggle ready state';
            set({ isLoading: false, error: errorMessage });
            throw error;
          }
        },

        refreshGameState: async () => {
          const { gameNumber } = get();
          if (!gameNumber) return;

          try {
            const gameState = await gameService.getGameState(gameNumber);
            set({ currentGameState: gameState });
            get().updateFromGameState(gameState);
          } catch (error) {
            console.error('Failed to refresh game state:', error);
          }
        },

        // State Synchronization
        setCurrentGameState: (currentGameState) => set({ currentGameState }),
        updateFromGameState: (gameState) => {
          if (!gameState) return;

          const scoreboard = new Map<number, number>(

            (gameState.scoreboard ?? []).map((entry) => [entry.userId, entry.score])

          );



          const mappedPlayers = gameState.players.map<Player>((player) => {

            const score = scoreboard.get(player.userId) ?? scoreboard.get(player.id) ?? 0;

            const isDisconnected = player.state === 'DISCONNECTED';

            const normalizedId = player.id.toString();



            return {

              id: normalizedId,

              userId: player.userId,

              nickname: player.nickname,

              isAlive: player.isAlive,

              state: player.state,

              hint: player.hint,

              defense: player.defense,

              votesReceived: player.votesReceived,

              hasVoted: player.hasVoted,

              score,

              isHost: player.nickname === gameState.gameOwner,

              isReady: !isDisconnected && player.state !== 'WAITING_FOR_HINT',

              isConnected: !isDisconnected,

              isOnline: !isDisconnected,

              role: undefined,

              votedFor: undefined,

              lastActive: Date.now(),

            };

          });



          const scores = mappedPlayers.reduce<Record<string, number>>((acc, player) => {

            acc[player.id] = player.score;

            return acc;

          }, {});



          const turnOrder = (gameState.turnOrder ?? []).map((value) => value.toString());

          const currentTurnPlayerId = turnOrder[gameState.currentTurnIndex] ?? undefined;

          const currentPlayer =

            currentTurnPlayerId != null

              ? mappedPlayers.find(

                  (player) =>

                    player.id === currentTurnPlayerId ||

                    player.userId.toString() === currentTurnPlayerId ||

                    player.nickname === currentTurnPlayerId,

                ) ?? null

              : null;



          const mappedPhase = mapGamePhase(gameState.currentPhase);

          const auth = getAuthIdentifiers();

          const selfPlayer = findSelfPlayer(mappedPlayers, auth);

          const isSelfLiar = gameState.yourRole === 'LIAR';

          const revealPhase = mappedPhase === 'GAME_OVER';

          const liarIdentifier = isSelfLiar

            ? pickFirstIdentifier(selfPlayer?.id, selfPlayer?.userId, selfPlayer?.nickname, auth.userId, auth.nickname)

            : (revealPhase ? pickFirstIdentifier(gameState.accusedPlayer) : null);

          const maskedWord = isSelfLiar ? null : gameState.yourWord ?? null;



          set({

            gamePhase: mappedPhase,

            players: mappedPlayers,

            currentPlayer,

            currentTurnPlayerId,

            turnOrder,

            currentRound: gameState.gameCurrentRound,

            totalRounds: gameState.gameTotalRounds,

            maxPlayers: gameState.gameParticipants,

            gameNumber: gameState.gameNumber,

            gameId: gameState.gameNumber.toString(),

            scores,

            currentTopic: gameState.citizenSubject ?? null,

            currentWord: maskedWord,

            currentLiar: liarIdentifier ?? null,

            isLiar: isSelfLiar,

          });

          get().setRoundStage(mapPhaseToStage(mappedPhase));



          // Update timer if available
          if (gameState.phaseEndTime) {
            // Calculate time remaining from phaseEndTime
            const endTime = new Date(gameState.phaseEndTime).getTime();
            const now = Date.now();
            const timeRemaining = Math.max(0, Math.floor((endTime - now) / 1000));

            set((state) => ({
              timer: {
                ...state.timer,
                timeRemaining
              }
            }));
          }
        },

        // Event Handlers
        handleGameEvent: (event: GameEvent) => {
          const state = get();
          
          switch (event.type) {
            case 'PLAYER_JOINED': {
              const { payload } = event;
              const rawPlayerId = payload.playerId ?? payload.userId ?? payload.nickname ?? '';
              const normalizedId = String(rawPlayerId);
              const parsedUserId =
                typeof payload.userId === 'number'
                  ? payload.userId
                  : Number.parseInt(String(payload.userId ?? rawPlayerId ?? 0), 10) || 0;
              const nickname = payload.playerName ?? payload.nickname ?? ('Player ' + normalizedId);

              const newPlayer: Player = {
                id: normalizedId,
                userId: parsedUserId,
                nickname,
                isAlive: true,
                state: 'WAITING_FOR_HINT',
                votesReceived: 0,
                hasVoted: false,
                score: 0,
                isHost: Boolean(payload.isHost),
                isReady: Boolean(payload.isReady),
                isConnected: true,
                isOnline: true,
                role: payload.role ?? undefined,
                votedFor: undefined,
                lastActive: Date.now(),
              };

              get().addPlayer(newPlayer);
              break;
            }

            case 'PLAYER_LEFT': {
              const { playerId } = event.payload;
              if (playerId != null) {
                get().removePlayer(String(playerId));
              }
              break;
            }

            case 'GAME_STARTED':
              set({
                gamePhase: 'SPEECH',
                currentRound: event.payload.currentRound ?? state.currentRound
              });
              break;

            case 'ROUND_STARTED': {
              const { category, word, liarId, timeLimit } = event.payload;
              const auth = getAuthIdentifiers();
              const selfPlayer = findSelfPlayer(state.players, auth);
              const isSelfRoundLiar = state.isLiar || isIdentifierSelf(liarId, state.players, auth);
              const nextWord = isSelfRoundLiar ? null : (word ?? state.currentWord);
              const nextLiarId = isSelfRoundLiar
                ? pickFirstIdentifier(liarId, selfPlayer?.id, selfPlayer?.userId, selfPlayer?.nickname, auth.userId, auth.nickname)
                : null;

              set({
                currentTopic: category ?? state.currentTopic,
                currentWord: nextWord,
                isLiar: isSelfRoundLiar,
                currentLiar: nextLiarId ?? null,
                hints: [],
                votes: [],
                defenses: [],
                roundHasStarted: true,
                currentRoundSummary: null,
              });

              get().setRoundStage('speech', { force: true });

              if (typeof timeLimit === 'number' && timeLimit > 0) {
                get().startTimer(timeLimit, 'SPEECH');
              }
              break;
            }

            case 'HINT_PROVIDED':
            case 'HINT_SUBMITTED': {
              const { playerId, playerName, hint } = event.payload;
              const resolvedPlayerId = String(playerId ?? 'unknown');
              get().addHint(resolvedPlayerId, playerName ?? '익명', hint ?? '');
              break;
            }

            case 'VOTE_CAST': {
              const { voterId, voterName, targetId, targetName } = event.payload;
              get().addVote(
                String(voterId ?? 'unknown'),
                voterName ?? '익명',
                String(targetId ?? 'unknown'),
                targetName ?? '익명'
              );
              break;
            }

            case 'DEFENSE_SUBMITTED': {
              const { defenderId, defenderName, defense, playerId, playerName } = event.payload;
              const resolvedId = defenderId ?? playerId ?? 'unknown';
              const resolvedName = defenderName ?? playerName ?? '익명';
              get().addDefense(String(resolvedId), resolvedName, defense ?? '');
              break;
            }

            case 'ROUND_ENDED': {
              get().setGamePhase('GAME_OVER');

              const scoreEntries = event.payload.scores ?? event.payload.finalScores;
              if (Array.isArray(scoreEntries) && scoreEntries.length > 0) {
                const newScores: Record<string, number> = {};
                const scoreboardSnapshot: RoundSummaryEntry['scoreboard'] = [];

                (scoreEntries as ScoreEntry[]).forEach(entry => {
                  const playerId = String(entry.playerId);
                  newScores[playerId] = entry.score;
                  const player = state.players.find(p => p.id === playerId || String(p.userId) === playerId);
                  scoreboardSnapshot.push({
                    playerId,
                    nickname: player?.nickname ?? '플레이어',
                    score: entry.score,
                    isAlive: player?.isAlive !== false,
                  });
                });

                set({ scores: newScores });

                get().addRoundSummary({
                  round: state.currentRound,
                  topic: state.currentTopic,
                  suspectedPlayerId: state.voting.targetPlayerId ?? undefined,
                  scoreboard: scoreboardSnapshot.sort((a, b) => b.score - a.score),
                  winningTeam: 'UNKNOWN',
                  concludedAt: Date.now(),
                });
              } else {
                get().addRoundSummary({
                  round: state.currentRound,
                  topic: state.currentTopic,
                  suspectedPlayerId: state.voting.targetPlayerId ?? undefined,
                  scoreboard: state.players.map((player) => ({
                    playerId: player.id,
                    nickname: player.nickname,
                    score: state.scores[player.id] ?? player.score ?? 0,
                    isAlive: player.isAlive !== false,
                  })).sort((a, b) => b.score - a.score),
                  winningTeam: 'UNKNOWN',
                  concludedAt: Date.now(),
                });
              }

              get().setRoundStage('results', { force: true });
              break;
            }

            case 'PHASE_CHANGED': {
              const { phase } = event.payload;
              if (phase) {
                get().setGamePhase(mapGamePhase(phase));
              }
              break;
            }

            case 'TIMER_UPDATE':
              set(currentState => ({
                timer: {
                  ...currentState.timer,
                  timeRemaining: event.payload.timeRemaining,
                  phase: event.payload.phase ? String(event.payload.phase) : currentState.timer.phase,
                }
              }));

              if (event.payload.phase) {
                const mapped = mapGamePhase(event.payload.phase);
                if (mapped !== get().gamePhase) {
                  get().setGamePhase(mapped);
                }
              }
              break;

            case 'GAME_STATE_UPDATED':
              if (event.payload.gameState) {
                get().updateFromGameState(event.payload.gameState);
              } else if (event.payload.state) {
                get().setGamePhase(mapGamePhase(event.payload.state));
              }

              if (event.payload.timeRemaining !== undefined) {
                set(currentState => ({
                  timer: {
                    ...currentState.timer,
                    timeRemaining: event.payload.timeRemaining ?? currentState.timer.timeRemaining
                  }
                }));
              }
              break;

            case 'GAME_ENDED': {
              const scoreEntries = event.payload.scores;
              if (Array.isArray(scoreEntries) && scoreEntries.length > 0) {
                const newScores: Record<string, number> = {};
                (scoreEntries as ScoreEntry[]).forEach(entry => {
                  newScores[String(entry.playerId)] = entry.score;
                });
                set({ scores: newScores });
              } else {
                // no-op
              }
              get().setGamePhase('GAME_OVER');
              get().setRoundStage('results', { force: true });
              break;
            }

            default:
              break;
          }
        },

        handleChatMessage: (message) => {
          get().addChatMessage(message);
        },

        handlePlayerJoined: (player) => {
          get().addPlayer(player);
        },

        handlePlayerLeft: (playerId) => {
          get().removePlayer(playerId);
        },

        handlePlayerReady: (playerId, ready) => {
          get().updatePlayer(playerId, { isReady: ready });
        },

        handlePhaseChange: (phase) => {
          get().setGamePhase(phase);
        },

        handleTimerUpdate: (timeRemaining) => {
          set((state) => ({
            timer: { ...state.timer, timeRemaining }
          }));
        },

        handleVoteUpdate: (votes) => {
          set((state) => ({
            voting: { ...state.voting, votes }
          }));
        },

        setRoundStage: (stage, options) => {
          const { force = false } = options ?? {};
          const currentStage = get().roundStage;
          const currentOrder = stageOrder[currentStage] ?? 0;
          const nextOrder = stageOrder[stage] ?? 0;

          if (!force && nextOrder < currentOrder && stage !== 'waiting') {
            return;
          }

          set({
            roundStage: stage,
            roundStageEnteredAt: Date.now(),
            roundHasStarted: stage !== 'waiting',
          });
        },

        addRoundSummary: (summary) => {
          set((state) => {
            const nextSummaries = [summary, ...state.roundSummaries];
            return {
              currentRoundSummary: summary,
              roundSummaries: nextSummaries.slice(0, 5),
            };
          });
        },

        clearRoundSummaries: () => set({
          roundSummaries: [],
          currentRoundSummary: null,
        }),

        // Reset Actions
        resetGame: () => set({ ...initialState, typingPlayers: new Set() }),
        resetVote: () => set({ userVote: null }),
        resetGameData: () => set({
          hints: [],
          votes: [],
          defenses: [],
          currentTopic: null,
          currentWord: null,
          currentLiar: null,
          isLiar: false,
          chatMessages: [],
          scores: {}
        })
      }),
      {
        name: 'unified-game-store',
        partialize: (state) => ({
          gameId: state.gameId,
          gameNumber: state.gameNumber,
          sessionCode: state.sessionCode,
          maxPlayers: state.maxPlayers,
          timeLimit: state.timeLimit,
          totalRounds: state.totalRounds,
          gameMode: state.gameMode,
        }),
      }
    ),
    {
      name: 'unified-game-store',
    }
  )
);
