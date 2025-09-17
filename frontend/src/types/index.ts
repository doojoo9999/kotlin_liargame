// Unified Type System - Central export point for all types
// This file consolidates and re-exports all type definitions to prevent duplicates

// Core game types (aligned with backend)
export * from './game'
export * from './backendTypes'

// Additional frontend-specific types
export interface FrontendPlayer extends Omit<import('./backendTypes').BackendPlayer, 'id' | 'userId'> {
  id: string // Frontend uses string IDs consistently
  userId: number // Original backend ID
  isOnline?: boolean
  isHost?: boolean
  isReady?: boolean
  isConnected?: boolean
  lastActive?: number
  connectionStability?: import('./backendTypes').ConnectionStability
  role?: 'CITIZEN' | 'LIAR'
  score?: number
  votedFor?: string
}


export interface FrontendGameState {
  gameId: string
  gameNumber: number // Backend game ID
  phase: import('./backendTypes').GamePhase
  state: import('./backendTypes').GameState
  currentRound: number
  totalRounds: number
  timeRemaining: number
  currentPlayer?: string
  currentTurnIndex: number
  players: FrontendPlayer[]
  gameData: {
    topic: string
    secretWord?: string
    hints: import('./game').Hint[]
    votes: import('./game').Vote[]
    accusedPlayer?: string
    defenseStatement?: string
    survivalVotes?: import('./game').SurvivalVote[]
    guessAttempt?: import('./game').GuessAttempt
    eliminatedPlayer?: string
    results?: import('./game').GameResults
    victoryAchieved?: boolean
    turnOrder?: string[]
    phaseEndTime?: string
  }
  scores: Record<string, number>
  gameMode: import('./backendTypes').GameMode
  isChatAvailable: boolean
  winner?: string
  reason?: string
}

// Type conversion utilities
export interface TypeConverter {
  backendToFrontend: {
    player: (backendPlayer: import('./backendTypes').BackendPlayer) => FrontendPlayer
    gameState: (backendState: import('./backendTypes').GameStateResponse) => FrontendGameState
  }
  frontendToBackend: {
    playerId: (frontendId: string) => number
    gameId: (frontendId: string) => number
  }
}

// WebSocket message types (unified)
export interface WebSocketGameEvent {
  type: import('./backendTypes').RealtimeEventType | 'GAME_STATE_UPDATED' | 'PHASE_CHANGED' | 'TIMER_UPDATE'
  gameId: string
  gameNumber?: number
  payload: unknown
  timestamp: number
}

export interface WebSocketChatMessage {
  id: string
  gameId: string
  gameNumber: number
  playerId: string
  playerName: string
  message: string
  timestamp: number
  type: 'CHAT' | 'SYSTEM' | import('./backendTypes').ChatMessageType
}

// Error types
export interface GameError {
  code: string
  message: string
  details?: unknown
}

export interface APIResponse<T = unknown> {
  success: boolean
  data?: T
  error?: GameError
  timestamp: number
}
