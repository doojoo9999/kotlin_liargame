import React, {useEffect, useMemo, useRef, useState} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {cn} from '../../lib/utils';
import {useAdvancedGestures} from '../../gestures/recognizer';
import {interactionManager} from '@/shared/interactions/manager';
import {animationUtils, gameAnimations} from '../../animations/game-specific';
import {adaptiveUIManager} from '../../adaptive/ui-system';
import {EnhancedPlayerCard} from './EnhancedPlayerCard';
import type {GameState, Player} from '@/shared/types/game';

interface EnhancedGameBoardProps {
  players: Player[];
  gameState: GameState;
  currentPlayer?: Player;
  onPlayerSelect?: (player: Player) => void;
  onPlayerVote?: (player: Player) => void;
  onPlayerAction?: (playerId: string, action: string) => void;
  className?: string;
}

export const EnhancedGameBoard: React.FC<EnhancedGameBoardProps> = ({
  players,
  gameState,
  currentPlayer,
  onPlayerSelect,
  onPlayerVote,
  onPlayerAction,
  className
}) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showVictoryEffect, setShowVictoryEffect] = useState(false);

  const layoutConfig = adaptiveUIManager.getLayoutConfig();
  const animationLevel = adaptiveUIManager.getAnimationLevel();

  // 제스처 설정 - 보드 전체 스와이프
  const gestureState = useAdvancedGestures(boardRef, {
    swipe: {
      threshold: 100,
      direction: 'horizontal',
      onSwipeLeft: () => {
        // 다음 플레이어로 포커스 이동
        const currentIndex = players.findIndex(p => p.id === selectedPlayerId);
        const nextIndex = (currentIndex + 1) % players.length;
        setSelectedPlayerId(players[nextIndex]?.id || null);
      },
      onSwipeRight: () => {
        // 이전 플레이어로 포커스 이동
        const currentIndex = players.findIndex(p => p.id === selectedPlayerId);
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : players.length - 1;
        setSelectedPlayerId(players[prevIndex]?.id || null);
      }
    }
  });

  // 최적화된 플레이어 데이터
  const memoizedPlayers = useMemo(() =>
    players.map(player => ({
      ...player,
      isCurrentTurn: player.id === gameState.currentPlayerId,
      canBeVoted: player.isAlive && player.id !== currentPlayer?.id && gameState.phase === 'voting',
      isSelected: player.id === selectedPlayerId
    })),
    [players, gameState.currentPlayerId, gameState.phase, currentPlayer?.id, selectedPlayerId]
  );

  // 게임 상태 변화 감지 및 애니메이션
  useEffect(() => {
    if (!boardRef.current || animationLevel === 'none') return;

    // 게임 종료 효과
    if (gameState.phase === 'ended') {
      setShowVictoryEffect(true);

      // 승리 애니메이션 실행
      interactionManager.executeInteraction(boardRef.current, {
        type: 'game_start',
        trigger: 'victory',
        animation: gameAnimations.victory.celebration,
        sound: 'victory',
        haptic: true
      });

      // 컨페티 효과
      setTimeout(() => {
        createConfettiEffect();
      }, 500);
    }
  }, [gameState.phase, animationLevel]);

  // 턴 변화 애니메이션
  useEffect(() => {
    if (!gameState.currentPlayerId || animationLevel === 'none') return;

    setIsTransitioning(true);

    // 순차적 카드 애니메이션
    const cardElements = boardRef.current?.querySelectorAll('[data-player-card]') as NodeListOf<HTMLElement>;
    if (cardElements.length > 0) {
      animationUtils.sequence(Array.from(cardElements), {
        keyframes: [
          { opacity: 0.7, transform: 'scale(0.95)' },
          { opacity: 1, transform: 'scale(1)' }
        ],
        duration: 200,
        easing: 'ease-out'
      }, 50);
    }

    setTimeout(() => setIsTransitioning(false), 1000);
  }, [gameState.currentPlayerId, animationLevel]);

  const createConfettiEffect = () => {
    if (!boardRef.current || animationLevel !== 'full') return;

    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7'];
    const container = boardRef.current;

    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div');
        confetti.className = 'absolute w-2 h-2 pointer-events-none';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * container.offsetWidth + 'px';
        confetti.style.top = '-10px';
        confetti.style.borderRadius = '50%';

        container.appendChild(confetti);

        confetti.animate(gameAnimations.victory.confetti.keyframes, {
          duration: gameAnimations.victory.confetti.duration,
          easing: gameAnimations.victory.confetti.easing
        }).addEventListener('finish', () => {
          confetti.remove();
        });
      }, i * 100);
    }
  };

  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayerId(player.id);
    onPlayerSelect?.(player);

    // 선택 피드백
    if (animationLevel !== 'none') {
      interactionManager.executeInteraction(document.body, {
        type: 'click',
        trigger: 'player_select',
        animation: { keyframes: [], duration: 0 },
        sound: 'click',
        haptic: true
      });
    }
  };

  const handlePlayerVote = (player: Player) => {
    onPlayerVote?.(player);

    // 투표 피드백
    interactionManager.executeInteraction(document.body, {
      type: 'vote_cast',
      trigger: 'vote',
      animation: { keyframes: [], duration: 0 },
      sound: 'vote_success',
      haptic: true
    });
  };

  const handlePlayerContext = (player: Player) => {
    onPlayerAction?.(player.id, 'context_menu');
  };

  // 레이아웃 계산
  const getGridLayout = () => {
    const { columns, spacing } = layoutConfig.playerCard;
    return {
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: spacing === 'tight' ? '0.5rem' : '1rem'
    };
  };

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedPlayerId) return;

      const currentIndex = players.findIndex(p => p.id === selectedPlayerId);
      let newIndex = currentIndex;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          newIndex = (currentIndex + 1) % players.length;
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          newIndex = currentIndex > 0 ? currentIndex - 1 : players.length - 1;
          break;
        case 'Enter':
          e.preventDefault();
          if (players[currentIndex]) {
            handlePlayerSelect(players[currentIndex]);
          }
          break;
        case 'v':
        case 'V':
          e.preventDefault();
          const player = players[currentIndex];
          if (player && player.isAlive && gameState.phase === 'voting') {
            handlePlayerVote(player);
          }
          break;
      }

      if (newIndex !== currentIndex && players[newIndex]) {
        setSelectedPlayerId(players[newIndex].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPlayerId, players, gameState.phase]);

  return (
    <motion.div
      ref={boardRef}
      className={cn(
        'relative w-full h-full p-4',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      tabIndex={0}
      role="application"
      aria-label="게임 보드"
      aria-live="polite"
    >
      {/* 게임 상태 표시 */}
      <div className="mb-4 text-center">
        <motion.h2
          className="text-xl font-bold text-gray-800"
          animate={isTransitioning ? { scale: [1, 1.1, 1] } : undefined}
          transition={{ duration: 0.6 }}
        >
          {gameState.phase === 'waiting' && '플레이어 대기 중...'}
          {gameState.phase === 'playing' && currentPlayer && `${currentPlayer.nickname}님의 차례`}
          {gameState.phase === 'voting' && '투표 시간'}
          {gameState.phase === 'ended' && '게임 종료'}
        </motion.h2>

        {gameState.phase === 'voting' && (
          <motion.p
            className="text-sm text-gray-600 mt-1"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            라이어를 찾아 투표하세요! (더블클릭 또는 V키로 투표)
          </motion.p>
        )}
      </div>

      {/* 플레이어 그리드 */}
      <motion.div
        className={cn(
          'grid w-full',
          layoutConfig.gameBoard.layout === 'stack' ? 'grid-cols-2' : ''
        )}
        style={layoutConfig.gameBoard.layout === 'grid' ? getGridLayout() : undefined}
        layout
      >
        <AnimatePresence mode="popLayout">
          {memoizedPlayers.map((player, index) => (
            <motion.div
              key={player.id}
              data-player-card
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{
                duration: 0.3,
                delay: animationLevel === 'full' ? index * 0.05 : 0
              }}
            >
              <EnhancedPlayerCard
                player={player}
                onSelect={handlePlayerSelect}
                onVote={handlePlayerVote}
                onContextMenu={handlePlayerContext}
                isSelected={player.isSelected}
                isCurrentTurn={player.isCurrentTurn}
                canVote={player.canBeVoted}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* 승리 오버레이 */}
      <AnimatePresence>
        {showVictoryEffect && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-white text-center"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                duration: 1,
                ease: "backOut"
              }}
            >
              <h1 className="text-4xl font-bold mb-2">🎉 게임 종료! 🎉</h1>
              <p className="text-xl">축하합니다!</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 제스처 가이드 (처음 방문시) */}
      {selectedPlayerId && layoutConfig.playerCard.size !== 'compact' && (
        <motion.div
          className="absolute bottom-4 left-4 bg-gray-800 text-white p-2 rounded text-xs opacity-75"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 0.75, y: 0 }}
          transition={{ delay: 2 }}
        >
          💡 터치: 선택 | 더블터치: 투표 | 길게터치: 메뉴 | 스와이프: 이동
        </motion.div>
      )}
    </motion.div>
  );
};
