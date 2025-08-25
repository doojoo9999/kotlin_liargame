import {useMutation} from '@tanstack/react-query';
import {applySubject} from '../api/applySubject';
import {applyWord} from '../api/applyWord';

export interface ApplySubjectWithWordsPayload {
  name: string;
  words: string[]; // individual words, empty strings filtered by caller
}

export const useApplySubjectWithWordsMutation = () => {
  return useMutation({
    mutationFn: async ({ name, words }: ApplySubjectWithWordsPayload) => {
      // 1) Create subject
      const subjectRes = await applySubject(name);
      // 2) Create words sequentially (can be parallel but keep simple)
      for (const w of words) {
        const word = w.trim();
        if (!word) continue;
        await applyWord({ subject: subjectRes.name, word });
      }
      return subjectRes;
    },
  });
};
