import React from 'react';
import {Card, CardContent} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Clock, MessageSquare, PlayCircle, Search, Shield, Target, Trophy, Users, Vote} from 'lucide-react';
import {motion} from 'framer-motion';
import type {GamePhase} from '@/store/gameStore';

interface GamePhaseIndicatorProps {
  gamePhase: GamePhase;
  timeRemaining: number;
  maxTime: number;
  currentRound: number;
  totalRounds: number;
  playerCount: number;
  readyCount?: number;
  votedCount?: number;
}

interface PhaseConfig {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  step: number;
  totalSteps: number;
}

export const GamePhaseIndicator: React.FC<GamePhaseIndicatorProps> = ({
  gamePhase,
  timeRemaining,
  maxTime,
  currentRound,
  totalRounds,
  playerCount,
  readyCount = 0,
  votedCount = 0,
}) => {
  const getPhaseConfig = (): PhaseConfig => {
    switch (gamePhase) {
      case 'WAITING_FOR_PLAYERS':
        return {
          title: '게임 시작 대기',
          description: '모든 플레이어 준비 완료 대기 중',
          icon: <Users className="h-5 w-5" />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          step: 0,
          totalSteps: 6
        };

      case 'SPEECH':
        return {
          title: '힌트 제공 단계',
          description: '각 플레이어가 순서대로 힌트 제공',
          icon: <MessageSquare className="h-5 w-5" />,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          step: 1,
          totalSteps: 6
        };

      case 'VOTING_FOR_LIAR':
        return {
          title: '라이어 투표',
          description: '라이어로 의심되는 플레이어 선택',
          icon: <Target className="h-5 w-5" />,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          step: 2,
          totalSteps: 6
        };

      case 'DEFENDING':
        return {
          title: '변론 단계',
          description: '의심받는 플레이어의 변론 시간',
          icon: <Shield className="h-5 w-5" />,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          step: 3,
          totalSteps: 6
        };

      case 'VOTING_FOR_SURVIVAL':
        return {
          title: '생존 투표',
          description: '처형 여부 최종 결정',
          icon: <Vote className="h-5 w-5" />,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          step: 4,
          totalSteps: 6
        };

      case 'GUESSING_WORD':
        return {
          title: '단어 추측',
          description: '라이어의 마지막 기회',
          icon: <Search className="h-5 w-5" />,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          step: 5,
          totalSteps: 6
        };

      case 'GAME_OVER':
        return {
          title: '게임 종료',
          description: '결과 확인 및 점수 계산',
          icon: <Trophy className="h-5 w-5" />,
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200',
          step: 6,
          totalSteps: 6
        };

      default:
        return {
          title: '게임 진행 중',
          description: '현재 진행 상황',
          icon: <PlayCircle className="h-5 w-5" />,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          step: 0,
          totalSteps: 6
        };
    }
  };

  const config = getPhaseConfig();
  const progressPercentage = maxTime > 0 ? ((maxTime - timeRemaining) / maxTime) * 100 : 0;
  const phaseProgressPercentage = (config.step / config.totalSteps) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressColor = () => {
    if (timeRemaining <= 10) return 'bg-red-500';
    if (timeRemaining <= 30) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusInfo = () => {
    switch (gamePhase) {
      case 'WAITING_FOR_PLAYERS':
        return `${readyCount}/${playerCount} 플레이어 준비 완료`;
      case 'VOTING_FOR_LIAR':
      case 'VOTING_FOR_SURVIVAL':
        return `${votedCount}/${playerCount} 투표 완료`;
      default:
        return `라운드 ${currentRound}/${totalRounds}`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`border-2 ${config.borderColor} ${config.bgColor} shadow-md`}>
        <CardContent className="pt-4">
          <div className="space-y-4">
            {/* Phase Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full bg-white shadow-sm ${config.color}`}>
                  {config.icon}
                </div>
                <div>
                  <h3 className={`font-bold text-lg ${config.color}`}>
                    {config.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {config.description}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-white/70">
                  {getStatusInfo()}
                </Badge>
                {timeRemaining > 0 && (
                  <div className={`flex items-center space-x-1 font-mono text-sm ${
                    timeRemaining <= 10 ? 'text-red-600 font-bold' : config.color
                  }`}>
                    <Clock className="h-4 w-4" />
                    <span>{formatTime(timeRemaining)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bars */}
            <div className="space-y-2">
              {/* Timer Progress */}
              {maxTime > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600">시간 진행</span>
                    <span className="text-xs text-gray-600">
                      {timeRemaining <= 10 && '⚠️ 시간 부족!'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className={`h-2 rounded-full transition-all duration-500 ${getProgressColor()}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Phase Progress */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-600">게임 진행</span>
                  <span className="text-xs text-gray-600">
                    {config.step}/{config.totalSteps} 단계
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className={`h-2 rounded-full ${config.color.replace('text-', 'bg-')}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${phaseProgressPercentage}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>

            {/* Phase Steps Indicator */}
            <div className="flex items-center justify-between text-xs">
              {['대기', '힌트', '투표', '변론', '판결', '추측', '결과'].map((step, index) => (
                <div
                  key={index}
                  className={`flex flex-col items-center space-y-1 ${
                    index <= config.step ? config.color : 'text-gray-400'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      index <= config.step 
                        ? config.color.replace('text-', 'bg-') 
                        : 'bg-gray-300'
                    } ${index === config.step ? 'ring-2 ring-offset-1 ring-current' : ''}`}
                  />
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};