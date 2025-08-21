import {useMutation, useQueryClient} from '@tanstack/react-query';
import {startGame} from '../api/startGame';

export const useStartGameMutation = (gameNumber: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: startGame,
    onSuccess: (data) => {
      console.log('Game started successfully:', data);
      // Update the game state cache with the new state from the server
      queryClient.setQueryData(['game', gameNumber], data);
    },
    onError: (error) => {
      // TODO: Show user-friendly error notification
      // (e.g., "Not enough players", "Only the owner can start")
      console.error('Failed to start game:', error);
    },
  });
};
