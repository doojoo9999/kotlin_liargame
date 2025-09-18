import type {
    BackendPlayer,
    ChatHistoryRequest,
    ChatHistoryResponse,
    ChatMessage,
    ChatMessageType,
    ConnectionStatusResponse,
    CountdownResponse,
    CreateGameRequest as BackendCreateGameRequest,
    DefenseSubmissionResponse,
    GameMode,
    GameRoomInfo,
    GameStateResponse as BackendGameStateResponse,
    JoinGameRequest as BackendJoinGameRequest,
    LiarGuessResultResponse,
    PlayerReadyResponse,
    ScoreboardEntry,
    VoteResponse,
    VotingStatusResponse
} from './backendTypes'

export type GameStateResponse = BackendGameStateResponse
export type CreateGameRequest = BackendCreateGameRequest
export type JoinGameRequest = BackendJoinGameRequest & { password?: string }

export type {
  BackendPlayer,
  GameMode,
  GameRoomInfo,
  PlayerReadyResponse,
  CountdownResponse,
  VotingStatusResponse,
  VoteResponse,
  DefenseSubmissionResponse,
  LiarGuessResultResponse,
  ScoreboardEntry,
  ChatMessage,
  ChatHistoryResponse,
  ChatHistoryRequest,
  ChatMessageType,
  ConnectionStatusResponse
}

export interface ApiError {
  success: false
  error: string
  message: string
  code?: number
  timestamp: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  timestamp: number
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

export interface GameListResponse {
  success: boolean
  gameRooms: GameRoomInfo[]
  data?: GameRoomInfo[]
  games?: GameRoomInfo[]
  timestamp: number
  pagination?: PaginatedResponse<unknown>['pagination']
}

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

export interface SendChatRequest {
  gameNumber: number
  content: string
  type?: ChatMessageType
}

export type DefenseResponse = DefenseSubmissionResponse
export type GuessResponse = LiarGuessResultResponse
