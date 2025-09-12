// Unified service exports
export { unifiedWebSocketService as websocketService } from './unifiedWebSocketService';
export { authService } from './authService';

// Game API services
export { gameService } from '../api/gameApi';
export { userService } from '../api/userApi';
export { wordService } from '../api/wordApi';

// Legacy services - deprecated, use unified services instead
export { default as websocketServiceLegacy } from './websocketService';
export { RealtimeService } from './realtimeService';
export { GameFlowService } from './gameFlowService';
export { GameServiceEnhanced } from './gameServiceEnhanced';

// Utility services
export * from './scoringService';
export * from './timerService';