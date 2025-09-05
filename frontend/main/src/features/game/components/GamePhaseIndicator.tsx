import React from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {cn} from '@/shared/utils/cn';
import {GamePhase} from '@/shared/types/game';

interface GamePhaseIndicatorProps {
  currentPhase: GamePhase;
  phaseConfig: {
    [key in GamePhase]: {
      label: string;
      description: string;
      color: string;
      icon: React.ReactNode;
    }
  };
  timeRemaining?: number;
  totalTime?: number;
  onPhaseSkip?: () => void;
  nextPhase?: GamePhase;
  className?: string;
}

export const GamePhaseIndicator: React.FC<GamePhaseIndicatorProps> = ({
  currentPhase,
  phaseConfig,
  timeRemaining,
  totalTime,
  onPhaseSkip,
  nextPhase,
  className
}) => {
  const currentConfig = phaseConfig[currentPhase];
  const nextConfig = nextPhase ? phaseConfig[nextPhase] : null;

  // 진행률 계산
  const progress = timeRemaining && totalTime
    ? ((totalTime - timeRemaining) / totalTime) * 100
    : 0;

  // 시간 경고 상태
  const isTimeWarning = timeRemaining !== undefined && timeRemaining < 30;
  const isTimeCritical = timeRemaining !== undefined && timeRemaining < 10;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn('bg-white rounded-lg shadow-lg p-6', className)}>
      {/* 현재 단계 표시 */}
      <motion.div
        key={currentPhase}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="text-center mb-6"
      >
        <div className="flex items-center justify-center space-x-3 mb-3">
          <motion.div
            animate={{
              scale: isTimeCritical ? [1, 1.2, 1] : 1,
              color: currentConfig.color
            }}
            transition={{
              scale: isTimeCritical ? { duration: 0.5, repeat: Infinity } : undefined
            }}
            className="text-3xl"
          >
            {currentConfig.icon}
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900">
            {currentConfig.label}
          </h2>
        </div>

        <p className="text-gray-600 text-sm max-w-md mx-auto">
          {currentConfig.description}
        </p>
      </motion.div>

      {/* 타이머 및 진행률 */}
      <AnimatePresence>
        {timeRemaining !== undefined && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative mb-6"
          >
            {/* 원형 타이머 */}
            <div className="relative w-32 h-32 mx-auto">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                {/* 배경 원 */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                />

                {/* 진행률 원 */}
                <motion.circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke={isTimeCritical ? '#dc2626' : isTimeWarning ? '#f59e0b' : currentConfig.color}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                  animate={{
                    strokeDashoffset: 2 * Math.PI * 50 * (1 - progress / 100),
                    stroke: isTimeCritical ? '#dc2626' : isTimeWarning ? '#f59e0b' : currentConfig.color
                  }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </svg>

              {/* 중앙 시간 표시 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{
                    scale: isTimeCritical ? [1, 1.1, 1] : 1,
                    color: isTimeCritical ? '#dc2626' : isTimeWarning ? '#f59e0b' : '#374151'
                  }}
                  transition={{
                    scale: isTimeCritical ? { duration: 0.5, repeat: Infinity } : undefined
                  }}
                  className="text-center"
                >
                  <div className="text-2xl font-bold font-mono">
                    {formatTime(timeRemaining)}
                  </div>
                  <div className="text-xs text-gray-500">남은 시간</div>
                </motion.div>
              </div>
            </div>

            {/* 시간 경고 메시지 */}
            <AnimatePresence>
              {isTimeWarning && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={cn(
                    'mt-4 p-3 rounded-lg text-center text-sm font-medium',
                    isTimeCritical
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  )}
                >
                  {isTimeCritical ? '⚠️ 시간이 얼마 남지 않았습니다!' : '⏰ 시간에 주의하세요'}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 다음 단계 미리보기 */}
      <AnimatePresence>
        {nextConfig && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="border-t pt-4"
          >
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-2">다음 단계</div>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-lg">{nextConfig.icon}</span>
                <span className="font-medium text-gray-700">{nextConfig.label}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 단계 건너뛰기 버튼 (권한이 있는 경우) */}
      <AnimatePresence>
        {onPhaseSkip && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-4 text-center"
          >
            <button
              onClick={onPhaseSkip}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              단계 건너뛰기
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GamePhaseIndicator;
