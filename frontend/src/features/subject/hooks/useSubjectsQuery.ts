import {useQuery} from '@tanstack/react-query';
import {getSubjects} from '../api/getSubjects';

export const useSubjectsQuery = () => {
  return useQuery({
    queryKey: ['subjects'],
    queryFn: getSubjects,
  });
};
