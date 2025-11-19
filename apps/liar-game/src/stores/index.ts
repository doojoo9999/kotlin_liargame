// Unified store exports
export { useGameStore, useChatStore, usePlayerStore, useGameFlowStore } from './unifiedGameStore'
export { useAuthStore } from './authStore'
export { useConnectionStore } from './connectionStore'
export { useUIStore } from './uiStore'
export { useAdminStore } from './adminStore'
export { useNemonemoStore } from './nemonemoStore'

// Legacy stores - deprecated, use unified store instead
export { default as useGameStoreLegacy } from './gameStore'
export type { Player, RoundSummaryEntry, RoundUxStage } from './unified/types'
export type { GamePhase } from '@/types/backendTypes'
export { useGameplayStore, selectGameplayMeta, selectGameplayPhase, selectGameplayPlayers, selectGameplayVoting, selectGameplayChat } from './gameplayStore'
