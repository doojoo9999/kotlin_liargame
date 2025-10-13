import {useCallback, useEffect, useMemo, useState} from 'react';
import {toast} from 'sonner';
import {useShallow} from 'zustand/react/shallow';
import {useConnectionStore} from '@/stores/connectionStore';
import {useGameStore} from '@/stores';
import {websocketService} from '@/services/websocketService';
import {resetRealtimeSessionTracking} from '@/utils/sessionCleanup';
import type {ChatMessageType} from '@/types/realtime';

export interface UseGameWebSocketReturn {
  isConnected: boolean;
  connectionError: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  retry: () => Promise<void>;
  joinGame: (gameId: string) => void;
  leaveGame: () => void;
  sendChatMessage: (message: string, type?: ChatMessageType) => Promise<void>;
  castVote: (targetPlayerId: string) => void;
  startGame: () => void;
}

export const useGameWebSocket = (): UseGameWebSocketReturn => {
  const selectGameStore = useShallow((state: ReturnType<typeof useGameStore.getState>) => ({
    connectionError: state.connectionError,
    setConnectionError: state.setConnectionError,
    setConnectionState: state.setConnectionState,
    resetGameData: state.resetGameData,
    sendChatMessage: state.sendChatMessage,
    castVote: state.castVote,
    startGame: state.startGame,
    currentPlayer: state.currentPlayer,
  }));

  const {
    connectionError,
    setConnectionError,
    setConnectionState,
    resetGameData,
    sendChatMessage: sendChatMessageAction,
    castVote: castVoteAction,
    startGame: startGameAction,
    currentPlayer,
  } = useGameStore(selectGameStore);

  const selectConnectionStore = useShallow((state: ReturnType<typeof useConnectionStore.getState>) => ({
    status: state.status,
    connect: state.connect,
    disconnect: state.disconnect,
  }));

  const {
    status: connectionStatus,
    connect: connectConnection,
    disconnect: disconnectConnection,
  } = useConnectionStore(selectConnectionStore);

  const [isConnecting, setIsConnecting] = useState(false);

  const isConnected = connectionStatus === 'connected';
  const derivedError = useMemo(() => {
    if (connectionStatus === 'error' && !connectionError) {
      return '웹소켓 연결에 실패했습니다';
    }
    return connectionError;
  }, [connectionStatus, connectionError]);

  useEffect(() => {
    setConnectionState(connectionStatus === 'connected');
    if (connectionStatus === 'connected') {
      setConnectionError(null);
    }
  }, [connectionStatus, setConnectionError, setConnectionState]);

  const connect = useCallback(async () => {
    if (isConnecting || isConnected) {
      return;
    }

    setIsConnecting(true);
    setConnectionError(null);

    try {
      await connectConnection();
      toast.success('웹소켓 연결이 완료되었습니다');
    } catch (error) {
      const message = error instanceof Error ? error.message : '연결에 실패했습니다';
      setConnectionError(message);
      toast.error(message);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [connectConnection, isConnected, isConnecting, setConnectionError]);

  const disconnect = useCallback(() => {
    disconnectConnection();
  }, [disconnectConnection]);

  const retry = useCallback(async () => {
    disconnectConnection();
    await new Promise(resolve => setTimeout(resolve, 500));
    return connect();
  }, [connect, disconnectConnection]);

  const joinGame = useCallback((gameId: string) => {
    if (!gameId) {
      return;
    }

    if (!isConnected) {
      const message = '웹소켓 연결이 필요합니다';
      setConnectionError(message);
      toast.error(message);
      return;
    }

    websocketService.subscribeToGame(gameId);
    resetGameData();
  }, [isConnected, resetGameData, setConnectionError]);

  const leaveGame = useCallback(() => {
    const { gameNumber } = useGameStore.getState();
    if (gameNumber != null) {
      websocketService.unsubscribeFromGame(gameNumber.toString());
    }
    resetGameData();
    resetRealtimeSessionTracking();
  }, [resetGameData]);

  const sendChatMessage = useCallback((message: string, type: ChatMessageType = 'DISCUSSION') => {
    return sendChatMessageAction(message, type);
  }, [sendChatMessageAction]);

  const castVote = useCallback((targetPlayerId: string) => {
    const voterId = currentPlayer?.id;
    if (!voterId) {
      console.warn('투표할 플레이어 정보를 찾지 못했습니다.');
      return;
    }
    castVoteAction(voterId, targetPlayerId);
  }, [castVoteAction, currentPlayer]);

  const startGame = useCallback(() => {
    startGameAction();
  }, [startGameAction]);

  return {
    isConnected,
    connectionError: derivedError,
    connect,
    disconnect,
    retry,
    joinGame,
    leaveGame,
    sendChatMessage,
    castVote,
    startGame,
  };
};
