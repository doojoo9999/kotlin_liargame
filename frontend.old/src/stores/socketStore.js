import {create} from 'zustand';
import gameStompClient from '../socket/gameStompClient';
import useGameStore from './gameStore';

const useSocketStore = create((set, get) => ({
    socketConnected: false,
    subscriptions: [],

    connectToRoom: async (gameNumber) => {
        if (get().socketConnected) return;

        try {
            await gameStompClient.connect();
            set({ socketConnected: true });

            const subs = [
                gameStompClient.subscribe(`/topic/game/${gameNumber}`, (msg) => {
                    const messageBody = JSON.parse(msg.body);
                    useGameStore.getState().setGameState(messageBody);
                }),
                gameStompClient.subscribe(`/topic/chat/${gameNumber}`, (msg) => {
                    const messageBody = JSON.parse(msg.body);
                    useGameStore.getState().addChatMessage(messageBody);
                }),
                gameStompClient.subscribe(`/topic/game/${gameNumber}/moderator`, (msg) => {
                    const messageBody = JSON.parse(msg.body);
                    useGameStore.getState().setModeratorMessage(messageBody.content);
                }),
            ];

            set({ subscriptions: subs });
            console.log(`[SocketStore] Connected and subscribed to room ${gameNumber}`);

        } catch (error) {
            console.error(`[SocketStore] Failed to connect:`, error);
        }
    },

    disconnectFromRoom: () => {
        get().subscriptions.forEach(sub => sub.unsubscribe());
        if (gameStompClient.isClientConnected()) {
            gameStompClient.disconnect();
        }
        set({ socketConnected: false, subscriptions: [] });
        console.log('[SocketStore] Disconnected.');
    },
}));

export default useSocketStore;
