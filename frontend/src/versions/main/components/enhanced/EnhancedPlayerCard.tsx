import React, {useEffect, useRef, useState} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {cn} from '../../lib/utils';
import {useAdvancedGestures} from '../../gestures/recognizer';
import {interactionManager} from '@/shared/interactions/manager';
import {gameAnimations} from '../../animations/game-specific';
import {adaptiveUIManager} from '../../adaptive/ui-system';
import type {Player} from '@/shared/types/game';

interface EnhancedPlayerCardProps {
  player: Player;
  onSelect?: (player: Player) => void;
  onVote?: (player: Player) => void;
  onContextMenu?: (player: Player) => void;
  isSelected?: boolean;
  isCurrentTurn?: boolean;
  canVote?: boolean;
  className?: string;
}

export const EnhancedPlayerCard: React.FC<EnhancedPlayerCardProps> = ({
  player,
  onSelect,
  onVote,
  onContextMenu,
  isSelected = false,
  isCurrentTurn = false,
  canVote = false,
  className
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  const layoutConfig = adaptiveUIManager.getLayoutConfig();
  const animationLevel = adaptiveUIManager.getAnimationLevel();

  // 제스처 설정
  const gestureState = useAdvancedGestures(cardRef, {
    tap: {
      onSingleTap: () => onSelect?.(player),
      onDoubleTap: () => onVote?.(player)
    },
    longPress: {
      duration: 500,
      onLongPress: () => onContextMenu?.(player)
    }
  });

  // 턴 변화 애니메이션
  useEffect(() => {
    if (!cardRef.current || animationLevel === 'none') return;

    if (isCurrentTurn) {
      interactionManager.executeInteraction(cardRef.current, {
        type: 'turn_change',
        trigger: 'turn_start',
        animation: gameAnimations.turnTransition.current,
        sound: 'turn_change',
        haptic: true
      });
    }
  }, [isCurrentTurn, animationLevel]);

  // 투표 효과
  const handleVote = async () => {
    if (!canVote || !cardRef.current) return;

    setIsAnimating(true);
    setShowParticles(true);

    // 카드 선택 애니메이션
    await interactionManager.executeInteraction(cardRef.current, {
      type: 'vote_cast',
      trigger: 'vote',
      animation: gameAnimations.cardSelect,
      sound: 'vote_cast',
      haptic: true
    });

    onVote?.(player);

    // 파티클 효과 정리
    setTimeout(() => {
      setShowParticles(false);
      setIsAnimating(false);
    }, 1200);
  };

  // 카드 크기 계산
  const getCardSize = () => {
    if (layoutConfig.playerCard.size === 'compact') {
      return 'w-20 h-24';
    }
    return 'w-24 h-32';
  };

  // 접근성 라벨 생성
  const ariaLabel = [
    `플레이어 ${player.nickname}`,
    player.isAlive ? '생존' : '탈락',
    isCurrentTurn ? '현재 턴' : '',
    player.hasVoted ? '투표 완료' : '투표 대기',
    player.hint ? `힌트: ${player.hint}` : '',
    canVote ? '투표 가능' : ''
  ].filter(Boolean).join(', ');

  return (
    <motion.div
      ref={cardRef}
      className={cn(
        'relative',
        getCardSize(),
        className
      )}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={animationLevel !== 'none' ? { scale: 1.05 } : undefined}
      whileTap={animationLevel !== 'none' ? { scale: 0.95 } : undefined}
    >
      {/* 메인 카드 */}
      <div
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-selected={isSelected}
        aria-current={isCurrentTurn ? "true" : undefined}
        onClick={() => onSelect?.(player)}
        onDoubleClick={() => canVote && handleVote()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect?.(player);
          } else if (e.key === 'v' && canVote) {
            handleVote();
          }
        }}
        className={cn(
          'w-full h-full border-2 rounded-lg p-3 transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
          'cursor-pointer select-none',
          {
            'border-blue-500 bg-blue-50 shadow-lg': isSelected,
            'border-yellow-400 bg-yellow-50 shadow-md': isCurrentTurn && !isSelected,
            'border-gray-300 bg-white hover:bg-gray-50': !isSelected && !isCurrentTurn,
            'opacity-60 grayscale': !player.isAlive,
            'ring-2 ring-green-400': canVote && !isAnimating,
            'animate-pulse': isAnimating
          }
        )}
      >
        {/* 플레이어 아바타 */}
        <div className="flex flex-col items-center space-y-1">
          <motion.div
            className={cn(
              'rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold',
              layoutConfig.playerCard.size === 'compact' ? 'w-8 h-8 text-sm' : 'w-12 h-12 text-lg'
            )}
            animate={isCurrentTurn && animationLevel !== 'none' ? {
              boxShadow: [
                '0 0 0 rgba(59, 130, 246, 0)',
                '0 0 20px rgba(59, 130, 246, 0.6)',
                '0 0 0 rgba(59, 130, 246, 0)'
              ]
            } : undefined}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {player.nickname.charAt(0).toUpperCase()}
          </motion.div>

          {/* 플레이어 이름 */}
          <span className={cn(
            'font-medium text-center truncate w-full',
            layoutConfig.playerCard.size === 'compact' ? 'text-xs' : 'text-sm'
          )}>
            {player.nickname}
          </span>
        </div>

        {/* 상태 표시 */}
        <div className="flex flex-wrap justify-center gap-1 mt-1">
          <span className={cn(
            'px-1 py-0.5 rounded text-xs',
            player.isAlive
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          )}>
            {player.isAlive ? '생존' : '탈락'}
          </span>

          {player.hasVoted && (
            <span className="px-1 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
              투표
            </span>
          )}

          {isCurrentTurn && (
            <span className="px-1 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800">
              턴
            </span>
          )}
        </div>

        {/* 힌트 표시 */}
        {player.hint && layoutConfig.playerCard.size !== 'compact' && (
          <div className="mt-1 text-xs text-gray-600 text-center truncate">
            "{player.hint}"
          </div>
        )}
      </div>

      {/* 투표 파티클 효과 */}
      <AnimatePresence>
        {showParticles && animationLevel === 'full' && (
          <div
            style={gameAnimations.voteParticles.container}
            className="pointer-events-none"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-blue-500 rounded-full"
                style={{ left: '50%', top: '50%' }}
                initial={{ scale: 0, opacity: 1 }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                  x: Math.cos(i * (360 / 12) * Math.PI / 180) * 80,
                  y: Math.sin(i * (360 / 12) * Math.PI / 180) * 80,
                }}
                transition={{
                  duration: 1.2,
                  delay: i * 0.1,
                  ease: "easeOut"
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* 제스처 피드백 */}
      {gestureState.isPressed && (
        <motion.div
          className="absolute inset-0 bg-blue-200 rounded-lg opacity-30"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.8 }}
        />
      )}
    </motion.div>
  );
};
