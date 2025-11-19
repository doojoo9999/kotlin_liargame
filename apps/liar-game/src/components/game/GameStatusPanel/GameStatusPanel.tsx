import React from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {Clock, MessageSquare, Shield, Trophy, Users, Vote} from 'lucide-react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Progress} from '@/components/ui/progress';
import {cn} from '@/lib/utils';
import {useGameFlowStore} from '@/stores';
import {useShallow} from 'zustand/react/shallow';

export interface GameStatusPanelProps {
  className?: string;
  showDetails?: boolean;
}

const GamePhaseIndicator: React.FC<{
  phase: string;
  timeRemaining: number;
}> = ({ phase, timeRemaining }) => {
  const getPhaseInfo = (value: string) => {
    switch (value) {
      case 'WAITING':
      case 'WAITING_FOR_PLAYERS':
        return {
          icon: Users,
          text: '대기 중',
          color: 'text-gray-500',
          bgColor: 'bg-gray-100 dark:bg-gray-800'
        };
      case 'STARTING':
        return {
          icon: Clock,
          text: '게임 시작',
          color: 'text-blue-500',
          bgColor: 'bg-blue-100 dark:bg-blue-900/20'
        };
      case 'PROVIDING_HINTS':
      case 'SPEECH':
        return {
          icon: MessageSquare,
          text: '힌트 제공',
          color: 'text-green-500',
          bgColor: 'bg-green-100 dark:bg-green-900/20'
        };
      case 'VOTING':
      case 'VOTING_FOR_LIAR':
      case 'VOTING_FOR_SURVIVAL':
        return {
          icon: Vote,
          text: value === 'VOTING_FOR_SURVIVAL' ? '생존 투표' : '투표 진행',
          color: 'text-orange-500',
          bgColor: 'bg-orange-100 dark:bg-orange-900/20'
        };
      case 'DEFENDING':
        return {
          icon: Shield,
          text: '변론 시간',
          color: 'text-purple-500',
          bgColor: 'bg-purple-100 dark:bg-purple-900/20'
        };
      case 'ROUND_ENDED':
        return {
          icon: Trophy,
          text: '라운드 종료',
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/20'
        };
      case 'GAME_ENDED':
      case 'GAME_OVER':
        return {
          icon: Trophy,
          text: '게임 종료',
          color: 'text-red-500',
          bgColor: 'bg-red-100 dark:bg-red-900/20'
        };
      case 'GUESSING_WORD':
        return {
          icon: Clock,
          text: '단어 추리',
          color: 'text-indigo-500',
          bgColor: 'bg-indigo-100 dark:bg-indigo-900/20'
        };
      default:
        return {
          icon: Clock,
          text: value,
          color: 'text-gray-500',
          bgColor: 'bg-gray-100 dark:bg-gray-800'
        };
    }
  };

  const phaseInfo = getPhaseInfo(phase);
  const Icon = phaseInfo.icon;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const timeProgress = timeRemaining > 0 ? Math.max(0, (timeRemaining / 180) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "p-4 rounded-lg border transition-all duration-300",
        phaseInfo.bgColor
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={cn("w-5 h-5", phaseInfo.color)} />
          <span className={cn("font-medium", phaseInfo.color)}>
            {phaseInfo.text}
          </span>
        </div>

        {timeRemaining > 0 && (
          <Badge variant="secondary" className={phaseInfo.color}>
            {formatTime(timeRemaining)}
          </Badge>
        )}
      </div>

      {timeRemaining > 0 && (
        <div className="space-y-2">
          <Progress
            value={timeProgress}
            className="h-2"
          />
          <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
            남은 시간: {formatTime(timeRemaining)}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export const GameStatusPanel: React.FC<GameStatusPanelProps> = ({
  className,
  showDetails = true
}) => {
  const selectStatusPanelState = useShallow((state) => ({
    gameNumber: state.gameNumber,
    currentRound: state.currentRound,
    totalRounds: state.totalRounds,
    gamePhase: state.gamePhase,
    isLiar: state.isLiar,
    currentTopic: state.currentTopic,
    timer: state.timer,
    hints: state.hints,
    votes: state.votes,
    defenses: state.defenses,
  }));

  const {
    gameNumber,
    currentRound,
    totalRounds,
    gamePhase,
    isLiar,
    currentTopic,
    timer,
    hints,
    votes,
    defenses,
  } = useGameFlowStore(selectStatusPanelState);

  if (!gameNumber) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="p-6 text-center">
          <div className="text-gray-500 dark:text-gray-400">
            게임방에 참여하지 않았습니다
          </div>
        </CardContent>
      </Card>
    );
  }

  const timeRemaining = timer?.timeRemaining ?? 0;
  const safeHints = hints ?? [];
  const safeVotes = votes ?? [];
  const safeDefenses = defenses ?? [];

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>게임 상태</span>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              라운드 {currentRound}/{totalRounds}
            </Badge>
            {isLiar && (
              <Badge variant="destructive" className="animate-pulse">
                라이어
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Game Phase */}
        <GamePhaseIndicator
          phase={gamePhase}
          timeRemaining={timeRemaining}
        />

        {/* Current Category */}
        {currentTopic && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
          >
            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">
              현재 주제
            </div>
            <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
              {currentTopic}
            </div>
          </motion.div>
        )}

        {showDetails && (
          <div className="grid grid-cols-3 gap-3">
            {/* Hints Count */}
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {safeHints.length}
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">
                힌트
              </div>
            </div>

            {/* Votes Count */}
            <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {safeVotes.length}
              </div>
              <div className="text-xs text-orange-600 dark:text-orange-400">
                투표
              </div>
            </div>

            {/* Defenses Count */}
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {safeDefenses.length}
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400">
                변론
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {showDetails && (safeHints.length > 0 || safeVotes.length > 0 || safeDefenses.length > 0) && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              최근 활동
            </div>

            <div className="space-y-1 max-h-32 overflow-y-auto">
              <AnimatePresence>
                {/* Recent Hints */}
                {safeHints.slice(-3).map((hint, index) => (
                  <motion.div
                    key={`hint-${hint.timestamp}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="text-xs p-2 bg-green-50 dark:bg-green-900/20 rounded border-l-2 border-green-400"
                  >
                    <span className="font-medium">{hint.playerName}</span>이 힌트를 제공했습니다
                  </motion.div>
                ))}

                {/* Recent Votes */}
                {safeVotes.slice(-3).map((vote, index) => (
                  <motion.div
                    key={`vote-${vote.voterId}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="text-xs p-2 bg-orange-50 dark:bg-orange-900/20 rounded border-l-2 border-orange-400"
                  >
                    <span className="font-medium">{vote.voterName}</span>이
                    <span className="font-medium"> {vote.targetName}</span>에게 투표했습니다
                  </motion.div>
                ))}

                {/* Recent Defenses */}
                {safeDefenses.slice(-3).map((defense, index) => (
                  <motion.div
                    key={`defense-${defense.timestamp}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="text-xs p-2 bg-purple-50 dark:bg-purple-900/20 rounded border-l-2 border-purple-400"
                  >
                    <span className="font-medium">{defense.defenderName}</span>이 변론했습니다
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
