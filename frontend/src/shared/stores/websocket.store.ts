import {create} from 'zustand';
import type {WebSocketEventHandlers, WebSocketMessage} from '@/shared/types/websocket.types';

interface WebSocketStore {
  // 상태
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  ws: WebSocket | null;

  // 이벤트 핸들러 저장소
  eventHandlers: Partial<WebSocketEventHandlers>;

  // 액션
  connect: (url: string, token: string) => void;
  disconnect: () => void;
  sendMessage: (message: WebSocketMessage) => void;
  setEventHandlers: (handlers: Partial<WebSocketEventHandlers>) => void;
  setError: (error: string | null) => void;
}

export const useWebSocketStore = create<WebSocketStore>((set, get) => ({
  // 초기 상태
  isConnected: false,
  isConnecting: false,
  error: null,
  ws: null,
  eventHandlers: {},

  // WebSocket 연결
  connect: (url: string, token: string) => {
    const currentWs = get().ws;
    if (currentWs) {
      currentWs.close();
    }

    set({ isConnecting: true, error: null });

    try {
      const ws = new WebSocket(`${url}?token=${token}`);

      ws.onopen = () => {
        console.log('WebSocket connected');
        set({ isConnected: true, isConnecting: false, ws });
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          const handlers = get().eventHandlers;

          // 메시지 타입에 따라 적절한 핸들러 호출
          switch (message.type) {
            case 'PLAYER_JOINED':
              handlers.onPlayerJoined?.(message);
              break;
            case 'PLAYER_LEFT':
              handlers.onPlayerLeft?.(message);
              break;
            case 'GAME_STARTED':
              handlers.onGameStarted?.(message);
              break;
            case 'PHASE_CHANGED':
              handlers.onPhaseChanged?.(message);
              break;
            case 'PLAYER_VOTED':
              handlers.onPlayerVoted?.(message);
              break;
            case 'HINT_PROVIDED':
              handlers.onHintProvided?.(message);
              break;
            case 'GAME_ENDED':
              handlers.onGameEnded?.(message);
              break;
            case 'PLAYER_ELIMINATED':
              handlers.onPlayerEliminated?.(message);
              break;
            case 'TIME_UPDATE':
              handlers.onTimeUpdate?.(message);
              break;
            case 'ERROR':
              handlers.onError?.(message);
              break;
            case 'CHAT_MESSAGE':
              handlers.onChatMessage?.(message);
              break;
            default:
              console.warn('Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        set({ isConnected: false, isConnecting: false, ws: null });
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        set({
          error: 'WebSocket connection failed',
          isConnected: false,
          isConnecting: false,
          ws: null
        });
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      set({
        error: 'Failed to create WebSocket connection',
        isConnecting: false
      });
    }
  },

  // WebSocket 연결 해제
  disconnect: () => {
    const ws = get().ws;
    if (ws) {
      ws.close();
    }
    set({
      isConnected: false,
      isConnecting: false,
      ws: null,
      error: null
    });
  },

  // 메시지 전송
  sendMessage: (message: WebSocketMessage) => {
    const { ws, isConnected } = get();

    if (!ws || !isConnected) {
      console.error('WebSocket is not connected');
      return;
    }

    try {
      ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      set({ error: 'Failed to send message' });
    }
  },

  // 이벤트 핸들러 설정
  setEventHandlers: (handlers: Partial<WebSocketEventHandlers>) => {
    set(state => ({
      eventHandlers: { ...state.eventHandlers, ...handlers }
    }));
  },

  // 에러 설정
  setError: (error: string | null) => {
    set({ error });
  },
}));
