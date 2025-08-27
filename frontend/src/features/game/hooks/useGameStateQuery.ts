import {useQuery} from '@tanstack/react-query';
import {getGameState} from '../api/getGameState';

const gameStateQueryKeys = {
  all: ['game'] as const,
  detail: (gameNumber: number) => [...gameStateQueryKeys.all, gameNumber] as const,
};

export const useGameStateQuery = (gameNumber: number) => {
  return useQuery({
    queryKey: gameStateQueryKeys.detail(gameNumber),
    queryFn: () => getGameState(gameNumber),
    // This query can be enabled/disabled based on whether the gameNumber is valid
    enabled: !!gameNumber,
    // Reduce unnecessary refetches to avoid rate limiting
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    // Cache for 30 seconds to reduce API calls
    staleTime: 30 * 1000,
    // Keep data in cache for 5 minutes
    gcTime: 5 * 60 * 1000,
    // Retry with exponential backoff if rate limited
    retry: (failureCount, error: any) => {
      // Don't retry if rate limited
      if (error?.response?.status === 429) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
