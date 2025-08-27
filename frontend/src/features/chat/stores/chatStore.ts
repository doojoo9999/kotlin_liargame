import {create} from 'zustand';
import {subscribeWithSelector} from 'zustand/middleware';
import {socketManager} from '../../../shared/socket/SocketManager';
import {logger} from '../../../shared/utils';
import type {ChatMessage} from '../types';

interface RawChatMessage {
    id?: number;
    playerId?: number;
    playerNickname: string;
    content: string;
    type: 'USER' | 'SYSTEM' | 'GAME_EVENT' | 'ADMIN' | 'POST_ROUND';
    timestamp: string;
}

const mapRawMessageToChatMessage = (raw: RawChatMessage): ChatMessage => {
    let type: ChatMessage['type'] = 'PLAYER';
    if (raw.type === 'SYSTEM' || raw.type === 'GAME_EVENT' || raw.type === 'ADMIN') {
        type = 'SYSTEM';
    }
    return {
        sender: raw.playerNickname,
        content: raw.content,
        timestamp: raw.timestamp,
        type: type,
    };
};

interface ChatStoreState {
    messages: ChatMessage[];
    currentSubscription: string | null;
    isSubscribing: boolean;
    // 액션들을 별도로 분리
    actions: {
        subscribeToChat: (gameNumber: number) => Promise<void>;
        unsubscribeFromChat: () => void;
        sendMessage: (gameNumber: number, content: string) => Promise<void>;
        clearMessages: () => void;
        addMessage: (message: ChatMessage) => void;
    };
}

export const useChatStore = create<ChatStoreState>()(
    subscribeWithSelector((set, get) => ({
        messages: [],
        currentSubscription: null,
        isSubscribing: false,

        actions: {
            subscribeToChat: async (gameNumber: number) => {
                const state = get();
                const destination = `/topic/chat/${gameNumber}`;

                // 구독 중이거나 이미 같은 구독이 있으면 무시
                if (state.isSubscribing || state.currentSubscription === destination) {
                    logger.debugLog('Already subscribed or subscribing to chat:', destination);
                    return;
                }

                set({ isSubscribing: true });

                try {
                    // 기존 구독 정리
                    if (state.currentSubscription) {
                        logger.debugLog('Unsubscribing from previous chat:', state.currentSubscription);
                        socketManager.unsubscribe(state.currentSubscription);
                    }

                    // 새 구독 등록
                    logger.debugLog('Subscribing to chat:', destination);
                    await socketManager.subscribe(destination, (message) => {
                        try {
                            console.log('[ChatStore] === WEBSOCKET MESSAGE RECEIVED ===');
                            console.log('[ChatStore] Raw message object:', message);
                            console.log('[ChatStore] Message body:', message.body);
                            console.log('[ChatStore] Message headers:', message.headers);
                            logger.debugLog('[ChatStore] Raw WebSocket message received:', message.body);

                            const rawMessage: RawChatMessage = JSON.parse(message.body);
                            console.log('[ChatStore] Parsed raw message:', rawMessage);
                            logger.debugLog('[ChatStore] Parsed raw message:', rawMessage);

                            const formattedMessage = mapRawMessageToChatMessage(rawMessage);
                            console.log('[ChatStore] Formatted message:', formattedMessage);
                            logger.debugLog('[ChatStore] Formatted message:', formattedMessage);

                            // 별도 액션으로 메시지 추가
                            get().actions.addMessage(formattedMessage);
                            console.log('[ChatStore] === MESSAGE ADDED TO STORE ===');
                        } catch (error) {
                            console.error('[ChatStore] Failed to parse chat message:', error);
                            logger.errorLog('Failed to parse chat message in store:', error);
                        }
                    });

                    set({
                        currentSubscription: destination,
                        isSubscribing: false
                    });
                } catch (error) {
                    logger.errorLog('Failed to subscribe to chat:', error);
                    set({ isSubscribing: false });
                }
            },

            unsubscribeFromChat: () => {
                const state = get();
                if (state.currentSubscription) {
                    logger.debugLog('Unsubscribing from chat:', state.currentSubscription);
                    socketManager.unsubscribe(state.currentSubscription);
                    set({ currentSubscription: null });
                }
            },

            sendMessage: async (gameNumber: number, content: string) => {
                try {
                    const destination = `/app/chat.send`;
                    const body = { gameNumber, content };

                    console.log('[ChatStore] Attempting to send message:', { destination, body });
                    console.log('[ChatStore] Socket connection state:', socketManager);

                    // 메시지 내용 검증
                    if (!content || content.trim().length === 0) {
                        console.error('[ChatStore] Empty message content, not sending');
                        throw new Error('메시지 내용이 비어있습니다.');
                    }

                    if (!gameNumber || gameNumber <= 0) {
                        console.error('[ChatStore] Invalid game number, not sending');
                        throw new Error('유효하지 않은 게임 번호입니다.');
                    }

                    logger.debugLog('[ChatStore] Sending WebSocket message:', body);
                    await socketManager.publish(destination, JSON.stringify(body));
                    console.log('[ChatStore] Message sent successfully');
                } catch (error) {
                    console.error('[ChatStore] Failed to send message:', error);
                    logger.errorLog('Failed to send chat message:', error);
                    throw error; // 에러를 다시 던져서 ChatInput에서 처리할 수 있도록 함
                }
            },

            clearMessages: () => {
                set({ messages: [] });
            },

            addMessage: (message: ChatMessage) => {
                logger.debugLog('[ChatStore] Adding message to store:', message);
                set((state) => {
                    // 중복 메시지 방지
                    const isDuplicate = state.messages.some(msg =>
                        msg.content === message.content &&
                        msg.timestamp === message.timestamp &&
                        msg.sender === message.sender
                    );

                    if (isDuplicate) {
                        logger.debugLog('[ChatStore] Duplicate message detected, skipping');
                        return state; // 상태 변경 없음
                    }

                    const newMessages = [...state.messages, message];
                    logger.debugLog('[ChatStore] Updated messages array:', newMessages);
                    return {
                        ...state,
                        messages: newMessages
                    };
                });
            }
        }
    }))
);
