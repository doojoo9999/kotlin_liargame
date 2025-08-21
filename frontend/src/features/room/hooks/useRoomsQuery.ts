import {useQuery} from '@tanstack/react-query';
import {getRooms} from '../api/getRooms';

const roomsQueryKeys = {
  all: ['rooms'] as const,
  list: () => [...roomsQueryKeys.all, 'list'] as const,
};

export const useRoomsQuery = () => {
  return useQuery({
    queryKey: roomsQueryKeys.list(),
    queryFn: getRooms,
    // Optional: Add polling or WebSocket updates later
    // refetchInterval: 5000,
  });
};
