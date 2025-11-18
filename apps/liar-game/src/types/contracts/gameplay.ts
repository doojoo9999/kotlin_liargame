import type {GameFlowPayload, GameRealtimePayload} from './versioning'

export type GameMode = 'LIARS_KNOW' | 'LIARS_DIFFERENT_WORD'
export type GameState = 'WAITING' | 'IN_PROGRESS' | 'ENDED'
export type GamePhase =
  | 'WAITING_FOR_PLAYERS'
  | 'SPEECH'
  | 'VOTING_FOR_LIAR'
  | 'DEFENDING'
  | 'VOTING_FOR_SURVIVAL'
  | 'GUESSING_WORD'
  | 'GAME_OVER'

export type PlayerState =
  | 'WAITING_FOR_HINT'
  | 'GAVE_HINT'
  | 'WAITING_FOR_VOTE'
  | 'VOTED'
  | 'ACCUSED'
  | 'DEFENDED'
  | 'WAITING_FOR_FINAL_VOTE'
  | 'FINAL_VOTED'
  | 'SURVIVED'
  | 'ELIMINATED'
  | 'DISCONNECTED'

export type PlayerRole = 'CITIZEN' | 'LIAR'
export type WinningTeam = 'CITIZENS' | 'LIARS'

export interface PlayerResponse {
  id: number
  userId: number
  nickname: string
  isAlive: boolean
  isOnline: boolean
  lastActiveAt?: string | null
  state: PlayerState
  hint?: string | null
  defense?: string | null
  votesReceived?: number | null
  hasVoted: boolean
  score?: number
}

export interface ScoreboardEntry {
  userId: number
  nickname: string
  isAlive: boolean
  score: number
}

export interface FinalVoteRecord {
  gameNumber: number
  voterPlayerId: number
  voterNickname: string
  voteForExecution: boolean
  success: boolean
  message?: string | null
}

export interface GameRoomInfo {
  gameNumber: number
  title: string
  host: string
  currentPlayers: number
  maxPlayers: number
  hasPassword: boolean
  subject: string | null
  subjects: string[]
  state: GameState | string
  players: PlayerResponse[]
}

export interface GameRoomListResponse extends GameFlowPayload {
  gameRooms: GameRoomInfo[]
}

export interface GameStateResponse extends GameFlowPayload {
  gameNumber: number
  gameName: string
  gameOwner: string
  gameParticipants: number
  gameCurrentRound: number
  gameTotalRounds: number
  gameLiarCount: number
  gameMode: GameMode
  gameState: GameState
  players: PlayerResponse[]
  currentPhase: GamePhase
  yourRole?: PlayerRole | null
  yourWord?: string | null
  accusedPlayer?: PlayerResponse | null
  isChatAvailable: boolean
  citizenSubject?: string | null
  liarSubject?: string | null
  subjects?: string[] | null
  turnOrder?: string[] | null
  currentTurnIndex?: number | null
  phaseEndTime?: string | null
  winner?: string | null
  reason?: string | null
  targetPoints: number
  scoreboard: ScoreboardEntry[]
  finalVotingRecord?: FinalVoteRecord[] | null
}

export interface PlayerReadyResponse extends GameFlowPayload {
  playerId: number
  nickname: string
  isReady: boolean
  allPlayersReady: boolean
  readyCount: number
  totalPlayers: number
}

export interface CountdownResponse extends GameFlowPayload {
  gameNumber: number
  countdownEndTime: string | null
  durationSeconds: number
  canCancel: boolean
}

export interface CountdownUpdateResponse extends GameRealtimePayload {
  gameNumber: number
  remainingTime: number
  phase: GamePhase | string
}

export interface PlayerVoteInfo {
  userId: number
  nickname: string
  votedAt?: string | null
}

export interface PlayerVotingInfo {
  id: number
  nickname: string
}

export interface VotingStatusResponse extends GameFlowPayload {
  gameNumber: number
  currentVotes: number
  requiredVotes: number
  totalPlayers: number
  votedPlayers: PlayerVoteInfo[]
  pendingPlayers: PlayerVoteInfo[]
  votingDeadline?: string | null
  canChangeVote: boolean
}

