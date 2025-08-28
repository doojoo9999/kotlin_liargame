import {useEffect, useRef} from 'react';
import {useChatStore} from '../stores/chatStore';

export const useChatSocket = (gameNumber: number) => {
    const messages = useChatStore((state) => state.messages);
    const actions = useChatStore((state) => state.actions);
    const hasInitialized = useRef(false);
    const currentGameNumber = useRef<number | null>(null);

    useEffect(() => {
        console.log('[useChatSocket] Messages updated:', messages);
    }, [messages]);

    useEffect(() => {
        if (!gameNumber || gameNumber <= 0) {
            return;
        }

        if (hasInitialized.current && currentGameNumber.current === gameNumber) {
            return;
        }

        if (currentGameNumber.current !== null && currentGameNumber.current !== gameNumber) {
            actions.clearMessages();
        }

        hasInitialized.current = true;
        currentGameNumber.current = gameNumber;

        console.log('[useChatSocket] Initializing for game:', gameNumber);

        actions.subscribeToChat(gameNumber);

        return () => {
            console.log('[useChatSocket] Cleanup for game:', gameNumber);
            actions.unsubscribeFromChat();
            hasInitialized.current = false;
        };
    }, [gameNumber]);

    return {
        messages,
        sendMessage: async (content: string) => {
            console.log('[useChatSocket] sendMessage called with content:', content);
            console.log('[useChatSocket] gameNumber:', gameNumber);
            console.log('[useChatSocket] actions.sendMessage:', actions.sendMessage);

            try {
                const result = await actions.sendMessage(gameNumber, content);
                console.log('[useChatSocket] sendMessage result:', result);
                return result;
            } catch (error) {
                console.error('[useChatSocket] sendMessage error:', error);
                throw error;
            }
        },
    };
};
