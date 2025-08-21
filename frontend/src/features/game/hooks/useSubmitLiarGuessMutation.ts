import {useMutation} from '@tanstack/react-query';
import {submitLiarGuess} from '../api/submitLiarGuess';

export const useSubmitLiarGuessMutation = (gameNumber: number) => {
  return useMutation({
    mutationFn: (guess: string) => submitLiarGuess({ gameNumber, guess }),
    onSuccess: () => {
      console.log('Liar guess submitted successfully.');
    },
    onError: (error) => {
      console.error('Failed to submit liar guess:', error);
    },
  });
};
