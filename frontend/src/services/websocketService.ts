import SockJS from 'sockjs-client';
import type {IMessage} from '@stomp/stompjs';
import {Client, StompConfig} from '@stomp/stompjs';
import {toast} from 'sonner';
import type {
    ChatCallback,
    ChatMessage,
    ChatMessageType,
    ConnectionCallback,
    EventCallback,
    GameEvent,
    LobbyUpdate,
    LobbyUpdateCallback
} from '@/types/realtime';

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
  gameId?: string;
  userId?: string;
}

interface RawWebSocketPayload {
  type: 'event' | 'chat' | 'notification' | 'system' | 'lobby';
  data: any;
  receivedAt: number;
  destination?: string;
}

type RawListener = (payload: RawWebSocketPayload) => void;

class WebSocketService {
  private client: Client | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseReconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private connectionTimeout = 15000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private currentGameId: string | null = null;

  // Callback handlers
  private eventCallbacks: Map<string, EventCallback[]> = new Map();
  private chatCallbacks: ChatCallback[] = [];
  private connectionCallbacks: ConnectionCallback[] = [];
  private lobbyCallbacks: LobbyUpdateCallback[] = [];
  private readonly lobbySubscriptionKey = 'lobby';

  // Subscription management
  private subscriptions: Map<string, any> = new Map();
  private messageQueue: { id: string; destination: string; body: any; attempts: number; timestamp: number }[] = [];
  private maxQueue = 100;
  private maxMessageAttempts = 3;
  private outboundListeners: ((msg: { destination: string; body: any; sentAt: number }) => void)[] = [];
  private rawListeners: RawListener[] = [];
  private pingInterval: NodeJS.Timeout | null = null;
  private lastPongReceived = Date.now();
  private connectionState: 'connecting' | 'connected' | 'disconnected' | 'reconnecting' = 'disconnected';

