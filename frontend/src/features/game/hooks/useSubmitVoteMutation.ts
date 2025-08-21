import {useMutation, useQueryClient} from '@tanstack/react-query';
import {submitVote} from '../api/submitVote';

export const useSubmitVoteMutation = (gameNumber: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitVote,
    onSuccess: (data) => {
      console.log('Vote submitted successfully:', data);
      // Update the game state cache with the new state from the server
      queryClient.setQueryData(['game', gameNumber], data);
    },
    onError: (error) => {
      // TODO: Show user-friendly error notification
      console.error('Failed to submit vote:', error);
    },
  });
};
