import {useMutation} from '@tanstack/react-query';
import {applyWord} from '../api/applyWord';

export const useApplyWordMutation = () => {
  return useMutation({
    mutationFn: async ({ subject, words }: { subject: string; words: string[] }) => {
      const results = [];
      for (const word of words) {
        const trimmedWord = word.trim();
        if (trimmedWord) {
          const result = await applyWord({ subject, word: trimmedWord });
          results.push(result);
        }
      }
      return results;
    },
  });
};
