import {useEffect} from 'react';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {useParams} from 'react-router-dom';
import {getGameState} from '@/features/game-play/api';
import {queryKeys} from '@/shared/api/queryKeys';
import {stompClient} from '@/shared/socket/stompClient';

export const useGame = () => {
  const { roomId } = useParams();
  const queryClient = useQueryClient();

  // 1. Fetch initial game state via HTTP
  const gameStateQuery = useQuery({
    queryKey: queryKeys.game.state(roomId),
    queryFn: () => getGameState(roomId),
    enabled: !!roomId, // Only run query if roomId is available
  });

  // 2. Manage WebSocket connection and subscriptions
  useEffect(() => {
    if (!roomId) return;

    const connectCallback = () => {
      // Subscribe to game state updates
      stompClient.subscribe(`/topic/game/${roomId}`, (message) => {
        console.log('Received game state update:', message);
        // 3. Update React Query cache with new data
        queryClient.setQueryData(queryKeys.game.state(roomId), message);
      });

      // You can add more subscriptions here, e.g., for chat
      // stompClient.subscribe(`/topic/chat/${roomId}`, ...);
    };

    // Connect to the WebSocket server
    // The URL should be configured in your environment variables
    const wsUrl = import.meta.env.VITE_WS_BASE_URL || 'http://localhost:8080/ws';
    stompClient.connect(wsUrl, connectCallback);

    // 4. Cleanup on component unmount
    return () => {
      stompClient.unsubscribe(`/topic/game/${roomId}`);
      // Consider if disconnecting is appropriate here. 
      // If the user navigates between game-related pages, you might not want to disconnect.
      // For simplicity, we disconnect on unmount.
      stompClient.disconnect();
    };
  }, [roomId, queryClient]);

  return {
    roomId,
    gameState: gameStateQuery.data,
    isLoading: gameStateQuery.isLoading,
    isError: gameStateQuery.isError,
  };
};
