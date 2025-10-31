export const puzzleKeys = {
  root: ['puzzles'] as const,
  list: (params?: Record<string, unknown>) =>
    params ? ([...puzzleKeys.root, 'list', params] as const) : ([...puzzleKeys.root, 'list'] as const),
  detail: (puzzleId: string) => [...puzzleKeys.root, 'detail', puzzleId] as const,
  dailyPicks: () => [...puzzleKeys.root, 'daily-picks'] as const
};

export const playKeys = {
  root: ['plays'] as const,
  session: (playId: string) => [...playKeys.root, 'session', playId] as const
};

export const leaderboardKeys = {
  root: ['leaderboard'] as const,
  puzzle: (puzzleId: string, mode: string) => [...leaderboardKeys.root, 'puzzle', puzzleId, mode] as const
};

export const challengeKeys = {
  root: ['challenges'] as const,
  list: () => [...challengeKeys.root, 'list'] as const,
  achievements: () => [...challengeKeys.root, 'achievements'] as const,
  season: () => [...challengeKeys.root, 'season'] as const
};

export const notificationKeys = {
  root: ['notifications'] as const,
  list: () => [...notificationKeys.root, 'list'] as const
};
