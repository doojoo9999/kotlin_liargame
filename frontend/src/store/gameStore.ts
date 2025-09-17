import {create} from 'zustand';
import {devtools, persist} from 'zustand/middleware';
import {gameService} from '../api/gameApi';
import type {GameMode} from '../types/game';
import type {CreateGameRequest, GameStateResponse} from '../types/backendTypes';
import type {GameRoomInfo, JoinGameRequest} from '../types/api';
import type {ChatMessage, ConnectionState} from '@/api/websocket';

export interface Player {
  id: string
  nickname: string
  isReady: boolean
  isHost: boolean
  isOnline: boolean
  isAlive?: boolean
  role?: 'civilian' | 'liar'
  votedFor?: string
  hasVoted?: boolean
}

export interface GameTimer {
  isActive: boolean
  timeRemaining: number
  totalTime: number
  phase: string
}

export interface VotingState {
  isActive: boolean
  phase: 'LIAR_VOTE' | 'SURVIVAL_VOTE' | null
  votes: Record<string, string>
  targetPlayerId?: string
  results?: {
    votes: Record<string, number>
    actualLiar?: string
    winners?: string[]
  }
}

export interface GameResults {
  liarId: string
  liarName: string
  topic: string
  votes: Record<string, number>
  liarWon: boolean
  roundScores: Record<string, number>
}

export interface GameState {
  // Game Session
  gameId: string | null
  gameNumber: number | null
  sessionCode: string | null
  players: Player[]
  currentPlayer: Player | null
  gamePhase: 'WAITING_FOR_PLAYERS' | 'SPEECH' | 'VOTING_FOR_LIAR' | 'DEFENDING' | 'VOTING_FOR_SURVIVAL' | 'GUESSING_WORD' | 'GAME_OVER'

  // Game Settings
  maxPlayers: number
  timeLimit: number
  currentRound: number
  totalRounds: number
  currentTurnPlayerId?: string
  turnOrder: string[]

  // Game Logic
  currentTopic: string | null
  currentWord: string | null
  currentLiar: string | null
  userVote: string | null
  gameResults: GameResults[] | null

  // Real-time Features
  timer: GameTimer
  voting: VotingState
  chatMessages: ChatMessage[]
  typingPlayers: Set<string>

  // Connection State
  connectionState: ConnectionState
  reconnectAttempts: number
  isLoading: boolean
  error: string | null

  // 백엔드 API 연동을 위한 새로운 상태
  gameList: GameRoomInfo[]
  gameListLoading: boolean
  gameListError: string | null
  availableGameModes: GameMode[]
  currentGameState: GameStateResponse | null
}

interface GameActions {
  // Session Actions
  setGameId: (gameId: string) => void
  setGameNumber: (gameNumber: number) => void
  setSessionCode: (code: string) => void
  setCurrentPlayer: (player: Player) => void
  updatePlayers: (players: Player[]) => void
  addPlayer: (player: Player) => void
  removePlayer: (playerId: string) => void
  updatePlayer: (playerId: string, updates: Partial<Player>) => void

  // Game Flow Actions
  setGamePhase: (phase: GameState['gamePhase']) => void
  setCurrentTopic: (topic: string) => void
  setCurrentWord: (word: string) => void
  setCurrentLiar: (liarId: string) => void
  setCurrentTurnPlayer: (playerId: string) => void
  setTurnOrder: (order: string[]) => void
  setUserVote: (vote: string) => void
  setGameResults: (results: GameResults[]) => void

  // Timer Actions
  updateTimer: (timer: Partial<GameTimer>) => void
  startTimer: (totalTime: number, phase: string) => void
  stopTimer: () => void

  // Voting Actions
  startVoting: (phase: 'LIAR_VOTE' | 'SURVIVAL_VOTE', targetPlayerId?: string) => void
  stopVoting: () => void
  addVote: (playerId: string, targetId: string) => void
  setVotingResults: (results: VotingState['results']) => void

  // Chat Actions
  addChatMessage: (message: ChatMessage) => void
  setChatMessages: (messages: ChatMessage[]) => void
  clearChat: () => void

