import {useMutation, useQueryClient} from '@tanstack/react-query';
import {submitHint} from '../api/submitHint';
import {useNotifications} from '../../../shared/hooks/useNotifications';

export const useSubmitHintMutation = (gameNumber: number) => {
  const queryClient = useQueryClient();
  const {showError} = useNotifications();

  return useMutation({
    mutationFn: submitHint,
    onSuccess: (data) => {
      console.log('Hint submitted successfully:', data);
      // Update the game state cache with the new state from the server
      queryClient.setQueryData(['game', gameNumber], data);
    },
    onError: (error) => {
      showError('힌트 제출 실패', '힌트를 제출하는 중에 오류가 발생했습니다.');
      console.error('Failed to submit hint:', error);
    },
  });
};
