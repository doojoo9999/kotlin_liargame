import {useCallback, useState} from 'react';
import useGameStore from '../stores/gameStore';
import {toast} from 'sonner';
import {useShallow} from 'zustand/react/shallow';

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
  const selectWebSocketState = useShallow((state: ReturnType<typeof useGameStore.getState>) => ({
    isConnected: state.isConnected,
    connectionError: state.connectionError,
    setConnectionError: state.setConnectionError,
    connectWebSocket: state.connectWebSocket,
    disconnectWebSocket: state.disconnectWebSocket,
    joinGame: state.joinGame,
    leaveGame: state.leaveGame,
    sendChatMessage: state.sendChatMessage,
    castVote: state.castVote,
    submitDefense: state.submitDefense,
    startGame: state.startGame,
  }));

  const {
    isConnected,
    connectionError,
    setConnectionError,
    connectWebSocket,
    disconnectWebSocket,
    joinGame: joinGameAction,
    leaveGame: leaveGameAction,
    sendChatMessage: sendChatMessageAction,
    castVote: castVoteAction,
    submitDefense: submitDefenseAction,
    startGame: startGameAction,
  } = useGameStore(selectWebSocketState);
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = useCallback(async () => {
    if (isConnecting || isConnected) return;

    setIsConnecting(true);
    setConnectionError(null);

    try {
      await connectWebSocket();
      toast.success('실시간 연결이 성공했습니다');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '연결에 실패했습니다';
      setConnectionError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, isConnected, connectWebSocket, setConnectionError]);

  const disconnect = useCallback(() => {
    disconnectWebSocket();
    toast.info('실시간 연결이 종료되었습니다');
  }, [disconnectWebSocket]);

  const retry = useCallback(async () => {
    if (isConnected) {
      disconnect();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return connect();
  }, [isConnected, connect, disconnect]);

  const joinGame = useCallback((gameId: string) => {
    joinGameAction(gameId);
  }, [joinGameAction]);

  const leaveGame = useCallback(() => {
    leaveGameAction();
  }, [leaveGameAction]);

  const sendChatMessage = useCallback((message: string) => {
    sendChatMessageAction(message);
  }, [sendChatMessageAction]);

  const castVote = useCallback((targetPlayerId: string) => {
    castVoteAction(targetPlayerId);
  }, [castVoteAction]);

  const submitDefense = useCallback((defense: string) => {
    submitDefenseAction(defense);
  }, [submitDefenseAction]);

  const startGame = useCallback(() => {
    startGameAction();
  }, [startGameAction]);

  // Auto-connect is handled by App.tsx based on authentication status
  // No automatic connection here to prevent connection timeout on login page

  return {
    isConnected,
    connectionError,
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
