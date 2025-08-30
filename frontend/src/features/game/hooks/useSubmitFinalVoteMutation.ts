import {useMutation} from '@tanstack/react-query';
import {submitFinalVote} from '../api/submitFinalVote';
import {useNotifications} from '../../../shared/hooks/useNotifications';

export const useSubmitFinalVoteMutation = (gameNumber: number) => {
  const {showError} = useNotifications();

  return useMutation({
    mutationFn: (voteForExecution: boolean) => submitFinalVote({ gameNumber, voteForExecution }),
    onSuccess: () => {
      console.log('Final vote submitted successfully.');
      // No need to invalidate queries here, as the WebSocket update will handle it.
    },
    onError: (error) => {
      let errorMessage = '최종 투표를 제출하는 중에 오류가 발생했습니다.';
      
      // Handle status code specific error messages
      if (error && typeof error === 'object' && 'response' in error) {
        const errorResponse = error.response as { status?: number };
        if (errorResponse.status) {
          switch (errorResponse.status) {
            case 409:
              errorMessage = '아직 최종 투표 시간이 아닙니다. 잠시 후 다시 시도해주세요.';
              break;
            case 400:
              errorMessage = '잘못된 요청입니다. 페이지를 새로고침 후 다시 시도해주세요.';
              break;
            default:
              errorMessage = '최종 투표를 제출하는 중에 오류가 발생했습니다.';
          }
        }
      }
      
      showError('최종 투표 실패', errorMessage);
      console.error('Failed to submit final vote:', error);
    },
  });
};
