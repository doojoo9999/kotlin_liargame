import React, {useEffect, useRef, useState} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {FixedSizeList as List} from 'react-window';
import {cn} from '@/shared/utils/cn';
import {ChatMessage, ChatMessageType} from '@/shared/types/game';

interface ChatSystemProps {
  gameNumber: number;
  messages: ChatMessage[];
  chatType: ChatMessageType;
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
  allowedSender?: 'current_player' | 'accused_player' | 'all';
  className?: string;
}

export const ChatSystem: React.FC<ChatSystemProps> = ({
  gameNumber,
  messages,
  chatType,
  onSendMessage,
  disabled = false,
  placeholder,
  allowedSender = 'all',
  className
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const listRef = useRef<List>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 새 메시지가 추가될 때 자동 스크롤
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToItem(messages.length - 1, 'end');
    }
  }, [messages.length]);

  // 채팅 입력 제한 체크
  const canSendMessage = !disabled && inputValue.trim().length > 0;

  const handleSendMessage = () => {
    if (!canSendMessage) return;

    onSendMessage(inputValue.trim());
    setInputValue('');
    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsTyping(e.target.value.length > 0);
  };

  // 메시지 타입별 스타일 정의
  const getMessageStyle = (message: ChatMessage) => {
    switch (message.type) {
      case 'HINT':
        return {
          containerClass: 'bg-blue-50 border-l-4 border-blue-400',
          senderClass: 'text-blue-700 font-semibold',
          contentClass: 'text-blue-800',
          prefix: '💡'
        };
      case 'DEFENSE':
        return {
          containerClass: 'bg-green-50 border-l-4 border-green-400',
          senderClass: 'text-green-700 font-semibold',
          contentClass: 'text-green-800',
          prefix: '🛡️'
        };
      case 'SYSTEM':
        return {
          containerClass: 'bg-gray-50 border-l-4 border-gray-400',
          senderClass: 'text-gray-600 font-medium',
          contentClass: 'text-gray-700',
          prefix: '📢'
        };
      case 'VOTE_ANNOUNCEMENT':
        return {
          containerClass: 'bg-red-50 border-l-4 border-red-400',
          senderClass: 'text-red-700 font-semibold',
          contentClass: 'text-red-800',
          prefix: '🗳️'
        };
      default:
        return {
          containerClass: 'bg-white border-l-4 border-transparent',
          senderClass: 'text-gray-700 font-medium',
          contentClass: 'text-gray-800',
          prefix: ''
        };
    }
  };

  // 가상화된 메시지 아이템 컴포넌트
  const MessageItem = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const message = messages[index];
    const messageStyle = getMessageStyle(message);

    return (
      <motion.div
        style={style}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className="px-4 py-2"
      >
        <div className={cn('p-3 rounded-lg', messageStyle.containerClass)}>
          <div className="flex items-start space-x-2">
            {messageStyle.prefix && (
              <span className="text-lg">{messageStyle.prefix}</span>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <span className={cn('text-sm', messageStyle.senderClass)}>
                  {message.senderNickname}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className={cn('text-sm break-words', messageStyle.contentClass)}>
                {message.content}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // 채팅 타입별 플레이스홀더
  const getPlaceholder = () => {
    if (placeholder) return placeholder;

    switch (chatType) {
      case 'HINT':
        return '힌트를 입력하세요...';
      case 'DISCUSSION':
        return '의견을 나눠보세요...';
      case 'DEFENSE':
        return '변론을 입력하세요...';
      default:
        return '메시지를 입력하세요...';
    }
  };

  return (
    <div className={cn('flex flex-col h-full bg-white rounded-lg shadow-lg', className)}>
      {/* 채팅 헤더 */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold text-gray-900">채팅</h3>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
            {chatType === 'HINT' && '힌트 단계'}
            {chatType === 'DISCUSSION' && '토론 단계'}
            {chatType === 'DEFENSE' && '변론 단계'}
            {chatType === 'SYSTEM' && '시스템'}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          {messages.length}개 메시지
        </div>
      </div>

      {/* 메시지 리스트 (가상화) */}
      <div className="flex-1 overflow-hidden">
        {messages.length > 0 ? (
          <List
            ref={listRef}
            height={300}
            itemCount={messages.length}
            itemSize={80}
            className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
          >
            {MessageItem}
          </List>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-2">💬</div>
              <p className="text-sm">아직 메시지가 없습니다</p>
            </div>
          </div>
        )}
      </div>

      {/* 입력 영역 */}
      <div className="p-4 border-t">
        <AnimatePresence>
          {disabled && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700"
            >
              {allowedSender === 'current_player' && '현재 턴인 플레이어만 채팅할 수 있습니다.'}
              {allowedSender === 'accused_player' && '의심받는 플레이어만 변론할 수 있습니다.'}
              {allowedSender === 'all' && '채팅이 비활성화되었습니다.'}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={getPlaceholder()}
            disabled={disabled}
            className={cn(
              'flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
              'disabled:bg-gray-100 disabled:cursor-not-allowed',
              disabled ? 'border-gray-200' : 'border-gray-300'
            )}
            maxLength={200}
          />

          <motion.button
            onClick={handleSendMessage}
            disabled={!canSendMessage}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-all',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              canSendMessage
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            )}
            whileHover={canSendMessage ? { scale: 1.05 } : undefined}
            whileTap={canSendMessage ? { scale: 0.95 } : undefined}
          >
            전송
          </motion.button>
        </div>

        {/* 타이핑 상태 표시 */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 text-xs text-gray-500"
            >
              {inputValue.length}/200
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ChatSystem;