  // Typing Indicators
  addTypingPlayer: (playerId: string) => void
  removeTypingPlayer: (playerId: string) => void
  clearTypingPlayers: () => void

  // Connection Actions
  setConnectionState: (state: ConnectionState) => void
  setReconnectAttempts: (attempts: number) => void

  // Settings Actions
  updateGameSettings: (settings: Partial<Pick<GameState, 'maxPlayers' | 'timeLimit' | 'totalRounds'>>) => void

  // UI Actions
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Reset Actions
  resetGame: () => void
  resetVote: () => void

  // 백엔드 API 연동 액션들
  fetchGameList: (page?: number, size?: number) => Promise<void>
  createGame: (gameData: CreateGameRequest) => Promise<GameStateResponse>
  joinGame: (joinData: JoinGameRequest) => Promise<GameStateResponse>
  leaveGame: () => Promise<void>
  startGame: () => Promise<void>
  toggleReady: () => Promise<void>
  fetchGameModes: () => Promise<void>
  refreshGameState: () => Promise<void>

  // 상태 업데이트 액션들
  setGameList: (games: GameRoomInfo[]) => void
  setGameListLoading: (loading: boolean) => void
  setGameListError: (error: string | null) => void
  setAvailableGameModes: (modes: GameMode[]) => void
  setCurrentGameState: (state: GameStateResponse) => void
  updateFromGameState: (gameState: GameStateResponse) => void

  // WebSocket Event Handlers
  handleGameStateUpdate: (update: unknown) => void
  handlePlayerJoined: (player: Player) => void
  handlePlayerLeft: (playerId: string) => void
  handlePlayerReady: (playerId: string, ready: boolean) => void
  handlePhaseChange: (phase: GameState['gamePhase']) => void
  handleTimerUpdate: (timeRemaining: number) => void
  handleVoteUpdate: (votes: Record<string, string>) => void
  handleChatMessage: (message: ChatMessage) => void

  // WebSocket Connection Management
  connectWebSocket: () => Promise<void>
  disconnectWebSocket: () => void
  setConnectionError: (error: string | null) => void
}

type GameStore = GameState & GameActions

const initialState: GameState = {
  gameId: null,
  gameNumber: null,
  sessionCode: null,
  players: [],
  currentPlayer: null,
  gamePhase: 'WAITING_FOR_PLAYERS',

  maxPlayers: 6,
  timeLimit: 120,
  currentRound: 0,
  totalRounds: 3,
  currentTurnPlayerId: undefined,
  turnOrder: [],

  currentTopic: null,
  currentWord: null,
  currentLiar: null,
  userVote: null,
  gameResults: null,

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

  connectionState: 'disconnected',
  reconnectAttempts: 0,
  isLoading: false,
  error: null,

  // 백엔드 API 연동을 위한 새로운 상태
  gameList: [],
  gameListLoading: false,
  gameListError: null,
  availableGameModes: [],
  currentGameState: null,
}

// 게임 상태 매핑 헬퍼 함수
const mapGamePhase = (gameState: string): GameState['gamePhase'] => {
  switch (gameState) {
    case 'WAITING':
      return 'WAITING_FOR_PLAYERS'
    case 'IN_PROGRESS':
      return 'SPEECH'
    case 'ENDED':
      return 'GAME_OVER'
    default:
      return 'WAITING_FOR_PLAYERS'
  }
}

