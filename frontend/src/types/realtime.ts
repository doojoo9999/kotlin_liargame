// 백엔드 신규/강화 API에 맞춘 타입들

export interface PlayerReadyResponse {
  playerId: number
  nickname: string
  isReady: boolean
  isOwner: boolean
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

export type VotingPhase = 'ACCUSATION' | 'DEFENSE' | 'COMPLETED'

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
