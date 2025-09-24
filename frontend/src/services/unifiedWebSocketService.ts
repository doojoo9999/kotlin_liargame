import {Client, StompConfig} from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type {RealtimeEventType} from '../types/backendTypes';

// Unified interfaces
export interface GameEvent {
  type: RealtimeEventType;
  gameId?: string;
  gameNumber?: number;
  payload: any;
  timestamp: number;
  userId?: string;
}

export interface ChatMessage {
  id: string;
  gameId?: string;
  gameNumber?: number;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
  type: 'CHAT' | 'SYSTEM';
}

// Event handler types
type EventCallback = (event: GameEvent) => void;
type ChatCallback = (message: ChatMessage) => void;
type ConnectionCallback = (connected: boolean, error?: string) => void;
type ErrorCallback = (error: Error) => void;

/**
 * Unified WebSocket Service
 * Consolidates websocketService and realtimeService functionality
 * Implements backend WebSocket protocol with STOMP over SockJS
 */
export class UnifiedWebSocketService {
  private static instance: UnifiedWebSocketService;
  private client: Client | null = null;
  
  // Connection state
  private isConnected = false;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  
  // Current session state
  private currentGameNumber: number | null = null;
  private currentUserId: number | null = null;
  private sessionId: string | null = null;
  
  // Event handlers
  private eventCallbacks = new Map<RealtimeEventType | 'ALL', EventCallback[]>();
  private chatCallbacks: ChatCallback[] = [];
  private connectionCallbacks: ConnectionCallback[] = [];
  private errorCallbacks: ErrorCallback[] = [];
  
  // Subscription tracking
  private subscriptions = new Map<string, any>();

  get connected(): boolean {
    return this.isConnected;
  }

  // ============= Connection Management =============

  get connecting(): boolean {
    return this.isConnecting;
  }

  get gameNumber(): number | null {
    return this.currentGameNumber;
  }

  get userId(): number | null {
    return this.currentUserId;
  }

  get status(): 'connected' | 'connecting' | 'disconnected' {
    if (this.isConnected) return 'connected';
    if (this.isConnecting) return 'connecting';
    return 'disconnected';
  }

  // ============= Game Room Management =============

  static getInstance(): UnifiedWebSocketService {
    if (!UnifiedWebSocketService.instance) {
      UnifiedWebSocketService.instance = new UnifiedWebSocketService();
    }
    return UnifiedWebSocketService.instance;
  }

