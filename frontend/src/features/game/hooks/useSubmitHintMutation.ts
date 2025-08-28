import {useMutation, useQueryClient} from '@tanstack/react-query';
import {submitHint} from '../api/submitHint';
import {useNotifications} from '../../../shared/hooks/useNotifications';

export const useSubmitHintMutation = (gameNumber: number) => {
  const queryClient = useQueryClient();
  const {showError, showSuccess} = useNotifications();

  return useMutation({
    mutationFn: submitHint,
    onSuccess: (data) => {
      console.log('Hint submitted successfully:', data);
      queryClient.setQueryData(['game', gameNumber], data);
      queryClient.invalidateQueries({queryKey: ['game', gameNumber]});
      showSuccess('힌트 제출 완료', '힌트가 성공적으로 제출되었습니다.');
    },
    onError: (error) => {
      showError('힌트 제출 실패', '힌트를 제출하는 중에 오류가 발생했습니다.');
      console.error('Failed to submit hint:', error);
    },
  });
};