  constructor() {
    this.setupClient();
  }

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connectionState === 'connected') {
        resolve();
        return;
      }

      if (this.connectionState === 'connecting') {
        // Wait for current connection attempt
        const checkConnection = () => {
          if (this.connectionState === 'connected') {
            resolve();
          } else if (this.connectionState === 'disconnected') {
            reject(new Error('Connection failed'));
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
        return;
      }

      this.connectionState = 'connecting';

      const timeout = setTimeout(() => {
        if (this.connectionState === 'connecting') {
          this.connectionState = 'disconnected';
          reject(new Error('Connection timeout'));
        }
      }, this.connectionTimeout);

      const onConnect = (connected: boolean) => {
        clearTimeout(timeout);
        this.removeConnectionCallback(onConnect);
        if (connected) {
          resolve();
        } else {
          reject(new Error('Connection failed'));
        }
      };

      this.addConnectionCallback(onConnect);

      if (this.client) {
        this.client.activate();
      } else {
        this.setupClient();
        if (this.client) {
          this.client.activate();
        }
      }
    });
  }

  public disconnect(): void {
    this.connectionState = 'disconnected';
    
    // Clear heartbeat intervals
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    // Clean up subscriptions
    this.subscriptions.forEach((subscription, key) => {
      try {
        subscription.unsubscribe();
      } catch (error) {
        console.warn(`Error unsubscribing from ${key}:`, error);
      }
    });
    this.subscriptions.clear();

    // Deactivate client
    if (this.client) {
      try {
        this.client.deactivate();
      } catch (error) {
        console.warn('Error deactivating WebSocket client:', error);
      }
    }
    
    this.isConnected = false;
    this.currentGameId = null;
    this.reconnectAttempts = 0;
    
    // Clear callbacks and queues
    this.eventCallbacks.clear();
    this.chatCallbacks = [];
    this.connectionCallbacks = [];
    this.rawListeners = [];
    this.messageQueue = [];
    
    console.log('WebSocket service disconnected and cleaned up');
  }

  public subscribeToGame(gameId: string, userId?: string): void {
    if (!this.isConnected || !this.client) {
      console.warn('Cannot subscribe - WebSocket not connected');
      return;
    }

    this.currentGameId = gameId;

    // Subscribe to game state changes
    const gameStateSub = this.client.subscribe(
      `/topic/game/${gameId}/state`,
      this.handleGameEvent.bind(this)
    );
    this.subscriptions.set(`game-state-${gameId}`, gameStateSub);

    // Subscribe to game events (실시간 이벤트)
    const gameEventSub = this.client.subscribe(
      `/topic/game/${gameId}/events`,
      this.handleGameEvent.bind(this)
    );
    this.subscriptions.set(`game-events-${gameId}`, gameEventSub);

    // Subscribe to chat messages
    const chatTopic = `/topic/chat.${gameId}`;
    const chatSub = this.client.subscribe(
      chatTopic,
      this.handleChatMessage.bind(this)
    );
    this.subscriptions.set(`chat-${gameId}`, chatSub);

    // Legacy fallback subscription for older broker routes
    const legacyChatTopic = `/topic/game/${gameId}/chat`;
    const legacyChatSub = this.client.subscribe(
      legacyChatTopic,
      this.handleChatMessage.bind(this)
    );
    this.subscriptions.set(`chat-legacy-${gameId}`, legacyChatSub);

    // Subscribe to personal notifications if userId provided
    if (userId) {
      const notificationSub = this.client.subscribe(
        `/topic/user/${userId}/notifications`,
        this.handlePersonalNotification.bind(this)
      );
      this.subscriptions.set(`notifications-${userId}`, notificationSub);
    }

    console.log(`Subscribed to game: ${gameId}`);
  }

  public unsubscribeFromGame(gameId: string, userId?: string): void {
    // Unsubscribe from game state
    const gameStateSub = this.subscriptions.get(`game-state-${gameId}`);
    if (gameStateSub) {
      gameStateSub.unsubscribe();
      this.subscriptions.delete(`game-state-${gameId}`);
    }

    // Unsubscribe from game events
    const gameEventSub = this.subscriptions.get(`game-events-${gameId}`);
    if (gameEventSub) {
      gameEventSub.unsubscribe();
      this.subscriptions.delete(`game-events-${gameId}`);
    }

    // Unsubscribe from chat
    const chatSub = this.subscriptions.get(`chat-${gameId}`);
    if (chatSub) {
      chatSub.unsubscribe();
      this.subscriptions.delete(`chat-${gameId}`);
    }
    const legacyChatSub = this.subscriptions.get(`chat-legacy-${gameId}`);
    if (legacyChatSub) {
      legacyChatSub.unsubscribe();
      this.subscriptions.delete(`chat-legacy-${gameId}`);
    }

    // Unsubscribe from personal notifications
    if (userId) {
      const notificationSub = this.subscriptions.get(`notifications-${userId}`);
      if (notificationSub) {
        notificationSub.unsubscribe();
        this.subscriptions.delete(`notifications-${userId}`);
      }
    }

    if (this.currentGameId === gameId) {
      this.currentGameId = null;
    }

    console.log(`Unsubscribed from game: ${gameId}`);
  }

  // Event subscription methods
  public onGameEvent(eventType: string, callback: EventCallback): () => void {
    if (!this.eventCallbacks.has(eventType)) {
      this.eventCallbacks.set(eventType, []);
    }
    this.eventCallbacks.get(eventType)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.eventCallbacks.get(eventType);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  public onChatMessage(callback: ChatCallback): () => void {
    this.chatCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.chatCallbacks.indexOf(callback);
      if (index > -1) {
        this.chatCallbacks.splice(index, 1);
      }
    };
  }

  public onLobbyUpdate(callback: LobbyUpdateCallback): () => void {
    this.lobbyCallbacks.push(callback);

    if (this.isConnected) {
      this.subscribeToLobby();
    }

    return () => {
      this.lobbyCallbacks = this.lobbyCallbacks.filter(cb => cb !== callback);
      if (this.lobbyCallbacks.length === 0) {
        const subscription = this.subscriptions.get(this.lobbySubscriptionKey);
        if (subscription) {
          try {
            subscription.unsubscribe();
          } catch (error) {
            console.warn('Error unsubscribing from lobby updates:', error);
          }
          this.subscriptions.delete(this.lobbySubscriptionKey);
        }
      }
    };
  }

  public ensureLobbySubscription(): void {
    if (this.isConnected) {
      this.subscribeToLobby();
    }
  }

  public addConnectionCallback(callback: ConnectionCallback): void {
    this.connectionCallbacks.push(callback);
  }

  public removeConnectionCallback(callback: ConnectionCallback): void {
    const index = this.connectionCallbacks.indexOf(callback);
    if (index > -1) {
      this.connectionCallbacks.splice(index, 1);
    }
  }

  public registerRawListener(listener: RawListener): () => void {
    this.rawListeners.push(listener);
    return () => {
      this.rawListeners = this.rawListeners.filter(l => l !== listener);
    };
  }

  private notifyRawListeners(payload: RawWebSocketPayload): void {
    if (!this.rawListeners.length) return;
    for (const listener of this.rawListeners) {
      try {
        listener(payload);
      } catch (error) {
        console.error('Raw listener error:', error);
      }
    }
  }

  private subscribeToLobby(): void {
    if (!this.client || this.lobbyCallbacks.length === 0) {
      return;
    }

    const existing = this.subscriptions.get(this.lobbySubscriptionKey);
    if (existing) {
      try {
        existing.unsubscribe();
      } catch (error) {
        console.warn('Error unsubscribing existing lobby listener:', error);
      }
      this.subscriptions.delete(this.lobbySubscriptionKey);
    }

    const subscription = this.client.subscribe('/topic/lobby', this.handleLobbyMessage.bind(this));
    this.subscriptions.set(this.lobbySubscriptionKey, subscription);
    console.log('Subscribed to lobby updates');
  }

  public safePublish(destination: string, body: any): string | undefined {
    if (!this.isConnected || !this.client) {
      return this.queueMessage(destination, body);
    }
    try {
      this.client.publish({ destination, body: JSON.stringify(body) });
      this.outboundListeners.forEach(l => l({ destination, body, sentAt: Date.now() }));
      return undefined;
    } catch (error) {
      console.warn('Failed to publish immediately, queueing message', { destination, error });
      return this.queueMessage(destination, body);
    }
  }

  public sendChatMessage(
    gameId: string,
    message: string,
    options?: { nickname?: string; type?: ChatMessageType }
  ): void {
    const normalizedType: ChatMessageType = options?.type ?? 'DISCUSSION';
    const payload: Record<string, unknown> = {
      gameNumber: Number(gameId),
      content: message,
      type: normalizedType,
    };

    if (options?.nickname) {
      payload.playerNickname = options.nickname;
    }

    if (!this.isConnected || !this.client) {
      toast.error('실시간 연결이 필요합니다');
      this.safePublish('/app/chat.send', payload);
      return;
    }

    this.client.publish({ destination: '/app/chat.send', body: JSON.stringify(payload) });
  }

  public sendGameAction(gameId: string, action: string, payload: any = {}): void {
    if (!this.isConnected || !this.client) {
      toast.error('실시간 연결이 필요합니다');
      this.safePublish(`/app/game/${gameId}/${action}`, payload);
      return;
    }
    this.client.publish({ destination: `/app/game/${gameId}/${action}`, body: JSON.stringify(payload) });
  }

  public sendTopicGuess(gameId: string, guess: string): void {
    this.sendGameAction(gameId, 'guess-topic', { guess });
  }

  public getConnectionState(): string {
    return this.connectionState;
  }

  // 게임 플로우 관련 특화 메서드들
  public sendHint(gameId: string, hint: string): void {
    this.sendGameAction(gameId, 'hint', { hint });
  }

  public sendVote(gameId: string, targetUserId: number): void {
    this.sendGameAction(gameId, 'vote', { targetUserId });
  }

  public sendDefense(gameId: string, defenseText: string): void {
    this.sendGameAction(gameId, 'defense', { defenseText });
  }

  public sendFinalVote(gameId: string, voteForExecution: boolean): void {
    this.sendGameAction(gameId, 'final-vote', { voteForExecution });
  }

  public sendWordGuess(gameId: string, guess: string): void {
    this.sendGameAction(gameId, 'guess', { guess });
  }

  public getQueuedMessageCount(): number {
    return this.messageQueue.length;
  }

  public sendEndDefense(gameId: string): void {
    this.sendGameAction(gameId, 'end-defense', {});
  }

  public sendEndRound(gameId: string): void {
    this.sendGameAction(gameId, 'end-round', {});
  }

  // 게임 플로우 이벤트 구독 헬퍼 메서드들
  public onHintProvided(callback: (event: GameEvent) => void): () => void {
    return this.onGameEvent('HINT_PROVIDED', callback);
  }

  public onVoteCast(callback: (event: GameEvent) => void): () => void {
    return this.onGameEvent('VOTE_CAST', callback);
  }

  public onDefenseSubmitted(callback: (event: GameEvent) => void): () => void {
    return this.onGameEvent('DEFENSE_SUBMITTED', callback);
  }

  public onPhaseChanged(callback: (event: GameEvent) => void): () => void {
    return this.onGameEvent('PHASE_CHANGED', callback);
  }

  public onTimerUpdate(callback: (event: GameEvent) => void): () => void {
    return this.onGameEvent('TIMER_UPDATE', callback);
  }

  public onGameStateUpdate(callback: (event: GameEvent) => void): () => void {
    return this.onGameEvent('GAME_STATE_UPDATED', callback);
  }

  public onRoundEnded(callback: (event: GameEvent) => void): () => void {
    return this.onGameEvent('ROUND_ENDED', callback);
  }

  public onGameEnded(callback: (event: GameEvent) => void): () => void {
    return this.onGameEvent('GAME_ENDED', callback);
  }

  // 상태 확인 메서드들
  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public clearMessageQueue(): void {
    this.messageQueue = [];
    console.log('Message queue cleared');
  }

  public getCurrentGameId(): string | null {
    return this.currentGameId;
  }

  public getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  // Send methods
  private flushQueue() {
    if (!this.isConnected || !this.client || this.messageQueue.length === 0) return;

    console.log(`Flushing ${this.messageQueue.length} queued messages`);
    const toRetry: typeof this.messageQueue = [];

    // Process all queued messages
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!;
      message.attempts++;

      try {
        this.client.publish({
          destination: message.destination,
          body: JSON.stringify(message.body)
        });

        this.outboundListeners.forEach(l => l({
          destination: message.destination,
          body: message.body,
          sentAt: Date.now()
        }));

        console.log(`Successfully sent queued message ${message.id}`);

      } catch (error) {
        console.error(`Failed to send queued message ${message.id}, attempt ${message.attempts}:`, error);

        // Retry message if under attempt limit
        if (message.attempts < this.maxMessageAttempts) {
          toRetry.push(message);
        } else {
          console.error(`Dropping message ${message.id} after ${message.attempts} failed attempts`);
        }
      }
    }

    // Re-queue messages that need retry
    this.messageQueue = toRetry;

    if (toRetry.length > 0) {
      console.log(`Re-queued ${toRetry.length} messages for retry`);
    }
  }

  private queueMessage(destination: string, body: any): string {
    // Remove oldest message if queue is full
    if (this.messageQueue.length >= this.maxQueue) {
      const removed = this.messageQueue.shift();
      console.warn('Message queue full, removed oldest message:', removed?.id);
    }

    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    this.messageQueue.push({
      id,
      destination,
      body,
      attempts: 0,
      timestamp: Date.now()
    });

    console.log(`Queued message ${id} to ${destination}`);
    return id;
  }

  // Heartbeat and connection monitoring
  private startHeartbeat(): void {
    this.stopHeartbeat(); // Clear any existing intervals
    
    // Send ping every 30 seconds
    this.pingInterval = setInterval(() => {
      if (this.isConnected && this.client) {
        try {
          this.client.publish({
            destination: '/app/ping',
            body: JSON.stringify({ timestamp: Date.now() })
          });
        } catch (error) {
          console.error('Failed to send ping:', error);
        }
      }
    }, 30000);
    
    // Check for missed pongs every 45 seconds
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastPong = now - this.lastPongReceived;
      
      if (timeSinceLastPong > 60000) { // 60 seconds without pong
        console.warn('No pong received for 60 seconds, connection may be dead');
        if (this.client) {
          this.client.forceDisconnect();
        }
      }
    }, 45000);
  }

  private stopHeartbeat(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Handle pong response
  private handlePong(): void {
    this.lastPongReceived = Date.now();
  }

  private setupClient(): void {
    const socket = new SockJS('http://localhost:20021/ws');

    // 재연결을 위한 헤더 준비
    const connectHeaders: Record<string, string> = {};
    const oldSessionId = localStorage.getItem('websocket-session-id');
    if (oldSessionId) {
      connectHeaders['x-old-session-id'] = oldSessionId;
    }

    const stompConfig: StompConfig = {
      webSocketFactory: () => socket,
      connectHeaders,
      debug: (str: string) => {
        if (import.meta.env.DEV) {
          console.log('STOMP Debug:', str);
        }
      },
      onConnect: this.onConnect.bind(this),
      onDisconnect: this.onDisconnect.bind(this),
      onStompError: this.onError.bind(this),
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      reconnectDelay: 0, // We handle reconnection manually
    };

    this.client = new Client(stompConfig);
  }

  private onConnect(frame: any): void {
    console.log('WebSocket connected', frame);
    this.isConnected = true;
    this.connectionState = 'connected';
    this.reconnectAttempts = 0;
    this.lastPongReceived = Date.now();

    // 세션 ID 저장 (재연결에 사용)
    const sessionId = frame.headers?.['session'];
    if (sessionId) {
      localStorage.setItem('websocket-session-id', sessionId);
      console.log('Stored WebSocket session ID:', sessionId);
    }

    // Start heartbeat monitoring
    this.startHeartbeat();

    this.subscribeToLobby();

    // Notify connection callbacks
    this.connectionCallbacks.forEach(callback => {
      try {
        callback(true);
      } catch (error) {
        console.error('Error in connection callback:', error);
      }
    });

    // Re-subscribe to previous subscriptions if any
    if (this.currentGameId) {
      console.log('Re-subscribing to game:', this.currentGameId);
      // Small delay to ensure connection is fully established
      setTimeout(() => {
        if (this.currentGameId) {
          this.subscribeToGame(this.currentGameId);
        }
      }, 100);
    }

    // Flush any queued messages
    this.flushQueue();
    
    if (this.reconnectAttempts > 0) {
      toast.success('재연결이 성공했습니다!');
    } else {
      toast.success('실시간 연결이 성공했습니다');
    }
  }

  private onDisconnect(): void {
    console.log('WebSocket disconnected');
    this.isConnected = false;
    
    // Stop heartbeat monitoring
    this.stopHeartbeat();

    // Only update connection state if not already reconnecting
    if (this.connectionState !== 'reconnecting') {
      this.connectionState = 'disconnected';
    }

    // Notify connection callbacks
    this.connectionCallbacks.forEach(callback => {
      try {
        callback(false);
      } catch (error) {
        console.error('Error in disconnection callback:', error);
      }
    });

    // Clear subscriptions but keep the map for re-subscription
    this.subscriptions.forEach((subscription, key) => {
      try {
        subscription.unsubscribe();
      } catch (error) {
        console.warn(`Error unsubscribing from ${key} on disconnect:`, error);
      }
    });
    // Don't clear the subscriptions map - we'll need it for re-subscription

    // Attempt reconnection only if not manually disconnected
    if (this.connectionState !== 'disconnected') {
      this.attemptReconnection();
      toast.error('실시간 연결이 끊어졌습니다. 재연결을 시도합니다.');
    }
  }

  private onError(error: any): void {
    console.error('STOMP Error:', error);
    toast.error('실시간 통신 오류가 발생했습니다');
  }

  private attemptReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.connectionState = 'disconnected';
      toast.error('재연결에 실패했습니다. 페이지를 새로고침해주세요.');
      return;
    }

    if (this.connectionState === 'reconnecting') {
      return; // Already attempting to reconnect
    }

    this.connectionState = 'reconnecting';
    this.reconnectAttempts++;
    
    // Exponential backoff with jitter and max delay cap
    const baseDelay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    const jitter = Math.random() * 1000; // Add randomness to prevent thundering herd
    const delay = Math.min(baseDelay + jitter, this.maxReconnectDelay);

    console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${Math.round(delay)}ms`);
    toast.info(`재연결 시도 중... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      if (this.connectionState === 'reconnecting') {
        try {
          // Setup fresh client for reconnection
          this.setupClient();
          if (this.client) {
            this.client.activate();
          }
        } catch (error) {
          console.error('Error during reconnection setup:', error);
          this.connectionState = 'disconnected';
          // Retry after a short delay
          setTimeout(() => this.attemptReconnection(), 1000);
        }
      }
    }, delay);
  }

  private handleLobbyMessage(message: IMessage): void {
    try {
      const raw = JSON.parse(message.body ?? '{}') ?? {};
      const rawGameNumber = raw.gameNumber ?? raw.gameId ?? raw.id;
      const parsedNumber = typeof rawGameNumber === 'number'
        ? rawGameNumber
        : typeof rawGameNumber === 'string'
          ? Number.parseInt(rawGameNumber, 10)
          : undefined;
      const normalizedGameNumber = typeof parsedNumber === 'number' && Number.isFinite(parsedNumber)
        ? parsedNumber
        : rawGameNumber;

      const normalized: LobbyUpdate = {
        ...raw,
        type: typeof raw.type === 'string' ? raw.type : 'UNKNOWN',
        gameNumber: normalizedGameNumber,
        currentPlayers: typeof raw.currentPlayers === 'number' ? raw.currentPlayers : undefined,
        maxPlayers: typeof raw.maxPlayers === 'number' ? raw.maxPlayers : undefined,
      };

      const nickname = typeof raw.nickname === 'string' ? raw.nickname : undefined;
      if (nickname) {
        normalized.nickname = nickname;
      }
      if (typeof raw.playerName === 'string') {
        normalized.playerName = raw.playerName;
      } else if (nickname) {
        normalized.playerName = nickname;
      }

      const parsedUserId = typeof raw.userId === 'number'
        ? raw.userId
        : typeof raw.userId === 'string'
          ? Number.parseInt(raw.userId, 10)
          : undefined;
      if (typeof parsedUserId === 'number' && Number.isFinite(parsedUserId)) {
        normalized.userId = parsedUserId;
      }

      this.notifyRawListeners({
        type: 'lobby',
        data: normalized,
        receivedAt: Date.now(),
        destination: message.headers?.destination,
      });

      this.lobbyCallbacks.forEach(callback => {
        try {
          callback(normalized);
        } catch (error) {
          console.error('Error in lobby callback:', error);
        }
      });
    } catch (error) {
      console.error('Error parsing lobby message:', error);
    }
  }

  private handleGameEvent(message: IMessage): void {
    try {
      const event: GameEvent = JSON.parse(message.body);
      console.log('Received game event:', event);

      this.notifyRawListeners({
        type: 'event',
        data: event,
        receivedAt: Date.now(),
        destination: message.headers?.destination,
      });

      // Notify specific event type callbacks
      const callbacks = this.eventCallbacks.get(event.type) || [];
      callbacks.forEach(callback => callback(event));

      // Notify all event callbacks
      const allCallbacks = this.eventCallbacks.get('*') || [];
      allCallbacks.forEach(callback => callback(event));

    } catch (error) {
      console.error('Error parsing game event:', error);
    }
  }

  private handleChatMessage(message: IMessage): void {
    try {
      const raw = JSON.parse(message.body);
      const chatMessage: ChatMessage = {
        id: String(raw.id ?? `${raw.gameNumber}-${raw.timestamp}`),
        gameNumber: raw.gameNumber ?? (raw.gameId ? Number(raw.gameId) : 0),
        playerId: raw.playerId ? String(raw.playerId) : undefined,
        userId: typeof raw.userId === 'number' ? raw.userId : undefined,
        playerNickname: raw.playerNickname ?? raw.playerName ?? 'SYSTEM',
        playerName: raw.playerName ?? raw.playerNickname ?? undefined,
        content: raw.content ?? raw.message ?? '',
        message: raw.message ?? raw.content ?? undefined,
        timestamp: typeof raw.timestamp === 'string' ? Date.parse(raw.timestamp) : Number(raw.timestamp ?? Date.now()),
        type: (raw.type || 'DISCUSSION') as ChatMessage['type']
      };
      console.log('Received chat message:', chatMessage);

      this.notifyRawListeners({
        type: 'chat',
        data: chatMessage,
        receivedAt: Date.now(),
        destination: message.headers?.destination,
      });

      this.chatCallbacks.forEach(callback => callback(chatMessage));

    } catch (error) {
      console.error('Error parsing chat message:', error);
    }
  }

  private handlePersonalNotification(message: IMessage): void {
    try {
      const notification = JSON.parse(message.body);
      console.log('Received personal notification:', notification);

      // 개인 알림을 게임 이벤트로 처리
      const gameEvent: GameEvent = {
        type: 'PERSONAL_NOTIFICATION' as any,
        gameId: this.currentGameId || '',
        payload: notification,
        timestamp: Date.now()
      };

      this.notifyRawListeners({
        type: 'notification',
        data: notification,
        receivedAt: Date.now(),
        destination: message.headers?.destination,
      });

      // 알림 타입별 이벤트 콜백 호출
      const callbacks = this.eventCallbacks.get('PERSONAL_NOTIFICATION') || [];
      callbacks.forEach(callback => callback(gameEvent));

      // 전체 이벤트 콜백도 호출
      const allCallbacks = this.eventCallbacks.get('*') || [];
      allCallbacks.forEach(callback => callback(gameEvent));

    } catch (error) {
      console.error('Error parsing personal notification:', error);
    }
  }

  private handlePingPong(message: IMessage): void {
    try {
      const data = JSON.parse(message.body);
      if (data.type === 'pong') {
        this.handlePong();
        this.notifyRawListeners({
          type: 'system',
          data,
          receivedAt: Date.now(),
          destination: message.headers?.destination,
        });
      }
    } catch (error) {
      console.error('Error parsing ping/pong message:', error);
    }
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
export default websocketService;
