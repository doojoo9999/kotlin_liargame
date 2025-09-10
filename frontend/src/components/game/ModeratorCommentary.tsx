import React, {useEffect, useState} from 'react';
import {Card, CardContent} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Clock, Megaphone, Search, Shield, Target, Trophy, Users} from 'lucide-react';
import {AnimatePresence, motion} from 'framer-motion';
import type {GamePhase} from '@/store/gameStore';

interface ModeratorCommentaryProps {
  gamePhase: GamePhase;
  currentTopic: string | null;
  currentWord: string | null;
  timeRemaining: number;
  isLiar: boolean;
  playerCount: number;
  currentTurnPlayer?: string;
  suspectedPlayer?: string;
}

interface CommentaryContent {
  title: string;
  message: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'yellow';
  tips?: string[];
  urgentMessage?: string;
}

export const ModeratorCommentary: React.FC<ModeratorCommentaryProps> = ({
  gamePhase,
  currentTopic,
  currentWord,
  timeRemaining,
  isLiar,
  playerCount,
  currentTurnPlayer,
  suspectedPlayer,
}) => {
  const [currentComment, setCurrentComment] = useState<CommentaryContent | null>(null);
  const [isUrgent, setIsUrgent] = useState(false);

  const getCommentaryContent = (): CommentaryContent => {
    switch (gamePhase) {
      case 'WAITING_FOR_PLAYERS':
        return {
          title: '게임 시작 준비',
          message: `모든 플레이어(${playerCount}명)가 준비되면 게임이 시작됩니다. 잠시만 기다려주세요!`,
          icon: <Users className="h-5 w-5" />,
          color: 'blue',
          tips: [
            '게임이 시작되면 주제와 단어가 공개됩니다',
            '라이어는 단어를 모른 채로 게임에 참여합니다',
            '모든 플레이어가 한 번씩 힌트를 제공합니다'
          ]
        };

      case 'SPEECH':
        return {
          title: isLiar ? '라이어의 힌트 제공 시간' : '힌트 제공 단계',
          message: isLiar 
            ? `당신은 라이어입니다! 다른 플레이어들의 힌트를 잘 듣고 자연스러운 힌트를 제공해보세요.`
            : `주제 "${currentTopic}"에 대한 단어 "${currentWord}"의 힌트를 제공하세요.`,
          icon: <Megaphone className="h-5 w-5" />,
          color: isLiar ? 'orange' : 'green',
          tips: isLiar ? [
            '다른 플레이어의 힌트를 참고하여 단어를 추측해보세요',
            '너무 구체적이거나 애매한 힌트는 피하세요',
            '자연스럽게 섞여들 수 있도록 행동하세요'
          ] : [
            '단어 자체나 단어의 일부를 직접 말하면 안 됩니다',
            '명확하면서도 너무 직접적이지 않은 힌트가 좋습니다',
            '다른 플레이어가 이해할 수 있을 만한 수준으로 설명하세요'
          ],
          urgentMessage: timeRemaining <= 10 ? `서둘러주세요! ${timeRemaining}초 남았습니다!` : undefined
        };

      case 'VOTING_FOR_LIAR':
        return {
          title: '라이어를 찾아라!',
          message: '모든 힌트를 들어보셨나요? 이제 라이어라고 생각하는 플레이어에게 투표하세요.',
          icon: <Target className="h-5 w-5" />,
          color: 'red',
          tips: [
            '어색하거나 관련 없는 힌트를 제공한 플레이어를 찾아보세요',
            '너무 애매하거나 너무 구체적인 힌트도 의심스럽습니다',
            '다른 플레이어들의 반응도 참고해보세요'
          ],
          urgentMessage: timeRemaining <= 15 ? `투표 시간이 얼마 남지 않았습니다!` : undefined
        };

      case 'DEFENDING':
        return {
          title: '변론의 시간',
          message: suspectedPlayer 
            ? `${suspectedPlayer}님이 변론할 시간입니다. 자신이 라이어가 아님을 증명해보세요!`
            : '의심받는 플레이어의 변론을 들어보세요.',
          icon: <Shield className="h-5 w-5" />,
          color: 'purple',
          tips: [
            '자신의 힌트가 왜 합리적이었는지 설명해보세요',
            '단어에 대한 추가적인 지식을 보여주세요',
            '다른 플레이어들을 설득할 수 있는 근거를 제시하세요'
          ]
        };

      case 'VOTING_FOR_SURVIVAL':
        return {
          title: '최종 판결',
          message: '변론을 들어보셨나요? 이제 의심받는 플레이어를 처형할지 결정하세요.',
          icon: <Target className="h-5 w-5" />,
          color: 'red',
          tips: [
            '변론이 설득력 있었는지 판단해보세요',
            '초기 힌트와 변론 내용이 일치하는지 확인하세요',
            '신중하게 결정하세요 - 실제 라이어일 수도 있습니다'
          ]
        };

      case 'GUESSING_WORD':
        return {
          title: isLiar ? '마지막 기회!' : '라이어의 추측 시간',
          message: isLiar
            ? '당신의 마지막 기회입니다! 지금까지의 힌트를 바탕으로 정답을 맞춰보세요!'
            : '라이어가 정답을 맞출 수 있을지 지켜보세요.',
          icon: <Search className="h-5 w-5" />,
          color: isLiar ? 'yellow' : 'blue',
          tips: isLiar ? [
            '지금까지 들은 모든 힌트를 종합해보세요',
            '주제와 가장 관련 있을 것 같은 단어를 생각해보세요',
            '정답을 맞추면 승리할 수 있습니다!'
          ] : [
            '라이어가 정답을 맞추면 라이어가 승리합니다',
            '힌트를 너무 명확하게 제공했는지 되돌아보세요'
          ]
        };

      case 'GAME_OVER':
        return {
          title: '게임 종료!',
          message: '게임이 끝났습니다! 결과를 확인해보세요.',
          icon: <Trophy className="h-5 w-5" />,
          color: 'green',
          tips: [
            '게임 결과와 각 플레이어의 역할을 확인해보세요',
            '다음 라운드를 위해 준비하세요',
            '잘한 플레이어들에게 박수를 보내주세요!'
          ]
        };

      default:
        return {
          title: '게임 진행 중',
          message: '게임이 진행되고 있습니다.',
          icon: <Megaphone className="h-5 w-5" />,
          color: 'blue'
        };
    }
  };

  useEffect(() => {
    const content = getCommentaryContent();
    setCurrentComment(content);
    setIsUrgent(!!content.urgentMessage || timeRemaining <= 10);
  }, [gamePhase, currentTopic, currentWord, timeRemaining, isLiar, suspectedPlayer]);

  const colorClasses = {
    blue: 'border-blue-500 bg-blue-50 text-blue-900',
    green: 'border-green-500 bg-green-50 text-green-900',
    orange: 'border-orange-500 bg-orange-50 text-orange-900',
    red: 'border-red-500 bg-red-50 text-red-900',
    purple: 'border-purple-500 bg-purple-50 text-purple-900',
    yellow: 'border-yellow-500 bg-yellow-50 text-yellow-900'
  };

  const iconColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
    yellow: 'text-yellow-600'
  };

  if (!currentComment) return null;

  return (
    <div className="sticky top-4 z-20 mb-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${gamePhase}-${isUrgent}`}
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`
            ${isUrgent ? 'animate-pulse' : ''} 
            ${isUrgent ? 'ring-2 ring-red-400 ring-opacity-60' : ''}
          `}
        >
          <Card className={`
            border-2 shadow-lg
            ${colorClasses[currentComment.color]}
            ${isUrgent ? 'shadow-red-200 shadow-xl' : ''}
          `}>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={iconColorClasses[currentComment.color]}>
                      {currentComment.icon}
                    </div>
                    <h3 className="font-bold text-lg">{currentComment.title}</h3>
                    <Badge 
                      variant="secondary" 
                      className="bg-white/50 text-xs font-medium"
                    >
                      진행자
                    </Badge>
                  </div>
                  {timeRemaining > 0 && (
                    <div className="flex items-center space-x-1 text-sm font-mono">
                      <Clock className="h-4 w-4" />
                      <span>
                        {Math.floor(timeRemaining / 60)}:
                        {(timeRemaining % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Main Message */}
                <div className="text-sm font-medium leading-relaxed">
                  {currentComment.message}
                </div>

                {/* Urgent Message */}
                {currentComment.urgentMessage && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-2 rounded-md bg-red-100 border border-red-200 text-red-800 text-sm font-bold"
                  >
                    ⚠️ {currentComment.urgentMessage}
                  </motion.div>
                )}

                {/* Tips */}
                {currentComment.tips && currentComment.tips.length > 0 && (
                  <div className="mt-3 p-3 rounded-md bg-white/30 border border-white/50">
                    <div className="text-xs font-bold mb-2 flex items-center">
                      💡 게임 팁
                    </div>
                    <ul className="space-y-1">
                      {currentComment.tips.map((tip, index) => (
                        <li key={index} className="text-xs flex items-start">
                          <span className="mr-2 text-gray-400">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};