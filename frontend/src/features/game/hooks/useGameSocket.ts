import {useEffect} from 'react';
import {useGameStore} from '../stores/gameStore';

/**
 * A hook that connects a React component to the centralized game state store,
 * ensuring it receives real-time updates via WebSocket.
 *
 * @param gameNumber The game number to subscribe to.
 */
export const useGameSocket = (gameNumber: number) => {
    const { subscribeToGame, unsubscribeFromGame } = useGameStore();

    useEffect(() => {
        if (gameNumber > 0) {
            subscribeToGame(gameNumber);
        }

        // Cleanup on component unmount
        return () => {
            unsubscribeFromGame();
        };
    }, [gameNumber, subscribeToGame, unsubscribeFromGame]);
};
