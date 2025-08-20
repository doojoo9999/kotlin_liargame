import {useEffect, useRef, useState} from 'react';
import {ActionIcon, Group, Paper, ScrollArea, Stack, Text, TextInput, ThemeIcon} from '@mantine/core';
import {useChat} from '@/features/chat/hooks/useChat';
import {useAuthStore} from '@/stores/authStore';
import {IconSend, IconUserCircle} from '@tabler/icons-react';

const ChatMessage = ({ message, isOwn }) => {
  return (
    <Group justify={isOwn ? 'flex-end' : 'flex-start'}>
      {!isOwn && (
        <ThemeIcon variant="light" size="lg" radius="xl">
          <IconUserCircle />
        </ThemeIcon>
      )}
      <Paper withBorder p="xs" radius="lg" bg={isOwn ? 'blue.1' : 'gray.1'}>
        <Stack gap={0}>
          {!isOwn && <Text size="xs" c="dimmed">{message.sender}</Text>}
          <Text size="sm">{message.content}</Text>
        </Stack>
      </Paper>
    </Group>
  );
};

export const ChatWindow = ({ roomId }) => {
  const { messages, sendMessage } = useChat(roomId);
  const { user } = useAuthStore();
  const [newMessage, setNewMessage] = useState('');
  const viewport = useRef(null);

  const scrollToBottom = () => {
    viewport.current?.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessage(newMessage);
      setNewMessage('');
    }
  };

  return (
    <Paper withBorder p="md" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Text fw={500} mb="sm">Chat</Text>
      <ScrollArea style={{ flex: 1 }} viewportRef={viewport}>
        <Stack gap="sm">
          {messages.map((msg, index) => (
            <ChatMessage key={index} message={msg} isOwn={msg.sender === user.nickname} />
          ))}
        </Stack>
      </ScrollArea>
      <form onSubmit={handleSendMessage} style={{ marginTop: '10px' }}>
        <TextInput
          value={newMessage}
          onChange={(e) => setNewMessage(e.currentTarget.value)}
          placeholder="Type a message..."
          rightSection={
            <ActionIcon type="submit" variant="filled" size="lg" radius="xl">
              <IconSend />
            </ActionIcon>
          }
        />
      </form>
    </Paper>
  );
};
