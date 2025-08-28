import {useQuery, useQueryClient} from '@tanstack/react-query';
import {getRooms} from '../api/getRooms';

const roomsQueryKeys = {
  all: ['rooms'] as const,
  list: () => [...roomsQueryKeys.all, 'list'] as const,
};

export const useRoomsQuery = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: roomsQueryKeys.list(),
    queryFn: getRooms,
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });

  const refetchRooms = () => {
    return query.refetch();
  };

  const invalidateRooms = () => {
    return queryClient.invalidateQueries({ queryKey: roomsQueryKeys.all });
  };

  return {
    ...query,
    refetchRooms,
    invalidateRooms,
  };
};
