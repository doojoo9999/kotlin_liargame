import SockJS from 'sockjs-client';
import type {IMessage} from '@stomp/stompjs';
import {Client, StompConfig} from '@stomp/stompjs';
import {toast} from 'sonner';

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
  gameId?: string;
  userId?: string;
}

export interface GameEvent {
  type: 'PLAYER_JOINED' | 'PLAYER_LEFT' | 'GAME_STARTED' | 'ROUND_STARTED' |
        'HINT_PROVIDED' | 'VOTE_CAST' | 'DEFENSE_SUBMITTED' | 'ROUND_ENDED' |
        'GAME_ENDED' | 'CHAT_MESSAGE' | 'GAME_STATE_UPDATED';
  gameId: string;
  payload: any;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  gameId: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
  type: 'CHAT' | 'SYSTEM';
}

type EventCallback = (event: GameEvent) => void;
type ChatCallback = (message: ChatMessage) => void;
type ConnectionCallback = (connected: boolean) => void;

class WebSocketService {
  private client: Client | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private currentGameId: string | null = null;

  // Callback handlers
  private eventCallbacks: Map<string, EventCallback[]> = new Map();
  private chatCallbacks: ChatCallback[] = [];
  private connectionCallbacks: ConnectionCallback[] = [];

  // Subscription management
  private subscriptions: Map<string, any> = new Map();
  private messageQueue: { destination: string; body: any }[] = [];
  private maxQueue = 50;
  private outboundListeners: ((msg: { destination: string; body: any; sentAt: number }) => void)[] = [];

  constructor() {
    this.setupClient();
  }

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnected) {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 10000);

      const onConnect = () => {
        clearTimeout(timeout);
        this.removeConnectionCallback(onConnect);
        resolve();
      };

      this.addConnectionCallback(onConnect);

      if (this.client) {
        this.client.activate();
      }
    });
  }

  public disconnect(): void {
    if (this.client) {
      this.client.deactivate();
    }
    this.isConnected = false;
    this.currentGameId = null;
    this.subscriptions.clear();
    this.eventCallbacks.clear();
    this.chatCallbacks = [];
    this.connectionCallbacks = [];
    this.messageQueue = [];
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
    const chatSub = this.client.subscribe(
      `/topic/game/${gameId}/chat`,
      this.handleChatMessage.bind(this)
    );
    this.subscriptions.set(`chat-${gameId}`, chatSub);

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

  public addConnectionCallback(callback: ConnectionCallback): void {
    this.connectionCallbacks.push(callback);
  }

  public removeConnectionCallback(callback: ConnectionCallback): void {
    const index = this.connectionCallbacks.indexOf(callback);
    if (index > -1) {
      this.connectionCallbacks.splice(index, 1);
    }
  }

  public safePublish(destination: string, body: any): string | undefined {
    if (!this.isConnected || !this.client) {
      return this.queueMessage(destination, body);
    }
    try {
      this.client.publish({ destination, body: JSON.stringify(body) });
      this.outboundListeners.forEach(l => l({ destination, body, sentAt: Date.now() }));
      return undefined;
    } catch (e) {
      return this.queueMessage(destination, body);
    }
  }

  public sendChatMessage(gameId: string, message: string): void {
    if (!this.isConnected || !this.client) {
      toast.error('실시간 연결이 필요합니다');
      this.safePublish(`/app/game/${gameId}/chat`, { message });
      return;
    }
    this.client.publish({ destination: `/app/game/${gameId}/chat`, body: JSON.stringify({ message }) });
  }

  public sendGameAction(gameId: string, action: string, payload: any = {}): void {
    if (!this.isConnected || !this.client) {
      toast.error('실시간 연결이 필요합니다');
      this.safePublish(`/app/game/${gameId}/${action}`, payload);
      return;
    }
    this.client.publish({ destination: `/app/game/${gameId}/${action}`, body: JSON.stringify(payload) });
  }

  // Send methods
  private flushQueue() {
    if (!this.isConnected || !this.client) return;
    const queued = [...this.messageQueue];
    this.messageQueue = [];
    queued.forEach(q => {
      try {
        this.client!.publish({ destination: q.destination, body: JSON.stringify(q.body) });
        this.outboundListeners.forEach(l => l({ destination: q.destination, body: q.body, sentAt: Date.now() }));
      } catch (e) {
        console.error('Queued message publish failed, re-queueing once', e);
        if (this.messageQueue.length < this.maxQueue) this.messageQueue.push(q);
      }
    });
  }

  private queueMessage(destination: string, body: any): string {
    if (this.messageQueue.length >= this.maxQueue) {
      this.messageQueue.shift();
    }
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    this.messageQueue.push({ destination, body });
    return id;
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

  public getCurrentGameId(): string | null {
    return this.currentGameId;
  }

  public getReconnectAttempts(): number {
    return this.reconnectAttempts;
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
      reconnectDelay: this.reconnectDelay,
    };

    this.client = new Client(stompConfig);
  }

  private onConnect(frame: any): void {
    console.log('WebSocket connected');
    this.isConnected = true;
    this.reconnectAttempts = 0;

    // 세션 ID 저장 (재연결에 사용)
    const sessionId = frame.headers?.['session'];
    if (sessionId) {
      localStorage.setItem('websocket-session-id', sessionId);
      console.log('Stored WebSocket session ID:', sessionId);
    }

    // Notify connection callbacks
    this.connectionCallbacks.forEach(callback => callback(true));

    // Re-subscribe to previous subscriptions if any
    if (this.currentGameId) {
      this.subscribeToGame(this.currentGameId);
    }

    this.flushQueue();
    toast.success('실시간 연결이 성공했습니다');
  }

  private onDisconnect(): void {
    console.log('WebSocket disconnected');
    this.isConnected = false;

    // Notify connection callbacks
    this.connectionCallbacks.forEach(callback => callback(false));

    // Clear subscriptions
    this.subscriptions.clear();

    // Attempt reconnection
    this.attemptReconnection();
    toast.error('실시간 연결이 끊어졌습니다');
  }

  private onError(error: any): void {
    console.error('STOMP Error:', error);
    toast.error('실시간 통신 오류가 발생했습니다');
  }

  private attemptReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      toast.error('재연결에 실패했습니다. 페이지를 새로고침해주세요.');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      if (!this.isConnected && this.client) {
        this.client.activate();
      }
    }, delay);
  }

  private handleGameEvent(message: IMessage): void {
    try {
      const event: GameEvent = JSON.parse(message.body);
      console.log('Received game event:', event);

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
      const chatMessage: ChatMessage = JSON.parse(message.body);
      console.log('Received chat message:', chatMessage);

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

// Export singleton instance
export const websocketService = new WebSocketService();
export default websocketService;