export const useGameStore = create<GameStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Session Actions
        setGameId: (gameId) => set({ gameId }),
        setGameNumber: (gameNumber) => set({ gameNumber }),
        setSessionCode: (sessionCode) => set({ sessionCode }),
        setCurrentPlayer: (currentPlayer) => set({ currentPlayer }),
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

        // Game Flow Actions
        setGamePhase: (gamePhase) => set({ gamePhase }),
        setCurrentTopic: (currentTopic) => set({ currentTopic }),
        setCurrentWord: (currentWord) => set({ currentWord }),
        setCurrentLiar: (currentLiar) => set({ currentLiar }),
        setCurrentTurnPlayer: (currentTurnPlayerId) => set({ currentTurnPlayerId }),
        setTurnOrder: (turnOrder) => set({ turnOrder }),
        setUserVote: (userVote) => set({ userVote }),
        setGameResults: (gameResults) => set({ gameResults }),

        // Timer Actions
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

        // Voting Actions
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
        addVote: (playerId, targetId) => set((state) => ({
          voting: {
            ...state.voting,
            votes: { ...state.voting.votes, [playerId]: targetId }
          }
        })),
        setVotingResults: (results) => set((state) => ({
          voting: { ...state.voting, results }
        })),

        // Chat Actions
        addChatMessage: (message) => set((state) => ({
          chatMessages: [...state.chatMessages, message]
        })),
        setChatMessages: (chatMessages) => set({ chatMessages }),
        clearChat: () => set({ chatMessages: [] }),

        // Typing Indicators
        addTypingPlayer: (playerId) => set((state) => ({
          typingPlayers: new Set([...state.typingPlayers, playerId])
        })),
        removeTypingPlayer: (playerId) => set((state) => {
          const newSet = new Set(state.typingPlayers)
          newSet.delete(playerId)
          return { typingPlayers: newSet }
        }),
        clearTypingPlayers: () => set({ typingPlayers: new Set() }),

        // Connection Actions
        setConnectionState: (connectionState) => set({ connectionState }),
        setReconnectAttempts: (reconnectAttempts) => set({ reconnectAttempts }),

        // Settings Actions
        updateGameSettings: (settings) => set((state) => ({ ...state, ...settings })),

        // UI Actions
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),

        // Reset Actions
        resetGame: () => set({ ...initialState, typingPlayers: new Set() }),
        resetVote: () => set({ userVote: null }),

        // 백엔드 API 연동 액션들
        fetchGameList: async (page = 0, size = 10) => {
          set({ gameListLoading: true, gameListError: null })
          try {
            const response = await gameService.getGameList(page, size)
            // Handle both possible response formats
            const gameList = response.games ? response.games : (response.data || [])
            set({ gameList, gameListLoading: false })
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch game list'
            set({ gameListLoading: false, gameListError: errorMessage })
          }
        },

        createGame: async (gameData) => {
          set({ isLoading: true, error: null })
          try {
            const gameState = await gameService.createGame(gameData)
            set({
              isLoading: false,
              currentGameState: gameState,
              gameNumber: gameState.gameNumber,
              gameId: gameState.gameNumber.toString()
            })
            get().updateFromGameState(gameState)
            return gameState
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create game'
            set({ isLoading: false, error: errorMessage })
            throw error
          }
        },

        joinGame: async (joinData) => {
          set({ isLoading: true, error: null })
          try {
            const payload = {
              gameNumber: joinData.gameNumber,
              gamePassword: joinData.gamePassword ?? (joinData as any).password ?? undefined,
              nickname: (joinData as any).nickname
            }
            const gameState = await gameService.joinGame(payload)
            set({
              isLoading: false,
              currentGameState: gameState,
              gameNumber: gameState.gameNumber,
              gameId: gameState.gameNumber.toString()
            })
            get().updateFromGameState(gameState)
            return gameState
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to join game'
            set({ isLoading: false, error: errorMessage })
            throw error
          }
        },

        leaveGame: async () => {
          const { gameNumber } = get()
          if (!gameNumber) return

          set({ isLoading: true, error: null })
          try {
            await gameService.leaveGame(gameNumber)
            set({ isLoading: false })
            get().resetGame()
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to leave game'
            set({ isLoading: false, error: errorMessage })
            throw error
          }
        },

        startGame: async () => {
          const { gameNumber } = get()
          if (!gameNumber) return

          set({ isLoading: true, error: null })
          try {
            const gameState = await gameService.startGame(gameNumber)
            set({ isLoading: false, currentGameState: gameState })
            get().updateFromGameState(gameState)
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to start game'
            set({ isLoading: false, error: errorMessage })
            throw error
          }
        },

        toggleReady: async () => {
          const { gameNumber } = get()
          if (!gameNumber) return

          set({ isLoading: true, error: null })
          try {
            const gameState = await gameService.toggleReady(gameNumber)
            set({ isLoading: false, currentGameState: gameState })
            get().updateFromGameState(gameState)
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to toggle ready state'
            set({ isLoading: false, error: errorMessage })
            throw error
          }
        },

        fetchGameModes: async () => {
          try {
            const modes = await gameService.getAvailableGameModes()
            set({ availableGameModes: modes })
          } catch (error) {
            console.error('Failed to fetch game modes:', error)
          }
        },

        refreshGameState: async () => {
          const { gameNumber } = get()
          if (!gameNumber) return

          try {
            const gameState = await gameService.getGameState(gameNumber)
            set({ currentGameState: gameState })
            get().updateFromGameState(gameState)
          } catch (error) {
            console.error('Failed to refresh game state:', error)
          }
        },

        // 상태 업데이트 액션들
        setGameList: (gameList) => set({ gameList }),
        setGameListLoading: (gameListLoading) => set({ gameListLoading }),
        setGameListError: (gameListError) => set({ gameListError }),
        setAvailableGameModes: (availableGameModes) => set({ availableGameModes }),
        setCurrentGameState: (currentGameState) => set({ currentGameState }),

        updateFromGameState: (gameState) => {
          const mappedPlayers = gameState.data.players.map(p => ({
            id: p.id.toString(),
            nickname: p.nickname,
            isReady: p.isReady,
            isHost: p.isHost,
            isOnline: p.isOnline,
            isAlive: true, // Default value since not provided by API
            role: undefined as 'civilian' | 'liar' | undefined, // Default value
          }))

          set({
            gamePhase: mapGamePhase(gameState.data.gameState),
            players: mappedPlayers,
            currentRound: gameState.data.currentRound,
            totalRounds: gameState.data.totalRounds,
            maxPlayers: gameState.data.players.length, // Derive from current players
            timeRemaining: gameState.data.timeRemaining,
          })
        },

        // WebSocket Event Handlers
        handleGameStateUpdate: (update: unknown) => {
          console.log('Game state update received:', update)
          if (update && typeof update === 'object' && 'gameState' in update) {
            get().updateFromGameState(update.gameState as GameStateResponse)
          }
        },

        handlePlayerJoined: (player) => {
          get().addPlayer(player)
        },

        handlePlayerLeft: (playerId) => {
          get().removePlayer(playerId)
        },

        handlePlayerReady: (playerId, ready) => {
          get().updatePlayer(playerId, { isReady: ready })
        },

        handlePhaseChange: (phase) => {
          get().setGamePhase(phase)
        },

        handleTimerUpdate: (timeRemaining) => {
          set((state) => ({
            timer: { ...state.timer, timeRemaining }
          }))
        },

        handleVoteUpdate: (votes) => {
          set((state) => ({
            voting: { ...state.voting, votes }
          }))
        },

        handleChatMessage: (message) => {
          get().addChatMessage(message)
        },

        // WebSocket Connection Management
        connectWebSocket: async () => {
          set({ connectionState: 'connecting', error: null })
          try {
            const { websocketService } = await import('../services/websocketService')
            await websocketService.connect()
            set({ connectionState: 'connected' })
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Connection failed'
            set({ connectionState: 'disconnected', error: errorMessage })
            throw error
          }
        },

        disconnectWebSocket: () => {
          const { websocketService } = require('../services/websocketService')
          websocketService.disconnect()
          set({ connectionState: 'disconnected' })
        },

        setConnectionError: (error) => {
          set({ error })
        },
      }),
      {
        name: 'game-store',
        partialize: (state) => ({
          gameId: state.gameId,
          gameNumber: state.gameNumber,
          sessionCode: state.sessionCode,
          maxPlayers: state.maxPlayers,
          timeLimit: state.timeLimit,
          totalRounds: state.totalRounds,
        }),
      }
    ),
    {
      name: 'game-store',
    }
  )
)
