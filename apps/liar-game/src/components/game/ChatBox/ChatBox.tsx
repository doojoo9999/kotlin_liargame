import React, {useEffect, useRef, useState} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {MessageCircle, Send, Users, WifiOff} from 'lucide-react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Avatar, AvatarFallback} from '@/components/ui/avatar';
import {ScrollArea} from '@/components/ui/scroll-area';
import {cn} from '@/lib/utils';
import {useChatStore, useGameFlowStore, usePlayerStore} from '@/stores';
import {useGameWebSocket} from '@/hooks/useGameWebSocket';
import type {ChatMessage} from '@/types/realtime';

export interface ChatBoxProps {
  className?: string;
  compact?: boolean;
  showPlayerList?: boolean;
  maxMessages?: number;
}

const MessageComponent: React.FC<{
  message: ChatMessage;
  isOwn: boolean;
  currentPlayerName?: string;
}> = ({ message, isOwn }) => {
  const displayName = message.playerName ?? message.playerNickname ?? message.nickname ?? 'SYSTEM'
  const messageText = message.message ?? message.content ?? ''
  const messageVariants = {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1
    },
    exit: { opacity: 0, y: -10, scale: 0.95 }
  };
  
  const messageTransition = { type: "spring" as const, stiffness: 300, damping: 25 };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMessageTypeStyles = () => {
    switch (message.type) {
      case 'SYSTEM':
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-center";
      default:
        return isOwn
          ? "bg-blue-500 text-white"
          : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100";
    }
  };

  if (message.type === 'SYSTEM') {
    return (
      <motion.div
        variants={messageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={messageTransition}
        className="flex justify-center my-2"
      >
        <div className={cn(
          "px-3 py-1 rounded-full text-sm",
          getMessageTypeStyles()
        )}>
          {messageText}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={messageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={messageTransition}
      className={cn(
        "flex gap-2 mb-3",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      {!isOwn && (
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarFallback className="text-xs">
            {displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={cn(
        "max-w-[70%] rounded-lg px-3 py-2",
        getMessageTypeStyles()
      )}>
        {!isOwn && (
          <div className="text-xs opacity-70 mb-1">
            {displayName}
          </div>
        )}
        <div className="text-sm">{messageText}</div>
        <div className={cn(
          "text-xs mt-1 opacity-50",
          isOwn ? "text-right" : "text-left"
        )}>
          {formatTime(message.timestamp)}
        </div>
      </div>

      {isOwn && (
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarFallback className="text-xs">
            {displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
    </motion.div>
  );
};

export const ChatBox: React.FC<ChatBoxProps> = ({
  className,
  compact = false,
  showPlayerList = false,
  maxMessages = 100
}) => {
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isComposingRef = useRef(false);
  const pendingSendRef = useRef(false);

  const chatMessages = useChatStore((state) => state.chatMessages);
  const players = usePlayerStore((state) => state.players);
  const currentPlayer = usePlayerStore((state) => state.currentPlayer);
  const gameNumber = useGameFlowStore((state) => state.gameNumber);
  const maxPlayers = useGameFlowStore((state) => state.maxPlayers);
  const hasActiveGame = Boolean(gameNumber);
  const currentPlayerId = currentPlayer?.id ?? null;

  const {
    isConnected,
    connectionError,
    sendChatMessage
  } = useGameWebSocket();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Focus input when component mounts
  useEffect(() => {
    if (!compact) {
      inputRef.current?.focus();
    }
  }, [compact]);

  const handleSendMessage = async () => {
    const trimmed = messageInput.trim();
    if (!trimmed || !isConnected || !hasActiveGame) {
      return;
    }

    setMessageInput('');
    inputRef.current?.focus({ preventScroll: true });

    try {
      await sendChatMessage(trimmed);
    } catch (error) {
      console.error('Failed to send chat message', error);
      setMessageInput(trimmed);
      inputRef.current?.focus({ preventScroll: true });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (isComposingRef.current) {
        pendingSendRef.current = true;
        return;
      }
      e.preventDefault();
      handleSendMessage().catch(() => {});
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
  };

  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleCompositionEnd = () => {
    isComposingRef.current = false;
    if (pendingSendRef.current) {
      pendingSendRef.current = false;
      handleSendMessage().catch(() => {});
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isComposingRef.current) {
      pendingSendRef.current = true;
      return;
    }
    handleSendMessage().catch(() => {});
  };

  const displayMessages = chatMessages.slice(-maxMessages);
  const currentPlayerName = currentPlayer?.nickname ?? players.find(p => p.id === currentPlayerId)?.nickname;

  const connectionStatus = () => {
    if (!isConnected) {
      return (
        <div className="flex items-center gap-2 text-red-500 text-sm">
          <WifiOff className="w-4 h-4" />
          <span>연결 끊김</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 text-green-500 text-sm">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span>실시간 연결</span>
      </div>
    );
  };

  if (compact) {
    return (
      <Card className={cn("w-full h-80", className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm font-medium">채팅</span>
            </div>
            {connectionStatus()}
          </div>
        </CardHeader>

        <CardContent className="p-3 pt-0 h-full flex flex-col">
          <ScrollArea className="flex-1 pr-2">
            <div className="space-y-2">
              <AnimatePresence>
                {displayMessages.map((message) => (
                  <MessageComponent
                    key={`${message.id}-${message.timestamp}`}
                    message={message}
                    isOwn={message.playerId === currentPlayerId}
                    currentPlayerName={currentPlayerName}
                  />
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <form className="flex gap-2 mt-2" onSubmit={handleFormSubmit}>
            <Input
              ref={inputRef}
              value={messageInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              placeholder={isConnected ? "메시지 입력..." : "연결 대기 중..."}
              disabled={!isConnected || !hasActiveGame}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={!messageInput.trim() || !isConnected || !hasActiveGame}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>

          {connectionError && (
            <div className="text-red-500 text-xs mt-1">
              {connectionError}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("flex gap-4", className)}>
      {/* Main Chat Area */}
      <Card className="flex-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              게임 채팅
              <Badge variant="secondary">
                {displayMessages.length}
              </Badge>
            </CardTitle>
            {connectionStatus()}
          </div>
        </CardHeader>

        <CardContent className="h-96 flex flex-col">
          <ScrollArea className="flex-1 pr-2">
            <div className="space-y-3">
              <AnimatePresence>
                {displayMessages.map((message) => (
                  <MessageComponent
                    key={`${message.id}-${message.timestamp}`}
                    message={message}
                    isOwn={message.playerId === currentPlayerId}
                    currentPlayerName={currentPlayerName}
                  />
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <form className="flex gap-2 mt-4" onSubmit={handleFormSubmit}>
            <Input
              ref={inputRef}
              value={messageInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              placeholder={isConnected ? "메시지를 입력하세요..." : "연결 대기 중..."}
              disabled={!isConnected || !hasActiveGame}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={!messageInput.trim() || !isConnected || !hasActiveGame}
            >
              <Send className="w-4 h-4" />
              전송
            </Button>
          </form>

          {connectionError && (
            <div className="text-red-500 text-sm mt-2">
              오류: {connectionError}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Player List (if enabled) */}
      {showPlayerList && hasActiveGame && (
        <Card className="w-64">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              참가자
              <Badge variant="secondary">
                {players.length}/{maxPlayers}
              </Badge>
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-2">
              {players.map((player) => (
                <div
                  key={player.id}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg",
                    player.id === currentPlayerId
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs">
                      {player.nickname?.charAt(0).toUpperCase() ?? '?'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {player.nickname ?? '플레이어'}
                      {player.id === currentPlayerId && " (나)"}
                    </div>
                    <div className="flex gap-1">
                      {player.isHost && (
                        <Badge variant="outline" className="text-xs">
                          방장
                        </Badge>
                      )}
                      {player.isReady && (
                        <Badge variant="secondary" className="text-xs">
                          준비
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    player.isConnected ? "bg-green-500" : "bg-gray-400"
                  )} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
