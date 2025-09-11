// Game Flow v2 Types (erasable syntax compliant)
export type PlayerID = string

export const GamePhase = {
  WAITING_FOR_PLAYERS: 'WAITING_FOR_PLAYERS',
  SPEECH: 'SPEECH',
  VOTING_FOR_LIAR: 'VOTING_FOR_LIAR',
  DEFENDING: 'DEFENDING',
  VOTING_FOR_SURVIVAL: 'VOTING_FOR_SURVIVAL',
  GUESSING_WORD: 'GUESSING_WORD',
  GAME_OVER: 'GAME_OVER',
} as const
export type GamePhase = typeof GamePhase[keyof typeof GamePhase]

export const GameState = {
  WAITING: 'WAITING',
  IN_PROGRESS: 'IN_PROGRESS', 
  ENDED: 'ENDED',
} as const
export type GameState = typeof GameState[keyof typeof GameState]

export const GameMode = {
  LIARS_KNOW: 'LIARS_KNOW',
  LIARS_DIFFERENT_WORD: 'LIARS_DIFFERENT_WORD',
} as const
export type GameMode = typeof GameMode[keyof typeof GameMode]

export interface Player {
  id: PlayerID
  nickname: string
  role?: 'CITIZEN' | 'LIAR'
  isAlive?: boolean
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
  phase: GamePhase
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
  phase: GamePhase
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
