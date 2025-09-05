import {useEffect, useState} from 'react';

interface ChatMessageStub { id: string; content: string; playerNickname?: string|null; timestamp: number }

export function useChatSubscriber(gameNumber?: number) {
  const [messages, setMessages] = useState<ChatMessageStub[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // stub connection simulation
    setConnected(true);
    return () => setConnected(false);
  }, [gameNumber]);

  return {
    messages,
    connected,
    send: (content: string) => setMessages(m => [...m, { id: Date.now().toString(), content, timestamp: Date.now() }])
  };
}
export default useChatSubscriber;

