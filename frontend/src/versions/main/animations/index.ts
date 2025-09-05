export * from './variants'
export * from './components'
export * from './hooks'

export const ANIMATION_DURATIONS = {
  FAST: 0.2,
  NORMAL: 0.3,
  SLOW: 0.5,
  PHASE_TRANSITION: 0.6,
  ROLE_REVEAL: 0.8
} as const

export const SPRING_CONFIGS = {
  GENTLE: { type: "spring" as const, stiffness: 120, damping: 14 },
  SNAPPY: { type: "spring" as const, stiffness: 300, damping: 30 },
  BOUNCY: { type: "spring" as const, stiffness: 260, damping: 20 }
} as const
