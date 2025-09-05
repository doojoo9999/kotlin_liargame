import {create} from 'zustand';

interface SocketStoreState {
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'error';
  lastError?: string;
  actions: {
    setState: (state: SocketStoreState['connectionState']) => void;
    setError: (err: string) => void;
  };
}

export const useSocketStore = create<SocketStoreState>((set) => ({
  connectionState: 'disconnected',
  actions: {
    setState: (state) => set({ connectionState: state }),
    setError: (err) => set({ connectionState: 'error', lastError: err })
  }
}));

