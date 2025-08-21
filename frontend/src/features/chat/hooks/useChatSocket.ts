import {useEffect, useState} from 'react';
import {stompClient} from '../../../shared/socket/stompClient';
import type {ChatMessage} from '../types';

export const useChatSocket = (gameNumber: number) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!gameNumber) return;

    // The stompClient connection is likely already initiated by another hook,
    // but calling connect() again is safe and ensures it's active.
    stompClient.connect();

    const destination = `/topic/chat/${gameNumber}`;
    const subscription = stompClient.subscribe(destination, (message) => {
      try {
        const chatMessage: ChatMessage = JSON.parse(message.body);
        setMessages((prevMessages) => [...prevMessages, chatMessage]);
      } catch (error) {
        console.error("Failed to parse chat message:", error);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [gameNumber]);

  const sendMessage = (content: string) => {
    if (!stompClient.isActive()) {
      console.error('STOMP client is not connected.');
      // Optionally, you could queue the message to be sent upon connection.
      return;
    }
    const destination = `/chat.send`;
    const body = JSON.stringify({ gameNumber, content });
    stompClient.publish(destination, body);
  };

  return { messages, sendMessage };
};