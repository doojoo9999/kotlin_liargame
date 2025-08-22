import {useMutation, useQueryClient} from '@tanstack/react-query';
import {submitVote} from '../api/submitVote';
import {useNotifications} from '../../../shared/hooks/useNotifications';

export const useSubmitVoteMutation = (gameNumber: number) => {
  const queryClient = useQueryClient();
  const {showError} = useNotifications();

  return useMutation({
    mutationFn: submitVote,
    onSuccess: (data) => {
      console.log('Vote submitted successfully:', data);
      // Update the game state cache with the new state from the server
      queryClient.setQueryData(['game', gameNumber], data);
    },
    onError: (error) => {
      showError('투표 제출 실패', '투표를 제출하는 중에 오류가 발생했습니다.');
      console.error('Failed to submit vote:', error);
    },
  });
};
