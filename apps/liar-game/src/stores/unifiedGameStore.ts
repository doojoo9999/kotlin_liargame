import {create} from 'zustand';
import {devtools, persist} from 'zustand/middleware';
import {toast} from 'sonner';
import {gameService} from '../api/gameApi';
import {useAuthStore} from './authStore';
import {websocketService} from '@/services/websocketService';
import type {
    CreateGameRequest,
    GameMode,
    GamePhase as BackendGamePhase,
    GameState as BackendGameState,
    GameStateResponse,
    GameRecoveryResponse,
    NextRoundResponse,
    FinalVotingResultResponse,
} from '../types/backendTypes';
import type {FrontendPlayer} from '../types';
import type {GameRoomInfo, JoinGameRequest} from '../types/api';
import type {ChatMessage, ChatMessageType, GameEvent, ScoreEntry, TurnChangedPayload} from '../types/realtime';
import type {
    FinalVotingProgressMessage,
    FinalVotingStartMessage,
    VotingProgressMessage,
    VotingStartMessage
} from '../types/contracts/gameplay';

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
  currentVotes?: number;
  totalParticipants?: number;
  requiredVotes?: number;
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



const CHAT_MESSAGE_LIMIT = 200;
const DEFAULT_TURN_TIME_SECONDS = 60;
const CHAT_TYPES: readonly ChatMessageType[] = ['DISCUSSION', 'HINT', 'DEFENSE', 'SYSTEM', 'POST_ROUND', 'WAITING_ROOM', 'GENERAL'] as const;

const normalizeChatType = (value: unknown): ChatMessageType => {
  if (typeof value === 'string') {
    const normalized = value.trim().toUpperCase();
    if ((CHAT_TYPES as readonly string[]).includes(normalized)) {
      return normalized as ChatMessageType;
    }
    if (normalized === 'ANNOUNCEMENT' || normalized === 'NOTICE') {
      return 'SYSTEM';
    }
  }
  return 'DISCUSSION';
};

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return null;
};

const toOptionalString = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toString();
  }
  return null;
};

const resolvePlayerByIdentifiers = (players: Player[], identifiers: Array<string | number | null | undefined>): Player | undefined => {
  for (const identifier of identifiers) {
    if (identifier == null) {
      continue;
    }
    const normalized = typeof identifier === 'number' ? identifier.toString() : identifier;
    const match = players.find((player) => {
      if (player.id === normalized) return true;
      if (player.userId != null && player.userId.toString() === normalized) return true;
      if (player.nickname === normalized) return true;
      return false;
    });
    if (match) {
      return match;
    }
  }
  return undefined;
};

const normalizeChatMessage = (
  rawMessage: Partial<ChatMessage> | Record<string, unknown>,
  players: Player[],
  defaultGameNumber: number | null
): ChatMessage => {
  const candidate = rawMessage as Record<string, unknown>;

  const type = normalizeChatType(candidate['type'] ?? candidate['messageType'] ?? candidate['category']);
  const timestamp = toFiniteNumber(candidate['timestamp'] ?? candidate['createdAt'] ?? candidate['time']) ?? Date.now();
  const rawGameNumber = toFiniteNumber(candidate['gameNumber'] ?? candidate['gameId'] ?? candidate['roomId']);
  const gameNumber = rawGameNumber ?? (defaultGameNumber ?? 0);

  const userId = toFiniteNumber(candidate['userId'] ?? candidate['playerUserId'] ?? candidate['senderUserId']) ?? undefined;
  const rawPlayerId = toOptionalString(candidate['playerId'] ?? candidate['playerID'] ?? candidate['playerUuid'] ?? candidate['senderId']);
  const rawNickname = toOptionalString(
    candidate['playerNickname']
    ?? candidate['playerNicknameSnapshot']
    ?? candidate['playerName']
    ?? candidate['nickname']
  );
  const content = toOptionalString(candidate['content'] ?? candidate['message'] ?? candidate['body'] ?? '') ?? '';

  const fallbackIdPart = rawPlayerId ?? (typeof userId === 'number' ? userId.toString() : type);
  const id =
    toOptionalString(candidate['id'] ?? candidate['messageId'] ?? candidate['eventId'] ?? candidate['uuid'])
    ?? `${gameNumber}-${timestamp}-${fallbackIdPart}`;

  const resolvedPlayer = resolvePlayerByIdentifiers(players, [rawPlayerId, rawNickname, userId]);

  const playerId = resolvedPlayer?.id ?? rawPlayerId ?? (typeof userId === 'number' ? userId.toString() : undefined);
  const nickname =
    resolvedPlayer?.nickname
    ?? rawNickname
    ?? (type === 'SYSTEM' ? 'SYSTEM' : `플레이어 ${playerId ?? (typeof userId === 'number' ? userId : '?')}`);

  return {
    id: id.toString(),
    gameNumber,
    playerId: playerId ?? undefined,
    userId,
    playerNickname: nickname,
    nickname,
    playerName: resolvedPlayer?.nickname ?? rawNickname ?? undefined,
    content,
    message: content,
    gameId: toOptionalString(candidate['gameId']) ?? (gameNumber ? gameNumber.toString() : undefined),
    roomId: toOptionalString(candidate['roomId'] ?? candidate['channelId'] ?? candidate['topic']) ?? undefined,
    timestamp,
    type,
  };
};

