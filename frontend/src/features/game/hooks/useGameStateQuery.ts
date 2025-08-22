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
  });
};
