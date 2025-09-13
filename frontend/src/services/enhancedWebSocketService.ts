/**
 * Enhanced Production-Ready WebSocket Service
 * Implements all required features with proper error handling, reconnection, and state management
 */

import {Client, IMessage, StompConfig} from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type {RealtimeEventType} from '../types/backendTypes';

// ============= Type Definitions =============

export interface WebSocketConfig {
  url?: string;
  reconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectDelay?: number;
  reconnectDecay?: number;
  maxReconnectAttempts?: number;
  heartbeatIncoming?: number;
  heartbeatOutgoing?: number;
  debug?: boolean;
  queueSize?: number;
  connectionTimeout?: number;
}

export interface GameEvent {
  type: RealtimeEventType | string;
  gameId?: string;
  gameNumber?: number;
  payload: any;
  timestamp: number;
  userId?: string | number;
  sequenceNumber?: number;
}

export interface ChatMessage {
  id: string;
  gameId?: string;
  gameNumber?: number;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
  type: 'CHAT' | 'SYSTEM' | 'HINT' | 'DEFENSE';
}

export interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';
  isAuthenticated: boolean;
  sessionId: string | null;
  userId: string | number | null;
  gameNumber: number | null;
  lastConnectedAt: Date | null;
  lastDisconnectedAt: Date | null;
  reconnectAttempts: number;
  totalReconnects: number;
  averageLatency: number;
  messagesSent: number;
  messagesReceived: number;
}

export interface MessageQueue {
  destination: string;
  body: any;
  headers?: Record<string, string>;
  timestamp: number;
  retries: number;
  id: string;
}

// Event handler types
type EventCallback = (event: GameEvent) => void;
type ChatCallback = (message: ChatMessage) => void;
type ConnectionCallback = (state: ConnectionState) => void;
type ErrorCallback = (error: Error, context?: string) => void;

// ============= Enhanced WebSocket Service =============

export class EnhancedWebSocketService {
  private static instance: EnhancedWebSocketService;
  private client: Client | null = null;
  private config: Required<WebSocketConfig>;
  
  // Connection state management
  private connectionState: ConnectionState = {
    status: 'disconnected',
    isAuthenticated: false,
    sessionId: null,
    userId: null,
    gameNumber: null,
    lastConnectedAt: null,
    lastDisconnectedAt: null,
    reconnectAttempts: 0,
    totalReconnects: 0,
    averageLatency: 0,
    messagesSent: 0,
    messagesReceived: 0
  };
  
  // Reconnection strategy
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectDelay = 1000;
  private connectionTimeout: NodeJS.Timeout | null = null;
  
  // Heartbeat management
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private lastHeartbeatSent: Date | null = null;
  private lastHeartbeatReceived: Date | null = null;
  private missedHeartbeats = 0;
  private maxMissedHeartbeats = 3;
  
  // Message queue for offline support
  private messageQueue: MessageQueue[] = [];
  private sequenceNumber = 0;
  private acknowledgments = new Map<string, NodeJS.Timeout>();
  
  // Event handlers
  private eventHandlers = new Map<RealtimeEventType | string, EventCallback[]>();
  private chatHandlers: ChatCallback[] = [];
  private connectionHandlers: ConnectionCallback[] = [];
  private errorHandlers: ErrorCallback[] = [];
  
  // Subscription management
  private subscriptions = new Map<string, any>();
  private subscribedChannels = new Set<string>();
  
  // Performance monitoring
  private latencyMeasurements: number[] = [];
  private maxLatencyMeasurements = 100;
  
  // Security
  private authToken: string | null = null;
  private refreshToken: string | null = null;
  
  private constructor(config?: WebSocketConfig) {
    this.config = {
      url: config?.url || this.getWebSocketUrl(),
      reconnect: config?.reconnect !== false,
      reconnectDelay: config?.reconnectDelay || 1000,
      maxReconnectDelay: config?.maxReconnectDelay || 30000,
      reconnectDecay: config?.reconnectDecay || 1.5,
      maxReconnectAttempts: config?.maxReconnectAttempts || 10,
      heartbeatIncoming: config?.heartbeatIncoming || 10000,
      heartbeatOutgoing: config?.heartbeatOutgoing || 10000,
      debug: config?.debug || false,
      queueSize: config?.queueSize || 100,
      connectionTimeout: config?.connectionTimeout || 15000
    };
    
    this.loadPersistedState();
    this.setupWindowHandlers();
  }
  
