import {useMutation, useQueryClient} from '@tanstack/react-query';
import {giveHint as giveHintApi} from '@/features/give-hint/api';
import {queryKeys} from '@/shared/api/queryKeys';
import {useAppNotifications} from '@/shared/hooks/useNotifications.jsx';

export const useGiveHint = (options = {}) => {
  const queryClient = useQueryClient();
  const { showSuccess, handleError } = useAppNotifications();

  return useMutation({
    mutationFn: (hintData) => giveHintApi(hintData),
    ...options,
    onSuccess: (data, variables, context) => {
      console.log('Hint submitted successfully.');
      showSuccess('Hint Submitted!', 'Your hint has been successfully submitted.');
      // The WebSocket update should handle the state change,
      // but we can optimistically update the cache as well.
      queryClient.setQueryData(queryKeys.game.state(variables.gameNumber), data);
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    onError: (error, variables, context) => {
      console.error('Failed to submit hint:', error);
      handleError(error, 'Failed to submit hint');
      if (options.onError) {
        options.onError(error, variables, context);
      }
    },
  });
};
