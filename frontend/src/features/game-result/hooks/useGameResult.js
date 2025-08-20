import {useQuery} from '@tanstack/react-query';
import {getGameResult} from '@/features/game-result/api';
import {queryKeys} from '@/shared/api/queryKeys'; // Assuming you add a key for game results

export const useGameResult = (gameNumber) => {
  return useQuery({
    // A new query key for game results needs to be added to queryKeys.js
    queryKey: ['gameResult', gameNumber], 
    queryFn: () => getGameResult(gameNumber),
    enabled: !!gameNumber,
  });
};
