export const queryKeys = {
  auth: {
    login: ['auth', 'login'],
    logout: ['auth', 'logout'],
    user: ['auth', 'user'],
  },
  rooms: {
    list: (filters) => ['rooms', 'list', filters],
    detail: (roomId) => ['rooms', 'detail', roomId],
  },
  game: {
    state: (roomId) => ['game', 'state', roomId],
    players: (roomId) => ['game', 'players', roomId],
    result: (roomId) => ['game', 'result', roomId],
  },
  subjects: {
    list: () => ['subjects', 'list'],
  },
  // Add other query keys as needed
};
