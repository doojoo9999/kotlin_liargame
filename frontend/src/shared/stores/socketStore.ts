import {create} from 'zustand';

type SocketConnectionState = 'idle' | 'connecting' | 'connected' | 'error' | 'reconnecting';

interface SocketStoreState {
    connectionState: SocketConnectionState;
    setConnectionState: (newState: SocketConnectionState) => void;
}

export const useSocketStore = create<SocketStoreState>((set) => ({
    connectionState: 'idle',
    setConnectionState: (newState) => set({ connectionState: newState }),
}));
