import React, {useEffect, useRef, useState} from 'react';
import {Button, Paper, ScrollArea, Stack, Text, TextInput} from '@mantine/core';
import {useGameStore} from '../../stores/gameStore';
import {useAuthStore} from '../../stores/authStore';
import {useMutation} from '@tanstack/react-query';
import {sendMessage} from '../../api/mutations/gameMutations'; // Corrected import path
import {useRoomStore} from '../../stores/roomStore';

function ChatWindow() {
  const { chatMessages } = useGameStore();
  const { user } = useAuthStore();
  const { currentRoom } = useRoomStore();
  const [message, setMessage] = useState('');
  const viewport = useRef(null);

  const sendChatMessageMutation = useMutation({
    mutationFn: ({ gameNumber, content }) => sendMessage(gameNumber, content),
    onSuccess: () => {
      setMessage('');
    },
    onError: (error) => {
        console.error("Failed to send message:", error);
        // Optionally show an error notification to the user
    }
  });

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && currentRoom?.gameNumber) {
      sendChatMessageMutation.mutate({ gameNumber: currentRoom.gameNumber, content: message.trim() });
    }
  };

  useEffect(() => {
    // Scroll to the bottom whenever a new message is added
    if (viewport.current) {
      viewport.current.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' });
    }
  }, [chatMessages]);

  return (
    <Paper shadow="sm" p="md" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ScrollArea style={{ flex: 1, marginBottom: 'var(--mantine-spacing-md)' }} viewportRef={viewport}>
        <Stack spacing="xs">
          {chatMessages.map((msg, index) => (
            <Text
              key={index}
              size="sm"
            >
              <Text span fw={msg.sender === user?.nickname ? 700 : 500} c={msg.sender === user?.nickname ? 'blue' : 'dark'}>
                {msg.sender || 'System'}:
              </Text>{' '}
              {msg.content}
            </Text>
          ))}
        </Stack>
      </ScrollArea>
      <form onSubmit={handleSendMessage}>
        <TextInput
          placeholder="Type your message..."
          value={message}
          onChange={(event) => setMessage(event.currentTarget.value)}
          disabled={sendChatMessageMutation.isPending}
          rightSection={
            <Button type="submit" loading={sendChatMessageMutation.isPending}>
              Send
            </Button>
          }
        />
      </form>
    </Paper>
  );
}

export default ChatWindow;
