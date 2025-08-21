import {useMutation, useQueryClient} from '@tanstack/react-query';
import {submitHint} from '../api/submitHint';

export const useSubmitHintMutation = (gameNumber: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitHint,
    onSuccess: (data) => {
      console.log('Hint submitted successfully:', data);
      // Update the game state cache with the new state from the server
      queryClient.setQueryData(['game', gameNumber], data);
    },
    onError: (error) => {
      // TODO: Show user-friendly error notification
      console.error('Failed to submit hint:', error);
    },
  });
};