  static getInstance(config?: WebSocketConfig): EnhancedWebSocketService {
    if (!EnhancedWebSocketService.instance) {
      EnhancedWebSocketService.instance = new EnhancedWebSocketService(config);
    }
    return EnhancedWebSocketService.instance;
  }
  
  // ============= Connection Management =============
  
  async connect(userId?: string | number, authToken?: string): Promise<void> {
    if (this.connectionState.status === 'connected') {
      return Promise.resolve();
    }
    
    if (this.connectionState.status === 'connecting') {
      return this.waitForConnection();
    }
    
    this.updateConnectionState({ status: 'connecting', userId });
    
    if (authToken) {
      this.authToken = authToken;
    }
    
    return new Promise((resolve, reject) => {
      try {
        const socket = new SockJS(this.config.url);
        
        const stompConfig: StompConfig = {
          webSocketFactory: () => socket,
          connectHeaders: this.buildConnectHeaders(),
          heartbeatIncoming: this.config.heartbeatIncoming,
          heartbeatOutgoing: this.config.heartbeatOutgoing,
          reconnectDelay: 0, // We handle reconnection ourselves
          
          debug: (str: string) => {
            if (this.config.debug) {
              console.log('[WebSocket Debug]', str);
            }
          },
          
          onConnect: (frame) => {
            this.handleConnection(frame);
            resolve();
          },
          
          onDisconnect: (frame) => {
            this.handleDisconnection(frame);
          },
          
          onStompError: (frame) => {
            this.handleStompError(frame);
            reject(new Error(frame.headers.message || 'STOMP error'));
          },
          
          onWebSocketClose: (event) => {
            this.handleWebSocketClose(event);
          },
          
          onWebSocketError: (error) => {
            this.handleWebSocketError(error);
            reject(error);
          }
        };
        
        this.client = new Client(stompConfig);
        this.client.activate();
        
        // Set connection timeout
        this.connectionTimeout = setTimeout(() => {
          if (this.connectionState.status === 'connecting') {
            this.handleConnectionTimeout();
            reject(new Error('Connection timeout'));
          }
        }, this.config.connectionTimeout);
        
      } catch (error) {
        this.handleConnectionError(error as Error);
        reject(error);
      }
    });
  }
  
  disconnect(reason?: string): void {
    this.clearTimers();
    this.updateConnectionState({ 
      status: 'disconnected',
      lastDisconnectedAt: new Date()
    });
    
    if (this.client) {
      try {
        // Send disconnect message
        if (this.client.connected) {
          this.sendSystemMessage('CLIENT_DISCONNECT', { reason });
        }
        this.client.deactivate();
      } catch (error) {
        console.error('[WebSocket] Error during disconnect:', error);
      }
      this.client = null;
    }
    
    this.clearSubscriptions();
    this.persistState();
  }
  
  // ============= Game Room Management =============
  
  joinGameRoom(gameNumber: number): void {
    if (!this.isConnected()) {
      throw new Error('WebSocket not connected');
    }
    
    const previousGame = this.connectionState.gameNumber;
    if (previousGame && previousGame !== gameNumber) {
      this.leaveGameRoom();
    }
    
    this.updateConnectionState({ gameNumber });
    
    const channels = [
      `/topic/game/${gameNumber}`,
      `/topic/game/${gameNumber}/chat`,
      `/topic/game/${gameNumber}/events`,
      `/topic/game/${gameNumber}/state`,
      `/topic/game/${gameNumber}/timer`
    ];
    
    channels.forEach(channel => {
      this.subscribeToChannel(channel);
    });
    
    // Subscribe to user-specific channels
    if (this.connectionState.userId) {
      this.subscribeToChannel(`/user/${this.connectionState.userId}/queue/messages`);
      this.subscribeToChannel(`/user/${this.connectionState.userId}/queue/notifications`);
    }
    
    // Send join notification
    this.sendSystemMessage('PLAYER_JOINED', { gameNumber });
    
    console.log(`[WebSocket] Joined game room ${gameNumber}`);
  }
  
