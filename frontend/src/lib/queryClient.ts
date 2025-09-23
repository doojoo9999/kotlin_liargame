import {QueryClient} from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: (failureCount, error) => {
        // Don't retry on 401, 403, 404
        if (error instanceof Error && error.message.includes('401')) return false
        if (error instanceof Error && error.message.includes('403')) return false
        if (error instanceof Error && error.message.includes('404')) return false
        
        // Retry up to 2 times for other errors
        return failureCount < 2
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
})

// Query Keys
export const QUERY_KEYS = {
  GAME: {
    STATUS: (gameId: string) => ['game', 'status', gameId],
    PLAYERS: (gameId: string) => ['game', 'players', gameId],
    RESULTS: (gameId: string) => ['game', 'results', gameId],
  },
  PLAYER: {
    PROFILE: (playerId: string) => ['player', 'profile', playerId],
  },
  ROUND: {
    RESULTS: (gameId: string, round: number) => ['round', 'results', gameId, round],
  },
  REALTIME: {
    READY_STATUS: (gameNumber: number) => ['realtime', 'ready-status', gameNumber],
    COUNTDOWN: (gameNumber: number) => ['realtime', 'countdown', gameNumber],
    CONNECTION_STATUS: (gameNumber: number) => ['realtime', 'connection-status', gameNumber],
    VOTING_STATUS: (gameNumber: number) => ['realtime', 'voting-status', gameNumber],
  }
} as const