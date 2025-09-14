// Message routing & handler registry (stub implementation)
import type {IncomingMessage, MessagePayloadMap, MessageType} from '@/types/websocket';
import {useGameStore} from '@/stores';
import {useConnectionStore} from '@/stores/connectionStore';

export type Handler<T = any> = (payload: T, raw: IncomingMessage<T>) => void;

class MessageHandlerRegistry {
  private handlers: Partial<{ [K in MessageType]: Handler<MessagePayloadMap[K]>[] }> = {};

  register<K extends MessageType>(type: K, handler: Handler<MessagePayloadMap[K]>) {
    if (!this.handlers[type]) this.handlers[type] = [] as any;
    (this.handlers[type] as Handler<MessagePayloadMap[K]>[]).push(handler);
    return () => {
      this.handlers[type] = (this.handlers[type] || []).filter(h => h !== handler) as any;
    };
  }

  dispatch(message: IncomingMessage) {
    const list = this.handlers[message.type] || [];
    list.forEach(h => {
      try { (h as any)(message.payload, message); } catch (e) { /* eslint-disable no-console */ console.error('handler error', e); }
    });
  }
}

export const messageHandlers = new MessageHandlerRegistry();

// Default basic handlers (can be expanded)
messageHandlers.register('GAME_STATE_UPDATE', (payload) => {
  if (payload?.gameState) {
    useGameStore.getState().updateFromGameState?.(payload.gameState);
  }
});

messageHandlers.register('ERROR', (payload) => {
  useConnectionStore.getState().addSyncIssue({ type: 'VALIDATION_ERROR', description: payload.message });
});

