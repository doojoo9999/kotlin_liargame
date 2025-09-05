import {useCallback, useMemo, useState} from 'react';
import {GamePhase, GameState, GameStats, Player} from '../types';

interface UseGameStateProps {
  initialGameState?: Partial<GameState>;
  initialPlayers?: Player[];
}

export const useGameState = ({ 
  initialGameState = {}, 
  initialPlayers = [] 
}: UseGameStateProps = {}) => {
  const [gameState, setGameState] = useState<GameState>({
    phase: 'discussion',
    timeLeft: 45,
    round: 1,
    topic: '빨간 과일',
    maxTime: 45,
    isLoading: false,
    ...initialGameState
  });
  
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);

  // Memoized game statistics
  const gameStats = useMemo((): GameStats => {
    const alive = players.filter(p => p.isAlive);
    const voted = players.filter(p => p.hasVoted && p.isAlive);
    const hosts = players.filter(p => p.isHost);
    const connectionIssues = players.filter(p => p.connectionQuality === 'poor').length;
    
    return {
      aliveCount: alive.length,
      votedCount: voted.length,
      totalCount: players.length,
      hostCount: hosts.length,
      connectionIssues
    };
  }, [players]);

  // Game state actions
  const updateGameState = useCallback((update: Partial<GameState>) => {
    setGameState(prev => ({ ...prev, ...update }));
    setError(null); // Clear errors on successful state update
  }, []);

  const nextPhase = useCallback(() => {
    const phaseOrder: GamePhase[] = ['lobby', 'discussion', 'voting', 'defense', 'result'];
    const currentIndex = phaseOrder.indexOf(gameState.phase);
    const nextIndex = (currentIndex + 1) % phaseOrder.length;
    const nextPhase = phaseOrder[nextIndex];
    
    updateGameState({ 
      phase: nextPhase, 
      timeLeft: nextPhase === 'discussion' ? 120 : 45,
      round: nextPhase === 'lobby' ? gameState.round + 1 : gameState.round
    });
  }, [gameState.phase, gameState.round, updateGameState]);

  const resetGame = useCallback(() => {
    setGameState({
      phase: 'lobby',
      timeLeft: 45,
      round: 1,
      topic: '빨간 과일',
      maxTime: 45,
      isLoading: false
    });
    setError(null);
  }, []);

  // Player actions
  const updatePlayer = useCallback((playerId: string, update: Partial<Player>) => {
    setPlayers(prev => prev.map(p => 
      p.id === playerId ? { ...p, ...update } : p
    ));
  }, []);

  const addPlayer = useCallback((player: Player) => {
    setPlayers(prev => [...prev, player]);
  }, []);

  const removePlayer = useCallback((playerId: string) => {
    setPlayers(prev => prev.filter(p => p.id !== playerId));
  }, []);

  const voteForPlayer = useCallback((voterId: string, targetId: string) => {
    setPlayers(prev => prev.map(p => {
      if (p.id === voterId) {
        return { ...p, hasVoted: true };
      }
      if (p.id === targetId) {
        return { ...p, votesReceived: p.votesReceived + 1 };
      }
      return p;
    }));
  }, []);

  const clearVotes = useCallback(() => {
    setPlayers(prev => prev.map(p => ({ 
      ...p, 
      hasVoted: false, 
      votesReceived: 0 
    })));
  }, []);

  // Connection status
  const setConnectionStatus = useCallback((connected: boolean) => {
    setIsConnected(connected);
    if (!connected) {
      setError('연결이 끊어졌습니다. 다시 연결을 시도하고 있습니다...');
    } else {
      setError(null);
    }
  }, []);

  // Error handling
  const setGameError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    updateGameState({ isLoading: false });
  }, [updateGameState]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Loading state
  const setLoading = useCallback((loading: boolean) => {
    updateGameState({ isLoading: loading });
  }, [updateGameState]);

  // Computed values
  const votingProgress = gameStats.aliveCount > 0 ? (gameStats.votedCount / gameStats.aliveCount) * 100 : 0;
  const isVotingComplete = gameStats.votedCount === gameStats.aliveCount && gameStats.aliveCount > 0;
  const canStartGame = gameStats.aliveCount >= 3;
  const hasConnectionIssues = gameStats.connectionIssues > 0;

  return {
    // State
    gameState,
    players,
    gameStats,
    error,
    isConnected,
    
    // Computed values
    votingProgress,
    isVotingComplete,
    canStartGame,
    hasConnectionIssues,
    
    // Actions
    updateGameState,
    nextPhase,
    resetGame,
    updatePlayer,
    addPlayer,
    removePlayer,
    voteForPlayer,
    clearVotes,
    setConnectionStatus,
    setGameError,
    clearError,
    setLoading
  };
};