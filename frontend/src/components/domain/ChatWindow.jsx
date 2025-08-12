import React, {useEffect, useRef, useState} from 'react';
import {ActionIcon, Box, Group, Paper, ScrollArea, Stack, Text, TextInput} from '@mantine/core';
import {IconSend} from '@tabler/icons-react';
import {useGame} from '../../hooks/useGame';

function ChatWindow() {
  const { chatMessages, user, sendChatMessage, isSocketConnected } = useGame();
  const [message, setMessage] = useState('');
  const viewport = useRef(null);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      sendChatMessage(message);
      setMessage('');
    }
  };

  useEffect(() => {
    if (viewport.current) {
      viewport.current.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' });
    }
  }, [chatMessages]);

  return (
    <Paper withBorder shadow="sm" p="md" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ScrollArea style={{ flex: 1 }} viewportRef={viewport}>
        <Stack gap="xs">
          {chatMessages.map((msg, index) => (
            <Box key={index}>
              <Text size="sm">
                <Text span fw={700} c={msg.playerNickname === user?.nickname ? 'blue' : 'dark'}>
                  {msg.playerNickname || 'System'}:
                </Text>{' '}
                {msg.content}
              </Text>
            </Box>
          ))}
        </Stack>
      </ScrollArea>
      <form onSubmit={handleSendMessage}>
        <Group mt="md" gap="xs">
          <TextInput
            style={{ flex: 1 }}
            placeholder="메시지를 입력하세요..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={!isSocketConnected}
          />
          <ActionIcon type="submit" variant="filled" size="lg" disabled={!isSocketConnected}>
            <IconSend size={18} />
          </ActionIcon>
        </Group>
      </form>
    </Paper>
  );
}

export default ChatWindow;
