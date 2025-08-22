import {Stack} from '@mantine/core';
import {ChatInput} from './ChatInput';
import {ChatMessageList} from './ChatMessageList';
import type {ChatMessage} from '../types';

interface ChatBoxProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export function ChatBox({ messages, onSendMessage, disabled }: ChatBoxProps) {
  return (
    <Stack>
      <ChatMessageList messages={messages} />
      <ChatInput onSendMessage={onSendMessage} disabled={disabled} />
    </Stack>
  );
}
