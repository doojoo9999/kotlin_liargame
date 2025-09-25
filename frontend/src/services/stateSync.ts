// Real-time state synchronization orchestrator
import {conflictResolver} from './conflictResolver';
import type {GameStateUpdatePayload, IncomingMessage} from '@/types/websocket';
import {messageHandlers} from './messageHandlers';
import {websocketService} from './websocketService';
import {useGameStore} from '@/stores';
import {useConnectionStore} from '@/stores/connectionStore';
import type {GameEvent} from '@/types/realtime';

class StateSync {
  private initialized = false;

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

  private handleGameEvent(event: GameEvent) {
    // Normalize to IncomingMessage shape
    const msg: IncomingMessage = {
      type: (event.type === 'GAME_STATE_UPDATED' ? 'GAME_STATE_UPDATE' : event.type) as any,
      gameId: event.gameId?.toString?.() || 'unknown',
      timestamp: event.timestamp || Date.now(),
      payload: event.payload,
    };

    if (msg.type === 'GAME_STATE_UPDATE') {
      const payload = msg.payload as GameStateUpdatePayload;
      this.mergeServerState(payload?.gameState);
    }

    messageHandlers.dispatch(msg);

    const storeHandle = useGameStore.getState().handleGameEvent;
    if (typeof storeHandle === 'function') {
      try {
        storeHandle(event);
      } catch (error) {
        console.error('Failed to apply game event to store:', error);
      }
    }
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

