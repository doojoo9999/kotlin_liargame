import {Box, Paper, Text} from '@mantine/core';
import {FixedSizeList as List} from 'react-window';
import type {ChatMessage} from '../types';

interface ChatMessageListProps {
  messages: ChatMessage[];
}

const Row = ({ index, style, data }: { index: number; style: React.CSSProperties; data: ChatMessage[] }) => {
  const message = data[index];
  const isSystem = message.type !== 'PLAYER';

  return (
    <Box style={style} p="xs">
      <Text c={isSystem ? 'dimmed' : 'default'} size="sm">
        <Text span fw={700} mr="sm">
          {message.sender}:
        </Text>
        {message.content}
      </Text>
    </Box>
  );
};

export function ChatMessageList({ messages }: ChatMessageListProps) {
  return (
    <Paper withBorder p="sm" style={{ flexGrow: 1, height: '300px' }}>
      <List
        height={280}
        itemCount={messages.length}
        itemSize={35}
        width="100%"
        itemData={messages}
      >
        {Row}
      </List>
    </Paper>
  );
}
