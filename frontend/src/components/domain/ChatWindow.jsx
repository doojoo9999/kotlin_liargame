import React, {useEffect, useRef, useState} from 'react';
import {Button, Paper, ScrollArea, Stack, Text, TextInput} from '@mantine/core';
import {useGameStore} from '../../stores/gameStore';
import {useAuthStore} from '../../stores/authStore';
import {useMutation} from '@tanstack/react-query';
import {sendMessage} from '../../api/mutations/roomMutations';
import {useRoomStore} from '../../stores/roomStore';

function ChatWindow() {
  const { chatMessages, addChatMessage, setChatMessages } = useGameStore();
  const { user } = useAuthStore();
  const { currentRoom } = useRoomStore();
  const [message, setMessage] = useState('');
  const viewport = useRef(null);

  const sendChatMessageMutation = useMutation({
    mutationFn: ({ gameNumber, content }) => sendMessage(gameNumber, content),
    onSuccess: () => {
      setMessage('');
    },
  });

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && currentRoom?.gameNumber) {
      sendChatMessageMutation.mutate({ gameNumber: currentRoom.gameNumber, content: message.trim() });
    }
  };

  useEffect(() => {
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
              style={{
                color: msg.sender === user?.nickname ? 'var(--mantine-color-blue-6)' : 'var(--mantine-color-gray-7)',
                fontWeight: msg.sender === user?.nickname ? 600 : 400,
              }}
            >
              {msg.sender || 'System'}: {msg.content}
            </Text>
          ))}
        </Stack>
      </ScrollArea>
      <form onSubmit={handleSendMessage}>
        <TextInput
          placeholder="Type your message..."
          value={message}
          onChange={(event) => setMessage(event.currentTarget.value)}
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
