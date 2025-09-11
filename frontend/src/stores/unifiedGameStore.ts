import {create} from 'zustand';
import {devtools, persist} from 'zustand/middleware';
import {gameService} from '../api/gameApi';
import type {CreateGameRequest, GameMode, GameRoomInfo, GameStateResponse, JoinGameRequest} from '../types/game';
import type {ChatMessage} from '../types/realtime';

// Unified Player interface
export interface Player {
  id: string;
  nickname: string;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  isAlive: boolean;
  role?: 'civilian' | 'liar';
  score: number;
  votedFor?: string;
  hasVoted?: boolean;
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
  handleGameEvent: (event: any) => void;
  handleChatMessage: (message: ChatMessage) => void;
  handlePlayerJoined: (player: Player) => void;
  handlePlayerLeft: (playerId: string) => void;
  handlePlayerReady: (playerId: string, ready: boolean) => void;
  handlePhaseChange: (phase: GameState['gamePhase']) => void;
  handleTimerUpdate: (timeRemaining: number) => void;
  handleVoteUpdate: (votes: Record<string, string>) => void;

  // Reset Actions
  resetGame: () => void;
  resetVote: () => void;
  resetGameData: () => void;
}

type UnifiedGameStore = GameState & GameActions;

// Helper function to map backend game state
const mapGamePhase = (gameState: string): GameState['gamePhase'] => {
  switch (gameState) {
    case 'WAITING':
      return 'WAITING_FOR_PLAYERS';
    case 'SPEECH':
      return 'SPEECH';
    case 'VOTING_FOR_LIAR':
      return 'VOTING_FOR_LIAR';
    case 'DEFENDING':
      return 'DEFENDING';
    case 'VOTING_FOR_SURVIVAL':
      return 'VOTING_FOR_SURVIVAL';
    case 'GUESSING_WORD':
      return 'GUESSING_WORD';
    case 'ENDED':
      return 'GAME_OVER';
    default:
      return 'WAITING_FOR_PLAYERS';
  }
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
        setGamePhase: (gamePhase) => set({ gamePhase }),
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
            // Import websocket service dynamically to avoid circular deps
            const { websocketService } = await import('../services/websocketService');
            websocketService.sendChatMessage(gameNumber.toString(), message);
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
            const gameList = response.games || response.data || [];
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
            const gameState = await gameService.createGame(gameData);
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
            const gameState = await gameService.joinGame(joinData);
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
            const gameState = await gameService.startGame(gameNumber);
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
          if (!gameState.data) return;

          const mappedPlayers = gameState.data.players.map(p => ({
            id: p.id.toString(),
            nickname: p.nickname,
            isHost: p.isHost,
            isReady: p.isReady,
            isConnected: p.isOnline,
            isAlive: true,
            role: undefined as 'civilian' | 'liar' | undefined,
            score: 0, // Will be updated from scores if available
          }));

          set({
            gamePhase: mapGamePhase(gameState.data.gameState),
            players: mappedPlayers,
            currentRound: gameState.data.currentRound,
            totalRounds: gameState.data.totalRounds,
            maxPlayers: gameState.data.maxPlayers || mappedPlayers.length,
          });

          // Update timer if available
          if (gameState.data.timeRemaining !== undefined) {
            set((state) => ({
              timer: {
                ...state.timer,
                timeRemaining: gameState.data.timeRemaining
              }
            }));
          }
        },

        // Event Handlers
        handleGameEvent: (event) => {
          const state = get();
          
          switch (event.type) {
            case 'PLAYER_JOINED':
              get().addPlayer({
                id: event.payload.playerId,
                nickname: event.payload.playerName,
                isHost: event.payload.isHost || false,
                isReady: false,
                isConnected: true,
                isAlive: true,
                score: 0
              });
              break;

            case 'PLAYER_LEFT':
              get().removePlayer(event.payload.playerId);
              break;

            case 'GAME_STARTED':
              set({
                gamePhase: 'SPEECH',
                currentRound: event.payload.currentRound
              });
              break;

            case 'ROUND_STARTED':
              set({
                currentTopic: event.payload.category,
                currentWord: event.payload.word,
                isLiar: event.payload.liarId === state.currentPlayer?.id,
                currentLiar: event.payload.liarId,
                hints: [],
                votes: [],
                defenses: []
              });
              
              if (event.payload.timeLimit) {
                get().startTimer(event.payload.timeLimit, 'SPEECH');
              }
              break;

            case 'HINT_PROVIDED':
              get().addHint(
                event.payload.playerId,
                event.payload.playerName,
                event.payload.hint
              );
              break;

            case 'VOTE_CAST':
              get().addVote(
                event.payload.voterId,
                event.payload.voterName,
                event.payload.targetId,
                event.payload.targetName
              );
              break;

            case 'DEFENSE_SUBMITTED':
              get().addDefense(
                event.payload.defenderId,
                event.payload.defenderName,
                event.payload.defense
              );
              break;

            case 'ROUND_ENDED':
              set({ gamePhase: 'GAME_OVER' });
              
              // Update scores
              if (event.payload.scores) {
                const newScores: Record<string, number> = {};
                event.payload.scores.forEach((scoreInfo: any) => {
                  newScores[scoreInfo.playerId] = scoreInfo.score;
                });
                set({ scores: newScores });
              }
              break;

            case 'GAME_STATE_UPDATED':
              set({
                gamePhase: mapGamePhase(event.payload.state)
              });
              
              if (event.payload.timeRemaining !== undefined) {
                set((state) => ({
                  timer: {
                    ...state.timer,
                    timeRemaining: event.payload.timeRemaining
                  }
                }));
              }
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