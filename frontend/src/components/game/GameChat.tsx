import React, {useEffect, useRef, useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Avatar, AvatarFallback} from '@/components/ui/avatar';
import {Badge} from '@/components/ui/badge';
import {useGameFlow} from '@/hooks/useGameFlow';
import {websocketService} from '@/services/websocketService';
import {MessageCircle, Send, Users} from 'lucide-react';
import {ChatMessage} from '@/types/gameFlow';
import {Player} from '@/store/gameStore';

interface GameChatProps {
  players: Player[];
  currentPlayer: Player | null;
  gamePhase: string;
  className?: string;
}

export const GameChat: React.FC<GameChatProps> = ({
  players,
  currentPlayer,
  gamePhase,
  className = '',
}) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { sendChatMessage, loadChatHistory, chatMessages } = useGameFlow();

  // 채팅 메시지 동기화
  useEffect(() => {
    setMessages(chatMessages);
  }, [chatMessages]);

  // 메시지 목록 끝으로 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 컴포넌트 마운트 시 채팅 기록 로드
  useEffect(() => {
    loadChatHistory().catch(console.error);
  }, [loadChatHistory]);

  // WebSocket 채팅 메시지 구독
  useEffect(() => {
    const unsubscribe = websocketService.onChatMessage((chatMessage) => {
      const formattedMessage: ChatMessage = {
        id: chatMessage.id,
        gameNumber: parseInt(chatMessage.gameId),
        userId: parseInt(chatMessage.playerId),
        nickname: chatMessage.playerName,
        message: chatMessage.message,
        timestamp: chatMessage.timestamp,
        type: chatMessage.type === 'SYSTEM' ? 'SYSTEM' : 'GENERAL',
      };

      setMessages(prev => [...prev, formattedMessage]);
    });

    return unsubscribe;
  }, []);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      await sendChatMessage(message);
      setMessage('');
    } catch (error) {
      console.error('Failed to send chat message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getPlayerByUserId = (userId: number) => {
    return players.find(p => parseInt(p.id) === userId);
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'SYSTEM':
        return 'text-blue-600';
      case 'HINT':
        return 'text-green-600';
      case 'DEFENSE':
        return 'text-orange-600';
      default:
        return 'text-foreground';
    }
  };

  const canSendMessage = () => {
    // 게임 단계별로 채팅 제한 설정
    const restrictedPhases = ['VOTING_FOR_LIAR', 'VOTING_FOR_SURVIVAL'];
    return !restrictedPhases.includes(gamePhase);
  };

  return (
    <Card className={`${className} ${isExpanded ? 'fixed inset-4 z-50' : 'h-96'}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <MessageCircle className="mr-2 h-5 w-5" />
            게임 채팅
            {messages.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {messages.length}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="mr-1 h-4 w-4" />
              {players.filter(p => p.isOnline).length}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? '최소화' : '확대'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col h-full">
        {/* 메시지 목록 */}
        <div className={`flex-1 overflow-y-auto space-y-2 mb-4 ${isExpanded ? 'max-h-[calc(100vh-200px)]' : 'max-h-60'}`}>
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              아직 메시지가 없습니다
            </div>
          ) : (
            messages.map((msg) => {
              const player = getPlayerByUserId(msg.userId);
              const isCurrentUser = currentPlayer && msg.userId === parseInt(currentPlayer.id);
              const isSystemMessage = msg.type === 'SYSTEM';

              return (
                <div
                  key={msg.id}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${isCurrentUser ? 'order-2' : 'order-1'}`}>
                    {isSystemMessage ? (
                      <div className="text-center">
                        <Badge variant="outline" className="text-xs">
                          {msg.message}
                        </Badge>
                      </div>
                    ) : (
                      <div
                        className={`p-3 rounded-lg ${
                          isCurrentUser
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {player?.nickname.charAt(0).toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm">
                              {player?.nickname || `플레이어 ${msg.userId}`}
                            </span>
                            {msg.type !== 'GENERAL' && (
                              <Badge variant="outline" className="text-xs">
                                {msg.type === 'HINT' ? '힌트' : '변론'}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs opacity-70">
                            {formatTimestamp(msg.timestamp)}
                          </span>
                        </div>
                        <div className={`text-sm ${getMessageTypeColor(msg.type)}`}>
                          {msg.message}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 메시지 입력 */}
        <div className="flex space-x-2">
          <Input
            placeholder={
              canSendMessage()
                ? "메시지를 입력하세요..."
                : "투표 중에는 채팅할 수 없습니다"
            }
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!canSendMessage()}
            maxLength={200}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || !canSendMessage()}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {!canSendMessage() && (
          <div className="text-xs text-muted-foreground mt-1 text-center">
            투표 단계에서는 채팅이 제한됩니다
          </div>
        )}
      </CardContent>
    </Card>
  );
};