  async connect(userId?: number): Promise<void> {
    if (this.isConnecting || this.isConnected) {
      return Promise.resolve();
    }

    this.isConnecting = true;
    this.currentUserId = userId || null;

    try {
      // Create WebSocket connection with SockJS fallback
      const socketOptions: SockJS.Options & {
        transportOptions?: Record<string, { withCredentials: boolean }>;
      } = {
        transports: ['websocket', 'xhr-streaming', 'xhr-polling'],
        // Ensure SockJS XHR transports include credentials for session-bound auth
        transportOptions: {
          'xhr-streaming': { withCredentials: true },
          'xhr-polling': { withCredentials: true },
        },
      };
      const socket = new SockJS(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/ws`, undefined, socketOptions);

      const stompConfig: StompConfig = {
        webSocketFactory: () => socket,
        connectHeaders: {
          'userId': this.currentUserId?.toString() || '',
          'sessionId': this.sessionId || '',
        },
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        reconnectDelay: this.reconnectInterval,
        maxWebSocketChunkSize: 8 * 1024,

        onConnect: (frame) => {
          console.log('WebSocket connected:', frame);
          this.isConnected = true;
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.sessionId = frame.headers['session-id'] || null;

          this.setupSubscriptions();
          this.startHeartbeat();
          this.notifyConnectionCallbacks(true);
        },

        onDisconnect: (frame) => {
          console.log('WebSocket disconnected:', frame);
          this.handleDisconnection();
        },

        onStompError: (frame) => {
          console.error('STOMP error:', frame);
          this.handleError(new Error(`STOMP error: ${frame.headers.message}`));
        },

        onWebSocketClose: (event) => {
          console.log('WebSocket closed:', event);
          this.handleDisconnection();
        },

        onWebSocketError: (error) => {
          console.error('WebSocket error:', error);
          this.handleError(new Error('WebSocket connection error'));
        }
      };

      this.client = new Client(stompConfig);
      this.client.activate();

      // Wait for connection with timeout
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);

        const checkConnection = () => {
          if (this.isConnected) {
            clearTimeout(timeout);
            resolve();
          } else if (!this.isConnecting) {
            clearTimeout(timeout);
            reject(new Error('Connection failed'));
          } else {
            setTimeout(checkConnection, 100);
          }
        };

        checkConnection();
      });

    } catch (error) {
      this.isConnecting = false;
      const err = error instanceof Error ? error : new Error('Unknown connection error');
      this.handleError(err);
      throw err;
    }
  }

  // ============= Message Handling =============

  disconnect(): void {
    this.stopHeartbeat();
    this.clearSubscriptions();

    if (this.client) {
      try {
        this.client.deactivate();
      } catch (error) {
        console.error('Error deactivating client:', error);
      }
      this.client = null;
    }

    this.isConnected = false;
    this.isConnecting = false;
    this.currentGameNumber = null;
    this.sessionId = null;

    this.notifyConnectionCallbacks(false);
  }

  joinGameRoom(gameNumber: number): void {
    if (!this.isConnected || !this.client) {
      throw new Error('WebSocket not connected');
    }

    this.currentGameNumber = gameNumber;

    // Subscribe to game-specific channels
    const gameChannels = [
      `/topic/game/${gameNumber}`,
      `/topic/game/${gameNumber}/chat`,
      `/topic/game/${gameNumber}/events`,
      `/topic/game/${gameNumber}/state`
    ];

    gameChannels.forEach(channel => {
      if (!this.subscriptions.has(channel)) {
        const subscription = this.client!.subscribe(channel, (message) => {
          this.handleIncomingMessage(channel, message);
        });
        this.subscriptions.set(channel, subscription);
      }
    });

    console.log(`Joined game room ${gameNumber}`);
  }

  leaveGameRoom(): void {
    if (this.currentGameNumber && this.client) {
      const gameChannels = [
        `/topic/game/${this.currentGameNumber}`,
        `/topic/game/${this.currentGameNumber}/chat`,
        `/topic/game/${this.currentGameNumber}/events`,
        `/topic/game/${this.currentGameNumber}/state`
      ];

      gameChannels.forEach(channel => {
        const subscription = this.subscriptions.get(channel);
        if (subscription) {
          subscription.unsubscribe();
          this.subscriptions.delete(channel);
        }
      });

      console.log(`Left game room ${this.currentGameNumber}`);
      this.currentGameNumber = null;
    }
  }

  sendGameMessage(type: string, payload: any, gameNumber?: number): void {
    if (!this.isConnected || !this.client) {
      throw new Error('WebSocket not connected');
    }

    const targetGame = gameNumber || this.currentGameNumber;
    if (!targetGame) {
      throw new Error('No game room specified');
    }

    const message = {
      type,
      gameNumber: targetGame,
      payload,
      timestamp: Date.now(),
      userId: this.currentUserId
    };

    const destination = `/app/game/${targetGame}/${type.toLowerCase()}`;

    try {
      this.client.publish({
        destination,
        body: JSON.stringify(message)
      });
      console.log(`Sent ${type} message to game ${targetGame}`);
    } catch (error) {
      console.error('Error sending game message:', error);
      throw new Error('Failed to send message');
    }
  }

  // ============= Message Sending =============

  sendChatMessage(message: string, gameNumber?: number): void {
    if (!message.trim()) return;

    const targetGame = gameNumber || this.currentGameNumber;
    if (!targetGame) {
      throw new Error('No game room specified');
    }

    this.sendGameMessage('CHAT', { message: message.trim() }, targetGame);
  }

  sendHint(hint: string, gameNumber?: number): void {
    this.sendGameMessage('HINT', { hint }, gameNumber);
  }

  sendVote(targetPlayerId: string, gameNumber?: number): void {
    this.sendGameMessage('VOTE', { targetPlayerId }, gameNumber);
  }

  sendDefense(defense: string, gameNumber?: number): void {
    this.sendGameMessage('DEFENSE', { defense }, gameNumber);
  }

  sendWordGuess(guess: string, gameNumber?: number): void {
    this.sendGameMessage('GUESS', { guess }, gameNumber);
  }

  onGameEvent(eventType: RealtimeEventType | 'ALL', callback: EventCallback): () => void {
    const handlers = this.eventCallbacks.get(eventType) || [];
    handlers.push(callback);
    this.eventCallbacks.set(eventType, handlers);

    // Return unsubscribe function
    return () => {
      const currentHandlers = this.eventCallbacks.get(eventType) || [];
      const index = currentHandlers.indexOf(callback);
      if (index > -1) {
        currentHandlers.splice(index, 1);
        if (currentHandlers.length === 0) {
          this.eventCallbacks.delete(eventType);
        } else {
          this.eventCallbacks.set(eventType, currentHandlers);
        }
      }
    };
  }

  // ============= Event Handler Registration =============

  onChatMessage(callback: ChatCallback): () => void {
    this.chatCallbacks.push(callback);

    return () => {
      const index = this.chatCallbacks.indexOf(callback);
      if (index > -1) {
        this.chatCallbacks.splice(index, 1);
      }
    };
  }

  onConnection(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.push(callback);

    return () => {
      const index = this.connectionCallbacks.indexOf(callback);
      if (index > -1) {
        this.connectionCallbacks.splice(index, 1);
      }
    };
  }

  onError(callback: ErrorCallback): () => void {
    this.errorCallbacks.push(callback);

    return () => {
      const index = this.errorCallbacks.indexOf(callback);
      if (index > -1) {
        this.errorCallbacks.splice(index, 1);
      }
    };
  }

  private handleDisconnection(): void {
    this.isConnected = false;
    this.isConnecting = false;
    this.stopHeartbeat();
    this.clearSubscriptions();
    this.notifyConnectionCallbacks(false);

    // Auto-reconnect logic
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect();
    } else {
      this.handleError(new Error('Max reconnection attempts reached'));
    }
  }

  // ============= Utility Methods =============

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      this.connect(this.currentUserId || undefined);
    }, delay);
  }

  private setupSubscriptions(): void {
    if (!this.client) return;

    // Global user-specific subscription
    if (this.currentUserId) {
      const userChannel = `/user/${this.currentUserId}/queue/messages`;
      if (!this.subscriptions.has(userChannel)) {
        const subscription = this.client.subscribe(userChannel, (message) => {
          this.handleIncomingMessage(userChannel, message);
        });
        this.subscriptions.set(userChannel, subscription);
      }
    }

    // Re-subscribe to current game room if exists
    if (this.currentGameNumber) {
      this.joinGameRoom(this.currentGameNumber);
    }
  }

  private handleIncomingMessage(channel: string, message: any): void {
    try {
      const data = JSON.parse(message.body);

      // Determine message type based on channel and content
      if (channel.includes('/chat')) {
        this.handleChatMessage(data);
      } else if (channel.includes('/events') || channel.includes('/game/')) {
        this.handleGameEvent(data);
      } else {
        // Generic event handling
        this.handleGameEvent(data);
      }
    } catch (error) {
      console.error('Error parsing incoming message:', error);
      this.handleError(new Error('Failed to parse incoming message'));
    }
  }

  private handleGameEvent(data: any): void {
    const event: GameEvent = {
      type: data.type || data.eventType,
      gameId: data.gameId,
      gameNumber: data.gameNumber || this.currentGameNumber || undefined,
      payload: data.payload || data,
      timestamp: data.timestamp || Date.now(),
      userId: data.userId
    };

    // Notify specific event handlers
    const specificHandlers = this.eventCallbacks.get(event.type) || [];
    specificHandlers.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in event callback:', error);
      }
    });

    // Notify general event handlers
    const generalHandlers = this.eventCallbacks.get('ALL') || [];
    generalHandlers.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in general event callback:', error);
      }
    });
  }

  private handleChatMessage(data: any): void {
    const message: ChatMessage = {
      id: data.id || `${Date.now()}-${Math.random()}`,
      gameId: data.gameId,
      gameNumber: data.gameNumber || this.currentGameNumber || undefined,
      playerId: data.playerId || data.userId,
      playerName: data.playerName || data.username,
      message: data.message || data.content,
      timestamp: data.timestamp || Date.now(),
      type: data.type || 'CHAT'
    };

    this.chatCallbacks.forEach(callback => {
      try {
        callback(message);
      } catch (error) {
        console.error('Error in chat callback:', error);
      }
    });
  }

  // ============= State Getters =============

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.client) {
        try {
          this.client.publish({
            destination: '/app/heartbeat',
            body: JSON.stringify({
              timestamp: Date.now(),
              userId: this.currentUserId,
              sessionId: this.sessionId
            })
          });
        } catch (error) {
          console.error('Heartbeat failed:', error);
        }
      }
    }, 30000); // Every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private clearSubscriptions(): void {
    this.subscriptions.forEach(subscription => {
      try {
        subscription.unsubscribe();
      } catch (error) {
        console.error('Error unsubscribing:', error);
      }
    });
    this.subscriptions.clear();
  }

  private notifyConnectionCallbacks(connected: boolean, error?: string): void {
    this.connectionCallbacks.forEach(callback => {
      try {
        callback(connected, error);
      } catch (error) {
        console.error('Error in connection callback:', error);
      }
    });
  }

  private handleError(error: Error): void {
    console.error('WebSocket service error:', error);
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (callbackError) {
        console.error('Error in error callback:', callbackError);
      }
    });
  }
}

// Export singleton instance
export const unifiedWebSocketService = UnifiedWebSocketService.getInstance();
export default unifiedWebSocketService;