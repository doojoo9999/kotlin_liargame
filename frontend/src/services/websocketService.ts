import SockJS from 'sockjs-client';
import type {IMessage} from '@stomp/stompjs';
import {Client as StompClient, StompConfig} from '@stomp/stompjs';
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
  private client: StompClient | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseReconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private connectionTimeout = 15000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private currentGameId: string | null = null;
  private lastSubscriptionUserId: string | null = null;

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
  private lastHeartbeatAck = Date.now();
  private pendingGameSubscriptions: Map<string, { userId?: string; attempts: number }> = new Map();
  private lobbySubscriptionPending = false;
  private pendingSubscriptionFlushTimer: NodeJS.Timeout | null = null;
  private readonly maxSubscriptionAttempts = 5;
  private connectionState: 'connecting' | 'connected' | 'disconnected' | 'reconnecting' = 'disconnected';
  private readonly userConnectionKey = 'user-connection';
  private readonly userHeartbeatKey = 'user-heartbeat';
  private readonly storageKeys = {
    session: 'liargame:websocket-session-id',
    legacy: 'websocket-session-id',
  } as const;
  private readonly connectionNoticeIds = new Set<string>();

  constructor() {
    this.setupClient();
  }

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connectionState === 'connected') {
        resolve();
        return;
      }

      if (this.client?.connected) {
        this.connectionState = 'connected';
        this.isConnected = true;
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

      try {
        this.ensureClient().activate();
      } catch (error) {
        this.connectionState = 'disconnected';
        reject(error instanceof Error ? error : new Error('Failed to initialize WebSocket client'));
        return;
      }
    });
  }

  public disconnect(): void {
    this.connectionState = 'disconnected';
    this.clearStoredSessionId();
    
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
    
    // Drop any queued messages; listeners stay registered for future reconnects
    this.messageQueue = [];
    this.pendingGameSubscriptions.clear();
    this.lobbySubscriptionPending = false;
    if (this.pendingSubscriptionFlushTimer) {
      clearTimeout(this.pendingSubscriptionFlushTimer);
      this.pendingSubscriptionFlushTimer = null;
    }

    console.log('WebSocket service disconnected and cleaned up');
    this.clearConnectionNotices();
  }

  public onRoomDeleted(callback: (event: GameEvent) => void): () => void {
    return this.onGameEvent('ROOM_DELETED', callback);
  }

  public subscribeToGame(gameId: string, userId?: string): void {
    this.currentGameId = gameId;
    if (userId !== undefined) {
      this.lastSubscriptionUserId = userId;
    }

    const pending = this.pendingGameSubscriptions.get(gameId);
    if (pending) {
      pending.userId = userId ?? pending.userId;
      pending.attempts = 0;
      this.pendingGameSubscriptions.set(gameId, pending);
    } else {
      this.pendingGameSubscriptions.set(gameId, { userId, attempts: 0 });
    }

    if (!this.client || !this.isConnected || !this.client.connected) {
      console.warn('Cannot subscribe - WebSocket not connected; deferring subscription', { gameId });
      this.requestPendingSubscriptionFlush();
      return;
    }

    try {
      this.performGameSubscription(gameId, userId);
      this.pendingGameSubscriptions.delete(gameId);
    } catch (error) {
      if (this.isStompConnectionError(error)) {
        console.warn('STOMP connection not ready, retrying game subscription soon', { gameId });
        this.requestPendingSubscriptionFlush();
        return;
      }
      throw error;
    }
  }

  public unsubscribeFromGame(gameId: string, userId?: string): void {
    const effectiveUserId = userId ?? this.lastSubscriptionUserId ?? undefined;
    this.pendingGameSubscriptions.delete(gameId);
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

    const playerStatusSub = this.subscriptions.get(`player-status-${gameId}`);
    if (playerStatusSub) {
      playerStatusSub.unsubscribe();
      this.subscriptions.delete(`player-status-${gameId}`);
    }

    const gameStatusSub = this.subscriptions.get(`game-status-${gameId}`);
    if (gameStatusSub) {
      gameStatusSub.unsubscribe();
      this.subscriptions.delete(`game-status-${gameId}`);
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
    if (effectiveUserId) {
      const notificationSub = this.subscriptions.get(`notifications-${effectiveUserId}`);
      if (notificationSub) {
        notificationSub.unsubscribe();
        this.subscriptions.delete(`notifications-${effectiveUserId}`);
      }
    }

    if (this.currentGameId === gameId) {
      this.currentGameId = null;
    }

    if (!effectiveUserId || this.lastSubscriptionUserId === effectiveUserId) {
      this.lastSubscriptionUserId = null;
    }

    console.log(`Unsubscribed from game: ${gameId}`);
  }

  public onLobbyUpdate(callback: LobbyUpdateCallback): () => void {
    this.lobbyCallbacks.push(callback);

    if (this.isConnected) {
      this.subscribeToLobby();
    } else {
      this.lobbySubscriptionPending = true;
      this.requestPendingSubscriptionFlush();
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
        this.lobbySubscriptionPending = false;
      }
    };
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

  public ensureLobbySubscription(): void {
    if (this.isConnected) {
      this.subscribeToLobby();
    } else if (this.lobbyCallbacks.length > 0) {
      this.lobbySubscriptionPending = true;
      this.requestPendingSubscriptionFlush();
    }
  }

  private performGameSubscription(gameId: string, userId?: string): void {
    const client = this.client;
    if (!client) {
      throw new Error('WebSocket client not ready');
    }

    const cleanupKeys = [
      `game-state-${gameId}`,
      `game-events-${gameId}`,
      `player-status-${gameId}`,
      `game-status-${gameId}`,
      `chat-${gameId}`,
      `chat-legacy-${gameId}`
    ];
    cleanupKeys.forEach(key => {
      const existing = this.subscriptions.get(key);
      if (existing) {
        try {
          existing.unsubscribe();
        } catch (error) {
          console.warn(`Error unsubscribing stale listener ${key}:`, error);
        }
        this.subscriptions.delete(key);
      }
    });

    const gameStateSub = client.subscribe(
      `/topic/game/${gameId}/state`,
      this.handleGameEvent.bind(this)
    );
    this.subscriptions.set(`game-state-${gameId}`, gameStateSub);

    const gameEventSub = client.subscribe(
      `/topic/game/${gameId}/events`,
      this.handleGameEvent.bind(this)
    );
    this.subscriptions.set(`game-events-${gameId}`, gameEventSub);

    const playerStatusSub = client.subscribe(
      `/topic/game/${gameId}/player-status`,
      this.handleGameEvent.bind(this)
    );
    this.subscriptions.set(`player-status-${gameId}`, playerStatusSub);

    const gameStatusSub = client.subscribe(
      `/topic/game/${gameId}/game-status`,
      this.handleGameEvent.bind(this)
    );
    this.subscriptions.set(`game-status-${gameId}`, gameStatusSub);

    const chatTopic = `/topic/chat.${gameId}`;
    const chatSub = client.subscribe(
      chatTopic,
      this.handleChatMessage.bind(this)
    );
    this.subscriptions.set(`chat-${gameId}`, chatSub);

    const legacyChatTopic = `/topic/game/${gameId}/chat`;
    const legacyChatSub = client.subscribe(
      legacyChatTopic,
      this.handleChatMessage.bind(this)
    );
    this.subscriptions.set(`chat-legacy-${gameId}`, legacyChatSub);

    if (userId) {
      const notificationKey = `notifications-${userId}`;
      const existingNotificationSub = this.subscriptions.get(notificationKey);
      if (existingNotificationSub) {
        try {
          existingNotificationSub.unsubscribe();
        } catch (error) {
          console.warn(`Error unsubscribing stale listener ${notificationKey}:`, error);
        }
        this.subscriptions.delete(notificationKey);
      }

      const notificationSub = client.subscribe(
        `/topic/user/${userId}/notifications`,
        this.handlePersonalNotification.bind(this)
      );
      this.subscriptions.set(notificationKey, notificationSub);
    }

    console.log(`Subscribed to game: ${gameId}`);
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
    if (this.lobbyCallbacks.length === 0) {
      this.lobbySubscriptionPending = false;
      return;
    }

    if (!this.client || !this.isConnected || !this.client.connected) {
      this.lobbySubscriptionPending = true;
      this.requestPendingSubscriptionFlush();
      return;
    }

    try {
      this.performLobbySubscription();
      this.lobbySubscriptionPending = false;
    } catch (error) {
      if (this.isStompConnectionError(error)) {
        console.warn('STOMP connection not ready for lobby subscription, retrying shortly', error);
        this.lobbySubscriptionPending = true;
        this.requestPendingSubscriptionFlush();
        return;
      }
      throw error;
    }
  }

  private performLobbySubscription(): void {
    const client = this.client;
    if (!client) {
      throw new Error('WebSocket client not ready');
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

    const subscription = client.subscribe('/topic/lobby', this.handleLobbyMessage.bind(this));
    this.subscriptions.set(this.lobbySubscriptionKey, subscription);
    console.log('Subscribed to lobby updates');
  }
  private requestPendingSubscriptionFlush(delay = 200): void {
    if (this.pendingSubscriptionFlushTimer) {
      clearTimeout(this.pendingSubscriptionFlushTimer);
    }

    this.pendingSubscriptionFlushTimer = setTimeout(() => {
      this.pendingSubscriptionFlushTimer = null;
      this.flushPendingSubscriptions();
    }, delay);
  }

  private flushPendingSubscriptions(): void {
    if (!this.client || !this.isConnected || !this.client.connected) {
      if (this.pendingGameSubscriptions.size > 0 || this.lobbySubscriptionPending) {
        this.requestPendingSubscriptionFlush();
      }
      return;
    }

    if (this.lobbySubscriptionPending) {
      try {
        this.performLobbySubscription();
        this.lobbySubscriptionPending = false;
      } catch (error) {
        if (this.isStompConnectionError(error)) {
          this.requestPendingSubscriptionFlush();
        } else {
          console.error('Failed to subscribe to lobby updates:', error);
          this.lobbySubscriptionPending = false;
        }
      }
    }

    if (this.pendingGameSubscriptions.size > 0) {
      for (const [gameId, meta] of [...this.pendingGameSubscriptions.entries()]) {
        try {
          this.performGameSubscription(gameId, meta.userId);
          this.pendingGameSubscriptions.delete(gameId);
        } catch (error) {
          if (this.isStompConnectionError(error)) {
            meta.attempts += 1;
            if (meta.attempts >= this.maxSubscriptionAttempts) {
              console.error('Giving up on game subscription after repeated failures', { gameId, error });
              this.pendingGameSubscriptions.delete(gameId);
            } else {
              this.pendingGameSubscriptions.set(gameId, meta);
              this.requestPendingSubscriptionFlush(Math.min(1000, 200 * meta.attempts));
            }
          } else {
            console.error('Unexpected error subscribing to game channel', { gameId, error });
            this.pendingGameSubscriptions.delete(gameId);
          }
        }
      }
    }
  }

  private isStompConnectionError(error: unknown): boolean {
    if (!error) {
      return false;
    }

    const message = error instanceof Error ? error.message : String(error);
    return message.includes('There is no underlying STOMP connection')
      || message.includes('Underlying connection is not open')
      || message.includes('Lost connection')
      || message.includes('not connected');
  }
  public processQueue(): void {
    this.flushQueue();
  }

  public safePublish(destination: string, body: any): string | undefined {
    if (!this.client || !this.client.connected || !this.isConnected) {
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

    const client = this.client;
    if (!client || !client.connected || !this.isConnected) {
      const queuedId = this.safePublish('/app/chat.send', payload);
      if (queuedId) {
        this.showConnectionNotice('chat');
        this.ensureConnectionAttempt();
      }
      return;
    }

    try {
      client.publish({ destination: '/app/chat.send', body: JSON.stringify(payload) });
    } catch (error) {
      console.warn('Falling back to queued send for chat message', { gameId, error });
      const queuedId = this.safePublish('/app/chat.send', payload);
      if (queuedId) {
        this.showConnectionNotice('chat');
        this.ensureConnectionAttempt();
      }
    }
  }

  public sendGameAction(gameId: string, action: string, payload: any = {}): void {
    const client = this.client;
    if (!client || !client.connected || !this.isConnected) {
      const queuedId = this.safePublish(`/app/game/${gameId}/${action}`, payload);
      if (queuedId) {
        this.showConnectionNotice('action');
        this.ensureConnectionAttempt();
      }
      return;
    }
    try {
      client.publish({ destination: `/app/game/${gameId}/${action}`, body: JSON.stringify(payload) });
    } catch (error) {
      console.warn('Falling back to queued send for game action', { gameId, action, error });
      const queuedId = this.safePublish(`/app/game/${gameId}/${action}`, payload);
      if (queuedId) {
        this.showConnectionNotice('action');
        this.ensureConnectionAttempt();
      }
    }
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

  private forceDisconnectClient(reason?: string): void {
    if (!this.client) {
      return;
    }

    const isActive = this.client.active || this.client.connected;
    if (!isActive) {
      return;
    }

    try {
      if (import.meta.env.DEV) {
        console.log('Forcing STOMP disconnect', reason ? `(${reason})` : '');
      }
      this.client.forceDisconnect();
      this.clearStoredSessionId();
    } catch (error) {
      console.warn('Failed to force STOMP disconnect', { reason, error });
    }
    // onDisconnect handler will finish the cleanup (stop heartbeat, etc.)
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
    if (!this.isConnected || !this.client || !this.client.connected || this.messageQueue.length === 0) return;

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

  private showConnectionNotice(context: 'chat' | 'action'): void {
    const id = context === 'chat' ? 'realtime-queue-chat' : 'realtime-queue-action';
    if (this.connectionNoticeIds.has(id)) {
      return;
    }

    const message = context === 'chat'
      ? '실시간 연결을 복구 중입니다. 채팅 메시지를 대기열에 저장했습니다.'
      : '실시간 연결을 복구 중입니다. 요청을 대기열에 저장했습니다.';

    toast.info(message, {
      id,
      duration: 4000,
    });

    this.connectionNoticeIds.add(id);
  }

  private clearConnectionNotices(): void {
    if (!this.connectionNoticeIds.size) {
      return;
    }

    for (const id of this.connectionNoticeIds) {
      toast.dismiss(id);
    }

    this.connectionNoticeIds.clear();
  }

  private ensureConnectionAttempt(): void {
    if (this.connectionState === 'connected'
      || this.connectionState === 'connecting'
      || this.connectionState === 'reconnecting') {
      return;
    }

    void this.connect().catch(error => {
      console.error('Automatic websocket reconnect failed after queuing message', error);
    });
  }

  private subscribeToUserQueues(): void {
    if (!this.client) {
      return;
    }

    const existingConnectionSub = this.subscriptions.get(this.userConnectionKey);
    if (existingConnectionSub) {
      try {
        existingConnectionSub.unsubscribe();
      } catch (error) {
        console.warn('Error unsubscribing existing user connection listener:', error);
      }
      this.subscriptions.delete(this.userConnectionKey);
    }

    const connectionSub = this.client.subscribe('/user/queue/connection', this.handleConnectionQueue.bind(this));
    this.subscriptions.set(this.userConnectionKey, connectionSub);

    const existingHeartbeatSub = this.subscriptions.get(this.userHeartbeatKey);
    if (existingHeartbeatSub) {
      try {
        existingHeartbeatSub.unsubscribe();
      } catch (error) {
        console.warn('Error unsubscribing existing user heartbeat listener:', error);
      }
      this.subscriptions.delete(this.userHeartbeatKey);
    }

    const heartbeatSub = this.client.subscribe('/user/queue/heartbeat', this.handleHeartbeatQueue.bind(this));
    this.subscriptions.set(this.userHeartbeatKey, heartbeatSub);
  }

  private getStoredSessionId(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const stored = window.localStorage.getItem(this.storageKeys.session);
      if (stored) {
        return stored;
      }
      return window.localStorage.getItem(this.storageKeys.legacy);
    } catch (error) {
      console.warn('Failed to read stored WebSocket session id', error);
      return null;
    }
  }

  private storeSessionId(sessionId: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(this.storageKeys.session, sessionId);
      window.localStorage.removeItem(this.storageKeys.legacy);
    } catch (error) {
      console.warn('Failed to persist WebSocket session id', error);
    }
  }

  private clearStoredSessionId(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.removeItem(this.storageKeys.session);
      window.localStorage.removeItem(this.storageKeys.legacy);
    } catch (error) {
      console.warn('Failed to clear WebSocket session id', error);
    }
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

  // Heartbeat and connection monitoring
  private startHeartbeat(): void {
    this.stopHeartbeat(); // Clear any existing intervals

    // Send heartbeat every 15 seconds
    this.pingInterval = setInterval(() => {
      if (this.isConnected && this.client?.connected) {
        try {
          this.client.publish({
            destination: '/app/heartbeat',
            body: JSON.stringify({ timestamp: Date.now() })
          });
        } catch (error) {
          console.error('Failed to send ping:', error);
          this.isConnected = false;
          this.connectionState = 'reconnecting';
          this.ensureConnectionAttempt();
        }
      } else if (!this.client?.connected && this.connectionState !== 'connecting') {
        this.isConnected = false;
        this.ensureConnectionAttempt();
      }
    }, 15000);

    // Check for missed acknowledgements every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceAck = now - this.lastHeartbeatAck;

      if (timeSinceAck > 60000) {
        console.warn('No heartbeat acknowledgement for 60 seconds, forcing disconnect');
        if (this.client) {
          this.client.forceDisconnect();
        }
      }
    }, 30000);
  }

  // Handle pong response
  private resolveWebSocketUrl(): string {
    const normalizeCandidate = (raw?: string | null): string | null => {
      if (!raw) {
        return null;
      }
      const trimmed = raw.trim();
      if (!trimmed.length) {
        return null;
      }

      let working = trimmed;

      if (/^ws(s)?:\/\//i.test(working)) {
        working = working.replace(/^ws(s)?:\/\//i, (_match, secure) => (secure ? 'https://' : 'http://'));
      } else if (/^\/\//.test(working)) {
        working = `http:${working}`;
      }

      if (!/^https?:\/\//i.test(working) && !working.startsWith('/')) {
        working = `http://${working}`;
      }

      if (working.startsWith('/')) {
        const path = working.replace(/\/+$/, '');
        if (!path.length) {
          return '/ws';
        }
        return path.endsWith('/ws') ? path : `${path}/ws`;
      }

      try {
        const url = new URL(working);
        const basePath = url.pathname?.trim() ?? '';
        const normalizedPath = basePath.length > 0 && basePath !== '/'
          ? basePath.replace(/\/+$/, '')
          : '';
        url.pathname = normalizedPath.endsWith('/ws')
          ? normalizedPath
          : `${normalizedPath}/ws`.replace(/^\/?/, '/');
        url.search = '';
        url.hash = '';
        return url.toString();
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('Invalid websocket URL candidate:', working, error);
        }
        return null;
      }
    };

    const envCandidates = [
      normalizeCandidate(import.meta.env.VITE_WS_BASE_URL as string | undefined),
      normalizeCandidate(import.meta.env.VITE_WS_URL as string | undefined),
    ].filter((value): value is string => Boolean(value));

    for (const candidate of envCandidates) {
      if (candidate) {
        return candidate;
      }
    }

    const apiCandidate = normalizeCandidate(import.meta.env.VITE_API_BASE_URL as string | undefined);
    if (apiCandidate) {
      return apiCandidate;
    }

    if (typeof window !== 'undefined') {
      const { protocol, hostname, port } = window.location;
      const fallbackPortMap: Record<string, string> = {
        '5173': '20021',
        '3000': '8080',
      };
      const derivedPort = fallbackPortMap[port];
      if (derivedPort) {
        const derivedCandidate = `${protocol === 'https:' ? 'https' : 'http'}://${hostname}:${derivedPort}`;
        const normalizedDerived = normalizeCandidate(derivedCandidate);
        if (normalizedDerived) {
          return normalizedDerived;
        }
      }
    }

    const defaultCandidates = [
      normalizeCandidate('http://localhost:20021'),
      normalizeCandidate('http://localhost:8080'),
    ].filter((value): value is string => Boolean(value));

    for (const candidate of defaultCandidates) {
      if (candidate) {
        return candidate;
      }
    }

    if (typeof window !== 'undefined') {
      const originFallback = normalizeCandidate(window.location.origin);
      if (originFallback) {
        return originFallback;
      }
    }

    return '/ws';
  }

  private setupClient(): void {
    const socketUrl = this.resolveWebSocketUrl();
    const socketOptions: (SockJS.Options & {
      withCredentials?: boolean;
      transportOptions?: Record<string, { withCredentials: boolean }>;
    }) = {
      withCredentials: true,
      transports: ['websocket', 'xhr-streaming', 'xhr-polling'],
      // Ensure SockJS transports forward session cookies for cross-origin setups
      transportOptions: {
        websocket: { withCredentials: true },
        'xhr-streaming': { withCredentials: true },
        'xhr-polling': { withCredentials: true },
      },
    };
    const createSocket = () => new SockJS(socketUrl, undefined, socketOptions);

    // 재연결을 위한 헤더 준비
    const connectHeaders: Record<string, string> = {};
    const oldSessionId = this.getStoredSessionId();
    if (oldSessionId) {
      connectHeaders['x-old-session-id'] = oldSessionId;
    }

    const stompConfig: StompConfig = {
      webSocketFactory: createSocket,
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

    this.client = new StompClient(stompConfig);
  }

  private ensureClient(): StompClient {
    if (!this.client) {
      this.setupClient();
    }
    if (!this.client) {
      throw new Error('WebSocket client 초기화에 실패했습니다.');
    }
    return this.client;
  }

  private onDisconnect(): void {
    console.log('WebSocket disconnected');
    this.isConnected = false;
    this.clearStoredSessionId();

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

  private onConnect(frame: any): void {
    console.log('WebSocket connected', frame);
    this.isConnected = true;
    this.connectionState = 'connected';
    this.reconnectAttempts = 0;
    this.lastHeartbeatAck = Date.now();

    // 세션 ID 저장 (재연결에 사용)
    const sessionId = frame.headers?.['session'];
    if (sessionId) {
      this.storeSessionId(sessionId);
      console.log('Stored WebSocket session ID:', sessionId);
    }

    // Start heartbeat monitoring
    this.startHeartbeat();

    this.subscribeToLobby();
    this.subscribeToUserQueues();
    this.flushPendingSubscriptions();

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
      const pendingGameId = this.currentGameId;
      const pendingUserId = this.lastSubscriptionUserId ?? undefined;
      console.log('Re-subscribing to game:', pendingGameId);
      // Small delay to ensure connection is fully established
      setTimeout(() => {
        if (this.currentGameId === pendingGameId) {
          this.subscribeToGame(pendingGameId, pendingUserId);
        }
      }, 100);
    }

    // Flush any queued messages
    this.flushQueue();
    this.clearConnectionNotices();

    if (this.reconnectAttempts > 0) {
      toast.success('재연결이 성공했습니다!');
    }
  }

  private handleConnectionQueue(message: IMessage): void {
    try {
      const payload = JSON.parse(message.body ?? '{}');
      const type = typeof payload.type === 'string' ? payload.type : 'CONNECTION_EVENT';

      this.notifyRawListeners({
        type: 'system',
        data: payload,
        receivedAt: Date.now(),
        destination: message.headers?.destination,
      });

      if (type === 'RECONNECTION_REQUIRED') {
        this.connectionState = 'reconnecting';
        this.isConnected = false;
        this.connectionCallbacks.forEach(callback => {
          try {
            callback(false);
          } catch (error) {
            console.error('Error in connection callback:', error);
          }
        });
        this.forceDisconnectClient('server requested reconnection');
      } else if (type === 'CONNECTION_CLOSED') {
        this.connectionState = 'disconnected';
        this.isConnected = false;
        this.connectionCallbacks.forEach(callback => {
          try {
            callback(false);
          } catch (error) {
            console.error('Error in connection callback:', error);
          }
        });
        this.forceDisconnectClient('server closed connection');
      }

      if (type === 'CONNECTION_ESTABLISHED' || type === 'RECONNECTION_SUCCESS') {
        this.connectionState = 'connected';
        this.connectionCallbacks.forEach(callback => {
          try {
            callback(true);
          } catch (error) {
            console.error('Error in connection callback:', error);
          }
        });
      }

      if (type === 'RECONNECTION_REQUIRED') {
        toast.error(payload.message ?? '연결이 끊어졌습니다. 재연결을 시도합니다.');
      } else if (type === 'CONNECTION_ESTABLISHED' && this.reconnectAttempts === 0) {
        toast.success(payload.message ?? '실시간 연결이 성공했습니다');
      }
    } catch (error) {
      console.error('Error handling connection queue message:', error);
    }
  }

  private handleHeartbeatQueue(message: IMessage): void {
    try {
      const payload = JSON.parse(message.body ?? '{}');
      this.lastHeartbeatAck = Date.now();
      this.notifyRawListeners({
        type: 'system',
        data: payload,
        receivedAt: this.lastHeartbeatAck,
        destination: message.headers?.destination,
      });
    } catch (error) {
      console.error('Error handling heartbeat queue message:', error);
    }
  }

  private normalizeGameEvent(raw: unknown, message: IMessage): GameEvent | null {
    const destination = message.headers?.destination ?? '';
    const extractGameId = (value: unknown): string | null => {
      if (value == null) {
        return null;
      }
      if (typeof value === 'string' && value.trim().length > 0) {
        return value;
      }
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value.toString();
      }
      return null;
    };

    const resolveGameId = (): string => {
      const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : null;
      const fromExplicitGameId = record ? extractGameId(record['gameId']) : null;
      const fromAlternateGameNumber = record ? extractGameId(record['gameNumber']) : null;
      const rawGameId = fromExplicitGameId ?? fromAlternateGameNumber ?? extractGameId(this.currentGameId);
      return rawGameId ?? '';
    };

    const extractTimestamp = (value: any): number => {
      const candidate = value?.timestamp ?? value?.sentAt ?? value?.createdAt ?? value?.time;
      if (typeof candidate === 'number' && Number.isFinite(candidate)) {
        return candidate;
      }
      if (typeof candidate === 'string') {
        const parsed = Date.parse(candidate);
        if (!Number.isNaN(parsed)) {
          return parsed;
        }
      }
      return Date.now();
    };

    if (raw == null) {
      return null;
    }

    const timestamp = extractTimestamp(raw as any);

    if (typeof raw === 'string') {
      if (destination.includes('/state')) {
        return {
          type: 'GAME_STATE_UPDATED',
          gameId: resolveGameId(),
          payload: { state: raw },
          timestamp,
        } as unknown as GameEvent;
      }
      return null;
    }

    if (typeof raw !== 'object') {
      return {
        type: 'GAME_STATE_UPDATED',
        gameId: resolveGameId(),
        payload: { state: raw },
        timestamp,
      } as unknown as GameEvent;
    }

    const record = raw as Record<string, unknown>;
    const rawType = record['type'] ?? record['eventType'] ?? record['event_type'];
    const normalizedType = typeof rawType === 'string' ? rawType.toUpperCase() : null;

    const coercePayload = (): any => {
      if (record['payload'] !== undefined) {
        return record['payload'];
      }
      if (record['data'] !== undefined) {
        return record['data'];
      }
      const clone: Record<string, unknown> = { ...record };
      delete clone['type'];
      delete clone['eventType'];
      delete clone['event_type'];
      delete clone['gameNumber'];
      delete clone['gameId'];
      delete clone['timestamp'];
      delete clone['payload'];
      delete clone['data'];
      return clone;
    };

    if (normalizedType) {
      const canonicalType =
        normalizedType === 'GAME_STATE_UPDATE' || normalizedType === 'STATE'
          ? 'GAME_STATE_UPDATED'
          : normalizedType;

      const payload = coercePayload();

      return {
        type: canonicalType,
        gameId: resolveGameId(),
        payload,
        timestamp,
      } as unknown as GameEvent;
    }

    const payload = record['payload'] ?? record;

    if (destination.includes('/state')) {
      return {
        type: 'GAME_STATE_UPDATED',
        gameId: resolveGameId(),
        payload: { gameState: payload },
        timestamp,
      } as unknown as GameEvent;
    }

    return {
      type: 'GAME_STATE_UPDATED',
      gameId: resolveGameId(),
      payload: { gameState: payload },
      timestamp,
    } as unknown as GameEvent;
  }

  private handleGameEvent(message: IMessage): void {
    try {
      const raw = message.body ? JSON.parse(message.body) : null;
      const event = this.normalizeGameEvent(raw, message);
      if (!event) {
        if (import.meta.env.DEV) {
          console.warn('Ignoring unrecognized game event payload', raw);
        }
        return;
      }

      if (import.meta.env.DEV) {
        console.log('Received game event:', event);
      }

      this.notifyRawListeners({
        type: 'event',
        data: event,
        receivedAt: Date.now(),
        destination: message.headers?.destination,
      });

      const callbacks = this.eventCallbacks.get(event.type) || [];
      callbacks.forEach(callback => callback(event));

      const allCallbacks = this.eventCallbacks.get('*') || [];
      allCallbacks.forEach(callback => callback(event));
    } catch (error) {
      console.error('Error parsing game event:', error);
    }
  }

  private handleChatMessage(message: IMessage): void {
    try {
      const raw = JSON.parse(message.body);
      const fallbackNickname = raw.playerNicknameSnapshot ?? raw.playerNickname ?? raw.playerName ?? raw.nickname;
      const resolvedNickname = fallbackNickname ?? 'SYSTEM';
      const resolvedUserId = typeof raw.userId === 'number'
        ? raw.userId
        : (typeof raw.playerUserId === 'number' ? raw.playerUserId : undefined);

      const chatMessage: ChatMessage = {
        id: String(raw.id ?? `${raw.gameNumber}-${raw.timestamp}`),
        gameNumber: raw.gameNumber ?? (raw.gameId ? Number(raw.gameId) : 0),
        playerId: raw.playerId ? String(raw.playerId) : undefined,
        userId: resolvedUserId,
        playerNickname: resolvedNickname,
        nickname: raw.nickname ?? undefined,
        playerName: raw.playerName ?? raw.playerNickname ?? raw.playerNicknameSnapshot ?? undefined,
        content: raw.content ?? raw.message ?? '',
        message: raw.message ?? raw.content ?? undefined,
        gameId: raw.gameId != null ? String(raw.gameId) : undefined,
        roomId: raw.roomId != null ? String(raw.roomId) : undefined,
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

}

// Export singleton instance (guarded so multiple imports share the same underlying connection)
const globalRef = globalThis as typeof globalThis & { __liarGameWebSocketService?: WebSocketService };

if (!globalRef.__liarGameWebSocketService) {
  globalRef.__liarGameWebSocketService = new WebSocketService();
}

export const websocketService = globalRef.__liarGameWebSocketService;
export default websocketService;
