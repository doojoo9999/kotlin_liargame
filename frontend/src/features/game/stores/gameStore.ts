import {create} from 'zustand';
import {socketManager} from '../../../shared/socket/SocketManager';
import {logger} from '../../../shared/utils/logger';
import {queryClient} from '../../../shared/api/queryClient';
import type {GameStateResponse} from '../../room/types';

interface GameStoreState {
    currentSubscription: string | null;
    subscribeToGame: (gameNumber: number) => void;
    unsubscribeFromGame: () => void;
}

export const useGameStore = create<GameStoreState>((set, get) => ({
    currentSubscription: null,
    subscribeToGame: (gameNumber) => {
        const { currentSubscription } = get();
        const destination = `/topic/game/${gameNumber}/state`;

        if (currentSubscription === destination) {
            return;
        }

        if (currentSubscription) {
            get().unsubscribeFromGame();
        }

        socketManager.subscribe(destination, (message) => {
            try {
                const gameState: GameStateResponse = JSON.parse(message.body);
                logger.debugLog('Received game state update in store:', gameState);
                queryClient.setQueryData(['game', gameNumber], gameState);
            } catch (error) {
                logger.errorLog('Failed to parse game state message in store:', error);
            }
        });

        set({ currentSubscription: destination });
    },
    unsubscribeFromGame: () => {
        const { currentSubscription } = get();
        if (currentSubscription) {
            socketManager.unsubscribe(currentSubscription);
            set({ currentSubscription: null });
        }
    },
}));
