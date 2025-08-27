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
    // 실시간성을 위해 refetch 설정 개선
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    // 게임 상태는 더 자주 업데이트되어야 하므로 staleTime 단축
    staleTime: 5 * 1000, // 5초로 단축
    // Keep data in cache for 5 minutes
    gcTime: 5 * 60 * 1000,
    // 실시간 게임 상태 업데이트를 위해 폴링 간격 설정
    refetchInterval: 10 * 1000, // 10초마다 폴링
    refetchIntervalInBackground: false,
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
