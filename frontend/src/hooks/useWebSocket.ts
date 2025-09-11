import {useEffect} from 'react';
import {useConnectionStore} from '@/stores/connectionStore';
import {websocketService} from '@/services/websocketService';
import {stateSync} from '@/services/stateSync';
import {useGameStore} from '@/store/gameStore';

/**
 * WebSocket 연결 및 구독 관리 기본 훅
 */
export function useWebSocket(gameId?: string) {
  const {
    status,
    connect,
    disconnect,
    processQueue,
  } = useConnectionStore();
  const { gameNumber } = useGameStore();

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

  // 게임 구독 처리
  useEffect(() => {
    const target = gameId || (gameNumber ? gameNumber.toString() : undefined);
    if (status === 'connected' && target) {
      websocketService.subscribeToGame(target);
      processQueue();
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

