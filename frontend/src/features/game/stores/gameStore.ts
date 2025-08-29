import {create} from 'zustand';
import {subscribeWithSelector} from 'zustand/middleware';
import {socketManager} from '../../../shared/socket/SocketManager';
import {logger} from '../../../shared/utils';
import {queryClient} from '../../../app/providers/QueryProvider';
import type {GameStateResponse} from '../../room';

interface GameStoreState {
    currentSubscription: string | null;
    isSubscribing: boolean;
    // 액션들을 별도로 분리
    actions: {
        subscribeToGame: (gameNumber: number) => Promise<void>;
        unsubscribeFromGame: () => void;
        updateGameState: (gameNumber: number, gameState: GameStateResponse) => void;
    };
}

export const useGameStore = create<GameStoreState>()(
    subscribeWithSelector((set, get) => ({
        currentSubscription: null,
        isSubscribing: false,

        actions: {
            subscribeToGame: async (gameNumber: number) => {
                const state = get();
                const destination = `/topic/game/${gameNumber}/state`;

                // 구독 중이거나 이미 같은 구독이 있으면 무시
                if (state.isSubscribing || state.currentSubscription === destination) {
                    logger.debugLog('Already subscribed or subscribing to game:', destination);
                    return;
                }

                set({ isSubscribing: true });

                try {
                    // 기존 구독 정리
                    if (state.currentSubscription) {
                        logger.debugLog('Unsubscribing from previous game:', state.currentSubscription);
                        socketManager.unsubscribe(state.currentSubscription);
                    }

                    // 새 구독 등록
                    logger.debugLog('Subscribing to game:', destination);
                    await socketManager.subscribe(destination, (message) => {
                        try {
                            console.log('[GameStore] ===== WEBSOCKET MESSAGE RECEIVED =====');
                            console.log('[GameStore] Topic:', destination);
                            console.log('[GameStore] Raw message body:', message.body);

                            const gameState: GameStateResponse = JSON.parse(message.body);
                            console.log('[GameStore] Parsed game state:', {
                                gameNumber: gameState.gameNumber,
                                currentPhase: gameState.currentPhase,
                                gameState: gameState.gameState,
                                playersCount: gameState.players?.length
                            });
                            console.log('[GameStore] ===== WEBSOCKET MESSAGE END =====');

                            logger.debugLog('Received game state update in store:', gameState);

                            // 별도 액션으로 게임 상태 업데이트
                            get().actions.updateGameState(gameNumber, gameState);
                        } catch (error) {
                            console.error('[GameStore] Failed to parse game state message:', error);
                            logger.errorLog('Failed to parse game state message in store:', error);
                        }
                    });

                    set({
                        currentSubscription: destination,
                        isSubscribing: false
                    });
                } catch (error) {
                    logger.errorLog('Failed to subscribe to game:', error);
                    set({ isSubscribing: false });
                }
            },

            unsubscribeFromGame: () => {
                const state = get();
                if (state.currentSubscription) {
                    logger.debugLog('Unsubscribing from game socket:', state.currentSubscription);
                    socketManager.unsubscribe(state.currentSubscription);
                    set({ currentSubscription: null });
                }
            },

            updateGameState: (gameNumber: number, gameState: GameStateResponse) => {
                logger.debugLog('Updating game state in store:', {
                    gameNumber,
                    playersLength: gameState.players.length,
                    gameOwner: gameState.gameOwner,
                    gameState: gameState.gameState,
                    currentPhase: gameState.currentPhase,
                    players: gameState.players
                });

                // 상태 업데이트 전후 비교를 위한 로그
                const currentData = queryClient.getQueryData(['game', gameNumber]) as GameStateResponse | undefined;
                if (currentData) {
                    console.log('[GameStore] State update comparison:', {
                        before: {
                            phase: currentData.currentPhase,
                            turnIndex: currentData.currentTurnIndex
                        },
                        after: {
                            phase: gameState.currentPhase,
                            turnIndex: gameState.currentTurnIndex
                        }
                    });
                }

                queryClient.setQueryData(['game', gameNumber], gameState);
                queryClient.invalidateQueries({ queryKey: ['game', gameNumber] });
            }
        }
    }))
);
