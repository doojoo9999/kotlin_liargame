import {Box, Button, Paper, Text} from '@mantine/core';
import {FixedSizeList as List} from 'react-window';
import {useEffect, useRef, useState} from 'react';
import type {ChatMessage} from '../types';

interface ChatMessageListProps {
  messages: ChatMessage[];
}

const Row = ({ index, style, data }: { index: number; style: React.CSSProperties; data: ChatMessage[] }) => {
  const message = data[index];
  const isSystem = message.type === 'SYSTEM';

  return (
    <Box style={style} p="xs">
      {isSystem ? (
        <Text c="blue" size="sm" fw={600} ta="center">
          🔔 {message.content}
        </Text>
      ) : (
        <Text c="default" size="sm">
          <Text span fw={700} mr="sm">
            {message.sender}:
          </Text>
          {message.content}
        </Text>
      )}
    </Box>
  );
};

export function ChatMessageList({ messages }: ChatMessageListProps) {
  const listRef = useRef<List>(null);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [showNewMessageButton, setShowNewMessageButton] = useState(false);
  const previousMessageCountRef = useRef(messages.length);

  // 스크롤을 맨 아래로 이동하는 함수
  const scrollToBottom = () => {
    if (listRef.current && messages.length > 0) {
      listRef.current.scrollToItem(messages.length - 1, 'end');
      setIsScrolledUp(false);
      setShowNewMessageButton(false);
    }
  };

  // 새로운 메시지가 추가될 때마다 체크
  useEffect(() => {
    const messageCountChanged = messages.length !== previousMessageCountRef.current;

    if (messageCountChanged && messages.length > 0) {
      if (!isScrolledUp) {
        // 스크롤이 맨 아래에 있으면 자동으로 최신 메시지로 스크롤
        scrollToBottom();
      } else {
        // 스크롤이 위에 있으면 새 메시지 알림 버튼 표시
        setShowNewMessageButton(true);
      }
      previousMessageCountRef.current = messages.length;
    }
  }, [messages.length, isScrolledUp]);

  // 스크롤 이벤트 핸들러
  const handleScroll = ({ scrollOffset }: { scrollOffset: number; scrollDirection: 'forward' | 'backward' }) => {
    if (messages.length === 0) return;

    const maxScrollOffset = Math.max(0, (messages.length * 35) - 280); // itemSize * itemCount - height
    const isAtBottom = scrollOffset >= maxScrollOffset - 35; // 마지막 메시지 근처

    if (isAtBottom) {
      setIsScrolledUp(false);
      setShowNewMessageButton(false);
    } else {
      setIsScrolledUp(true);
    }
  };

  // 컴포넌트 마운트 시 맨 아래로 스크롤
  useEffect(() => {
    scrollToBottom();
  }, []);

  return (
    <Box style={{ position: 'relative', flexGrow: 1, height: '300px' }}>
      <Paper withBorder p="sm" style={{ height: '100%' }}>
        <List
          ref={listRef}
          height={280}
          itemCount={messages.length}
          itemSize={35}
          width="100%"
          itemData={messages}
          onScroll={handleScroll}
        >
          {Row}
        </List>
      </Paper>

      {/* 최신 채팅 보기 버튼 */}
      {showNewMessageButton && (
        <Button
          size="xs"
          variant="filled"
          color="blue"
          style={{
            position: 'absolute',
            bottom: '50px',
            right: '20px',
            zIndex: 10,
            borderRadius: '20px',
            fontSize: '12px',
            padding: '8px 16px'
          }}
          onClick={scrollToBottom}
        >
          최신 채팅 보기
        </Button>
      )}
    </Box>
  );
}
