const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:20021',
  websocketUrl: import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:20021',
  game: {
    minPlayers: 3,
    maxPlayers: 15,
    defaultRounds: 3,
    minRounds: 1,
    maxRounds: 10,
  },
};

export default config;
