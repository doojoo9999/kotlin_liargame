import {useMutation, useQueryClient} from '@tanstack/react-query';
import {startGame as startGameApi} from '@/features/game-play/api/mutations/startGame';
import {queryKeys} from '@/shared/api/queryKeys';
import {useAppNotifications} from '@/shared/hooks/useNotifications.jsx';

export const useStartGame = (options = {}) => {
  const queryClient = useQueryClient();
  const { handleError } = useAppNotifications();

  return useMutation({
    mutationFn: (gameNumber) => startGameApi(gameNumber),
    ...options,
    onSuccess: (data, gameNumber, context) => {
      console.log('Game started successfully!');
      // The game state will be updated via WebSocket, but we can also optimistically update the cache.
      queryClient.setQueryData(queryKeys.game.state(gameNumber), data);

      if (options.onSuccess) {
        options.onSuccess(data, gameNumber, context);
      }
    },
    onError: (error, gameNumber, context) => {
      console.error('Failed to start game:', error);
      handleError(error, 'Failed to start game');
      if (options.onError) {
        options.onError(error, gameNumber, context);
      }
    },
  });
};
