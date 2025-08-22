import {useEffect} from 'react';
import {useChatStore} from '../stores/chatStore';

/**
 * A hook that connects a React component to the centralized chat store.
 * It handles subscribing and unsubscribing based on the component's lifecycle.
 *
 * @param gameNumber The game number for the chat room.
 * @returns The chat messages and a function to send a new message.
 */
export const useChatSocket = (gameNumber: number) => {
    const { messages, subscribeToChat, unsubscribeFromChat, sendMessage, clearMessages } = useChatStore((state) => ({
        messages: state.messages,
        subscribeToChat: state.subscribeToChat,
        unsubscribeFromChat: state.unsubscribeFromChat,
        sendMessage: state.sendMessage,
        clearMessages: state.clearMessages,
    }));

    useEffect(() => {
        if (gameNumber > 0) {
            subscribeToChat(gameNumber);
        }

        // Cleanup on component unmount
        return () => {
            unsubscribeFromChat();
            clearMessages(); // Clear messages when leaving the room
        };
    }, [gameNumber, subscribeToChat, unsubscribeFromChat, clearMessages]);

    const handleSendMessage = (content: string) => {
        sendMessage(gameNumber, content);
    };

    return {
        messages,
        sendMessage: handleSendMessage,
    };
};
