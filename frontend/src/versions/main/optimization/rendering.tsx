import React, {memo, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {FixedSizeList as List} from 'react-window';
import {cn} from '../lib/utils';
import type {GameState, Player} from '@/shared/types/game';

// 가상화된 플레이어 리스트
interface VirtualizedPlayerListProps {
  players: Player[];
  onPlayerSelect: (player: Player) => void;
  itemHeight?: number;
  height?: number;
}

export const VirtualizedPlayerList = memo<VirtualizedPlayerListProps>(({
  players,
  onPlayerSelect,
  itemHeight = 120,
  height = 400
}) => {
  const itemRenderer = useCallback(({ index, style }: any) => {
    const player = players[index];
    if (!player) return null;

    return (
      <div style={style} className="px-2">
        <div
          onClick={() => onPlayerSelect(player)}
          className={cn(
            'p-3 border rounded-lg cursor-pointer transition-colors',
            'hover:bg-gray-50 focus:bg-blue-50 focus:border-blue-500',
            player.isAlive ? 'bg-white' : 'bg-gray-100 opacity-60'
          )}
          tabIndex={0}
          role="button"
          aria-label={`플레이어 ${player.nickname} ${player.isAlive ? '생존' : '탈락'}`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              {player.nickname.charAt(0)}
            </div>
            <div className="flex-1">
              <h3 className="font-medium">{player.nickname}</h3>
              <p className="text-sm text-gray-600">
                {player.isAlive ? '생존' : '탈락'}
                {player.hasVoted ? ' • 투표완료' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }, [players, onPlayerSelect]);

  // 성능 최적화: 플레이어 수가 적으면 가상화 비활성화
  if (players.length <= 10) {
    return (
      <div className="space-y-2">
        {players.map((player, index) => (
          <div key={player.id}>
            {itemRenderer({ index, style: {} })}
          </div>
        ))}
      </div>
    );
  }

  return (
    <List
      height={height}
      itemCount={players.length}
      itemSize={itemHeight}
      width="100%"
      itemData={players}
    >
      {itemRenderer}
    </List>
  );
});

VirtualizedPlayerList.displayName = 'VirtualizedPlayerList';

// 최적화된 게임 보드 Props
interface OptimizedGameBoardProps {
  players: Player[];
  gameState: GameState;
  onPlayerAction?: (action: PlayerAction) => void;
  className?: string;
}

interface PlayerAction {
  type: 'select' | 'vote' | 'context';
  playerId: string;
  data?: any;
}

// 개별 플레이어 카드 최적화
const MemoizedPlayerCard = memo<{
  player: Player & { isCurrentTurn: boolean; canBeVoted: boolean };
  onAction: (action: PlayerAction) => void;
}>(({ player, onAction }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [lastActionTime, setLastActionTime] = useState(0);

  // 액션 쓰로틀링
  const throttledAction = useCallback((action: PlayerAction) => {
    const now = Date.now();
    if (now - lastActionTime < 100) return; // 100ms 쓰로틀링

    setLastActionTime(now);
    onAction(action);
  }, [onAction, lastActionTime]);

  const handleClick = useCallback(() => {
    throttledAction({ type: 'select', playerId: player.id });
  }, [throttledAction, player.id]);

  const handleDoubleClick = useCallback(() => {
    if (player.canBeVoted) {
      throttledAction({ type: 'vote', playerId: player.id });
    }
  }, [throttledAction, player.id, player.canBeVoted]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    throttledAction({ type: 'context', playerId: player.id });
  }, [throttledAction, player.id]);

  // 메모이제이션된 스타일 계산
  const cardStyles = useMemo(() => ({
    transform: isHovered ? 'scale(1.02)' : 'scale(1)',
    transition: 'transform 0.2s ease-out',
  }), [isHovered]);

  return (
    <div
      className={cn(
        'relative p-3 border-2 rounded-lg cursor-pointer transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        {
          'border-yellow-400 bg-yellow-50': player.isCurrentTurn,
          'border-gray-300 bg-white hover:bg-gray-50': !player.isCurrentTurn,
          'opacity-60 grayscale': !player.isAlive,
          'ring-2 ring-green-400': player.canBeVoted
        }
      )}
      style={cardStyles}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      tabIndex={0}
      role="button"
      aria-label={`플레이어 ${player.nickname}`}
    >
      <div className="text-center">
        <div className="w-12 h-12 mx-auto bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold mb-2">
          {player.nickname.charAt(0)}
        </div>
        <h3 className="font-medium text-sm truncate">{player.nickname}</h3>
        <div className="flex justify-center gap-1 mt-1">
          <span className={cn(
            'px-1 py-0.5 text-xs rounded',
            player.isAlive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          )}>
            {player.isAlive ? '생존' : '탈락'}
          </span>
          {player.hasVoted && (
            <span className="px-1 py-0.5 text-xs rounded bg-blue-100 text-blue-800">
              투표
            </span>
          )}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // 최적화된 비교 함수
  const prev = prevProps.player;
  const next = nextProps.player;

  return (
    prev.id === next.id &&
    prev.nickname === next.nickname &&
    prev.isAlive === next.isAlive &&
    prev.hasVoted === next.hasVoted &&
    prev.isCurrentTurn === next.isCurrentTurn &&
    prev.canBeVoted === next.canBeVoted
  );
});

MemoizedPlayerCard.displayName = 'MemoizedPlayerCard';

// 최적화된 게임 보드 컴포넌트
const OptimizedGameBoardComponent: React.FC<OptimizedGameBoardProps> = ({
  players,
  gameState,
  onPlayerAction,
  className
}) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: players.length });

  // Intersection Observer로 가시성 감지
  useEffect(() => {
    if (!boardRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = parseInt(entry.target.getAttribute('data-index') || '0');
          if (entry.isIntersecting) {
            setVisibleRange(prev => ({
              start: Math.min(prev.start, index),
              end: Math.max(prev.end, index + 1)
            }));
          }
        });
      },
      { threshold: 0.1 }
    );

    const cards = boardRef.current.querySelectorAll('[data-index]');
    cards.forEach(card => observer.observe(card));

    return () => observer.disconnect();
  }, [players.length]);

  // 플레이어 상태 변화만 감지하는 메모이제이션
  const memoizedPlayers = useMemo(() =>
    players.map(player => ({
      ...player,
      isCurrentTurn: player.id === gameState.currentPlayerId,
      canBeVoted: player.isAlive &&
                   player.id !== gameState.currentPlayerId &&
                   gameState.phase === 'voting'
    })),
    [players, gameState.currentPlayerId, gameState.phase]
  );

  // 액션 핸들러 최적화
  const handlePlayerAction = useCallback((action: PlayerAction) => {
    onPlayerAction?.(action);
  }, [onPlayerAction]);

  // 그리드 레이아웃 계산
  const gridColumns = useMemo(() => {
    const width = window.innerWidth;
    if (width < 768) return 2;
    if (width < 1024) return 3;
    return 4;
  }, []);

  return (
    <div
      ref={boardRef}
      className={cn(
        'grid gap-4 p-4',
        className
      )}
      style={{
        gridTemplateColumns: `repeat(${gridColumns}, 1fr)`
      }}
    >
      {memoizedPlayers.map((player, index) => (
        <div
          key={player.id}
          data-index={index}
          style={{
            // 가시성 최적화: 보이지 않는 카드는 높이만 유지
            visibility: index >= visibleRange.start && index < visibleRange.end
              ? 'visible'
              : 'hidden'
          }}
        >
          <MemoizedPlayerCard
            player={player}
            onAction={handlePlayerAction}
          />
        </div>
      ))}
    </div>
  );
};

