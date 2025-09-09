
// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  message?: string
  error?: string
  timestamp?: string
}

// Error Response
export interface ApiError {
  success: false
  error: string
  message: string
  code?: number
  timestamp: string
}

// Pagination
export interface PaginationParams {
  page?: number
  size?: number
  sort?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    size: number
    totalElements: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
  }
}

// Game API Types
export interface GameRoom {
  gameNumber: number
  gameName: string
  gameOwner: string
  gameState: 'WAITING' | 'IN_PROGRESS' | 'ENDED'
  gameMode: string
  gameParticipants: number
  gameMaxPlayers: number
  isPrivate: boolean
  createdAt: string
}

export interface GameListResponse extends ApiResponse<GameRoom[]> {}

export interface CreateGameRequest {
  gameName: string
  gameMode: string
  maxPlayers: number
  isPrivate: boolean
  password?: string
}

export interface JoinGameRequest {
  gameNumber: number
  password?: string
}

export interface GameStateResponse extends ApiResponse<{
  gameNumber: number
  gameName: string
  gameState: string
  currentPhase: string
  players: Array<{
    id: number
    nickname: string
    isReady: boolean
    isHost: boolean
    isOnline: boolean
  }>
  currentRound: number
  totalRounds: number
  timeRemaining: number
}> {}

// Chat API Types
export interface ChatMessage {
  id: string
  gameNumber: number
  playerId: string
  playerNickname: string
  content: string
  type: 'DISCUSSION' | 'HINT' | 'DEFENSE' | 'SYSTEM'
  timestamp: string
}

export interface SendChatRequest {
  gameNumber: number
  content: string
  type?: 'DISCUSSION' | 'HINT' | 'DEFENSE'
}

export interface ChatHistoryResponse extends ApiResponse<ChatMessage[]> {}

// Game Action Types
export interface VoteRequest {
  gameNumber: number
  targetUserId: number
}

export interface HintRequest {
  gameNumber: number
  hint: string
}

export interface DefenseRequest {
  gameNumber: number
  defenseText: string
}

export interface WordGuessRequest {
  gameNumber: number
  guess: string
}

export interface FinalVoteRequest {
  gameNumber: number
  voteForExecution: boolean
}

// Subject and Word Management
export interface Subject {
  id: number
  name: string
  status: 'ACTIVE' | 'PENDING' | 'REJECTED'
  createdBy: string
  createdAt: string
}

export interface Word {
  id: number
  word: string
  subjectId: number
  status: 'ACTIVE' | 'PENDING' | 'REJECTED'
  createdBy: string
  createdAt: string
}

export interface CreateSubjectRequest {
  name: string
}

export interface CreateWordRequest {
  word: string
  subjectId: number
}

// Admin API Types
export interface AdminStats {
  totalGames: number
  activeGames: number
  totalPlayers: number
  onlinePlayers: number
}

export interface PlayerInfo {
  id: number
  nickname: string
  isOnline: boolean
  currentGameId?: number
  joinedAt: string
}

// Generic API Client Response
export type ApiClientResponse<T> = Promise<ApiResponse<T>>
