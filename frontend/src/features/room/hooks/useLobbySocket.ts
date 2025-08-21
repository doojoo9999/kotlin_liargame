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
    // Ensure the client is trying to connect
    stompClient.connect();

    const subscription = stompClient.subscribe('/topic/lobby', (message) => {
      try {
        const payload: LobbyUpdatePayload = JSON.parse(message.body);
        const queryKey = ['rooms', 'list'];

        queryClient.setQueryData<GameRoom[]>(queryKey, (oldData = []) => {
          const roomIndex = oldData.findIndex((room) => room.gameNumber === payload.gameRoom.gameNumber);

          switch (payload.type) {
            case 'ROOM_CREATED':
              // Add the new room if it doesn't exist
              return roomIndex === -1 ? [...oldData, payload.gameRoom] : oldData;
            
            case 'ROOM_UPDATED':
              // Update the room if it exists
              if (roomIndex !== -1) {
                const newData = [...oldData];
                newData[roomIndex] = payload.gameRoom;
                return newData;
              }
              return oldData;

            case 'ROOM_DELETED':
              // Remove the room
              return oldData.filter((room) => room.gameNumber !== payload.gameRoom.gameNumber);

            default:
              return oldData;
          }
        });
      } catch (error) {
        console.error("Failed to parse lobby update message:", error);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);
};
