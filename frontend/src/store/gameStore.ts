import {create} from 'zustand'
import {devtools, persist} from 'zustand/middleware'
import type {ChatMessage, ConnectionState} from '@/api/websocket'

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
  votes: Record<string, string> // playerId -> targetId
  targetPlayerId?: string
  results?: {
    votes: Record<string, number>
    actualLiar?: string
    winners?: string[]
  }
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
  gameResults: any[] | null
  
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
  setGameResults: (results: any[]) => void
  
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
  
  // WebSocket Event Handlers
  handleGameStateUpdate: (update: any) => void
  handlePlayerJoined: (player: Player) => void
  handlePlayerLeft: (playerId: string) => void
  handlePlayerReady: (playerId: string, ready: boolean) => void
  handlePhaseChange: (phase: GameState['gamePhase']) => void
  handleTimerUpdate: (timeRemaining: number) => void
  handleVoteUpdate: (votes: Record<string, string>) => void
  handleChatMessage: (message: ChatMessage) => void
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
        
        // WebSocket Event Handlers
        handleGameStateUpdate: (update) => set((state) => {
          const newState: Partial<GameState> = {}
          
          if (update.gameState) newState.gamePhase = update.gameState
          if (update.players) newState.players = update.players
          if (update.currentRound !== undefined) newState.currentRound = update.currentRound
          if (update.currentTurnPlayerId) newState.currentTurnPlayerId = update.currentTurnPlayerId
          if (update.timeRemaining !== undefined) {
            newState.timer = {
              ...state.timer,
              timeRemaining: update.timeRemaining,
              isActive: update.timeRemaining > 0
            }
          }
          
          return newState
        }),
        
        handlePlayerJoined: (player) => {
          const state = get()
          if (!state.players.find(p => p.id === player.id)) {
            set((state) => ({ players: [...state.players, player] }))
          }
        },
        
        handlePlayerLeft: (playerId) => set((state) => ({
          players: state.players.filter(p => p.id !== playerId)
        })),
        
        handlePlayerReady: (playerId, ready) => set((state) => ({
          players: state.players.map(p => 
            p.id === playerId ? { ...p, isReady: ready } : p
          )
        })),
        
        handlePhaseChange: (phase) => set({ gamePhase: phase }),
        
        handleTimerUpdate: (timeRemaining) => set((state) => ({
          timer: {
            ...state.timer,
            timeRemaining,
            isActive: timeRemaining > 0
          }
        })),
        
        handleVoteUpdate: (votes) => set((state) => ({
          voting: { ...state.voting, votes }
        })),
        
        handleChatMessage: (message) => set((state) => ({
          chatMessages: [...state.chatMessages, message]
        })),
      }),
      {
        name: 'liar-game-store',
        partialize: (state) => ({ 
          currentPlayer: state.currentPlayer,
          gameId: state.gameId,
          gameNumber: state.gameNumber,
          sessionCode: state.sessionCode
        }),
      }
    )
  )
)