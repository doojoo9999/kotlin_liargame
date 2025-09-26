import type {GamePhase, GameStateResponse, PlayerRole} from './backendTypes'

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
  | 'ROOM_DELETED'

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

export type ChatMessageType = 'DISCUSSION' | 'HINT' | 'DEFENSE' | 'SYSTEM' | 'POST_ROUND' | 'WAITING_ROOM' | 'GENERAL'

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

export type LobbyEventType = 'PLAYER_JOINED' | 'PLAYER_LEFT' | 'ROOM_DELETED' | 'OWNER_KICKED_AND_TRANSFERRED' | string

export interface LobbyUpdate {
  type: LobbyEventType
  gameNumber?: number | string
  playerName?: string
  nickname?: string
  userId?: number
  currentPlayers?: number
  maxPlayers?: number
  [key: string]: unknown
}

export type LobbyUpdateCallback = (update: LobbyUpdate) => void

type PlayerIdentifier = string | number

export interface PlayerJoinedPayload {
  playerId: PlayerIdentifier
  playerName?: string
  nickname?: string
  userId?: number | string
  isHost?: boolean
  isReady?: boolean
  role?: PlayerRole | string
  [key: string]: unknown
}

export interface PlayerLeftPayload {
  playerId: PlayerIdentifier
  [key: string]: unknown
}

export interface GameStartedPayload {
  currentRound?: number
  [key: string]: unknown
}

export interface RoundStartedPayload {
  category?: string
  word?: string
  liarId?: PlayerIdentifier
  timeLimit?: number
  [key: string]: unknown
}

export interface HintProvidedPayload {
  playerId: PlayerIdentifier
  playerName?: string
  hint?: string
  [key: string]: unknown
}

export interface VoteCastPayload {
  voterId?: PlayerIdentifier
  voterName?: string
  targetId?: PlayerIdentifier
  targetName?: string
  [key: string]: unknown
}

export interface DefenseSubmittedPayload {
  defenderId?: PlayerIdentifier
  defenderName?: string
  defense?: string
  playerId?: PlayerIdentifier
  playerName?: string
  [key: string]: unknown
}

export interface ScoreEntry {
  playerId: PlayerIdentifier
  score: number
}

export interface RoundEndedPayload {
  scores?: ScoreEntry[]
  finalScores?: ScoreEntry[]
  [key: string]: unknown
}

export interface PhaseChangedPayload {
  phase: GamePhase | string
  [key: string]: unknown
}

export interface TimerUpdatePayload {
  timeRemaining: number
  phase?: GamePhase | string
  [key: string]: unknown
}

export interface GameStateUpdatedPayload {
  gameState?: GameStateResponse
  state?: GamePhase | string
  timeRemaining?: number
  [key: string]: unknown
}

export interface GameEndedPayload {
  winner?: WinningTeam | string
  scores?: ScoreEntry[]
  finalScores?: ScoreEntry[]
  [key: string]: unknown
}

export interface PlayerConnectionPayload {
  userId?: PlayerIdentifier
  playerId?: PlayerIdentifier
  nickname?: string
  playerName?: string
  isConnected?: boolean
  hasGracePeriod?: boolean
  seconds?: number
  lastActiveAt?: string
  [key: string]: unknown
}

export interface PlayerReadyChangedPayload {
  userId?: PlayerIdentifier
  playerId?: PlayerIdentifier
  nickname?: string
  playerName?: string
  isReady?: boolean
  allReady?: boolean
  updatedAt?: string
  [key: string]: unknown
}

export interface OwnerTransferPayload {
  kickedOwner?: string
  kickedPlayer?: string
  previousOwner?: string
  newOwner?: string
  newHost?: string
  nextOwner?: string
  message?: string
  [key: string]: unknown
}

export interface PersonalNotificationPayload {
  [key: string]: unknown
}

export interface RoomDeletedPayload {
  reason?: string
  message?: string
}

export type GameEventPayloadMap = {
  PLAYER_JOINED: PlayerJoinedPayload
  PLAYER_LEFT: PlayerLeftPayload
  PLAYER_DISCONNECTED: PlayerConnectionPayload
  PLAYER_RECONNECTED: PlayerConnectionPayload
  GRACE_PERIOD_STARTED: PlayerConnectionPayload
  GRACE_PERIOD_EXPIRED: PlayerConnectionPayload
  PLAYER_READY_CHANGED: PlayerReadyChangedPayload
  PLAYER_READY_UPDATE: PlayerReadyChangedPayload
  OWNER_KICKED_AND_TRANSFERRED: OwnerTransferPayload
  ROOM_DELETED: RoomDeletedPayload
  GAME_STARTED: GameStartedPayload
  ROUND_STARTED: RoundStartedPayload
  HINT_PROVIDED: HintProvidedPayload
  HINT_SUBMITTED: HintProvidedPayload
  VOTE_CAST: VoteCastPayload
  DEFENSE_SUBMITTED: DefenseSubmittedPayload
  ROUND_ENDED: RoundEndedPayload
  GAME_ENDED: GameEndedPayload
  PHASE_CHANGED: PhaseChangedPayload
  TIMER_UPDATE: TimerUpdatePayload
  CHAT_MESSAGE: ChatMessage
  GAME_STATE_UPDATED: GameStateUpdatedPayload
  PERSONAL_NOTIFICATION: PersonalNotificationPayload
}

export type GameEventType = keyof GameEventPayloadMap

export type GameEvent = {
  [Type in GameEventType]: {
    type: Type
    gameId: string
    payload: GameEventPayloadMap[Type]
    timestamp: number
  }
}[GameEventType]

export type EventCallback = (event: GameEvent) => void

export type ConnectionCallback = (connected: boolean) => void


