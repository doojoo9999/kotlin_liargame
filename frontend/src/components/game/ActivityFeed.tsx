import React, {useEffect, useRef} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {ScrollArea} from '@/components/ui/scroll-area';
import {AlertCircle, Clock, Eye, MessageCircle, Search, Shield, Target, Users, Zap} from 'lucide-react';
import {AnimatePresence, motion} from 'framer-motion';
import type {GamePhase, Player} from '@/store/gameStore';

interface ActivityEvent {
  id: string;
  type: 'hint' | 'vote' | 'defense' | 'guess' | 'phase_change' | 'player_action' | 'system';
  playerId?: string;
  playerName?: string;
  content?: string;
  targetId?: string;
  targetName?: string;
  timestamp: number;
  phase: GamePhase;
  isHighlight?: boolean;
}

interface ActivityFeedProps {
  activities: ActivityEvent[];
  players: Player[];
  currentPlayer: Player | null;
  gamePhase: GamePhase;
  maxItems?: number;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  players,
  currentPlayer,
  gamePhase,
  maxItems = 50,
}) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const latestActivityId = useRef<string>('');

  // Auto-scroll to bottom when new activity is added
  useEffect(() => {
    if (activities.length > 0 && activities[0].id !== latestActivityId.current) {
      latestActivityId.current = activities[0].id;
      
      setTimeout(() => {
        if (scrollAreaRef.current) {
          const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
          if (scrollElement) {
            scrollElement.scrollTop = scrollElement.scrollHeight;
          }
        }
      }, 100);
    }
  }, [activities]);

  const getActivityIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'hint':
        return <MessageCircle className="h-4 w-4" />;
      case 'vote':
        return <Target className="h-4 w-4" />;
      case 'defense':
        return <Shield className="h-4 w-4" />;
      case 'guess':
        return <Search className="h-4 w-4" />;
      case 'phase_change':
        return <Clock className="h-4 w-4" />;
      case 'player_action':
        return <Users className="h-4 w-4" />;
      case 'system':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: ActivityEvent['type'], isHighlight?: boolean) => {
    if (isHighlight) return 'text-yellow-600';
    
    switch (type) {
      case 'hint':
        return 'text-green-600';
      case 'vote':
        return 'text-red-600';
      case 'defense':
        return 'text-purple-600';
      case 'guess':
        return 'text-orange-600';
      case 'phase_change':
        return 'text-blue-600';
      case 'player_action':
        return 'text-indigo-600';
      case 'system':
        return 'text-gray-600';
      default:
        return 'text-gray-500';
    }
  };

  const getActivityBg = (type: ActivityEvent['type'], isHighlight?: boolean) => {
    if (isHighlight) return 'bg-yellow-50 border-yellow-200';
    
    switch (type) {
      case 'hint':
        return 'bg-green-50 border-green-200';
      case 'vote':
        return 'bg-red-50 border-red-200';
      case 'defense':
        return 'bg-purple-50 border-purple-200';
      case 'guess':
        return 'bg-orange-50 border-orange-200';
      case 'phase_change':
        return 'bg-blue-50 border-blue-200';
      case 'player_action':
        return 'bg-indigo-50 border-indigo-200';
      case 'system':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatActivityContent = (activity: ActivityEvent) => {
    const { type, playerName, content, targetName } = activity;
    const isCurrentPlayer = activity.playerId === currentPlayer?.id;
    const playerDisplay = isCurrentPlayer ? '나' : playerName;

    switch (type) {
      case 'hint':
        return {
          title: `${playerDisplay}님이 힌트를 제공했습니다`,
          content: content ? `"${content}"` : undefined
        };

      case 'vote':
        return {
          title: `${playerDisplay}님이 투표했습니다`,
          content: targetName ? `대상: ${targetName}님` : undefined
        };

      case 'defense':
        return {
          title: `${playerDisplay}님이 변론했습니다`,
          content: content ? `"${content}"` : undefined
        };

      case 'guess':
        return {
          title: `${playerDisplay}님이 단어를 추측했습니다`,
          content: content ? `추측: "${content}"` : undefined
        };

      case 'phase_change':
        return {
          title: getPhaseDisplayName(activity.phase),
          content: '새로운 단계가 시작되었습니다'
        };

      case 'player_action':
        return {
          title: content || `${playerDisplay}님의 행동`,
          content: undefined
        };

      case 'system':
        return {
          title: content || '시스템 메시지',
          content: undefined
        };

      default:
        return {
          title: content || '알 수 없는 활동',
          content: undefined
        };
    }
  };

  const getPhaseDisplayName = (phase: GamePhase) => {
    switch (phase) {
      case 'WAITING_FOR_PLAYERS':
        return '플레이어 대기';
      case 'SPEECH':
        return '힌트 제공 단계';
      case 'VOTING_FOR_LIAR':
        return '라이어 투표';
      case 'DEFENDING':
        return '변론 단계';
      case 'VOTING_FOR_SURVIVAL':
        return '생존 투표';
      case 'GUESSING_WORD':
        return '단어 추측';
      case 'GAME_OVER':
        return '게임 종료';
      default:
        return '게임 진행';
    }
  };

  const isRecentActivity = (timestamp: number) => {
    return Date.now() - timestamp < 5000; // 5초 이내
  };

  const displayActivities = activities.slice(0, maxItems);

  return (
    <Card className="h-80 flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="flex items-center text-sm">
          <Eye className="mr-2 h-4 w-4" />
          실시간 활동
          <Badge variant="secondary" className="ml-2 text-xs">
            {activities.length}개
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 min-h-0 p-0">
        <ScrollArea ref={scrollAreaRef} className="h-full px-6 pb-4">
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {displayActivities.map((activity, index) => {
                const { title, content } = formatActivityContent(activity);
                const isRecent = isRecentActivity(activity.timestamp);
                const isMyActivity = activity.playerId === currentPlayer?.id;
                const colorClass = getActivityColor(activity.type, activity.isHighlight);
                const bgClass = getActivityBg(activity.type, activity.isHighlight);

                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0, 
                      scale: 1,
                      transition: { delay: index * 0.05 }
                    }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className={`
                      relative p-3 rounded-lg border transition-all
                      ${bgClass}
                      ${isRecent ? 'ring-2 ring-blue-200 ring-opacity-50' : ''}
                      ${isMyActivity ? 'ring-1 ring-blue-300' : ''}
                    `}
                  >
                    {/* Recent Activity Indicator */}
                    {isRecent && (
                      <div className="absolute -top-1 -right-1">
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping" />
                        <div className="absolute top-0 w-3 h-3 bg-blue-500 rounded-full" />
                      </div>
                    )}

                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      <div className={`mt-0.5 ${colorClass}`}>
                        {getActivityIcon(activity.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {title}
                          </h4>
                          <div className="flex items-center space-x-1">
                            {isMyActivity && (
                              <Badge variant="outline" className="text-xs">
                                나
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500">
                              {formatTime(activity.timestamp)}
                            </span>
                          </div>
                        </div>

                        {content && (
                          <p className="text-xs text-gray-600 leading-relaxed">
                            {content}
                          </p>
                        )}

                        {/* Additional Info */}
                        {activity.type === 'phase_change' && (
                          <div className="mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {getPhaseDisplayName(activity.phase)}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {displayActivities.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="mx-auto h-8 w-8 opacity-30 mb-2" />
                <div className="text-sm">아직 활동이 없습니다</div>
                <div className="text-xs text-gray-400 mt-1">
                  게임이 시작되면 활동이 표시됩니다
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};