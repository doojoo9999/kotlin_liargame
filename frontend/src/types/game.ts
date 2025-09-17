import type {GamePhase as BackendGamePhase} from './backendTypes'
// Frontend Game Types - Re-exported from backend types for consistency
export type PlayerID = string

// Use backend types as source of truth - avoid duplication
export type { GamePhase, GameState, GameMode } from './backendTypes'

export interface Player {
  id: PlayerID
  nickname: string
  role?: 'CITIZEN' | 'LIAR'
  isAlive?: boolean
  isOnline?: boolean
  isHost?: boolean
  lastActive?: number
}

export interface Hint {
  playerId: PlayerID
  text: string
  timestamp: number
}

export interface Vote {
  voterId: PlayerID
  targetId: PlayerID
  timestamp: number
}

export interface GameResults {
  winners: PlayerID[]
  reason: string
}

export interface ActivityEvent {
  id: string
  type: 'hint' | 'vote' | 'defense' | 'guess' | 'phase_change' | 'system' | 'survival_vote'
  playerId?: PlayerID
  targetId?: PlayerID
  content?: string
  phase: BackendGamePhase
  timestamp: number
  highlight?: boolean
}

export interface SurvivalVote {
  voterId: PlayerID
  targetId: PlayerID
  timestamp: number
}

export interface GuessAttempt {
  playerId: PlayerID
  word: string
  timestamp: number
  correct: boolean
}

export interface GameStateV2 {
  gameId: string
  phase: BackendGamePhase
  currentRound: number
  totalRounds: number
  timeRemaining: number
  currentPlayer?: PlayerID
  players: Player[]
  gameData: {
    topic: string
    secretWord?: string
    hints: Hint[]
    votes: Vote[]
    accusedPlayer?: PlayerID
    defenseStatement?: string
    survivalVotes?: SurvivalVote[]
    guessAttempt?: GuessAttempt
    eliminatedPlayer?: PlayerID
    results?: GameResults
    victoryAchieved?: boolean
  }
  scores: Record<PlayerID, number>
}

export type RoundPhase = 'waiting' | 'topic_reveal' | 'discussion' | 'voting' | 'results' | 'finished'

export interface RoundInfo {
  current: number
  total: number
  phase: RoundPhase
  topic?: string | null
  progress?: number
  timeRemaining?: number
}
