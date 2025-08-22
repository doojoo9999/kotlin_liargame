import {useMutation} from '@tanstack/react-query';
import {submitFinalVote} from '../api/submitFinalVote';
import {useNotifications} from '../../../shared/hooks/useNotifications';

export const useSubmitFinalVoteMutation = (gameNumber: number) => {
  const {showError} = useNotifications();

  return useMutation({
    mutationFn: (vote: boolean) => submitFinalVote({ gameNumber, vote }),
    onSuccess: () => {
      console.log('Final vote submitted successfully.');
      // No need to invalidate queries here, as the WebSocket update will handle it.
    },
    onError: (error) => {
      showError('최종 투표 실패', '최종 투표를 제출하는 중에 오류가 발생했습니다.');
      console.error('Failed to submit final vote:', error);
    },
  });
};
