import React from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {cn} from '@/shared/utils/cn';
import {GamePhase, Player} from '@/shared/types/game';

interface AdvancedPlayerCardProps {
  player: Player;
  gamePhase: GamePhase;
  isCurrentTurn?: boolean;
  isVotingTarget?: boolean;
  onVote?: (playerId: number) => void;
  onViewHint?: (hint: string) => void;
  disabled?: boolean;
  className?: string;
}

export const AdvancedPlayerCard: React.FC<AdvancedPlayerCardProps> = ({
  player,
  gamePhase,
  isCurrentTurn = false,
  isVotingTarget = false,
  onVote,
  onViewHint,
  disabled = false,
  className
}) => {
  const [isPressed, setIsPressed] = React.useState(false);

  const canVote = gamePhase === 'VOTING' && onVote && !disabled;
  const canViewHint = player.hint && onViewHint;

  const handleClick = () => {
    if (canVote) {
      onVote(player.id);
    } else if (canViewHint) {
      onViewHint(player.hint!);
    }
  };

  const getCardVariant = () => {
    if (!player.isAlive) return 'eliminated';
    if (isCurrentTurn) return 'current-turn';
    if (isVotingTarget) return 'voting-target';
    if (player.state === 'SUSPECTED') return 'suspected';
    if (player.state === 'DEFENDING') return 'defending';
    return 'default';
  };

  const cardVariants = {
    default: {
      scale: 1,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      borderColor: 'rgb(229, 231, 235)',
    },
    'current-turn': {
      scale: 1.02,
      boxShadow: [
        '0 0 0 rgba(59, 130, 246, 0)',
        '0 0 20px rgba(59, 130, 246, 0.8)',
        '0 0 0 rgba(59, 130, 246, 0)'
      ],
      borderColor: 'rgb(59, 130, 246)',
      transition: {
        boxShadow: { duration: 2, repeat: Infinity },
        scale: { duration: 0.3 }
      }
    },
    'voting-target': {
      scale: 1.05,
      boxShadow: '0 0 25px rgba(220, 38, 38, 0.6)',
      borderColor: 'rgb(220, 38, 38)',
    },
    suspected: {
      scale: 0.98,
      boxShadow: '0 0 15px rgba(245, 158, 11, 0.5)',
      borderColor: 'rgb(245, 158, 11)',
    },
    defending: {
      scale: 1.03,
      boxShadow: '0 0 20px rgba(16, 185, 129, 0.6)',
      borderColor: 'rgb(16, 185, 129)',
    },
    eliminated: {
      scale: 0.95,
      opacity: 0.4,
      filter: 'grayscale(100%)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    }
  };

  const pressVariants = {
    pressed: { scale: 0.95 },
    released: { scale: 1 }
  };

  return (
    <motion.div
      className={cn(
        'relative p-4 rounded-lg border-2 cursor-pointer select-none',
        'bg-white hover:bg-gray-50 transition-colors',
        disabled && 'cursor-not-allowed opacity-60',
        className
      )}
      variants={cardVariants}
      animate={getCardVariant()}
      whileTap={!disabled ? pressVariants.pressed : undefined}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onClick={!disabled ? handleClick : undefined}
      layout
    >
      {/* 역할 표시 (게임 종료 후에만) */}
      <AnimatePresence>
        {gamePhase === 'FINISHED' && player.role && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={cn(
              'absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-bold text-white',
              player.role === 'LIAR' ? 'bg-red-500' : 'bg-blue-500'
            )}
          >
            {player.role === 'LIAR' ? '라이어' : '시민'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 플레이어 정보 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={cn(
            'w-3 h-3 rounded-full',
            player.isAlive ? 'bg-green-500' : 'bg-gray-400'
          )} />
          <span className="font-semibold text-gray-900">{player.nickname}</span>
          {player.isHost && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-1 rounded">
              방장
            </span>
          )}
        </div>

        {/* 투표 수 표시 */}
        <AnimatePresence>
          {player.votesReceived > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="flex items-center space-x-1"
            >
              <span className="text-red-600 font-bold">{player.votesReceived}</span>
              <span className="text-xs text-gray-500">표</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 상태 표시 */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          {/* 힌트 제공 여부 */}
          <AnimatePresence>
            {player.hint && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
              >
                힌트 제공
              </motion.div>
            )}
          </AnimatePresence>

          {/* 투표 완료 여부 */}
          <AnimatePresence>
            {player.hasVoted && gamePhase === 'VOTING' && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded"
              >
                투표 완료
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 현재 턴 표시 */}
        <AnimatePresence>
          {isCurrentTurn && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-xs bg-blue-500 text-white px-2 py-1 rounded font-bold"
            >
              현재 턴
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 클릭 피드백 효과 */}
      <AnimatePresence>
        {isPressed && (
          <motion.div
            initial={{ opacity: 0.6, scale: 0 }}
            animate={{ opacity: 0, scale: 2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 bg-blue-500 rounded-lg pointer-events-none"
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdvancedPlayerCard;
