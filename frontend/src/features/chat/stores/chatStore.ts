import {create} from 'zustand';
import {socketManager} from '../../../shared/socket/SocketManager';
import {logger} from '../../../shared/utils/logger';
import type {ChatMessage} from '../types';

interface RawChatMessage {
    id?: number;
    gameNumber: number;
    senderId?: number;
    senderNickname: string;
    content: string;
    messageType: 'USER' | 'SYSTEM' | 'GAME_EVENT' | 'ADMIN';
    timestamp: string;
}

const mapRawMessageToChatMessage = (raw: RawChatMessage): ChatMessage => {
    let type: ChatMessage['type'] = 'PLAYER';
    if (raw.messageType === 'SYSTEM' || raw.messageType === 'GAME_EVENT' || raw.messageType === 'ADMIN') {
        type = 'SYSTEM';
    }
    return {
        sender: raw.senderNickname,
        content: raw.content,
        timestamp: raw.timestamp,
        type: type,
    };
};

interface ChatStoreState {
    messages: ChatMessage[];
    currentSubscription: string | null;
    subscribeToChat: (gameNumber: number) => void;
    unsubscribeFromChat: () => void;
    sendMessage: (gameNumber: number, content: string) => void;
    clearMessages: () => void;
}

export const useChatStore = create<ChatStoreState>((set, get) => ({
    messages: [],
    currentSubscription: null,
    subscribeToChat: (gameNumber) => {
        const { currentSubscription } = get();
        const destination = `/topic/chat/${gameNumber}`;

        if (currentSubscription === destination) {
            return; // Already subscribed
        }

        if (currentSubscription) {
            get().unsubscribeFromChat();
        }

        socketManager.subscribe(destination, (message) => {
            try {
                const rawMessage: RawChatMessage = JSON.parse(message.body);
                const formattedMessage = mapRawMessageToChatMessage(rawMessage);
                set((state) => ({ messages: [...state.messages, formattedMessage] }));
            } catch (error) {
                logger.errorLog('Failed to parse chat message in store:', error);
            }
        });

        set({ currentSubscription: destination });
    },
    unsubscribeFromChat: () => {
        const { currentSubscription } = get();
        if (currentSubscription) {
            socketManager.unsubscribe(currentSubscription);
            set({ currentSubscription: null });
        }
    },
    sendMessage: (gameNumber, content) => {
        const destination = `/chat.send`;
        const body = { gameNumber, content };
        socketManager.publish(destination, JSON.stringify(body));
    },
    clearMessages: () => set({ messages: [] }),
}));
