import {useMutation, useQueryClient} from '@tanstack/react-query';
import {castVote as castVoteApi} from '@/features/vote/api';
import {queryKeys} from '@/shared/api/queryKeys';
import {useAppNotifications} from '@/shared/hooks/useNotifications.jsx';

export const useCastVote = (options = {}) => {
  const queryClient = useQueryClient();
  const { showSuccess, handleError } = useAppNotifications();

  return useMutation({
    mutationFn: (voteData) => castVoteApi(voteData),
    ...options,
    onSuccess: (data, variables, context) => {
      console.log('Vote cast successfully.');
      showSuccess('Vote Cast!', 'Your vote has been successfully cast.');
      // Game state will be updated via WebSocket.
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    onError: (error, variables, context) => {
      console.error('Failed to cast vote:', error);
      handleError(error, 'Failed to cast vote');
      if (options.onError) {
        options.onError(error, variables, context);
      }
    },
  });
};
