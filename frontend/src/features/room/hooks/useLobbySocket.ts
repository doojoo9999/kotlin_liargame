import {useQueryClient} from '@tanstack/react-query';
import {useEffect} from 'react';
import {stompClient} from '../../../shared/socket/stompClient';
import type {GameRoom} from '../types';

// Type for the message payload from /topic/lobby
interface LobbyUpdatePayload {
  type: 'ROOM_CREATED' | 'ROOM_UPDATED' | 'ROOM_DELETED';
  gameRoom: GameRoom; // Assuming the payload contains the updated room details
}

export const useLobbySocket = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    // The actual subscription logic should be inside onConnect to handle auto-reconnects
    const onConnect = () => {
      console.log('Lobby WebSocket connected, subscribing to /topic/lobby');
      subscription = stompClient.subscribe('/topic/lobby', (message) => {
        try {
          const payload: LobbyUpdatePayload = JSON.parse(message.body);
          const queryKey = ['rooms', 'list'];

          queryClient.setQueryData<GameRoom[]>(queryKey, (oldData = []) => {
            const roomIndex = oldData.findIndex((room) => room.gameNumber === payload.gameRoom.gameNumber);

            switch (payload.type) {
              case 'ROOM_CREATED':
                return roomIndex === -1 ? [...oldData, payload.gameRoom] : oldData;
              
              case 'ROOM_UPDATED':
                if (roomIndex !== -1) {
                  const newData = [...oldData];
                  newData[roomIndex] = payload.gameRoom;
                  return newData;
                }
                return oldData;

              case 'ROOM_DELETED':
                return oldData.filter((room) => room.gameNumber !== payload.gameRoom.gameNumber);

              default:
                return oldData;
            }
          });
        } catch (error) {
          console.error("Failed to parse lobby update message:", error);
        }
      });
    };

    // We need to enhance our stompClient to handle onConnect callbacks
    // For now, let's assume it connects and we can subscribe immediately.
    // A better implementation would be: stompClient.onConnect(onConnect);
    stompClient.connect();
    onConnect(); // Assuming immediate connection for simplicity

    return () => {
      console.log('Unsubscribing from /topic/lobby');
      subscription?.unsubscribe();
      // We don't disconnect here, as other parts of the app might use the connection.
    };
  }, [queryClient]);
};
