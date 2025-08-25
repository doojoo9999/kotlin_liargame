import {useMutation, useQueryClient} from '@tanstack/react-query';
import {applySubject} from '../api/applySubject';

export const useApplySubjectMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      return await applySubject(name);
    },
    onSuccess: () => {
      // Invalidate subjects query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
};
