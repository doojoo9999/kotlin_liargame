import {useQuery} from '@tanstack/react-query';
import {getGameState} from '../api/getGameState';
import {useEffect, useState} from 'react';

const gameStateQueryKeys = {
  all: ['game'] as const,
  detail: (gameNumber: number) => [...gameStateQueryKeys.all, gameNumber] as const,
};

export const useGameStateQuery = (gameNumber: number) => {
  const [gameState, setGameState] = useState<any>(null);
  const [refetchInterval, setRefetchInterval] = useState(5000); // 기본 5초

  const query = useQuery({
    queryKey: gameStateQueryKeys.detail(gameNumber),
    queryFn: () => getGameState(gameNumber),
    enabled: !!gameNumber,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0, // 캐시를 항상 stale로 취급하여 실시간 업데이트 보장
    gcTime: 30 * 1000,
    refetchInterval: refetchInterval, // 동적 폴링 간격
    refetchIntervalInBackground: false,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 429) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // 게임 상태에 따라 폴링 간격 동적 조정
  useEffect(() => {
    if (query.data) {
      setGameState(query.data);

      const currentPhase = query.data.currentPhase;

      // 중요한 페이즈에서는 더 빠른 폴링
      if (currentPhase === 'VOTING_FOR_LIAR' ||
          currentPhase === 'DEFENDING' ||
          currentPhase === 'VOTING_FOR_SURVIVAL') {
        setRefetchInterval(2000); // 2초로 단축
        console.log('[GameStateQuery] Critical phase detected, polling every 2 seconds');
      } else if (currentPhase === 'SPEECH') {
        setRefetchInterval(3000); // 힌트 단계는 3초
        console.log('[GameStateQuery] Speech phase, polling every 3 seconds');
      } else {
        setRefetchInterval(5000); // 기본 5초
        console.log('[GameStateQuery] Normal phase, polling every 5 seconds');
      }
    }
  }, [query.data]);

  return query;
};
