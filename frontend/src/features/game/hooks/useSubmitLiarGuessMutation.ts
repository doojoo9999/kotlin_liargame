import {useMutation} from '@tanstack/react-query';
import {submitLiarGuess} from '../api/submitLiarGuess';
import {useNotifications} from '../../../shared/hooks/useNotifications';

export const useSubmitLiarGuessMutation = (gameNumber: number) => {
  const {showError} = useNotifications();

  return useMutation({
    mutationFn: (guess: string) => submitLiarGuess({ gameNumber, guess }),
    onSuccess: () => {
      console.log('Liar guess submitted successfully.');
    },
    onError: (error) => {
      showError('단어 추측 실패', '단어를 추측하는 중에 오류가 발생했습니다.');
      console.error('Failed to submit liar guess:', error);
    },
  });
};
