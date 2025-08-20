import {useQuery} from '@tanstack/react-query';
import {getSubjects} from '@/features/subjects/api';

// A new query key for subjects needs to be added to queryKeys.js
export const useSubjects = () => {
  return useQuery({
    queryKey: ['subjects', 'list'],
    queryFn: getSubjects,
    staleTime: 1000 * 60 * 60, // Cache subjects for 1 hour
  });
};
