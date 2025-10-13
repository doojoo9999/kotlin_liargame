import {Client} from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type {GameRealtimeEvent, GameStateResponse} from '../types/backendTypes';

const WEBSOCKET_SESSION_STORAGE_KEY = 'liargame:websocket-session-id';
const LEGACY_WEBSOCKET_SESSION_STORAGE_KEY = 'websocket-session-id';

type GameStateUpdateEvent = {
  type: 'GAME_STATE_UPDATE';
  gameNumber: number;
  timestamp: string;
  gameState: GameStateResponse;
};

type PersonalNotificationEvent = {
  type: 'PERSONAL_NOTIFICATION';
  gameNumber: number;
  timestamp: string;
  notification: unknown;
};

type ExtendedRealtimeEvent = GameRealtimeEvent | GameStateUpdateEvent | PersonalNotificationEvent;
type ExtendedRealtimeEventType = ExtendedRealtimeEvent['type'];

export interface RealtimeEventHandler {
  (event: ExtendedRealtimeEvent): void;
}

export interface ChatMessageHandler {
  (message: any): void;
}

export interface ConnectionHandler {
  (connected: boolean): void;
}

/**
 * Enhanced Realtime Service using STOMP over SockJS
 * Implements backend WebSocket protocol with reconnection and session management
 */
export class RealtimeService {
  private static instance: RealtimeService;
  private client: Client | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  
  // Event handlers
  private eventHandlers = new Map<ExtendedRealtimeEventType | 'ALL', RealtimeEventHandler[]>();
  private chatHandlers: ChatMessageHandler[] = [];
  private connectionHandlers: ConnectionHandler[] = [];
  
  // Connection state
  private currentGameNumber: number | null = null;
  private currentUserId: number | null = null;
  private sessionId: string | null = null;

  static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  // ============= Connection Management =============

