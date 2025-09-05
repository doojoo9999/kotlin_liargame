import {create} from 'zustand';

interface ChatMessage {
  id: string;
  gameNumber: number;
  content: string;
  createdAt: number;
}

interface ChatStoreState {
  messages: ChatMessage[];
  actions: {
    sendMessage: (gameNumber: number, content: string) => Promise<void>;
    addMessage: (msg: ChatMessage) => void;
  };
}

export const useChatStore = create<ChatStoreState>((set, get) => ({
  messages: [],
  actions: {
    sendMessage: async (gameNumber: number, content: string) => {
      const msg: ChatMessage = {
        id: `${Date.now()}`,
        gameNumber,
        content,
        createdAt: Date.now()
      };
      get().actions.addMessage(msg);
    },
    addMessage: (msg: ChatMessage) => set(state => ({ messages: [...state.messages, msg] }))
  }
}));

