import type {
    BackendPlayer,
    CastVoteResponse,
    CountdownResponse as BackendCountdownResponse,
    CreateGameRequest as BackendCreateGameRequest,
    DefenseSubmissionResponse,
    GameMode,
    GameState as BackendGameState,
    GameStateResponse as BackendGameStateResponse,
    JoinGameRequest as BackendJoinGameRequest,
    PlayerReadyResponse as BackendPlayerReadyResponse,
    ScoreboardEntry as BackendScoreboardEntry,
    VotingStatusResponse as BackendVotingStatusResponse,
    WordGuessResponse,
} from './backendTypes'
import type {APIResponse} from './index'

export type ApiResponse<T = unknown> = APIResponse<T>

export interface ApiError {
  success: false
  error: string
  message: string
  code?: number
  timestamp: string
}

export interface PaginationParams {
  page?: number
  size?: number
  sort?: string
}

export type PaginatedResponse<T> = ApiResponse<T[]> & {
  pagination: {
    page: number
    size: number
    totalElements: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
  }
}

export interface GameRoom {
  gameNumber: number
  gameName: string
  gameOwner: string
  gameState: BackendGameState
  gameMode: GameMode
  gameParticipants: number
  gameMaxPlayers: number
  isPrivate: boolean
  createdAt: string
}

export type CreateGameRequest = BackendCreateGameRequest

export type JoinGameRequest = BackendJoinGameRequest & {
  password?: string
}

export interface GameRoomInfo {
  gameNumber: number
  title: string
  host: string
  currentPlayers: number
  maxPlayers: number
  hasPassword: boolean
  state: BackendGameState
  subjects: string[]
  subject?: string | null
  players?: BackendPlayer[]
  gameName?: string
  gameOwner?: string
  gameParticipants?: number
  gameMaxPlayers?: number
  isPrivate?: boolean
  gameState?: BackendGameState
  gameMode?: GameMode | string
}

export type GameListResponse = ApiResponse<GameRoomInfo[]> & {
  gameRooms?: GameRoomInfo[]
  games?: GameRoomInfo[]
  data?: GameRoomInfo[]
}

export type PlayerResponse = BackendPlayer & {
  role?: 'CITIZEN' | 'LIAR'
}

export type ScoreboardEntry = BackendScoreboardEntry

export type GameStateResponse = BackendGameStateResponse & {
  state?: BackendGameState
  phase?: BackendGameStateResponse['currentPhase']
}

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

export type ChatHistoryResponse = ApiResponse<ChatMessage[]>

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

export type VoteResponse = CastVoteResponse

export type DefenseResponse = DefenseSubmissionResponse

export type GuessResponse = WordGuessResponse

export type PlayerReadyResponse = BackendPlayerReadyResponse

export type CountdownResponse = BackendCountdownResponse

export type VotingStatusResponse = BackendVotingStatusResponse

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

export type ApiClientResponse<T> = Promise<ApiResponse<T>>
