export interface Player {
  id: string
  nickname: string
  isReady: boolean
  isHost: boolean
  isOnline: boolean
  avatar?: string
  score?: number
  role?: 'civilian' | 'liar'
  hasVoted?: boolean
  isTyping?: boolean
}

export interface GameRoom {
  id: string
  name: string
  hostId: string
  hostName: string
  playerCount: number
  maxPlayers: number
  status: 'waiting' | 'playing' | 'finished'
  isPrivate: boolean
  createdAt: string
  timeLimit: number
}

export interface ChatMessage {
  id: string
  playerId: string
  playerName: string
  message: string
  timestamp: number
  type: 'message' | 'system' | 'join' | 'leave'
}

export interface GamePhase {
  phase: 'waiting' | 'topic_reveal' | 'discussion' | 'voting' | 'results' | 'finished'
  timeRemaining: number
  maxTime: number
}

export interface VoteResult {
  playerId: string
  playerName: string
  votes: number
  voters: string[]
}

export interface GameResults {
  liarId: string
  liarName: string
  topic: string
  votes: VoteResult[]
  liarWon: boolean
  roundScores: Record<string, number>
}

export interface RoundInfo {
  current: number
  total: number
  phase: GamePhase['phase']
  topic?: string
}

export type GameAction = 
  | 'join'
  | 'leave' 
  | 'ready'
  | 'start'
  | 'vote'
  | 'next_round'
  | 'end_game'

export type PlayerStatus = 'online' | 'offline' | 'away' | 'ready' | 'waiting'

export type AnimationType = 
  | 'slideIn'
  | 'fadeIn' 
  | 'scaleIn'
  | 'bounceIn'
  | 'slideUp'
  | 'slideDown'

export interface AnimationProps {
  type?: AnimationType
  delay?: number
  duration?: number
  className?: string
}