// React.memo로 감싸서 성능 최적화
export const OptimizedGameBoard = memo(OptimizedGameBoardComponent, (prevProps, nextProps) => {
  // 게임 상태의 중요한 변화만 감지
  return (
    prevProps.gameState.currentPlayerId === nextProps.gameState.currentPlayerId &&
    prevProps.gameState.phase === nextProps.gameState.phase &&
    prevProps.players.length === nextProps.players.length &&
    prevProps.players.every((player, index) => {
      const nextPlayer = nextProps.players[index];
      return nextPlayer &&
             player.id === nextPlayer.id &&
             player.isAlive === nextPlayer.isAlive &&
             player.hasVoted === nextPlayer.hasVoted;
    })
  );
});

OptimizedGameBoard.displayName = 'OptimizedGameBoard';

// 성능 모니터링 훅
export const useRenderingPerformance = (componentName: string) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current++;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;

    if (timeSinceLastRender < 16) { // 60fps 기준
      console.warn(`${componentName} rendering too frequently:`, {
        renderCount: renderCount.current,
        timeSinceLastRender
      });
    }

    lastRenderTime.current = now;
  });

  return {
    renderCount: renderCount.current,
    getAverageRenderTime: () => {
      const totalTime = Date.now() - lastRenderTime.current;
      return renderCount.current > 0 ? totalTime / renderCount.current : 0;
    }
  };
};

// 레이지 로딩 이미지 컴포넌트
export const LazyImage = memo<{
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
}>(({ src, alt, className, placeholder = '/images/placeholder.svg' }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <img
      ref={imgRef}
      src={isInView ? src : placeholder}
      alt={alt}
      className={cn(
        'transition-opacity duration-300',
        isLoaded ? 'opacity-100' : 'opacity-50',
        className
      )}
      onLoad={() => setIsLoaded(true)}
      loading="lazy"
    />
  );
});

LazyImage.displayName = 'LazyImage';
