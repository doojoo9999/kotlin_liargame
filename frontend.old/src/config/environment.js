// src/config/environment.js
const config = {
  // API 설정
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:20021',
  websocketUrl: import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:20021',
  
  // 개발 모드 설정
  isDevelopment: import.meta.env.VITE_ENVIRONMENT === 'development',
  isStaging: import.meta.env.VITE_ENVIRONMENT === 'staging',
  isProduction: import.meta.env.VITE_ENVIRONMENT === 'production',
  
  // 기능 플래그
  useDummyWebSocket: import.meta.env.VITE_USE_DUMMY_WEBSOCKET === 'true',
  useDummyData: import.meta.env.VITE_USE_DUMMY_DATA === 'true',
  
  // UI 설정
  frontendPort: parseInt(import.meta.env.VITE_FRONTEND_PORT) || 5173,
  
  // 게임 설정
  game: {
    minPlayers: parseInt(import.meta.env.VITE_MIN_PLAYERS) || 3,
    maxPlayers: parseInt(import.meta.env.VITE_MAX_PLAYERS) || 15,
    minRounds: parseInt(import.meta.env.VITE_MIN_ROUNDS) || 1,
    maxRounds: parseInt(import.meta.env.VITE_MAX_ROUNDS) || 10,
    defaultRounds: parseInt(import.meta.env.VITE_DEFAULT_ROUNDS) || 3,
    chatMessageLimit: parseInt(import.meta.env.VITE_CHAT_MESSAGE_LIMIT) || 500
  },
  
  // 디버그 설정
  enableDebugLogs: import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true',
  
  // 타임아웃 설정
  timeouts: {
    apiRequest: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
    websocketConnect: parseInt(import.meta.env.VITE_WS_TIMEOUT) || 5000,
    gamePhase: parseInt(import.meta.env.VITE_GAME_PHASE_TIMEOUT) || 60000
  },
  
  // WebSocket 재연결 설정
  websocket: {
    maxReconnectAttempts: parseInt(import.meta.env.VITE_WS_MAX_RECONNECT_ATTEMPTS) || 5,
    reconnectDelay: parseInt(import.meta.env.VITE_WS_RECONNECT_DELAY) || 1000
  }
}

export default config