import {create} from 'zustand';
import {socketManager} from '../../../shared/socket/SocketManager';
import {logger} from '../../../shared/utils/logger';
import {queryClient} from '../../../shared/api/queryClient';
import type {GameRoom} from '../types';

interface LobbyUpdatePayload {
    type: 'ROOM_CREATED' | 'ROOM_UPDATED' | 'ROOM_DELETED';
    gameRoom: GameRoom;
}

interface RoomStoreState {
    isSubscribed: boolean;
    subscribeToLobby: () => void;
    unsubscribeFromLobby: () => void;
}

export const useRoomStore = create<RoomStoreState>((set, get) => ({
    isSubscribed: false,
    subscribeToLobby: () => {
        if (get().isSubscribed) {
            return;
        }

        const destination = '/topic/lobby';
        socketManager.subscribe(destination, (message) => {
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
                logger.errorLog('Failed to parse lobby update message in store:', error);
            }
        });

        set({ isSubscribed: true });
    },
    unsubscribeFromLobby: () => {
        if (get().isSubscribed) {
            const destination = '/topic/lobby';
            socketManager.unsubscribe(destination);
            set({ isSubscribed: false });
        }
    },
}));
