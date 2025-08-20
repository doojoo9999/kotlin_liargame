import {useQuery, useQueryClient} from '@tanstack/react-query';
import {useEffect} from 'react';
import {getRooms} from '@/features/room-list/api';
import {queryKeys} from '@/shared/api/queryKeys';
import {stompClient} from '@/shared/socket/stompClient';

export const useRooms = () => {
  const queryClient = useQueryClient();

  const roomsQuery = useQuery({
    queryKey: queryKeys.rooms.list(),
    queryFn: getRooms,
    refetchInterval: 30000, // Poll every 30 seconds
  });

  useEffect(() => {
    const connectCallback = () => {
      // Subscribe to lobby updates for real-time changes
      stompClient.subscribe('/topic/lobby', (message) => {
        console.log('Received lobby update:', message);
        // When an update is received, invalidate the rooms list query to refetch
        queryClient.invalidateQueries({ queryKey: queryKeys.rooms.list() });
      });
    };
    
    const wsUrl = import.meta.env.VITE_WS_BASE_URL || 'http://localhost:8080/ws';
    if (!stompClient.stompClient?.active) {
      stompClient.connect(wsUrl, connectCallback);
    } else {
      connectCallback();
    }

    return () => {
      stompClient.unsubscribe('/topic/lobby');
    };
  }, [queryClient]);

  return roomsQuery;
};
