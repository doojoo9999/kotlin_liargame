import {useEffect} from 'react';
import {useConnectionStore} from '@/stores/connectionStore';
import {websocketService} from '@/services/websocketService';
import {stateSync} from '@/services/stateSync';
import {useGameStore} from '@/stores';
import {useShallow} from 'zustand/react/shallow';

/**
 * WebSocket 연결 및 구독 관리 기본 훅
 */
export function useWebSocket(gameId?: string) {
  const selectConnectionState = useShallow((state: ReturnType<typeof useConnectionStore.getState>) => ({
    status: state.status,
    connect: state.connect,
    processQueue: state.processQueue,
  }));

  const {
    status,
    connect,
    processQueue,
  } = useConnectionStore(selectConnectionState);
  const gameNumber = useGameStore((state) => state.gameNumber);

  useEffect(() => {
    stateSync.init();
    if (status === 'idle' || status === 'disconnected' || status === 'error') {
      connect().catch(() => {});
    }
    return () => {
      // 연결 유지 전략: 언마운트 시 즉시 끊지 않음 (필요시 주석 해제)
      // disconnect();
    };
  }, [status, connect]);

  useEffect(() => {
    const unsubscribe = websocketService.onChatMessage((message) => {
      useGameStore.getState().ingestChatMessage(message);
    });

    return unsubscribe;
  }, []);

  // 게임 구독 처리
  useEffect(() => {
    const target = gameId || (gameNumber ? gameNumber.toString() : undefined);
    if (status === 'connected' && target) {
      websocketService.subscribeToGame(target);
      processQueue();
      const store = useGameStore.getState();
      if (typeof store.loadChatHistory === 'function' && store.chatMessages.length === 0) {
        store.loadChatHistory().catch(() => {});
      }
      return () => {
        websocketService.unsubscribeFromGame(target);
      };
    }
  }, [status, gameId, gameNumber, processQueue]);

  return {
    status,
    send: websocketService.safePublish.bind(websocketService),
    connected: status === 'connected',
    reconnecting: status === 'reconnecting' || status === 'connecting',
  };
}
