// API Endpoints aligned with backend documentation
export const API_ENDPOINTS = {
  // Authentication - aligned with backend /api/v1/auth/*
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    LOGOUT: '/api/v1/auth/logout',
    REFRESH: '/api/v1/auth/refresh-session',
    CHECK: '/api/v1/auth/check',
  },
  // Game Management - aligned with backend /api/v1/game/*
  GAME: {
    CREATE: '/api/v1/game/create',
    JOIN: '/api/v1/game/join',
    LEAVE: '/api/v1/game/leave',
    START: '/api/v1/game/start',
    ROOMS: '/api/v1/game/rooms', // Fixed: was /game/list, now matches backend
    STATE: '/api/v1/game', // /{gameNumber}
    RESULT: '/api/v1/game/result', // /result/{gameNumber}
    RECOVER_STATE: '/api/v1/game/recover-state', // /recover-state/{gameNumber}
  },
  // Game Actions - aligned with backend /api/v1/game/*
  GAME_PLAY: {
    HINT: '/api/v1/game/hint',
    VOTE: '/api/v1/game/vote',
    FINAL_VOTE: '/api/v1/game/vote/final',
    CAST_VOTE: '/api/v1/game/cast-vote',
    DEFENSE: '/api/v1/game/submit-defense',
    END_DEFENSE: '/api/v1/game/defense/end',
    GUESS_WORD: '/api/v1/game/guess-word',
    LIAR_GUESS: '/api/v1/game/submit-liar-guess',
    END_ROUND: '/api/v1/game/end-of-round',
    KICK_OWNER: '/api/v1/game', // /{gameNumber}/kick-owner
    EXTEND_TIME: '/api/v1/game', // /{gameNumber}/extend-time
  },
  // Chat - aligned with backend /api/v1/chat/*
  CHAT: {
    SEND: '/api/v1/chat/send',
    HISTORY: '/api/v1/chat/history',
    POST_ROUND: '/api/v1/chat/post-round', // /post-round/{gameNumber}
    SPEECH_COMPLETE: '/api/v1/chat/speech/complete',
  },
  // Subject Management - aligned with backend /api/v1/subjects/*
  SUBJECT: {
    LIST: '/api/v1/subjects/listsubj',
    CREATE: '/api/v1/subjects/applysubj',
    DELETE: '/api/v1/subjects/delsubj', // /delsubj/{id}
    APPROVE_PENDING: '/api/v1/subjects/approve-pending',
  },
  // Word Management - aligned with backend /api/v1/words/*
  WORD: {
    LIST: '/api/v1/words/wlist',
    CREATE: '/api/v1/words/applyw',
    DELETE: '/api/v1/words/delw', // /delw/{id}
    APPROVE_PENDING: '/api/v1/words/approve-pending',
  },
  // User Management - aligned with backend /api/v1/user/*
  USER: {
    ADD: '/api/v1/user/add',
    STATS: '/api/v1/user/stats',
  },
  // Admin Management - aligned with backend /api/v1/admin/*
  ADMIN: {
    LOGIN: '/api/v1/admin/login',
    KICK_PLAYER: '/api/v1/admin/games', // /games/{gameNumber}/kick
    TERMINATE_ROOM: '/api/v1/admin/terminate-room',
    GRANT_ROLE: '/api/v1/admin/grant-role', // /grant-role/{userId}
    STATISTICS: '/api/v1/admin/statistics',
    GAMES: '/api/v1/admin/games',
    PLAYERS: '/api/v1/admin/players',
    CONTENT_PENDING: '/api/v1/admin/content/pending',
    CONTENT_APPROVE_ALL: '/api/v1/admin/content/approve-all',
    CLEANUP_STALE: '/api/v1/admin/cleanup/stale-games',
    CLEANUP_DISCONNECTED: '/api/v1/admin/cleanup/disconnected-players',
    CLEANUP_EMPTY: '/api/v1/admin/cleanup/empty-games',
    PROFANITY_REQUESTS: '/api/v1/admin/profanity/requests',
    PROFANITY_APPROVE: '/api/v1/admin/profanity/approve', // /approve/{requestId}
    PROFANITY_REJECT: '/api/v1/admin/profanity/reject', // /reject/{requestId}
  },
  // Profanity Management - aligned with backend /api/v1/profanity/*
  PROFANITY: {
    SUGGEST: '/api/v1/profanity/suggest',
  },
} as const;

