import React from 'react';
import {motion} from 'framer-motion';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Progress} from '@/components/ui/progress';
import {cn} from '@/lib/utils';
import {Clock, Target, Trophy, Users} from 'lucide-react';

type GamePhase = 'WAITING' | 'DISCUSSING' | 'VOTING' | 'REVEALING' | 'ENDED';

interface GamePhaseConfig {
  key: GamePhase;
  label: string;
  description: string;
  color: string;
  icon: React.ReactNode;
}

export interface GamePhaseIndicatorProps {
  currentPhase: GamePhase;
  timeRemaining?: number;
  totalTime?: number;
  playerCount?: number;
  maxPlayers?: number;
  currentRound?: number;
  totalRounds?: number;
  animated?: boolean;
}

const phaseConfigs: Record<GamePhase, GamePhaseConfig> = {
  WAITING: {
    key: 'WAITING',
    label: '대기 중',
    description: '플레이어들이 입장하기를 기다리고 있습니다',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: <Users className="h-4 w-4" />
  },
  DISCUSSING: {
    key: 'DISCUSSING',
    label: '토론 중',
    description: '플레이어들이 의견을 나누고 있습니다',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: <Target className="h-4 w-4" />
  },
  VOTING: {
    key: 'VOTING',
    label: '투표 중',
    description: '라이어를 찾기 위한 투표가 진행 중입니다',
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: <Trophy className="h-4 w-4" />
  },
  REVEALING: {
    key: 'REVEALING',
    label: '결과 공개',
    description: '투표 결과와 라이어가 공개됩니다',
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    icon: <Target className="h-4 w-4" />
  },
  ENDED: {
    key: 'ENDED',
    label: '게임 종료',
    description: '게임이 종료되었습니다',
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    icon: <Trophy className="h-4 w-4" />
  }
};

const GamePhaseIndicator = React.forwardRef<HTMLDivElement, GamePhaseIndicatorProps>(
  ({
    currentPhase,
    timeRemaining,
    totalTime,
    playerCount,
    maxPlayers,
    currentRound,
    totalRounds,
    animated = true,
    ...props
  }, ref) => {
    const config = phaseConfigs[currentPhase];
    const timeProgress = totalTime && timeRemaining ? ((totalTime - timeRemaining) / totalTime) * 100 : 0;

    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const containerVariants = {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 }
    };

    const phaseChangeVariants = {
      initial: { scale: 1 },
      animate: { scale: [1, 1.05, 1] },
      transition: { duration: 0.5 }
    };

    return (
      <motion.div
        variants={animated ? containerVariants : {}}
        initial="initial"
        animate="animate"
        exit="exit"
        ref={ref}
        {...props}
      >
        <Card className="game-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <motion.div
                className="flex items-center space-x-2"
                variants={animated ? phaseChangeVariants : {}}
                animate={animated ? "animate" : "initial"}
                key={currentPhase} // 페이즈 변경 시 애니메이션 재실행
              >
                <Badge variant="outline" className={cn("text-sm", config.color)}>
                  {config.icon}
                  <span className="ml-1">{config.label}</span>
                </Badge>
              </motion.div>

              {/* 라운드 정보 */}
              {currentRound && totalRounds && (
                <Badge variant="secondary" className="text-xs">
                  {currentRound}/{totalRounds} 라운드
                </Badge>
              )}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* 페이즈 설명 */}
            <p className="text-sm text-muted-foreground">{config.description}</p>

            {/* 타이머 */}
            {timeRemaining !== undefined && totalTime && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>남은 시간</span>
                  </div>
                  <motion.span
                    className={cn(
                      "font-mono font-bold",
                      timeRemaining <= 10 ? "text-red-500" : "text-foreground"
                    )}
                    animate={timeRemaining <= 10 ? {
                      scale: [1, 1.1, 1],
                      color: ["#ef4444", "#dc2626", "#ef4444"]
                    } : {}}
                    transition={{ duration: 1, repeat: timeRemaining <= 10 ? Infinity : 0 }}
                  >
                    {formatTime(timeRemaining)}
                  </motion.span>
                </div>

                <Progress
                  value={timeProgress}
                  className={cn(
                    "h-2 transition-all duration-1000",
                    timeRemaining <= 10 && "game-glow-danger"
                  )}
                />
              </div>
            )}

            {/* 플레이어 정보 */}
            {playerCount !== undefined && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>참여자</span>
                </div>
                <span className="font-semibold">
                  {playerCount}{maxPlayers ? `/${maxPlayers}` : ''}명
                </span>
              </div>
            )}

            {/* 게임 단계 진행률 */}
            {currentRound && totalRounds && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>게임 진행률</span>
                  <span className="font-semibold">
                    {Math.round((currentRound / totalRounds) * 100)}%
                  </span>
                </div>
                <Progress
                  value={(currentRound / totalRounds) * 100}
                  className="h-2"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }
);

GamePhaseIndicator.displayName = "GamePhaseIndicator";

export { GamePhaseIndicator, phaseConfigs };
