import React, {useMemo} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {cn} from '@/shared/utils/cn';
import {GameState, Player, PlayerAction} from '@/shared/types/game';
import AdvancedPlayerCard from './AdvancedPlayerCard';

interface GameBoardProps {
  players: Player[];
  gameState: GameState;
  layout: 'circle' | 'grid' | 'adaptive';
  onPlayerAction?: (action: PlayerAction) => void;
  interactive?: boolean;
  className?: string;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  players,
  gameState,
  layout,
  onPlayerAction,
  interactive = true,
  className
}) => {
  const currentPlayer = players.find((_, index) => index === gameState.currentTurnIndex);

  // 레이아웃에 따른 플레이어 배치 계산
  const playerPositions = useMemo(() => {
    const playerCount = players.length;

    if (layout === 'circle' || (layout === 'adaptive' && playerCount <= 8)) {
      // 원형 배치
      return players.map((_, index) => {
        const angle = (index / playerCount) * 2 * Math.PI - Math.PI / 2;
        const radius = Math.min(40, 30 + playerCount * 2);
        const x = 50 + radius * Math.cos(angle);
        const y = 50 + radius * Math.sin(angle);

        return {
          x: `${x}%`,
          y: `${y}%`,
          transform: 'translate(-50%, -50%)'
        };
      });
    } else {
      // 그리드 배치
      const cols = Math.ceil(Math.sqrt(playerCount));
      const rows = Math.ceil(playerCount / cols);

      return players.map((_, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        const x = (col + 0.5) / cols * 100;
        const y = (row + 0.5) / rows * 100;

        return {
          x: `${x}%`,
          y: `${y}%`,
          transform: 'translate(-50%, -50%)'
        };
      });
    }
  }, [players.length, layout]);

  // 턴 순서 연결선 계산
  const turnConnections = useMemo(() => {
    if (layout !== 'circle' && layout !== 'adaptive') return [];

    const connections = [];
    for (let i = 0; i < players.length; i++) {
      const current = playerPositions[i];
      const next = playerPositions[(i + 1) % players.length];

      if (current && next) {
        connections.push({
          from: current,
          to: next,
          isActive: i === gameState.currentTurnIndex
        });
      }
    }
    return connections;
  }, [playerPositions, gameState.currentTurnIndex, layout, players.length]);

  const handlePlayerVote = (targetId: number) => {
    if (onPlayerAction && interactive) {
      onPlayerAction({
        type: 'VOTE',
        playerId: currentPlayer?.id || 0,
        targetId
      });
    }
  };

  const handleViewHint = (hint: string) => {
    console.log('Viewing hint:', hint);
    // 힌트 모달 또는 토스트 표시 로직
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const playerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: "backOut" }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.3 }
    }
  };

  return (
    <div className={cn('relative w-full h-full min-h-[500px]', className)}>
      {/* 턴 순서 연결선 */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <AnimatePresence>
          {turnConnections.map((connection, index) => (
            <motion.line
              key={`connection-${index}`}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: connection.isActive ? 0.8 : 0.3 }}
              exit={{ pathLength: 0, opacity: 0 }}
              x1={connection.from.x}
              y1={connection.from.y}
              x2={connection.to.x}
              y2={connection.to.y}
              stroke={connection.isActive ? '#3b82f6' : '#d1d5db'}
              strokeWidth={connection.isActive ? '3' : '2'}
              strokeDasharray={connection.isActive ? '0' : '5,5'}
              markerEnd="url(#arrowhead)"
              transition={{ duration: 0.5 }}
            />
          ))}
        </AnimatePresence>

        {/* 화살표 마커 정의 */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#3b82f6"
            />
          </marker>
        </defs>
      </svg>

      {/* 플레이어 카드들 */}
      <motion.div
        className="relative w-full h-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence mode="popLayout">
          {players.map((player, index) => {
            const position = playerPositions[index];
            const isCurrentTurn = index === gameState.currentTurnIndex;

            return (
              <motion.div
                key={player.id}
                className="absolute"
                style={position}
                variants={playerVariants}
                layout
                layoutId={`player-${player.id}`}
              >
                <AdvancedPlayerCard
                  player={player}
                  gamePhase={gameState.gamePhase}
                  isCurrentTurn={isCurrentTurn}
                  onVote={handlePlayerVote}
                  onViewHint={handleViewHint}
                  disabled={!interactive}
                  className="w-40 h-24"
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* 중앙 정보 패널 (원형 레이아웃일 때) */}
      <AnimatePresence>
        {(layout === 'circle' || layout === 'adaptive') && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          >
            <div className="bg-white rounded-full shadow-lg p-6 border-2 border-gray-200">
              <div className="text-center">
                <div className="text-sm text-gray-500 mb-1">현재 턴</div>
                <div className="font-bold text-lg text-gray-900">
                  {currentPlayer?.nickname || '대기 중'}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  라운드 {gameState.round}/{gameState.maxRounds}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameBoard;
