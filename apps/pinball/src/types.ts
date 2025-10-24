import type {Body, Engine, World} from 'matter-js'

export type WinCondition = 'last-survivor' | 'first-drop'

export interface Participant {
  id: string
  name: string
  entryCount: number
  isActive: boolean
  colorHue: number
}

export interface BallState {
  id: string
  participantId: string
  body: Body
  hasShield: boolean
  shieldConsumed: boolean
  spawnX: number
  spawnIndex: number
  eliminatedAt?: number
}

export type MapDifficulty = 'casual' | 'standard' | 'chaos'

export interface MapDefinition {
  id: string
  name: string
  description: string
  difficulty: MapDifficulty
  background: {
    gradientFrom: string
    gradientTo: string
    accent: string
  }
  size: {
    width: number
    height: number
  }
  gravityScale: number
  spawnSlots: number[]
  obstacles: MapObstacle[]
  drainY: number
}

export type MapObstacle =
  | {
      type: 'wall'
      x: number
      y: number
      width: number
      height: number
      angle?: number
      restitution?: number
    }
  | {
      type: 'peg'
      x: number
      y: number
      radius: number
      restitution?: number
    }
  | {
      type: 'bumper'
      x: number
      y: number
      radius: number
      restitution: number
      impulseScale: number
    }

export interface SkillCard {
  id: string
  name: string
  summary: string
  type: 'global' | 'participant'
  description: string
  rarity: 'common' | 'rare'
  apply: (context: SkillContext) => ResolvedSkill | null
}

export interface SkillContext {
  participants: Participant[]
  winCondition: WinCondition
}

export interface ResolvedSkill {
  id: string
  name: string
  summary: string
  description: string
  rarity: 'common' | 'rare'
  type: 'global' | 'participant'
  targetParticipantId?: string
  hooks: SkillHooks
}

export interface SkillHooks {
  setupWorld?: (engine: Engine, world: World) => void
  setupBall?: (ball: Body, state: BallState, helpers: SkillHelpers) => void
  onTick?: (engine: Engine, balls: BallState[], delta: number, helpers: SkillHelpers) => void
}

export interface SkillHelpers {
  resetBallPosition: (state: BallState) => void
  addImpulse: (state: BallState, force: {x: number; y: number}) => void
}

export interface EliminationEvent {
  order: number
  ballId: string
  participantId: string
  participantName: string
  reason: 'drain' | 'fallout'
  timestamp: number
}

export interface SimulationResult {
  winnerBallId: string | null
  winnerParticipantId: string | null
  eliminationLog: EliminationEvent[]
  completed: boolean
}
