import {useQueryClient} from '@tanstack/react-query';
import {useEffect} from 'react';
import {stompClient} from '../../../shared/socket/stompClient';
import type {GameStateResponse} from '../../room/types';

export const useGameSocket = (gameNumber: number) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!gameNumber) return;

    let subscription: { unsubscribe: () => void } | null = null;

    const onConnect = () => {
      const destination = `/topic/game/${gameNumber}/state`;
      console.log(`GameRoom WebSocket connected, subscribing to ${destination}`);
      
      subscription = stompClient.subscribe(destination, (message) => {
        try {
          const gameState: GameStateResponse = JSON.parse(message.body);
          console.log('Received game state update:', gameState);
          
          // Update the query cache with the new game state
          queryClient.setQueryData(['game', gameNumber], gameState);

        } catch (error) {
          console.error("Failed to parse game state update message:", error);
        }
      });
    };

    // This assumes a single, persistent connection is managed by stompClient.
    // We connect if not already connected, and the subscription is handled in onConnect.
    // A more robust stompClient would handle a queue of subscriptions to be made upon connection.
    stompClient.connect(); 
    
    // For simplicity, we're calling onConnect directly. A better stompClient
    // would have a way to register callbacks to be executed on connection.
    onConnect();

    return () => {
      console.log(`Unsubscribing from /topic/game/${gameNumber}/state`);
      subscription?.unsubscribe();
    };
  }, [gameNumber, queryClient]);
};
