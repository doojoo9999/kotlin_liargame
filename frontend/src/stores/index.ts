// Unified store exports
export { useGameStore } from './unifiedGameStore';
export { useAuthStore } from './authStore';
export { useConnectionStore } from './connectionStore';
export { useUIStore } from './uiStore';
export { useAdminStore } from './adminStore';
export { useNemonemoStore } from './nemonemoStore';

// Legacy stores - deprecated, use unified store instead
export { default as useGameStoreLegacy } from './gameStore';
export { useGameStoreV2 } from './gameStoreV2';
export type { Player } from './unifiedGameStore'
export type { GamePhase } from '@/types/backendTypes'
