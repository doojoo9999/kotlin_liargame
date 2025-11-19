import type { FrontendPlayer } from '@/types'
import type { ChatMessage, ChatMessageType } from '@/types/realtime'
import type { GameMode } from '@/types/backendTypes'

export type RoundUxStage = 'waiting' | 'speech' | 'debate' | 'vote' | 'results'

export interface RoundSummaryEntry {
  round: number
  topic: string | null
  suspectedPlayerId?: string | null
  scoreboard: Array<{
    playerId: string
    nickname: string
    score: number
    isAlive: boolean
  }>
  winningTeam?: 'CITIZENS' | 'LIARS' | 'UNKNOWN'
  concludedAt: number
}

export interface Player extends FrontendPlayer {
  score: number
}

export interface GameTimer {
  isActive: boolean
  timeRemaining: number
  totalTime: number
  phase: string
}

export interface VotingState {
  isActive: boolean
  phase: 'LIAR_VOTE' | 'SURVIVAL_VOTE' | null
  votes: Record<string, string>
  targetPlayerId?: string
  currentVotes?: number
  totalParticipants?: number
  requiredVotes?: number
  results?: {
    votes: Record<string, number>
    actualLiar?: string
    winners?: string[]
  }
}

export interface GameResults {
  liarId: string
  liarName: string
  topic: string
  votes: Record<string, number>
  liarWon: boolean
  roundScores: Record<string, number>
}

export interface Hint {
  playerId: string
  playerName: string
  hint: string
  timestamp: number
}

export interface Vote {
  voterId: string
  voterName: string
  targetId: string
  targetName: string
}

export interface Defense {
  defenderId: string
  defenderName: string
  defense: string
  timestamp: number
}

export interface ChatSliceState {
  chatMessages: ChatMessage[]
  chatLoading: boolean
  chatError: string | null
  typingPlayers: Set<string>
}

export interface LobbyState {
  gameList: any[]
  gameListLoading: boolean
  gameListError: string | null
  availableGameModes: GameMode[]
}

export interface ConnectionStateSlice {
  isConnected: boolean
  connectionError: string | null
  reconnectAttempts: number
}
