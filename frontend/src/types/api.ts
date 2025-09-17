
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

export interface CreateGameRequest {
  nickname?: string;
  gameName?: string;
  gamePassword?: string;
  gameParticipants: number;
  gameTotalRounds: number;
  gameLiarCount: number;
  gameMode: 'LIARS_KNOW' | 'LIARS_DIFFERENT_WORD';
  subjectIds?: number[];
  useRandomSubjects?: boolean;
  randomSubjectCount?: number;
  targetPoints: number;
}

export interface JoinGameRequest {
  gameNumber: number
  password?: string
  gamePassword?: string
  nickname?: string
}

export interface GameRoomInfo {
  gameNumber: number
  title: string
  host: string
  currentPlayers: number
  maxPlayers: number
  hasPassword: boolean
  state: 'WAITING' | 'IN_PROGRESS' | 'ENDED'
  subjects: string[]
  subject?: string | null
  players?: unknown[]
  // Legacy aliases for backward compatibility
  gameName?: string
  gameOwner?: string
  gameParticipants?: number
  gameMaxPlayers?: number
  isPrivate?: boolean
  gameState?: 'WAITING' | 'IN_PROGRESS' | 'ENDED'
  gameMode?: 'LIARS_KNOW' | 'LIARS_DIFFERENT_WORD' | string
}

export interface GameListResponse {
  gameRooms?: GameRoomInfo[]
  games?: GameRoomInfo[]
  data?: GameRoomInfo[]
}

export interface PlayerResponse {
  id: number;
  userId: number;
  nickname: string;
  isAlive: boolean;
  state: string;
  hint?: string;
  defense?: string;
  votesReceived: number;
  hasVoted: boolean;
  role?: 'CITIZEN' | 'LIAR';
}

export interface ScoreboardEntry {
  userId: number;
  nickname: string;
  isAlive: boolean;
  score: number;
}

export interface GameStateResponse {
  gameNumber: number;
  gameName: string;
  gameOwner: string;
  gameParticipants: number;
  gameCurrentRound: number;
  gameTotalRounds: number;
  gameLiarCount: number;
  gameMode: 'LIARS_KNOW' | 'LIARS_DIFFERENT_WORD';
  gameState: 'WAITING' | 'IN_PROGRESS' | 'ENDED';
  players: PlayerResponse[];
  currentPhase: 'WAITING_FOR_PLAYERS' | 'SPEECH' | 'VOTING_FOR_LIAR' | 'DEFENDING' | 'VOTING_FOR_SURVIVAL' | 'GUESSING_WORD' | 'GAME_OVER';
  yourRole?: string;
  yourWord?: string;
  accusedPlayer?: PlayerResponse;
  isChatAvailable: boolean;
  citizenSubject?: string;
  liarSubject?: string;
  subjects?: string[];
  turnOrder?: string[];
  currentTurnIndex?: number;
  phaseEndTime?: string;
  winner?: string;
  reason?: string;
  targetPoints: number;
  scoreboard: ScoreboardEntry[];
  finalVotingRecord?: any[];
}

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

export type ChatHistoryResponse = ApiResponse<ChatMessage[]>

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

// Response Types to match backend
export interface VoteResponse {
  voterNickname: string;
  targetNickname: string;
  success: boolean;
  message?: string;
}

export interface DefenseResponse {
  gameNumber: number;
  playerId: number;
  playerNickname: string;
  defenseText: string;
  success: boolean;
}

export interface GuessResponse {
  gameNumber: number;
  guess: string;
  isCorrect: boolean;
  actualWord: string;
  success: boolean;
}

// Additional response types for new endpoints
export interface PlayerReadyResponse {
  playerId: number;
  nickname: string;
  isReady: boolean;
  allPlayersReady: boolean;
  readyCount: number;
  totalPlayers: number;
}

export interface CountdownResponse {
  gameNumber: number;
  countdownEndTime?: string;
  durationSeconds: number;
  canCancel: boolean;
}

export interface VotingStatusResponse {
  gameNumber: number;
  currentVotes: number;
  requiredVotes: number;
  totalPlayers: number;
  votedPlayers: Array<{
    userId: number;
    nickname: string;
    votedAt?: string;
  }>;
  pendingPlayers: Array<{
    userId: number;
    nickname: string;
    votedAt?: string;
  }>;
  votingDeadline?: string;
  canChangeVote: boolean;
}

// Subject and Word Management interfaces are now in their respective API files:
// - Subject interfaces: /api/subjectApi.ts
// - Word interfaces: /api/wordApi.ts

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