export interface VoteResponse extends GameFlowPayload {
  voterNickname: string
  targetNickname: string
  success: boolean
  message?: string | null
}

export interface DefenseSubmissionResponse extends GameFlowPayload {
  gameNumber: number
  userId: number
  playerNickname: string
  defenseText: string
  success: boolean
  message?: string | null
}

export interface GameResultResponse extends GameFlowPayload {
  gameNumber: number
  gameName: string
  winningTeam: WinningTeam
  citizenWord: string
  liarWord?: string | null
  citizens: PlayerResponse[]
  liars: PlayerResponse[]
  rounds: number
  correctGuess?: boolean | null
}

export interface GameEndResponse extends GameFlowPayload {
  gameNumber: number
  winner: WinningTeam | string
  citizens: PlayerResultInfo[]
  liars: PlayerResultInfo[]
  citizenSubject: string | null
  liarSubject: string | null
  gameStatistics: GameStatistics
  timestamp: string
}

export interface GameStatistics extends GameFlowPayload {
  totalRounds: number
  currentRound: number
  totalDuration: number
  averageRoundDuration: number
  totalVotes: number
  correctGuesses: number
}

export interface PlayerResultInfo {
  id: number
  nickname: string
  role: PlayerRole | string
  isAlive: boolean
  score: number
}

export interface GameRecoveryResponse extends GameFlowPayload {
  gameNumber: number
  gameState: string
  scoreboard: ScoreboardEntry[]
  targetPoints: number
  finalVotingRecord: FinalVoteRecord[]
  currentPhase: GamePhase
  phaseEndTime?: string | null
  accusedPlayerId?: number | null
  accusedNickname?: string | null
  currentAccusationTargetId?: number | null
  gameCurrentRound: number
  turnOrder?: string[] | null
  currentTurnIndex?: number | null
  defenseReentryCount: number
  recentSystemHeadline?: string | null
  defense: DefenseRecoveryResponse
  player: {
    id: number
    nickname: string
    isAlive: boolean
    role: PlayerRole | string
  }
  timestamp: string
}

export interface DefenseRecoveryResponse extends GameFlowPayload {
  gameNumber: number
  hasActiveDefense: boolean
  hasActiveFinalVoting: boolean
  accusedPlayerId?: number | null
  accusedPlayerNickname?: string | null
  defenseText?: string | null
  isDefenseSubmitted: boolean
  currentPhase?: GamePhase | null
  phaseEndTime?: string | null
  finalVotingRecord?: FinalVoteRecord[] | null
  scoreboard?: ScoreboardEntry[] | null
  targetPoints?: number | null
}

export interface GameTerminationResponse extends GameFlowPayload {
  gameNumber: number
  terminationType: string
  reason: string
  timestamp: string
  success: boolean
}

export interface FinalVotingResultResponse extends GameFlowPayload {
  gameNumber: number
  accusedPlayerId: number
  accusedPlayerNickname: string
  executionVotes: number
  survivalVotes: number
  totalVotes: number
  isExecuted: boolean
  defenseText: string
  finalVotingRecord: FinalVoteRecord[]
  scoreboard: ScoreboardEntry[]
  targetPoints: number
}

export interface LiarGuessStartResponse extends GameFlowPayload {
  gameNumber: number
  liarPlayer: PlayerResultInfo
  citizenSubject: string
  guessTimeLimit: number
  timestamp: string
}

export interface LiarGuessResultResponse extends GameFlowPayload {
  gameNumber: number
  liarGuess: string
  correctAnswer: string
  isCorrect: boolean
  winner: WinningTeam | string
  gameEnd: boolean
}

export interface LiarSpecificMessage extends GameRealtimePayload {
  content: string
  timestamp: string
  showInput: boolean
}

export interface StatusMessage extends GameRealtimePayload {
  content: string
  timestamp: string
}

export interface GamePhaseMessage extends GameRealtimePayload {
  phase: GamePhase | string
  timestamp: string
  additionalData?: Record<string, unknown> | null
}

