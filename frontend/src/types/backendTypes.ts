import type {
    GameFlowPayload,
    GameFlowSchemaVersion,
    GameRealtimePayload,
    RealtimeSchemaVersion,
    VersionedPayload
} from './contracts/versioning'
import {
    GAME_FLOW_SCHEMA_VERSION,
    isGameFlowPayload,
    isRealtimePayload,
    REALTIME_SCHEMA_VERSION
} from './contracts/versioning'

import type {
    CountdownResponse,
    CountdownUpdateResponse,
    CurrentTurnMessage,
    DefenseRecoveryResponse,
    DefenseStartMessage,
    DefenseSubmissionMessage,
    DefenseSubmissionResponse,
    DefenseTimeoutMessage,
    FinalVoteRecord,
    FinalVotingProgressMessage,
    FinalVotingResultResponse,
    FinalVotingStartMessage,
    GameEndResponse,
    GameMode,
    GamePhase,
    GamePhaseMessage,
    GameRealtimeEvent,
    GameRealtimeEventType,
    GameRecoveryResponse,
    GameResultResponse,
    GameRoomInfo,
    GameRoomListResponse,
    GameState,
    GameStateResponse,
    GameStatistics,
    GameTerminationMessage,
    GameTerminationResponse,
    LiarGuessResultResponse,
    LiarGuessStartResponse,
    LiarSpecificMessage,
    ModeratorMessage,
    PlayerReadyResponse,
    PlayerResponse,
    PlayerResultInfo,
    PlayerRole,
    PlayerState,
    PlayerVoteInfo,
    PlayerVotingInfo,
    ScoreboardBroadcast,
    ScoreboardEntry,
    SpeechTimerMessage,
    StatusMessage,
    VoteResponse,
    VotingProgressMessage,
    VotingStartMessage,
    VotingStatusResponse,
    WinningTeam
} from './contracts/gameplay'

export {
  GAME_FLOW_SCHEMA_VERSION,
  REALTIME_SCHEMA_VERSION,
  isGameFlowPayload,
  isRealtimePayload
}

export type {
  GameFlowSchemaVersion,
  RealtimeSchemaVersion,
  VersionedPayload,
  GameFlowPayload,
  GameRealtimePayload,
  GameMode,
  GameState,
  GamePhase,
  PlayerState,
  PlayerRole,
  WinningTeam,
  PlayerResponse,
  PlayerResponse as BackendPlayer,
  ScoreboardEntry,
  FinalVoteRecord,
  GameRoomInfo,
  GameRoomListResponse,
  GameStateResponse,
  PlayerReadyResponse,
  CountdownResponse,
  CountdownUpdateResponse,
  PlayerVoteInfo,
  PlayerVotingInfo,
  VotingStatusResponse,
  VoteResponse,
  DefenseSubmissionResponse,
  GameResultResponse,
  GameEndResponse,
  GameStatistics,
  PlayerResultInfo,
  GameRecoveryResponse,
  DefenseRecoveryResponse,
  GameTerminationResponse,
  FinalVotingResultResponse,
  LiarGuessStartResponse,
  LiarGuessResultResponse,
  LiarSpecificMessage,
  StatusMessage,
  GamePhaseMessage,
  CurrentTurnMessage,
  DefenseStartMessage,
  DefenseSubmissionMessage,
  DefenseTimeoutMessage,
  VotingStartMessage,
  VotingProgressMessage,
  FinalVotingStartMessage,
  FinalVotingProgressMessage,
  SpeechTimerMessage,
  ModeratorMessage,
  GameTerminationMessage,
  ScoreboardBroadcast,
  GameRealtimeEvent,
  GameRealtimeEventType
}

export type ChatMessageType = 'HINT' | 'DISCUSSION' | 'DEFENSE' | 'POST_ROUND' | 'WAITING_ROOM' | 'SYSTEM'
export type ConnectionStability = 'STABLE' | 'UNSTABLE' | 'POOR'

export interface CreateGameRequest {
  nickname?: string
  gameName?: string
  gamePassword?: string | null
  gameParticipants: number
  gameLiarCount: number
  gameTotalRounds: number
  gameMode: GameMode
  subjectIds?: number[]
  useRandomSubjects?: boolean
  randomSubjectCount?: number
  targetPoints: number
}

export interface JoinGameRequest {
  gameNumber: number
  gamePassword?: string
  nickname?: string
}

export interface ChatMessage {
  id: number | null
  gameNumber: number
  playerNickname: string | null
  content: string
  timestamp: string
  type: ChatMessageType
}

export type ChatHistoryResponse = ChatMessage[]

export interface ChatHistoryRequest {
  gameNumber: number
  type?: ChatMessageType
  round?: number
  limit?: number
}

export interface PlayerConnectionStatus {
  userId: number
  nickname: string
  isConnected: boolean
  hasGracePeriod: boolean
  lastSeenAt: string
  connectionStability: ConnectionStability
}

export interface ConnectionStatusSummary {
  players: PlayerConnectionStatus[]
  connectedCount: number
  disconnectedCount: number
  totalCount: number
}

export type ConnectionStatusResponse = ConnectionStatusSummary

export const normalizeConnectionStatus = (players: PlayerConnectionStatus[]): ConnectionStatusResponse => {
  const connectedCount = players.filter(player => player.isConnected).length
  const disconnectedCount = players.length - connectedCount

  return {
    players,
    connectedCount,
    disconnectedCount,
    totalCount: players.length
  }
}
export type CastVoteResponse = VoteResponse
export type WordGuessResponse = LiarGuessResultResponse

