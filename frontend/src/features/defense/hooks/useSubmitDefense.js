import {useMutation, useQueryClient} from '@tanstack/react-query';
import {submitDefense as submitDefenseApi} from '@/features/defense/api';
import {queryKeys} from '@/shared/api/queryKeys';
import {useAppNotifications} from '@/shared/hooks/useNotifications.jsx';

export const useSubmitDefense = (options = {}) => {
  const queryClient = useQueryClient();
  const { showSuccess, handleError } = useAppNotifications();

  return useMutation({
    mutationFn: (defenseData) => submitDefenseApi(defenseData),
    ...options,
    onSuccess: (data, variables, context) => {
      console.log('Defense submitted successfully.');
      showSuccess('Defense Submitted!', 'Your defense has been successfully submitted.');
      // Game state will be updated via WebSocket.
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    onError: (error, variables, context) => {
      console.error('Failed to submit defense:', error);
      handleError(error, 'Failed to submit defense');
      if (options.onError) {
        options.onError(error, variables, context);
      }
    },
  });
};
