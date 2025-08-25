import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { IMessage } from '@stomp/stompjs';
import { socketManager } from '../../../shared/socket/SocketManager';
import { logger } from '../../../shared/utils/logger';
import type { GameRoom, LobbyUpdatePayload } from '../types';

const LOBBY_TOPIC = '/topic/lobby';

// Type guard to check if the payload is a valid LobbyUpdatePayload
function isLobbyUpdatePayload(payload: unknown): payload is LobbyUpdatePayload {
  if (typeof payload !== 'object' || payload === null) return false;
  const p = payload as LobbyUpdatePayload;
  return (
    (p.type === 'ROOM_CREATED' || p.type === 'ROOM_UPDATED' || p.type === 'ROOM_DELETED') &&
    typeof p.gameRoom === 'object' &&
    p.gameRoom !== null &&
    typeof p.gameRoom.gameNumber === 'number'
  );
}

export const useLobbySocket = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleLobbyUpdate = (message: IMessage) => {
      try {
        const parsedData: unknown = JSON.parse(message.body);

        if (!isLobbyUpdatePayload(parsedData)) {
          logger.errorLog(`Invalid lobby update payload received: ${message.body}`);
          return;
        }

        const payload = parsedData;
        const queryKey = ['rooms'];

        queryClient.setQueryData<GameRoom[]>(queryKey, (oldData = []) => {
          if (!oldData) return [payload.gameRoom];
          const roomIndex = oldData.findIndex((room) => room.gameNumber === payload.gameRoom.gameNumber);

          switch (payload.type) {
            case 'ROOM_CREATED':
              return roomIndex === -1 ? [...oldData, payload.gameRoom] : oldData;
            case 'ROOM_UPDATED':
              return roomIndex !== -1
                ? oldData.map((room) => (room.gameNumber === payload.gameRoom.gameNumber ? payload.gameRoom : room))
                : oldData;
            case 'ROOM_DELETED':
              return oldData.filter((room) => room.gameNumber !== payload.gameRoom.gameNumber);
            default:
              return oldData;
          }
        });
      } catch (error) {
        let errorMessage = 'An unknown error occurred while processing lobby update.';
        if (error instanceof Error) {
          errorMessage = `Error processing lobby update: ${error.message}`;
        }
        logger.errorLog(errorMessage);
      }
    };

    // Use a flag to prevent multiple subscriptions
    let isSubscribed = false;

    const subscribe = async () => {
      if (!isSubscribed) {
        isSubscribed = true;
        await socketManager.subscribe(LOBBY_TOPIC, handleLobbyUpdate);
      }
    };

    // Call the async subscribe function
    void subscribe();

    // Cleanup on component unmount
    return () => {
      socketManager.unsubscribe(LOBBY_TOPIC);
    };
  }, [queryClient]);
};