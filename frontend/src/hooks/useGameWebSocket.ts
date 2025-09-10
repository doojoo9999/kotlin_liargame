import {useCallback, useEffect, useState} from 'react';
import {websocketService} from '../services/websocketService';
import useGameStore from '../stores/gameStore';
import {toast} from 'sonner';

export interface UseGameWebSocketReturn {
  isConnected: boolean;
  connectionError: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  retry: () => Promise<void>;
  joinGame: (gameId: string) => void;
  leaveGame: () => void;
  sendChatMessage: (message: string) => void;
  castVote: (targetPlayerId: string) => void;
  submitDefense: (defense: string) => void;
  startGame: () => void;
}

export const useGameWebSocket = (): UseGameWebSocketReturn => {
  const gameStore = useGameStore();
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = useCallback(async () => {
    if (isConnecting || gameStore.isConnected) return;

    setIsConnecting(true);
    gameStore.setConnectionError(null);

    try {
      await gameStore.connectWebSocket();
      toast.success('실시간 연결이 성공했습니다');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '연결에 실패했습니다';
      gameStore.setConnectionError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, gameStore]);

  const disconnect = useCallback(() => {
    gameStore.disconnectWebSocket();
    toast.info('실시간 연결이 종료되었습니다');
  }, [gameStore]);

  const retry = useCallback(async () => {
    if (gameStore.isConnected) {
      disconnect();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return connect();
  }, [gameStore.isConnected, connect, disconnect]);

  const joinGame = useCallback((gameId: string) => {
    gameStore.joinGame(gameId);
  }, [gameStore]);

  const leaveGame = useCallback(() => {
    gameStore.leaveGame();
  }, [gameStore]);

  const sendChatMessage = useCallback((message: string) => {
    gameStore.sendChatMessage(message);
  }, [gameStore]);

  const castVote = useCallback((targetPlayerId: string) => {
    gameStore.castVote(targetPlayerId);
  }, [gameStore]);

  const submitDefense = useCallback((defense: string) => {
    gameStore.submitDefense(defense);
  }, [gameStore]);

  const startGame = useCallback(() => {
    gameStore.startGame();
  }, [gameStore]);

  // Auto-connect is handled by App.tsx based on authentication status
  // No automatic connection here to prevent connection timeout on login page

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (gameStore.isConnected) {
        websocketService.disconnect();
      }
    };
  }, [gameStore.isConnected]);

  return {
    isConnected: gameStore.isConnected,
    connectionError: gameStore.connectionError,
    connect,
    disconnect,
    retry,
    joinGame,
    leaveGame,
    sendChatMessage,
    castVote,
    submitDefense,
    startGame
  };
};
