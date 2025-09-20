// Centralized WebSocket STOMP destination helpers
export const SOCKET_ENDPOINTS = {
  gameState: (gameId: string) => `/topic/game/${gameId}/state`,
  phaseChange: (gameId: string) => `/topic/game/${gameId}/phase`,
  playerAction: (gameId: string) => `/topic/game/${gameId}/action`,
  timer: (gameId: string) => `/topic/game/${gameId}/timer`,
  chat: (gameId: string) => `/topic/game/${gameId}/chat`,
  errors: () => '/user/queue/errors',
};

export const SEND_ENDPOINTS = {
  joinGame: (gameId: string) => `/app/game/${gameId}/join`,
  leaveGame: (gameId: string) => `/app/game/${gameId}/leave`,
  submitHint: (gameId: string) => `/app/game/${gameId}/hint`,
  castVote: (gameId: string) => `/app/game/${gameId}/vote`,
  submitDefense: (gameId: string) => `/app/game/${gameId}/defense`,
  guessWord: (gameId: string) => `/app/game/${gameId}/guess`,
  sendMessage: (gameId: string) => `/app/game/${gameId}/chat`,
};
