// 백엔드 API 명세에 정확히 맞춘 엔드포인트 정의
export const API_ENDPOINTS = {
  // 인증 관련 (v1 API)
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    REFRESH_SESSION: '/api/v1/auth/refresh-session',
  },

  // 게임 관련 (v1 API)
  GAME: {
    CREATE: '/api/v1/game/create',
    JOIN: '/api/v1/game/join',
    START: (gameNumber: number) => `/api/v1/game/${gameNumber}/start`,
    END: (gameNumber: number) => `/api/v1/game/${gameNumber}/end`,
    STATE: (gameNumber: number) => `/api/v1/game/${gameNumber}/state`,

    // 힌트 제공
    HINT: '/api/v1/game/hint',

    // 투표 관련 (신규 API 사용)
    VOTE: '/api/v1/game/cast-vote',  // 기존 /vote 대신 /cast-vote 사용
    FINAL_VOTE: '/api/v1/game/vote/final',

    // 변론 및 추측
    DEFENSE: '/api/v1/game/submit-defense',
    LIAR_GUESS: '/api/v1/game/guess-word',  // 신규 API
  },

  // 채팅 관련 (v1 API)
  CHAT: {
    SEND: '/api/v1/chat/send',
    HISTORY: '/api/v1/chat/history',  // POST 방식임에 주의
  },

  // 주제 관련 (기존 유지)
  SUBJECTS: {
    RANDOM: '/api/subjects/random',
    LIST: '/api/subjects',
    CATEGORIES: '/api/subjects/categories',
  },

  // 사용자 관련 (기존 유지)
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
