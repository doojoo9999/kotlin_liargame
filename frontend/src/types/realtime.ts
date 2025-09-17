// 백엔드 신규/강화 API에 맞춘 타입들

export interface PlayerReadyResponse {
  playerId: number
  nickname: string
  isReady: boolean
  isOwner: boolean
}

export interface HostPermissions {
  canStartGame: boolean
  canKickPlayers: boolean
  canTransferHost: boolean
  canModifySettings: boolean
}

export interface HostTransferRequest {
  targetPlayerId: number
  targetNickname: string
}

export interface CountdownResponse {
  isActive: boolean
  startedAt?: string // ISO timestamp
  endTime?: string // ISO timestamp
  durationSeconds: number
  remainingSeconds?: number
}

export type ConnectionStateType = 'CONNECTED' | 'DISCONNECTED' | 'GRACE_PERIOD'

export interface PlayerConnectionStatus {
  playerId: number
  nickname: string
  connectionState: ConnectionStateType
  lastConnectedAt?: string
  gracePeriodEndsAt?: string
}

export interface ConnectionStatusResponse {
  connectedCount: number
  disconnectedCount: number
  totalCount: number
  playerStatuses: PlayerConnectionStatus[]
}

export type VotingPhase = 'LIAR_ELIMINATION' | 'SURVIVAL_VOTE' | 'TIE_BREAKER' | 'ACCUSATION' | 'DEFENSE' | 'COMPLETED'

export interface PlayerVoteInfo {
  playerId: number
  nickname: string
  targetPlayerId?: number
  targetNickname?: string
  hasVoted: boolean
}

export interface VotingStatusResponse {
  votingPhase: VotingPhase
  requiredVotes: number
  currentVotes: number
  activePlayersCount: number
  playerVotes: PlayerVoteInfo[]
}

export type BroadcastMessageType =
  | 'PLAYER_READY_UPDATE'
  | 'COUNTDOWN_STARTED'
  | 'COUNTDOWN_CANCELLED'
  | 'CONNECTION_STATUS_UPDATE'
  | 'VOTING_PROGRESS'
  | 'PLAYER_RECONNECTED'
  | 'GAME_STATE_UPDATE'
  | 'PLAYER_JOINED'
  | 'PLAYER_LEFT'

export interface WebSocketMessage<T = any> {
  type: BroadcastMessageType
  payload: T
  gameNumber: number
  timestamp: string
}

export interface PlayerReadyUpdatePayload {
  playerId: number
  nickname: string
  isReady: boolean
}

export interface CountdownPayload {
  isActive: boolean
  startedAt?: string
  endTime?: string
  durationSeconds: number
}

export interface VotingProgressPayload {
  votingPhase: VotingPhase
  requiredVotes: number
  currentVotes: number
  activePlayersCount: number
}

export type WinningTeam = 'LIARS' | 'CITIZENS' | 'DRAW'

export interface PlayerResultInfo {
  userId: number
  nickname: string
  role: string
  points: number
  isAlive: boolean
}

export interface GameStatistics {
  totalRounds: number
  completedRounds: number
  totalVotes: number
  averageVotingTime: number
}

export interface GameEndResponse {
  gameNumber: number
  winner: WinningTeam
  citizens: PlayerResultInfo[]
  liars: PlayerResultInfo[]
  citizenSubject?: string
  liarSubject?: string
  gameStatistics: GameStatistics
  timestamp: string
}

export type GameEndCondition = 'LIAR_VICTORY' | 'CITIZEN_VICTORY' | 'NEXT_ROUND'

export type ChatMessageType = 'DISCUSSION' | 'HINT' | 'DEFENSE' | 'SYSTEM' | 'POST_ROUND' | 'GENERAL'

export interface ChatMessage {
  id: string
  gameNumber: number
  playerId?: string
  userId?: number
  playerNickname: string
  nickname?: string
  playerName?: string
  content: string
  message?: string
  gameId?: string
  roomId?: string
  timestamp: number
  type: ChatMessageType
}

export type ChatCallback = (message: ChatMessage) => void

export type GameEventType =
  | 'PLAYER_JOINED'
  | 'PLAYER_LEFT'
  | 'GAME_STARTED'
  | 'ROUND_STARTED'
  | 'HINT_PROVIDED'
  | 'VOTE_CAST'
  | 'DEFENSE_SUBMITTED'
  | 'ROUND_ENDED'
  | 'GAME_ENDED'
  | 'CHAT_MESSAGE'
  | 'GAME_STATE_UPDATED'
  | 'PERSONAL_NOTIFICATION'

export interface GameEvent {
  type: GameEventType
  gameId: string
  payload: unknown
  timestamp: number
}

export type EventCallback = (event: GameEvent) => void

export type ConnectionCallback = (connected: boolean) => void