  leaveGameRoom(): void {
    const gameNumber = this.connectionState.gameNumber;
    if (!gameNumber) return;
    
    // Send leave notification
    this.sendSystemMessage('PLAYER_LEFT', { gameNumber });
    
    // Unsubscribe from game channels
    const channels = [
      `/topic/game/${gameNumber}`,
      `/topic/game/${gameNumber}/chat`,
      `/topic/game/${gameNumber}/events`,
      `/topic/game/${gameNumber}/state`,
      `/topic/game/${gameNumber}/timer`
    ];
    
    channels.forEach(channel => {
      this.unsubscribeFromChannel(channel);
    });
    
    this.updateConnectionState({ gameNumber: null });
    
    console.log(`[WebSocket] Left game room ${gameNumber}`);
  }
  
  // ============= Message Sending with Queue Support =============
  
  sendMessage(type: string, payload: any, options?: {
    destination?: string;
    priority?: number;
    requireAck?: boolean;
  }): string {
    const messageId = this.generateMessageId();
    const gameNumber = this.connectionState.gameNumber;
    
    if (!gameNumber && !options?.destination) {
      throw new Error('No game room or destination specified');
    }
    
    const destination = options?.destination || `/app/game/${gameNumber}/${type.toLowerCase()}`;
    const message: GameEvent = {
      type,
      gameNumber,
      payload,
      timestamp: Date.now(),
      userId: this.connectionState.userId,
      sequenceNumber: ++this.sequenceNumber
    };
    
    if (!this.isConnected()) {
      this.queueMessage(messageId, destination, message, options?.priority);
      return messageId;
    }
    
    try {
      this.client!.publish({
        destination,
        body: JSON.stringify(message),
        headers: {
          'message-id': messageId,
          'sequence-number': this.sequenceNumber.toString(),
          'require-ack': options?.requireAck ? 'true' : 'false'
        }
      });
      
      this.connectionState.messagesSent++;
      
      if (options?.requireAck) {
        this.setupAcknowledgmentTimeout(messageId, destination, message);
      }
      
      return messageId;
      
    } catch (error) {
      console.error('[WebSocket] Failed to send message:', error);
      this.queueMessage(messageId, destination, message, options?.priority);
      throw error;
    }
  }
  
  // Specific message type methods
  sendChatMessage(message: string): string {
    return this.sendMessage('CHAT', { message: message.trim() });
  }
  
  sendHint(hint: string): string {
    return this.sendMessage('HINT', { hint }, { requireAck: true });
  }
  
  sendVote(targetPlayerId: string | number): string {
    return this.sendMessage('VOTE', { targetPlayerId }, { requireAck: true });
  }
  
  sendDefense(defense: string): string {
    return this.sendMessage('DEFENSE', { defense }, { requireAck: true });
  }
  
  sendWordGuess(guess: string): string {
    return this.sendMessage('GUESS', { guess }, { requireAck: true });
  }
  
  // ============= Event Handler Registration =============
  
  onGameEvent(eventType: RealtimeEventType | string | 'ALL', callback: EventCallback): () => void {
    const handlers = this.eventHandlers.get(eventType) || [];
    handlers.push(callback);
    this.eventHandlers.set(eventType, handlers);
    
    return () => {
      const currentHandlers = this.eventHandlers.get(eventType) || [];
      const index = currentHandlers.indexOf(callback);
      if (index > -1) {
        currentHandlers.splice(index, 1);
        if (currentHandlers.length === 0) {
          this.eventHandlers.delete(eventType);
        } else {
          this.eventHandlers.set(eventType, currentHandlers);
        }
      }
    };
  }
  
  onChatMessage(callback: ChatCallback): () => void {
    this.chatHandlers.push(callback);
    return () => {
      const index = this.chatHandlers.indexOf(callback);
      if (index > -1) {
        this.chatHandlers.splice(index, 1);
      }
    };
  }
  
  onConnectionChange(callback: ConnectionCallback): () => void {
    this.connectionHandlers.push(callback);
    // Immediately call with current state
    callback(this.connectionState);
    return () => {
      const index = this.connectionHandlers.indexOf(callback);
      if (index > -1) {
        this.connectionHandlers.splice(index, 1);
      }
    };
  }
  
  onError(callback: ErrorCallback): () => void {
    this.errorHandlers.push(callback);
    return () => {
      const index = this.errorHandlers.indexOf(callback);
      if (index > -1) {
        this.errorHandlers.splice(index, 1);
      }
    };
  }
  
