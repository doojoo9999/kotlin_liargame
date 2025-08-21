import {useQueryClient} from '@tanstack/react-query';
import {useEffect} from 'react';
import {stompClient} from '../../../shared/socket/stompClient';
import type {GameStateResponse} from '../../room/types';

export const useGameSocket = (gameNumber: number) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!gameNumber) return;

    // Ensure the client is trying to connect
    stompClient.connect();

    const destination = `/topic/game/${gameNumber}/state`;
    const subscription = stompClient.subscribe(destination, (message) => {
      try {
        const gameState: GameStateResponse = JSON.parse(message.body);
        console.log('Received game state update:', gameState);
        
        // Update the query cache with the new game state
        queryClient.setQueryData(['game', gameNumber], gameState);

      } catch (error)        console.error("Failed to parse game state update message:", error);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [gameNumber, queryClient]);
};
