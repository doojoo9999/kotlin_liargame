import {useMutation, useQueryClient} from '@tanstack/react-query';
import {castFinalVote as castFinalVoteApi} from '@/features/final-vote/api';
import {useAppNotifications} from '@/shared/hooks/useNotifications.jsx';

export const useCastFinalVote = (options = {}) => {
  const queryClient = useQueryClient();
  const { showSuccess, handleError } = useAppNotifications();

  return useMutation({
    mutationFn: (voteData) => castFinalVoteApi(voteData),
    ...options,
    onSuccess: (data, variables, context) => {
      console.log('Final vote cast successfully.');
      showSuccess('Judgment Cast!', 'Your final vote has been cast.');
      // Game state will be updated via WebSocket.
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    onError: (error, variables, context) => {
      console.error('Failed to cast final vote:', error);
      handleError(error, 'Failed to cast final vote');
      if (options.onError) {
        options.onError(error, variables, context);
      }
    },
  });
};
