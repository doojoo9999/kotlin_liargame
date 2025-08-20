import {useEffect, useState} from 'react';
import {stompClient} from '@/shared/socket/stompClient';
import {useAuthStore} from '@/stores/authStore';

export const useChat = (roomId) => {
  const [messages, setMessages] = useState([]);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!roomId || !stompClient.stompClient?.active) {
      return;
    }

    const subscription = stompClient.subscribe(`/topic/chat/${roomId}`, (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      stompClient.unsubscribe(`/topic/chat/${roomId}`);
    };
  }, [roomId, stompClient.stompClient?.active]);

  const sendMessage = (messageContent) => {
    if (messageContent && stompClient.stompClient?.active) {
      const chatMessage = {
        sender: user?.nickname || 'Unknown',
        content: messageContent,
        type: 'CHAT',
      };
      stompClient.publish({
        destination: `/app/chat/${roomId}/sendMessage`,
        body: chatMessage,
      });
    }
  };

  return { messages, sendMessage };
};