  async connect(userId?: number): Promise<void> {
    if (this.isConnecting || (this.client && this.client.connected)) {
      return;
    }

    this.isConnecting = true;
    this.currentUserId = userId || this.currentUserId;

    return new Promise((resolve, reject) => {
      try {
        // Create SockJS connection
        const socketOptions: SockJS.Options & {
          transportOptions?: Record<string, { withCredentials: boolean }>;
        } = {
          transports: ['websocket', 'xhr-streaming', 'xhr-polling'],
          // Ensure SockJS XHR transports forward session cookies
          transportOptions: {
            'xhr-streaming': { withCredentials: true },
            'xhr-polling': { withCredentials: true },
          },
        };
        const socket = new SockJS('/ws', undefined, socketOptions);
        
        // Initialize STOMP client
        this.client = new Client({
          webSocketFactory: () => socket,
          debug: (str) => {
            if (process.env.NODE_ENV === 'development') {
              console.log('STOMP Debug:', str);
            }
          },
          reconnectDelay: this.reconnectInterval,
          heartbeatIncoming: 10000,
          heartbeatOutgoing: 10000,
        });

        // Connection headers for reconnection
        const connectHeaders: Record<string, string> = {};
        const storedSessionId = this.sessionId ?? this.getStoredSessionId();
        if (storedSessionId) {
          connectHeaders['x-old-session-id'] = storedSessionId;
          this.sessionId = storedSessionId;
        }

        this.client.onConnect = (frame) => {
          console.log('STOMP Connected:', frame);
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          
          // Store session ID for reconnection
          const sessionIdHeader = frame.headers['session'];
          if (sessionIdHeader) {
            this.sessionId = sessionIdHeader;
            this.storeSessionId(sessionIdHeader);
          }

          // Start heartbeat
          this.startHeartbeat();
          
          // Notify connection handlers
          this.connectionHandlers.forEach(handler => handler(true));
          
          resolve();
        };

        this.client.onDisconnect = () => {
          console.log('STOMP Disconnected');
          this.isConnecting = false;
          this.stopHeartbeat();
          
          // Notify connection handlers
          this.connectionHandlers.forEach(handler => handler(false));
          
          // Auto-reconnect
          this.scheduleReconnect();
        };

        this.client.onStompError = (frame) => {
          console.error('STOMP Error:', frame);
          this.isConnecting = false;
          reject(new Error(`STOMP Error: ${frame.headers['message']}`));
        };

        this.client.onWebSocketError = (event) => {
          console.error('WebSocket Error:', event);
          this.isConnecting = false;
          reject(new Error('WebSocket connection failed'));
        };

        // Activate connection
        this.client.activate();

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.stopHeartbeat();
    
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
    
    this.currentGameNumber = null;
    this.sessionId = null;
    this.clearStoredSessionId();
    
    // Notify connection handlers
    this.connectionHandlers.forEach(handler => handler(false));
  }

  isConnected(): boolean {
    return this.client?.connected || false;
  }

  // ============= Game Subscription Management =============

  subscribeToGame(gameNumber: number): void {
    if (!this.client?.connected) {
      throw new Error('WebSocket not connected');
    }

    this.currentGameNumber = gameNumber;

    // Subscribe to game state updates
    this.client.subscribe(`/topic/game/${gameNumber}/state`, (message) => {
      try {
        const gameState = JSON.parse(message.body) as GameStateResponse;
        const event: GameStateUpdateEvent = {
          type: 'GAME_STATE_UPDATE',
          gameNumber,
          timestamp: new Date().toISOString(),
          gameState,
        };
        this.notifyEventHandlers('GAME_STATE_UPDATE', event);
        this.notifyEventHandlers('ALL', event);
      } catch (error) {
        console.error('Failed to parse game state:', error);
      }
    });

    // Subscribe to chat messages
    this.client.subscribe(`/topic/game/${gameNumber}/chat`, (message) => {
      try {
        const chatMessage = JSON.parse(message.body);
        this.chatHandlers.forEach(handler => handler(chatMessage));
      } catch (error) {
        console.error('Failed to parse chat message:', error);
      }
    });

    // Subscribe to real-time events
    this.client.subscribe(`/topic/game/${gameNumber}/events`, (message) => {
      try {
        const event = JSON.parse(message.body) as GameRealtimeEvent;
        this.notifyEventHandlers(event.type, event);
        this.notifyEventHandlers('ALL', event);
      } catch (error) {
        console.error('Failed to parse realtime event:', error);
      }
    });

    // Subscribe to personal notifications
    if (this.currentUserId) {
      this.client.subscribe(`/topic/user/${this.currentUserId}/notifications`, (message) => {
        try {
          const notification = JSON.parse(message.body);
          const event: PersonalNotificationEvent = {
            type: 'PERSONAL_NOTIFICATION',
            gameNumber,
            timestamp: new Date().toISOString(),
            notification,
          };
          this.notifyEventHandlers('PERSONAL_NOTIFICATION', event);
          this.notifyEventHandlers('ALL', event);
        } catch (error) {
          console.error('Failed to parse notification:', error);
        }
      });
    }

    console.log(`Subscribed to game ${gameNumber}`);
  }

  unsubscribeFromGame(): void {
    // STOMP subscriptions are automatically cleaned up when client disconnects
    this.currentGameNumber = null;
    console.log('Unsubscribed from game');
  }

  // ============= Event Handler Management =============

  onRealtimeEvent(eventType: ExtendedRealtimeEventType | 'ALL', handler: RealtimeEventHandler): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(eventType);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  onChatMessage(handler: ChatMessageHandler): () => void {
    this.chatHandlers.push(handler);
    
    // Return unsubscribe function
    return () => {
      const index = this.chatHandlers.indexOf(handler);
      if (index > -1) {
        this.chatHandlers.splice(index, 1);
      }
    };
  }

  onConnection(handler: ConnectionHandler): () => void {
    this.connectionHandlers.push(handler);
    
    // Return unsubscribe function
    return () => {
      const index = this.connectionHandlers.indexOf(handler);
      if (index > -1) {
        this.connectionHandlers.splice(index, 1);
      }
    };
  }

  // ============= Message Sending =============

  sendHeartbeat(): void {
    if (this.client?.connected) {
      this.client.publish({
        destination: '/app/heartbeat',
        body: JSON.stringify({ timestamp: Date.now() })
      });
    }
  }

  // ============= Private Methods =============

  getCurrentGameNumber(): number | null {
    return this.currentGameNumber;
  }

  getCurrentUserId(): number | null {
    return this.currentUserId;
  }

  setCurrentUserId(userId: number): void {
    this.currentUserId = userId;
  }

  getConnectionState(): {
    connected: boolean;
    gameNumber: number | null;
    userId: number | null;
    reconnectAttempts: number;
  } {
    return {
      connected: this.isConnected(),
      gameNumber: this.currentGameNumber,
      userId: this.currentUserId,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  private notifyEventHandlers(eventType: ExtendedRealtimeEventType | 'ALL', event: ExtendedRealtimeEvent): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error('Event handler error:', error);
        }
      });
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 30000); // 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // ============= Utility Methods =============

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1), 30000);

    console.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      if (!this.isConnected()) {
        this.connect(this.currentUserId || undefined).catch(console.error);
      }
    }, delay);
  }

  private getStoredSessionId(): string | null {
    try {
      const stored = localStorage.getItem(WEBSOCKET_SESSION_STORAGE_KEY);
      if (stored) {
        return stored;
      }
      return localStorage.getItem(LEGACY_WEBSOCKET_SESSION_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  private storeSessionId(sessionId: string): void {
    try {
      localStorage.setItem(WEBSOCKET_SESSION_STORAGE_KEY, sessionId);
      localStorage.removeItem(LEGACY_WEBSOCKET_SESSION_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to store session ID:', error);
    }
  }

  private clearStoredSessionId(): void {
    try {
      localStorage.removeItem(WEBSOCKET_SESSION_STORAGE_KEY);
      localStorage.removeItem(LEGACY_WEBSOCKET_SESSION_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear session ID:', error);
    }
  }
}

// Singleton instance
export const realtimeService = RealtimeService.getInstance();