const mergeChatMessages = (existing: ChatMessage[], next: ChatMessage[]): ChatMessage[] => {
  if (!next.length) {
    return existing;
  }
  const map = new Map<string, ChatMessage>();
  for (const message of existing) {
    map.set(message.id, message);
  }
  for (const message of next) {
    map.set(message.id, message);
  }
  return Array.from(map.values())
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-CHAT_MESSAGE_LIMIT);
};


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
  chatLoading: boolean;
  chatError: string | null;
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
  ingestChatMessage: (message: Partial<ChatMessage> | Record<string, unknown>) => void;
  loadChatHistory: (limit?: number) => Promise<ChatMessage[]>;
  sendChatMessage: (message: string, type?: ChatMessageType) => Promise<void>;
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
  applyRecoverySnapshot: (snapshot: GameRecoveryResponse) => void;

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
    targetPlayerId: undefined,
    currentVotes: 0,
    totalParticipants: 0,
    requiredVotes: undefined,
    results: undefined,
  },
  chatMessages: [],
  chatLoading: false,
  chatError: null,
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

const safeUnsubscribeFromGame = (gameNumber: number | null) => {
  if (gameNumber == null) {
    return;
  }
  try {
    websocketService.unsubscribeFromGame(gameNumber.toString());
  } catch (error) {
    console.warn('[unifiedGameStore] Failed to unsubscribe from game', { gameNumber, error });
  }
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
        addPlayer: (player) => set((state) => {
          const existingIndex = state.players.findIndex(existing => {
            if (existing.id === player.id) {
              return true;
            }
            if (existing.userId != null && player.userId != null && existing.userId === player.userId) {
              return true;
            }
            if (existing.nickname && player.nickname && existing.nickname === player.nickname) {
              return true;
            }
            return false;
          });

          if (existingIndex >= 0) {
            const players = [...state.players];
            players[existingIndex] = { ...players[existingIndex], ...player };
            return { players };
          }

          return { players: [...state.players, player] };
        }),
        removePlayer: (playerId) => set((state) => ({
          players: state.players.filter(p => p.id !== playerId)
        })),
        updatePlayer: (playerId, updates) => set((state) => {
          const players = state.players.map((player) =>
            player.id === playerId ? { ...player, ...updates } : player
          );

          const currentPlayer = state.currentPlayer?.id === playerId
            ? { ...state.currentPlayer, ...updates }
            : state.currentPlayer;

          return {
            players,
            currentPlayer,
          };
        }),

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
            currentVotes: 0,
            totalParticipants: get().players.filter(player => player.isAlive !== false).length,
            requiredVotes: undefined,
            results: undefined,
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
          chatMessages: mergeChatMessages(state.chatMessages, [message])
        })),
        setChatMessages: (chatMessages) => set({
          chatMessages: mergeChatMessages([], chatMessages)
        }),
        ingestChatMessage: (message) => {
          const { players, gameNumber } = get();
          const normalized = normalizeChatMessage(message, players, gameNumber);
          set((state) => ({
            chatMessages: mergeChatMessages(state.chatMessages, [normalized])
          }));
        },
        loadChatHistory: async (limit = 50) => {
          const { gameNumber } = get();
          if (!gameNumber) {
            return [];
          }

          set({ chatLoading: true, chatError: null });
          try {
            const { gameFlowService } = await import('../services/gameFlowService');
            const messages = await gameFlowService.getChatHistory(gameNumber, limit);
            const players = get().players;
            const normalized = messages.map((msg) => normalizeChatMessage(msg, players, gameNumber));
            set({
              chatMessages: mergeChatMessages([], normalized),
              chatLoading: false,
              chatError: null,
            });
            return normalized;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load chat history';
            set({ chatLoading: false, chatError: errorMessage });
            throw error;
          }
        },
        sendChatMessage: async (message, type = 'DISCUSSION') => {
          const trimmed = (message ?? '').trim();
          if (!trimmed) {
            return;
          }

          const { gameNumber, currentPlayer } = get();
          if (!gameNumber) {
            throw new Error('게임 번호가 없습니다.');
          }

          try {
            const nickname = currentPlayer?.nickname ?? useAuthStore.getState().nickname ?? undefined;
            const { websocketService } = await import('../services/websocketService');
            websocketService.sendChatMessage(gameNumber.toString(), trimmed, {
              nickname,
              type,
            });
          } catch (error) {
            console.error('Failed to send chat message:', error);
            throw error;
          }
        },
        clearChat: () => set({
          chatMessages: [],
          chatLoading: false,
          chatError: null,
        }),

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
            const readyState = await gameService.toggleReady(gameNumber);
            set({ isLoading: false });

            const playerId = String(readyState.playerId);
            get().handlePlayerReady(playerId, readyState.isReady);
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

          if (!Array.isArray((gameState as GameStateResponse).players)) {
            console.warn('[unifiedGameStore] Ignoring malformed game state update', gameState);
            return;
          }

          const scoreboard = new Map<number, number>(
            (gameState.scoreboard ?? []).map((entry) => [entry.userId, entry.score])
          );

          const existingPlayers = get().players;
          const isWaitingRoom = gameState.gameState === 'WAITING';
          const auth = getAuthIdentifiers();
          const normalizedYourRole = gameState.yourRole === 'LIAR' || gameState.yourRole === 'CITIZEN'
            ? gameState.yourRole
            : undefined;

          const mappedPlayers = gameState.players.map<Player>((player) => {
            const score = scoreboard.get(player.userId) ?? scoreboard.get(player.id) ?? 0;
            const isDisconnectedState = player.state === 'DISCONNECTED';
            const isOnline = Boolean(player.isOnline);
            const normalizedId = player.id.toString();

            const existingPlayer = existingPlayers.find((candidate) => {
              if (candidate.id === normalizedId) return true;
              if (candidate.userId != null && candidate.userId === player.userId) return true;
              if (candidate.nickname === player.nickname) return true;
              return false;
            });

            const readyState = isWaitingRoom ? (existingPlayer?.isReady ?? false) : false;
            const isSelfPlayer = (
              (auth.userId != null && auth.userId === String(player.userId)) ||
              (auth.nickname != null && auth.nickname === player.nickname)
            );
            const existingRole = existingPlayer?.role;
            const resolvedRole = isSelfPlayer
              ? normalizedYourRole ?? existingRole
              : (existingRole === 'LIAR' || existingRole === 'CITIZEN')
                ? existingRole
                : undefined;

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
              isReady: readyState,
              isConnected: isOnline && !isDisconnectedState,
              isOnline,
              role: resolvedRole,
              votedFor: existingPlayer?.votedFor,
              lastActive: existingPlayer?.lastActive ?? Date.now(),
            };

          });



          const scores = mappedPlayers.reduce<Record<string, number>>((acc, player) => {

            acc[player.id] = player.score;

            return acc;

          }, {});

          const alivePlayersCount = mappedPlayers.filter((player) => player.isAlive !== false).length;



          const turnOrder = (gameState.turnOrder ?? []).map((value) => value.toString());

          const currentTurnIndex = typeof gameState.currentTurnIndex === 'number' ? gameState.currentTurnIndex : undefined;
          const currentTurnPlayerId = currentTurnIndex != null ? turnOrder[currentTurnIndex] : undefined;

          const currentTurnPlayer =
            currentTurnPlayerId != null
              ? mappedPlayers.find(
                  (player) =>
                    player.id === currentTurnPlayerId ||
                    player.userId.toString() === currentTurnPlayerId ||
                    player.nickname === currentTurnPlayerId,
                ) ?? null
              : null;

          const mappedPhase = mapGamePhase(gameState.currentPhase);

          const selfPlayer = findSelfPlayer(mappedPlayers, auth);

          const currentPlayer = selfPlayer ?? currentTurnPlayer;

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

          if (mappedPhase === 'VOTING_FOR_LIAR') {
            set((state) => ({
              voting: {
                ...state.voting,
                isActive: true,
                phase: 'LIAR_VOTE',
                totalParticipants: alivePlayersCount,
                requiredVotes: Math.floor(alivePlayersCount / 2) + 1,
              },
            }));
          } else if (mappedPhase === 'VOTING_FOR_SURVIVAL') {
            set((state) => ({
              voting: {
                ...state.voting,
                isActive: true,
                phase: 'SURVIVAL_VOTE',
                totalParticipants: alivePlayersCount,
              },
            }));
          }



          // Update timer if available
          if (gameState.phaseEndTime) {
            const endTime = new Date(gameState.phaseEndTime).getTime();
            const now = Date.now();
            const timeRemaining = Math.max(0, Math.floor((endTime - now) / 1000));
            const resolvedPhase = mappedPhase ?? get().gamePhase ?? '';

            set((state) => {
              const previousTotal = state.timer.phase === resolvedPhase && state.timer.totalTime >= timeRemaining
                ? state.timer.totalTime
                : Math.max(timeRemaining, state.timer.totalTime ?? timeRemaining);

              return {
                timer: {
                  isActive: timeRemaining > 0,
                  phase: resolvedPhase,
                  totalTime: previousTotal,
                  timeRemaining,
                },
              };
            });
          } else if (mappedPhase === 'WAITING_FOR_PLAYERS') {
            set((state) => ({
              timer: {
                ...state.timer,
                isActive: false,
                timeRemaining: 0,
                phase: mappedPhase,
              },
            }));
          }
        },
        applyRecoverySnapshot: (snapshot) => {
          if (!snapshot) {
            return;
          }

          const scoreboardEntries = snapshot.scoreboard ?? [];
          if (scoreboardEntries.length > 0) {
            const recoveredScores: Record<string, number> = {};
            scoreboardEntries.forEach(entry => {
              recoveredScores[String(entry.userId)] = entry.score;
            });

            set((state) => ({
              scores: { ...state.scores, ...recoveredScores },
            }));
          }

          if (typeof snapshot.gameCurrentRound === 'number' && snapshot.gameCurrentRound > 0) {
            set((state) => ({
              currentRound: snapshot.gameCurrentRound,
              totalRounds: Math.max(state.totalRounds, snapshot.gameCurrentRound),
            }));
          }

          let recoveryPhase: ReturnType<typeof mapGamePhase> | null = null;
          if (snapshot.currentPhase) {
            recoveryPhase = mapGamePhase(snapshot.currentPhase);
            set({ gamePhase: recoveryPhase });
            get().setRoundStage(mapPhaseToStage(recoveryPhase), { force: true });
          }

          if (recoveryPhase === 'VOTING_FOR_LIAR' || recoveryPhase === 'VOTING_FOR_SURVIVAL') {
            const aliveFromScoreboard = (snapshot.scoreboard ?? []).filter((entry) => entry.isAlive !== false).length;
            const aliveFallback = get().players.filter((player) => player.isAlive !== false).length;
            const resolvedAlive = aliveFromScoreboard || aliveFallback;

            set((state) => ({
              voting: {
                ...state.voting,
                isActive: true,
                phase: recoveryPhase === 'VOTING_FOR_LIAR' ? 'LIAR_VOTE' : 'SURVIVAL_VOTE',
                totalParticipants: resolvedAlive,
                requiredVotes: recoveryPhase === 'VOTING_FOR_LIAR'
                  ? Math.floor(resolvedAlive / 2) + 1
                  : state.voting.requiredVotes,
              },
            }));
          }

          const defenseSnapshot = snapshot.defense;
          if (defenseSnapshot?.defenseText && defenseSnapshot.accusedPlayerId != null) {
            const defenderId = String(defenseSnapshot.accusedPlayerId);
            const defenderName = defenseSnapshot.accusedPlayerNickname ?? 'Unknown';
            const hasExisting = get().defenses.some(
              (entry) => entry.defenderId === defenderId && entry.defense === defenseSnapshot.defenseText
            );
            if (!hasExisting) {
              get().addDefense(defenderId, defenderName, defenseSnapshot.defenseText);
            }
          }

          if (defenseSnapshot?.hasActiveFinalVoting) {
            set((state) => ({
              voting: {
                ...state.voting,
                isActive: true,
                phase: 'SURVIVAL_VOTE',
              },
            }));
          }

          const finalRecords = snapshot.finalVotingRecord?.length
            ? snapshot.finalVotingRecord
            : defenseSnapshot?.finalVotingRecord;

          if (finalRecords && finalRecords.length > 0) {
            const votes = finalRecords.reduce<Record<string, number>>((acc, record) => {
              const key = record.voteForExecution ? 'EXECUTION' : 'SURVIVAL';
              acc[key] = (acc[key] ?? 0) + 1;
              return acc;
            }, {});

            set((state) => ({
              voting: {
                ...state.voting,
                results: {
                  votes,
                },
              },
            }));
          }

          if (snapshot.phaseEndTime) {
            const endTime = new Date(snapshot.phaseEndTime).getTime();
            const now = Date.now();
            const timeRemaining = Math.max(0, Math.floor((endTime - now) / 1000));
            const targetPhase = recoveryPhase ?? get().gamePhase ?? '';

            set((state) => {
              const previousTotal = state.timer.phase === targetPhase && state.timer.totalTime >= timeRemaining
                ? state.timer.totalTime
                : Math.max(timeRemaining, state.timer.totalTime ?? timeRemaining);

              return {
                timer: {
                  isActive: timeRemaining > 0,
                  phase: targetPhase,
                  totalTime: previousTotal,
                  timeRemaining,
                },
              };
            });
          }
        },

        // Event Handlers
        handleGameEvent: (event: GameEvent) => {
          const state = get();

          const resolvePlayerIdByIdentifier = (identifier: unknown): string | null => {
            if (identifier == null) {
              return null;
            }
            const normalized = String(identifier);
            const players = get().players;
            const match = players.find((player) => {
              if (player.id === normalized) return true;
              if (player.userId != null && String(player.userId) === normalized) return true;
              if (player.nickname === normalized) return true;
              return false;
            });
            return match?.id ?? null;
          };

          const updatePlayerByIdentifier = (identifier: unknown, updates: Partial<Player>) => {
            const targetId = resolvePlayerIdByIdentifier(identifier);
            if (targetId) {
              get().updatePlayer(targetId, updates);
            }
          };

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

              const normalizedRole = payload.role === 'CITIZEN' || payload.role === 'LIAR' ? payload.role : undefined;

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
                role: normalizedRole,
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

            case 'PLAYER_DISCONNECTED': {
              const payload = event.payload as any;
              const identifier = payload?.userId ?? payload?.playerId ?? payload?.nickname ?? payload?.playerName;
              updatePlayerByIdentifier(identifier, {
                isConnected: false,
                isOnline: false,
                lastActive: Date.now(),
              });
              break;
            }

            case 'PLAYER_RECONNECTED': {
              const payload = event.payload as any;
              const identifier = payload?.userId ?? payload?.playerId ?? payload?.nickname ?? payload?.playerName;
              updatePlayerByIdentifier(identifier, {
                isConnected: true,
                isOnline: true,
                lastActive: Date.now(),
              });
              break;
            }

            case 'GRACE_PERIOD_STARTED': {
              const payload = event.payload as any;
              const identifier = payload?.userId ?? payload?.playerId ?? payload?.nickname ?? payload?.playerName;
              updatePlayerByIdentifier(identifier, {
                isConnected: false,
                isOnline: false,
                lastActive: Date.now(),
              });
              break;
            }

            case 'GRACE_PERIOD_EXPIRED': {
              const payload = event.payload as any;
              const identifier = payload?.userId ?? payload?.playerId ?? payload?.nickname ?? payload?.playerName;
              updatePlayerByIdentifier(identifier, {
                isConnected: false,
                isOnline: false,
                lastActive: Date.now(),
              });
              break;
            }

            case 'PLAYER_READY_CHANGED':
            case 'PLAYER_READY_UPDATE': {
              const payload = event.payload as any;
              const identifier = payload?.userId ?? payload?.playerId ?? payload?.nickname ?? payload?.playerName;
              updatePlayerByIdentifier(identifier, {
                isReady: Boolean(payload?.isReady),
                lastActive: Date.now(),
              });
              break;
            }

            case 'OWNER_KICKED_AND_TRANSFERRED': {
              const payload = event.payload as any;
              const kicked = payload?.kickedOwner ?? payload?.kickedPlayer ?? payload?.previousOwner;
              const promoted = payload?.newOwner ?? payload?.nextOwner ?? payload?.newHost;
              if (kicked) {
                updatePlayerByIdentifier(kicked, { isHost: false });
              }
              if (promoted) {
                updatePlayerByIdentifier(promoted, { isHost: true });
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
                voting: {
                  isActive: false,
                  phase: null,
                  votes: {},
                  targetPlayerId: undefined,
                  currentVotes: 0,
                  totalParticipants: state.players.filter((player) => player.isAlive !== false).length,
                  requiredVotes: undefined,
                  results: undefined,
                },
                userVote: null,
              });

              get().setGamePhase('SPEECH');
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

            case 'VOTING_START': {
              const payload = event.payload as VotingStartMessage;
              const participantCount = Array.isArray(payload.availablePlayers) ? payload.availablePlayers.length : get().players.filter((player) => player.isAlive !== false).length;
              const requiredVotes = participantCount > 0 ? Math.floor(participantCount / 2) + 1 : undefined;

              set((state) => ({
                voting: {
                  ...state.voting,
                  isActive: true,
                  phase: 'LIAR_VOTE',
                  votes: {},
                  targetPlayerId: undefined,
                  results: undefined,
                  currentVotes: 0,
                  totalParticipants: participantCount,
                  requiredVotes,
                },
              }));

              if (typeof payload.votingTimeLimit === 'number' && payload.votingTimeLimit > 0) {
                get().startTimer(payload.votingTimeLimit, 'VOTING_FOR_LIAR');
              }
              get().setGamePhase('VOTING_FOR_LIAR');
              get().setRoundStage('vote', { force: true });
              break;
            }

            case 'VOTING_PROGRESS': {
              const payload = event.payload as VotingProgressMessage;
              const total = payload.totalCount ?? get().voting.totalParticipants ?? get().players.filter((player) => player.isAlive !== false).length;
              const requiredVotes = total && total > 0 ? Math.floor(total / 2) + 1 : get().voting.requiredVotes;

              set((state) => ({
                voting: {
                  ...state.voting,
                  isActive: true,
                  phase: 'LIAR_VOTE',
                  currentVotes: payload.votedCount ?? state.voting.currentVotes ?? 0,
                  totalParticipants: total ?? state.voting.totalParticipants,
                  requiredVotes: requiredVotes ?? state.voting.requiredVotes,
                },
              }));
              break;
            }

            case 'FINAL_VOTING_START': {
              const payload = event.payload as FinalVotingStartMessage;
              const targetId = payload.accusedPlayerId != null ? String(payload.accusedPlayerId) : undefined;
              const total = get().players.filter((player) => player.isAlive !== false).length;

              set((state) => ({
                voting: {
                  ...state.voting,
                  isActive: true,
                  phase: 'SURVIVAL_VOTE',
                  votes: {},
                  targetPlayerId: targetId,
                  results: undefined,
                  currentVotes: 0,
                  totalParticipants: total,
                  requiredVotes: undefined,
                },
              }));

              if (typeof payload.votingTimeLimit === 'number' && payload.votingTimeLimit > 0) {
                get().startTimer(payload.votingTimeLimit, 'VOTING_FOR_SURVIVAL');
              }
              get().setGamePhase('VOTING_FOR_SURVIVAL');
              get().setRoundStage('vote', { force: true });
              break;
            }

            case 'FINAL_VOTING_PROGRESS': {
              const payload = event.payload as FinalVotingProgressMessage;
              const total = payload.totalCount ?? get().voting.totalParticipants ?? get().players.filter((player) => player.isAlive !== false).length;

              set((state) => ({
                voting: {
                  ...state.voting,
                  isActive: true,
                  phase: 'SURVIVAL_VOTE',
                  currentVotes: payload.votedCount ?? state.voting.currentVotes ?? 0,
                  totalParticipants: total ?? state.voting.totalParticipants,
                },
              }));
              break;
            }

            case 'ROUND_ENDED': {
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

            case 'TURN_CHANGED': {
              const payload = event.payload as TurnChangedPayload;
              const resolvedPlayerId = payload.currentPlayerId != null
                ? resolvePlayerByIdentifier(payload.currentPlayerId)
                : null;

              if (resolvedPlayerId) {
                set({ currentTurnPlayerId: resolvedPlayerId });
                const player = state.players.find((candidate) => candidate.id === resolvedPlayerId);
                if (player) {
                  set({ currentPlayer: player });
                }
              }

              const configuredTotal = typeof payload.turnTimeoutSeconds === 'number' && payload.turnTimeoutSeconds > 0
                ? payload.turnTimeoutSeconds
                : DEFAULT_TURN_TIME_SECONDS;

              const phaseEndTimestamp = typeof payload.phaseEndTime === 'string'
                ? Date.parse(payload.phaseEndTime)
                : Number.NaN;

              let timeRemaining = configuredTotal;
              if (!Number.isNaN(phaseEndTimestamp)) {
                timeRemaining = Math.max(0, Math.floor((phaseEndTimestamp - Date.now()) / 1000));
              } else if (payload.turnStartedAt) {
                const startedAt = Date.parse(payload.turnStartedAt);
                if (!Number.isNaN(startedAt)) {
                  const elapsed = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
                  timeRemaining = Math.max(0, configuredTotal - elapsed);
                }
              }

              set({
                timer: {
                  isActive: true,
                  totalTime: configuredTotal,
                  timeRemaining,
                  phase: 'SPEECH',
                },
              });

              get().setGamePhase('SPEECH');
              get().setRoundStage('speech', { force: true });
              break;
            }

            case 'FINAL_VOTING_RESULT': {
              const payload = event.payload as FinalVotingResultResponse;
              const votesRecord: Record<string, number> = {
                EXECUTION: payload.executionVotes,
                SURVIVAL: payload.survivalVotes,
              };

              set((state) => ({
                voting: {
                  ...state.voting,
                  isActive: false,
                  currentVotes: payload.executionVotes + payload.survivalVotes,
                  totalParticipants: payload.totalVotes,
                  results: {
                    votes: votesRecord,
                    winners: payload.isExecuted ? ['CITIZENS'] : ['LIARS'],
                    actualLiar: state.currentLiar ?? undefined,
                  },
                },
              }));
              get().setRoundStage('results', { force: true });
              break;
            }

            case 'NEXT_ROUND': {
              const payload = (event.payload ?? event) as NextRoundResponse;
              const nextRound = typeof payload.currentRound === 'number' ? payload.currentRound : state.currentRound + 1;
              set({ currentRound: nextRound });

              set({
                roundHasStarted: false,
                currentRoundSummary: null,
                hints: [],
                votes: [],
                defenses: [],
                voting: {
                  isActive: false,
                  phase: null,
                  votes: {},
                  targetPlayerId: undefined,
                  currentVotes: 0,
                  totalParticipants: state.players.filter((player) => player.isAlive !== false).length,
                  requiredVotes: undefined,
                  results: undefined,
                },
                userVote: null,
              });

              get().setGamePhase('SPEECH');
              get().setRoundStage('speech', { force: true });
              get().stopTimer();

              if (payload.message) {
                toast.success(`라운드 ${nextRound}가 시작됩니다.`, {
                  description: payload.message,
                });
              }
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
          get().ingestChatMessage(message);
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
        resetGame: () => {
          const currentGameNumber = get().gameNumber;
          safeUnsubscribeFromGame(currentGameNumber);
          set({ ...initialState, typingPlayers: new Set() });
        },
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
          chatLoading: false,
          chatError: null,
          scores: {},
          userVote: null,
          voting: {
            isActive: false,
            phase: null,
            votes: {},
            targetPlayerId: undefined,
            currentVotes: 0,
            totalParticipants: 0,
            requiredVotes: undefined,
            results: undefined,
          }
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

