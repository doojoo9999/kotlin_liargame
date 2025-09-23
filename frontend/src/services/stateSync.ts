// Real-time state synchronization orchestrator
import {conflictResolver} from './conflictResolver';
import type {IncomingMessage} from '@/types/websocket';
import {messageHandlers} from './messageHandlers';
import {websocketService} from './websocketService';
import {useGameStore} from '@/stores';
import {useConnectionStore} from '@/stores/connectionStore';

class StateSync {
  private initialized = false;
  private lastServerStateVersion: number | null = null;

  init() {
    if (this.initialized) return;
    websocketService.registerRawListener(raw => {
      if (raw.type === 'event') {
        this.handleGameEvent(raw.data);
      } else if (raw.type === 'chat') {
        // UI unread count handled elsewhere (uiStore)
      }
    });
    this.initialized = true;
  }

  private handleGameEvent(event: any) {
    // Normalize to IncomingMessage shape
    const msg: IncomingMessage = {
      type: (event.type === 'GAME_STATE_UPDATED' ? 'GAME_STATE_UPDATE' : event.type) as any,
      gameId: event.gameId?.toString?.() || 'unknown',
      timestamp: event.timestamp || Date.now(),
      payload: event.payload,
    };

    if (msg.type === 'GAME_STATE_UPDATE') {
      this.mergeServerState(msg.payload?.gameState);
    }

    messageHandlers.dispatch(msg);
  }

  private mergeServerState(serverState: any) {
    if (!serverState) return;
    try {
      const gameStore = useGameStore.getState();
      const merged = conflictResolver.mergeStates([serverState]);
      gameStore.updateFromGameState?.(merged);
      // Confirm any optimistic updates implicitly
      const pending = useConnectionStore.getState().optimisticUpdates;
      Object.keys(pending).forEach(id => {
        useConnectionStore.getState().confirmOptimistic(id);
      });
    } catch (e) {
      useConnectionStore.getState().addSyncIssue({ type: 'VALIDATION_ERROR', description: '서버 상태 병합 실패', data: e });
    }
  }
}

export const stateSync = new StateSync();

