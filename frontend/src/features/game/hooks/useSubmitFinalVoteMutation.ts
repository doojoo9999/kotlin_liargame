import {useMutation} from '@tanstack/react-query';
import {submitFinalVote} from '../api/submitFinalVote';

export const useSubmitFinalVoteMutation = (gameNumber: number) => {
  return useMutation({
    mutationFn: (vote: boolean) => submitFinalVote({ gameNumber, vote }),
    onSuccess: () => {
      console.log('Final vote submitted successfully.');
      // No need to invalidate queries here, as the WebSocket update will handle it.
    },
    onError: (error) => {
      console.error('Failed to submit final vote:', error);
      // TODO: Show user-friendly error notification
    },
  });
};