export interface CurrentTurnMessage extends GameRealtimePayload {
  currentSpeakerId: number
  timestamp: string
}

export interface DefenseStartMessage extends GameRealtimePayload {
  gameNumber: number
  accusedPlayerId: number
  accusedPlayerNickname: string
  defenseTimeLimit: number
  timestamp: string
}

export interface DefenseSubmissionMessage extends GameRealtimePayload {
  gameNumber: number
  userId: number
  playerNickname: string
  defenseText: string
  timestamp: string
}

export interface DefenseTimeoutMessage extends GameRealtimePayload {
  gameNumber: number
  accusedPlayerId: number
  accusedPlayerNickname: string
  timestamp: string
}

export interface VotingStartMessage extends GameRealtimePayload {
  gameNumber: number
  availablePlayers: PlayerVotingInfo[]
  votingTimeLimit: number
  timestamp: string
}

export interface VotingProgressMessage extends GameRealtimePayload {
  gameNumber: number
  votedCount: number
  totalCount: number
  timestamp: string
}

export interface FinalVotingStartMessage extends GameRealtimePayload {
  gameNumber: number
  accusedPlayerId: number
  accusedPlayerNickname: string
  defenseText: string
  votingTimeLimit: number
  timestamp: string
}

export interface FinalVotingProgressMessage extends GameRealtimePayload {
  gameNumber: number
  votedCount: number
  totalCount: number
  timestamp: string
}

export interface SpeechTimerMessage extends GameRealtimePayload {
  userId: number
  remainingTime: number
  timestamp: string
}

export interface ModeratorMessage extends GameRealtimePayload {
  type: string
  content: string
  timestamp: string
  isImportant: boolean
}

export interface GameTerminationMessage extends GameRealtimePayload {
  gameNumber: number
  message: string
  timestamp: string
  reason: string
}

export interface ScoreboardBroadcast extends GameRealtimePayload {
  gameNumber: number
  targetPoints: number
  players: Array<Record<string, unknown>>
  timestamp: string
}

export interface GameRealtimeEventBase<Type extends string, Payload> {
  type: Type
  payload: Payload
}

export type GameRealtimeEvent =
  | GameRealtimeEventBase<'PHASE_CHANGE', GamePhaseMessage>
  | GameRealtimeEventBase<'CURRENT_TURN', CurrentTurnMessage>
  | GameRealtimeEventBase<'DEFENSE_START', DefenseStartMessage>
  | GameRealtimeEventBase<'DEFENSE_SUBMISSION', DefenseSubmissionMessage>
  | GameRealtimeEventBase<'DEFENSE_TIMEOUT', DefenseTimeoutMessage>
  | GameRealtimeEventBase<'VOTING_START', VotingStartMessage>
  | GameRealtimeEventBase<'VOTING_PROGRESS', VotingProgressMessage>
  | GameRealtimeEventBase<'FINAL_VOTING_START', FinalVotingStartMessage>
  | GameRealtimeEventBase<'FINAL_VOTING_PROGRESS', FinalVotingProgressMessage>
  | GameRealtimeEventBase<'FINAL_VOTING_RESULT', FinalVotingResultResponse>
  | GameRealtimeEventBase<'SPEECH_TIMER', SpeechTimerMessage>
  | GameRealtimeEventBase<'MODERATOR', ModeratorMessage>
  | GameRealtimeEventBase<'TERMINATION', GameTerminationMessage>
  | GameRealtimeEventBase<'GAME_END', GameEndResponse>
  | GameRealtimeEventBase<'SCOREBOARD', ScoreboardBroadcast>
  | GameRealtimeEventBase<'COUNTDOWN_UPDATE', CountdownUpdateResponse>
  | GameRealtimeEventBase<'LIAR_GUESS_START', LiarGuessStartResponse>
  | GameRealtimeEventBase<'LIAR_GUESS_RESULT', LiarGuessResultResponse>
  | GameRealtimeEventBase<'LIAR_MESSAGE', LiarSpecificMessage>
  | GameRealtimeEventBase<'STATUS_MESSAGE', StatusMessage>

export type GameRealtimeEventType = GameRealtimeEvent['type']