  // ============= Private Methods =============
  
  isConnected(): boolean {
    return this.connectionState.status === 'connected' && this.client?.connected === true;
  }
  
  getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }
  
  getSessionId(): string | null {
    return this.connectionState.sessionId;
  }
  
  getUserId(): string | number | null {
    return this.connectionState.userId;
  }
  
  getGameNumber(): number | null {
    return this.connectionState.gameNumber;
  }
  
  getLatency(): number {
    return this.connectionState.averageLatency;
  }
  
  getQueueSize(): number {
    return this.messageQueue.length;
  }
  
  // ============= Reconnection Strategy with Exponential Backoff =============
  
  getStatistics(): {
    messagesSent: number;
    messagesReceived: number;
    reconnects: number;
    uptime: number;
    latency: number;
  } {
    const uptime = this.connectionState.lastConnectedAt
      ? Date.now() - this.connectionState.lastConnectedAt.getTime()
      : 0;

    return {
      messagesSent: this.connectionState.messagesSent,
      messagesReceived: this.connectionState.messagesReceived,
      reconnects: this.connectionState.totalReconnects,
      uptime,
      latency: this.connectionState.averageLatency
    };
  }
  
  private handleConnection(frame: any): void {
    clearTimeout(this.connectionTimeout!);

    const sessionId = frame.headers['session-id'] || frame.headers['session'];

    this.updateConnectionState({
      status: 'connected',
      isAuthenticated: true,
      sessionId,
      lastConnectedAt: new Date(),
      reconnectAttempts: 0
    });

    // Store session for reconnection
    this.storeSessionId(sessionId);

    // Restore subscriptions
    this.restoreSubscriptions();

    // Flush message queue
    this.flushMessageQueue();

    // Start heartbeat monitoring
    this.startHeartbeatMonitoring();

    console.log('[WebSocket] Connected successfully:', sessionId);
  }
  
  // ============= Heartbeat and Health Monitoring =============
  
  private handleDisconnection(frame?: any): void {
    const wasConnected = this.connectionState.status === 'connected';

    this.updateConnectionState({
      status: 'disconnected',
      lastDisconnectedAt: new Date()
    });

    this.stopHeartbeatMonitoring();

    if (wasConnected && this.config.reconnect) {
      this.scheduleReconnection();
    }

    console.log('[WebSocket] Disconnected:', frame?.headers?.message);
  }
  
  private handleStompError(frame: any): void {
    const error = new Error(`STOMP Error: ${frame.headers.message || 'Unknown error'}`);
    this.notifyError(error, 'STOMP');

    // Check if it's an authentication error
    if (frame.headers.message?.includes('401') || frame.headers.message?.includes('Unauthorized')) {
      this.updateConnectionState({ isAuthenticated: false });
      this.refreshAuthentication();
    }
  }
  
  private handleWebSocketClose(event: CloseEvent): void {
    console.log('[WebSocket] Connection closed:', event.code, event.reason);

    if (event.code === 1006) {
      // Abnormal closure
      this.notifyError(new Error('WebSocket connection lost'), 'CONNECTION');
    }

    this.handleDisconnection();
  }
  
  private handleWebSocketError(error: Event): void {
    console.error('[WebSocket] Connection error:', error);
    this.notifyError(new Error('WebSocket connection error'), 'CONNECTION');
  }
  
  private handleConnectionTimeout(): void {
    this.updateConnectionState({ status: 'error' });
    this.notifyError(new Error('Connection timeout'), 'TIMEOUT');

    if (this.config.reconnect) {
      this.scheduleReconnection();
    }
  }
  
  private handleConnectionError(error: Error): void {
    this.updateConnectionState({ status: 'error' });
    this.notifyError(error, 'CONNECTION');
  }
  
  // ============= Message Queue Management =============
  
  private scheduleReconnection(): void {
    if (this.connectionState.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.notifyError(new Error('Max reconnection attempts reached'), 'RECONNECTION');
      this.updateConnectionState({ status: 'error' });
      return;
    }

    const delay = this.calculateReconnectDelay();

    this.updateConnectionState({
      status: 'reconnecting',
      reconnectAttempts: this.connectionState.reconnectAttempts + 1
    });

    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.connectionState.reconnectAttempts}/${this.config.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect(this.connectionState.userId || undefined, this.authToken || undefined)
        .then(() => {
          this.updateConnectionState({ totalReconnects: this.connectionState.totalReconnects + 1 });
        })
        .catch(error => {
          console.error('[WebSocket] Reconnection failed:', error);
        });
    }, delay);
  }
  
  private calculateReconnectDelay(): number {
    const attempt = this.connectionState.reconnectAttempts;
    const baseDelay = this.config.reconnectDelay;
    const maxDelay = this.config.maxReconnectDelay;
    const decay = this.config.reconnectDecay;

    // Exponential backoff with jitter
    const exponentialDelay = Math.min(baseDelay * Math.pow(decay, attempt), maxDelay);
    const jitter = Math.random() * 0.3 * exponentialDelay; // Add 0-30% jitter

    return Math.floor(exponentialDelay + jitter);
  }
  
  // ============= Subscription Management =============
  
  private startHeartbeatMonitoring(): void {
    this.stopHeartbeatMonitoring();

    // Send periodic heartbeats
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, this.config.heartbeatOutgoing);

    // Check for missed heartbeats
    setInterval(() => {
      this.checkHeartbeatHealth();
    }, this.config.heartbeatIncoming * 2);
  }
  
  private stopHeartbeatMonitoring(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
  
  private sendHeartbeat(): void {
    if (!this.isConnected()) return;

    const heartbeatId = this.generateMessageId();
    const timestamp = Date.now();

    try {
      this.client!.publish({
        destination: '/app/heartbeat',
        body: JSON.stringify({
          id: heartbeatId,
          timestamp,
          sessionId: this.connectionState.sessionId,
          userId: this.connectionState.userId,
          gameNumber: this.connectionState.gameNumber
        }),
        headers: { 'heartbeat-id': heartbeatId }
      });

      this.lastHeartbeatSent = new Date();

      // Measure latency when response arrives
      this.acknowledgments.set(heartbeatId, setTimeout(() => {
        this.acknowledgments.delete(heartbeatId);
      }, 5000));

    } catch (error) {
      console.error('[WebSocket] Failed to send heartbeat:', error);
      this.missedHeartbeats++;
    }
  }
  
  private checkHeartbeatHealth(): void {
    if (!this.lastHeartbeatReceived) return;

    const timeSinceLastHeartbeat = Date.now() - this.lastHeartbeatReceived.getTime();
    const threshold = this.config.heartbeatIncoming * this.maxMissedHeartbeats;

    if (timeSinceLastHeartbeat > threshold) {
      console.warn('[WebSocket] Heartbeat timeout detected');
      this.handleHeartbeatTimeout();
    }
  }
  
  // ============= Message Handling =============
  
  private handleHeartbeatTimeout(): void {
    this.notifyError(new Error('Heartbeat timeout'), 'HEARTBEAT');

    // Force reconnection
    if (this.client) {
      this.client.deactivate();
    }

    this.handleDisconnection();
  }
  
  private handleHeartbeatResponse(heartbeatId: string, timestamp: number): void {
    this.lastHeartbeatReceived = new Date();
    this.missedHeartbeats = 0;

    // Calculate latency
    const latency = Date.now() - timestamp;
    this.updateLatency(latency);

    // Clear acknowledgment timeout
    const timeout = this.acknowledgments.get(heartbeatId);
    if (timeout) {
      clearTimeout(timeout);
      this.acknowledgments.delete(heartbeatId);
    }
  }
  
  private queueMessage(id: string, destination: string, body: any, priority: number = 0): void {
    if (this.messageQueue.length >= this.config.queueSize) {
      // Remove oldest low-priority message
      const lowestPriorityIndex = this.messageQueue.reduce((minIdx, msg, idx, arr) =>
        msg.retries > arr[minIdx].retries ? idx : minIdx, 0);
      this.messageQueue.splice(lowestPriorityIndex, 1);
    }

    this.messageQueue.push({
      id,
      destination,
      body,
      timestamp: Date.now(),
      retries: 0,
      headers: { priority: priority.toString() }
    });

    // Persist queue for offline support
    this.persistMessageQueue();
  }
  
  private flushMessageQueue(): void {
    if (!this.isConnected() || this.messageQueue.length === 0) return;

    console.log(`[WebSocket] Flushing ${this.messageQueue.length} queued messages`);

    const queue = [...this.messageQueue];
    this.messageQueue = [];

    // Sort by priority and timestamp
    queue.sort((a, b) => {
      const priorityA = parseInt(a.headers?.priority || '0');
      const priorityB = parseInt(b.headers?.priority || '0');
      if (priorityA !== priorityB) return priorityB - priorityA;
      return a.timestamp - b.timestamp;
    });

    queue.forEach(message => {
      try {
        this.client!.publish({
          destination: message.destination,
          body: JSON.stringify(message.body),
          headers: {
            ...message.headers,
            'queued-at': message.timestamp.toString(),
            'message-id': message.id
          }
        });

        this.connectionState.messagesSent++;

      } catch (error) {
        console.error('[WebSocket] Failed to send queued message:', error);

        // Re-queue if not exceeded max retries
        if (message.retries < 3) {
          message.retries++;
          this.messageQueue.push(message);
        }
      }
    });

    this.persistMessageQueue();
  }
  
  private subscribeToChannel(channel: string): void {
    if (!this.isConnected() || this.subscriptions.has(channel)) return;

    try {
      const subscription = this.client!.subscribe(channel, (message: IMessage) => {
        this.handleIncomingMessage(channel, message);
      });

      this.subscriptions.set(channel, subscription);
      this.subscribedChannels.add(channel);

      console.log(`[WebSocket] Subscribed to ${channel}`);

    } catch (error) {
      console.error(`[WebSocket] Failed to subscribe to ${channel}:`, error);
      this.notifyError(error as Error, 'SUBSCRIPTION');
    }
  }
  
  // ============= State Management =============
  
  private unsubscribeFromChannel(channel: string): void {
    const subscription = this.subscriptions.get(channel);
    if (subscription) {
      try {
        subscription.unsubscribe();
        this.subscriptions.delete(channel);
        this.subscribedChannels.delete(channel);
        console.log(`[WebSocket] Unsubscribed from ${channel}`);
      } catch (error) {
        console.error(`[WebSocket] Failed to unsubscribe from ${channel}:`, error);
      }
    }
  }
  
  private restoreSubscriptions(): void {
    if (this.subscribedChannels.size === 0) return;

    console.log(`[WebSocket] Restoring ${this.subscribedChannels.size} subscriptions`);

    const channels = Array.from(this.subscribedChannels);
    this.subscribedChannels.clear();
    this.subscriptions.clear();

    channels.forEach(channel => {
      this.subscribeToChannel(channel);
    });

    // Re-join game room if was in one
    if (this.connectionState.gameNumber) {
      this.joinGameRoom(this.connectionState.gameNumber);
    }
  }
  
  // ============= Persistence =============
  
  private clearSubscriptions(): void {
    this.subscriptions.forEach((subscription, channel) => {
      try {
        subscription.unsubscribe();
      } catch (error) {
        console.error(`[WebSocket] Error unsubscribing from ${channel}:`, error);
      }
    });

    this.subscriptions.clear();
    this.subscribedChannels.clear();
  }
  
  private handleIncomingMessage(channel: string, message: IMessage): void {
    this.connectionState.messagesReceived++;

    try {
      const data = JSON.parse(message.body);

      // Handle heartbeat responses
      if (message.headers['heartbeat-id']) {
        this.handleHeartbeatResponse(
          message.headers['heartbeat-id'],
          data.timestamp
        );
        return;
      }

      // Handle acknowledgments
      if (message.headers['ack-for']) {
        this.handleAcknowledgment(message.headers['ack-for']);
        return;
      }

      // Route message based on channel
      if (channel.includes('/chat')) {
        this.handleChatMessage(data);
      } else if (channel.includes('/events') || channel.includes('/state')) {
        this.handleGameEvent(data);
      } else if (channel.includes('/notifications')) {
        this.handleNotification(data);
      } else {
        // Generic event handling
        this.handleGameEvent(data);
      }

    } catch (error) {
      console.error('[WebSocket] Error parsing message:', error);
      this.notifyError(error as Error, 'MESSAGE_PARSING');
    }
  }
  
  private handleGameEvent(data: any): void {
    const event: GameEvent = {
      type: data.type || data.eventType || 'UNKNOWN',
      gameId: data.gameId,
      gameNumber: data.gameNumber || this.connectionState.gameNumber || undefined,
      payload: data.payload || data,
      timestamp: data.timestamp || Date.now(),
      userId: data.userId,
      sequenceNumber: data.sequenceNumber
    };

    // Notify specific event handlers
    const specificHandlers = this.eventHandlers.get(event.type) || [];
    specificHandlers.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('[WebSocket] Error in event callback:', error);
      }
    });

    // Notify general event handlers
    const generalHandlers = this.eventHandlers.get('ALL') || [];
    generalHandlers.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('[WebSocket] Error in general event callback:', error);
      }
    });
  }
  
  private handleChatMessage(data: any): void {
    const message: ChatMessage = {
      id: data.id || `${Date.now()}-${Math.random()}`,
      gameId: data.gameId,
      gameNumber: data.gameNumber || this.connectionState.gameNumber || undefined,
      playerId: String(data.playerId || data.userId),
      playerName: data.playerName || data.nickname || 'Unknown',
      message: data.message || data.content || '',
      timestamp: data.timestamp || Date.now(),
      type: data.type || 'CHAT'
    };

    this.chatHandlers.forEach(callback => {
      try {
        callback(message);
      } catch (error) {
        console.error('[WebSocket] Error in chat callback:', error);
      }
    });
  }
  
  private handleNotification(data: any): void {
    // Create a special event for notifications
    const event: GameEvent = {
      type: 'NOTIFICATION',
      gameNumber: this.connectionState.gameNumber || undefined,
      payload: data,
      timestamp: Date.now(),
      userId: this.connectionState.userId
    };

    this.handleGameEvent(event);
  }
  
  private handleAcknowledgment(messageId: string): void {
    const timeout = this.acknowledgments.get(messageId);
    if (timeout) {
      clearTimeout(timeout);
      this.acknowledgments.delete(messageId);
    }
  }
  
  // ============= Utility Methods =============
  
  private updateConnectionState(updates: Partial<ConnectionState>): void {
    this.connectionState = { ...this.connectionState, ...updates };

    // Notify connection handlers
    this.connectionHandlers.forEach(callback => {
      try {
        callback(this.connectionState);
      } catch (error) {
        console.error('[WebSocket] Error in connection callback:', error);
      }
    });

    // Persist state for recovery
    this.persistState();
  }
  
  private updateLatency(latency: number): void {
    this.latencyMeasurements.push(latency);

    if (this.latencyMeasurements.length > this.maxLatencyMeasurements) {
      this.latencyMeasurements.shift();
    }

    // Calculate average latency
    const average = this.latencyMeasurements.reduce((sum, val) => sum + val, 0) /
                    this.latencyMeasurements.length;

    this.updateConnectionState({ averageLatency: Math.round(average) });
  }
  
  private persistState(): void {
    try {
      const state = {
        sessionId: this.connectionState.sessionId,
        userId: this.connectionState.userId,
        gameNumber: this.connectionState.gameNumber,
        subscribedChannels: Array.from(this.subscribedChannels)
      };

      localStorage.setItem('websocket-state', JSON.stringify(state));
    } catch (error) {
      console.error('[WebSocket] Failed to persist state:', error);
    }
  }
  
  private loadPersistedState(): void {
    try {
      const stored = localStorage.getItem('websocket-state');
      if (stored) {
        const state = JSON.parse(stored);

        if (state.sessionId) {
          this.connectionState.sessionId = state.sessionId;
        }

        if (state.userId) {
          this.connectionState.userId = state.userId;
        }

        if (state.gameNumber) {
          this.connectionState.gameNumber = state.gameNumber;
        }

        if (state.subscribedChannels) {
          state.subscribedChannels.forEach((channel: string) => {
            this.subscribedChannels.add(channel);
          });
        }
      }
    } catch (error) {
      console.error('[WebSocket] Failed to load persisted state:', error);
    }
  }
  
  private persistMessageQueue(): void {
    try {
      localStorage.setItem('websocket-queue', JSON.stringify(this.messageQueue));
    } catch (error) {
      console.error('[WebSocket] Failed to persist message queue:', error);
    }
  }
  
  private loadPersistedQueue(): void {
    try {
      const stored = localStorage.getItem('websocket-queue');
      if (stored) {
        this.messageQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[WebSocket] Failed to load persisted queue:', error);
    }
  }
  
  private storeSessionId(sessionId: string): void {
    try {
      localStorage.setItem('websocket-session-id', sessionId);
    } catch (error) {
      console.error('[WebSocket] Failed to store session ID:', error);
    }
  }
  
  private getStoredSessionId(): string | null {
    try {
      return localStorage.getItem('websocket-session-id');
    } catch {
      return null;
    }
  }
  
  private buildConnectHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    // Add authentication token
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    // Add user ID
    if (this.connectionState.userId) {
      headers['userId'] = String(this.connectionState.userId);
    }

    // Add session ID for reconnection
    const oldSessionId = this.getStoredSessionId();
    if (oldSessionId && oldSessionId !== this.connectionState.sessionId) {
      headers['x-old-session-id'] = oldSessionId;
    }

    // Add client version for compatibility
    headers['client-version'] = '1.0.0';

    return headers;
  }
  
  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // ============= Public Getters =============
  
  private getWebSocketUrl(): string {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:20021';
    return `${baseUrl}/ws`;
  }
  
  private waitForConnection(timeout: number = 10000): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const checkConnection = () => {
        if (this.connectionState.status === 'connected') {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Connection timeout'));
        } else if (this.connectionState.status === 'error') {
          reject(new Error('Connection failed'));
        } else {
          setTimeout(checkConnection, 100);
        }
      };

      checkConnection();
    });
  }
  
  private sendSystemMessage(type: string, payload: any): void {
    try {
      if (this.isConnected() && this.client) {
        this.client.publish({
          destination: '/app/system',
          body: JSON.stringify({
            type,
            payload,
            timestamp: Date.now(),
            sessionId: this.connectionState.sessionId,
            userId: this.connectionState.userId
          })
        });
      }
    } catch (error) {
      console.error('[WebSocket] Failed to send system message:', error);
    }
  }
  
  private setupAcknowledgmentTimeout(messageId: string, destination: string, message: any): void {
    const timeout = setTimeout(() => {
      this.acknowledgments.delete(messageId);
      console.warn(`[WebSocket] Message ${messageId} not acknowledged, retrying...`);

      // Retry the message
      this.queueMessage(messageId, destination, message, 1);
      this.flushMessageQueue();
    }, 5000);

    this.acknowledgments.set(messageId, timeout);
  }
  
  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    this.stopHeartbeatMonitoring();

    // Clear all acknowledgment timers
    this.acknowledgments.forEach(timeout => clearTimeout(timeout));
    this.acknowledgments.clear();
  }
  
  private setupWindowHandlers(): void {
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Page is hidden, reduce heartbeat frequency
        this.stopHeartbeatMonitoring();
      } else {
        // Page is visible, restore heartbeat
        if (this.isConnected()) {
          this.startHeartbeatMonitoring();
          this.sendHeartbeat();
        }
      }
    });

    // Handle online/offline events
    window.addEventListener('online', () => {
      console.log('[WebSocket] Network online');
      if (!this.isConnected() && this.config.reconnect) {
        this.connect(this.connectionState.userId || undefined);
      }
    });

    window.addEventListener('offline', () => {
      console.log('[WebSocket] Network offline');
      this.notifyError(new Error('Network offline'), 'NETWORK');
    });

    // Handle page unload
    window.addEventListener('beforeunload', () => {
      this.disconnect('Page unload');
    });
  }
  
  private notifyError(error: Error, context?: string): void {
    console.error(`[WebSocket] ${context || 'Error'}:`, error);

    this.errorHandlers.forEach(callback => {
      try {
        callback(error, context);
      } catch (callbackError) {
        console.error('[WebSocket] Error in error callback:', callbackError);
      }
    });
  }
  
  private async refreshAuthentication(): Promise<void> {
    // Attempt to refresh the authentication token
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken: this.refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        this.authToken = data.token;
        this.refreshToken = data.refreshToken;

        // Reconnect with new token
        this.disconnect();
        await this.connect(this.connectionState.userId || undefined, this.authToken);
      } else {
        this.notifyError(new Error('Authentication refresh failed'), 'AUTH');
      }
    } catch (error) {
      this.notifyError(error as Error, 'AUTH_REFRESH');
    }
  }
}

// Export singleton instance
export const enhancedWebSocketService = EnhancedWebSocketService.getInstance();
export default enhancedWebSocketService;