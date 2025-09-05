import React, {useState} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {cn} from '@/shared/utils/cn';
import {Player, VotingRecord} from '@/shared/types/game';

interface VotingPanelProps {
  players: Player[];
  votingType: 'LIAR_SELECTION' | 'FINAL_SURVIVAL';
  onVote: (targetId: number, voteType?: boolean) => Promise<void>;
  timeRemaining?: number;
  currentVotes: VotingRecord[];
  userVote?: number | boolean;
  disabled?: boolean;
  className?: string;
}

export const VotingPanel: React.FC<VotingPanelProps> = ({
  players,
  votingType,
  onVote,
  timeRemaining,
  currentVotes,
  userVote,
  disabled = false,
  className
}) => {
  const [isVoting, setIsVoting] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<number | boolean | null>(null);
  const [showResults, setShowResults] = useState(false);

  // 투표 현황 계산
  const voteStats = React.useMemo(() => {
    if (votingType === 'LIAR_SELECTION') {
      const stats = new Map<number, number>();
      currentVotes.forEach(vote => {
        stats.set(vote.targetId, (stats.get(vote.targetId) || 0) + 1);
      });
      return Array.from(stats.entries()).map(([playerId, count]) => ({
        playerId,
        player: players.find(p => p.id === playerId),
        count
      }));
    } else {
      const agreeCount = currentVotes.filter(vote => vote.voteType === true).length;
      const disagreeCount = currentVotes.filter(vote => vote.voteType === false).length;
      return { agree: agreeCount, disagree: disagreeCount };
    }
  }, [currentVotes, players, votingType]);

  const handleVote = async (target: number | boolean) => {
    if (disabled || isVoting) return;

    setIsVoting(true);
    setSelectedTarget(target);

    try {
      await onVote(typeof target === 'number' ? target : 0, typeof target === 'boolean' ? target : undefined);
    } catch (error) {
      console.error('Vote failed:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const canCancelVote = userVote !== undefined && !disabled;

  const handleCancelVote = async () => {
    if (!canCancelVote) return;
    // 투표 취소 로직 (서버에서 지원하는 경우)
    console.log('Cancel vote requested');
  };

  // 시간 경고 애니메이션
  const isTimeWarning = timeRemaining !== undefined && timeRemaining < 10;

  return (
    <div className={cn('bg-white rounded-lg shadow-lg p-6', className)}>
      {/* 투표 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">
          {votingType === 'LIAR_SELECTION' ? '라이어 지목 투표' : '생존 투표'}
        </h3>

        {/* 타이머 */}
        <AnimatePresence>
          {timeRemaining !== undefined && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: 1,
                scale: isTimeWarning ? [1, 1.1, 1] : 1,
                color: isTimeWarning ? '#dc2626' : '#374151'
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{
                scale: isTimeWarning ? { duration: 0.5, repeat: Infinity } : undefined
              }}
              className="font-mono text-xl font-bold"
            >
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 투표 설명 */}
      <div className="mb-6 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          {votingType === 'LIAR_SELECTION'
            ? '라이어라고 생각하는 플레이어를 선택하세요.'
            : '현재 의심받는 플레이어의 생존에 찬성 또는 반대하세요.'
          }
        </p>
      </div>

      {/* 투표 옵션 */}
      <div className="space-y-4 mb-6">
        {votingType === 'LIAR_SELECTION' ? (
          // 라이어 지목 투표
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {players.filter(p => p.isAlive).map(player => {
              const isSelected = userVote === player.id;
              const voteCount = Array.isArray(voteStats)
                ? voteStats.find(s => s.playerId === player.id)?.count || 0
                : 0;

              return (
                <motion.button
                  key={player.id}
                  onClick={() => handleVote(player.id)}
                  disabled={disabled || isVoting}
                  className={cn(
                    'relative p-4 rounded-lg border-2 text-left transition-all',
                    'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300',
                    disabled && 'opacity-50 cursor-not-allowed'
                  )}
                  whileHover={!disabled ? { scale: 1.02 } : undefined}
                  whileTap={!disabled ? { scale: 0.98 } : undefined}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{player.nickname}</span>
                    <AnimatePresence>
                      {voteCount > 0 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold"
                        >
                          {voteCount}표
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* 선택 표시 */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>
        ) : (
          // 찬반 투표
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: true, label: '찬성', color: 'green', count: (voteStats as any).agree },
              { value: false, label: '반대', color: 'red', count: (voteStats as any).disagree }
            ].map(option => {
              const isSelected = userVote === option.value;

              return (
                <motion.button
                  key={option.label}
                  onClick={() => handleVote(option.value)}
                  disabled={disabled || isVoting}
                  className={cn(
                    'relative p-6 rounded-lg border-2 text-center transition-all',
                    'hover:shadow-md focus:outline-none focus:ring-2',
                    option.color === 'green'
                      ? 'border-green-500 hover:bg-green-50 focus:ring-green-500'
                      : 'border-red-500 hover:bg-red-50 focus:ring-red-500',
                    isSelected && option.color === 'green' ? 'bg-green-50' : '',
                    isSelected && option.color === 'red' ? 'bg-red-50' : '',
                    disabled && 'opacity-50 cursor-not-allowed'
                  )}
                  whileHover={!disabled ? { scale: 1.02 } : undefined}
                  whileTap={!disabled ? { scale: 0.98 } : undefined}
                >
                  <div className="text-2xl font-bold mb-2">{option.label}</div>
                  <AnimatePresence>
                    {option.count > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className={cn(
                          'inline-block px-3 py-1 rounded-full text-sm font-bold',
                          option.color === 'green'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        )}
                      >
                        {option.count}표
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* 선택 표시 */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className={cn(
                          'absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center',
                          option.color === 'green' ? 'bg-green-500' : 'bg-red-500'
                        )}
                      >
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* 투표 취소 버튼 */}
      <AnimatePresence>
        {canCancelVote && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={handleCancelVote}
            className="w-full py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            투표 취소
          </motion.button>
        )}
      </AnimatePresence>

      {/* 로딩 상태 */}
      <AnimatePresence>
        {isVoting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-lg"
          >
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="text-gray-600">투표 중...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VotingPanel;
