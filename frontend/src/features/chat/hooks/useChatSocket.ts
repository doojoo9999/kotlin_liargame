import {useEffect, useState} from 'react';
import {stompClient} from '../../../shared/socket/stompClient';
import type {ChatMessage} from '../types';

export const useChatSocket = (gameNumber: number) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!gameNumber) return;

    let subscription: { unsubscribe: () => void } | null = null;

    const onConnect = () => {
      const destination = `/topic/chat/${gameNumber}`;
      console.log(`Chat WebSocket connected, subscribing to ${destination}`);
      
      subscription = stompClient.subscribe(destination, (message) => {
        try {
          const chatMessage: ChatMessage = JSON.parse(message.body);
          setMessages((prevMessages) => [...prevMessages, chatMessage]);
        } catch (error) {
          console.error("Failed to parse chat message:", error);
        }
      });
    };

    // Assuming stompClient is already connected from the game room page
    onConnect();

    return () => {
      console.log(`Unsubscribing from /topic/chat/${gameNumber}`);
      subscription?.unsubscribe();
    };
  }, [gameNumber]);

  const sendMessage = (content: string) => {
    if (!stompClient.client.active) {
      console.error('STOMP client is not connected.');
      return;
    }
    const destination = `/chat.send`;
    const body = JSON.stringify({ gameNumber, content });
    stompClient.publish(destination, body);
  };

  return { messages, sendMessage };
};