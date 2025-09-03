// API 엔드포인트 정의
export const API_ENDPOINTS = {
  // 인증 관련
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    PROFILE: '/api/auth/profile',
  },

  // 게임 룸 관련
  GAME_ROOMS: {
    CREATE: '/api/games/rooms',
    LIST: '/api/games/rooms',
    JOIN: (roomId: number) => `/api/games/rooms/${roomId}/join`,
    LEAVE: (roomId: number) => `/api/games/rooms/${roomId}/leave`,
    DETAIL: (roomId: number) => `/api/games/rooms/${roomId}`,
    DELETE: (roomId: number) => `/api/games/rooms/${roomId}`,
  },

  // 게임 플레이 관련
  GAME_PLAY: {
    START: (gameNumber: number) => `/api/games/${gameNumber}/start`,
    END: (gameNumber: number) => `/api/games/${gameNumber}/end`,
    VOTE: (gameNumber: number) => `/api/games/${gameNumber}/vote`,
    HINT: (gameNumber: number) => `/api/games/${gameNumber}/hint`,
    CHAT: (gameNumber: number) => `/api/games/${gameNumber}/chat`,
    STATE: (gameNumber: number) => `/api/games/${gameNumber}/state`,
  },

  // 주제 관련
  SUBJECTS: {
    RANDOM: '/api/subjects/random',
    LIST: '/api/subjects',
    CATEGORIES: '/api/subjects/categories',
  },

  // 사용자 관련
  USERS: {
    PROFILE: '/api/users/profile',
    UPDATE: '/api/users/profile',
    STATS: '/api/users/stats',
  }
} as const;

// URL 파라미터 치환 헬퍼
export const buildEndpoint = (template: string, params: Record<string, string | number>): string => {
  return Object.entries(params).reduce((url, [key, value]) => {
    return url.replace(`:${key}`, String(value));
  }, template);
};
