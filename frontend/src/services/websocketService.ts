import SockJS from 'sockjs-client';
import {Client, IMessage, StompConfig} from '@stomp/stompjs';
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
  }

  public subscribeToGame(gameId: string): void {
    if (!this.isConnected || !this.client) {
      console.warn('Cannot subscribe - WebSocket not connected');
      return;
    }

    this.currentGameId = gameId;

    // Subscribe to game events
    const gameEventSub = this.client.subscribe(
      `/topic/game/${gameId}`,
      this.handleGameEvent.bind(this)
    );
    this.subscriptions.set(`game-${gameId}`, gameEventSub);

    // Subscribe to chat messages
    const chatSub = this.client.subscribe(
      `/topic/game/${gameId}/chat`,
      this.handleChatMessage.bind(this)
    );
    this.subscriptions.set(`chat-${gameId}`, chatSub);

    console.log(`Subscribed to game: ${gameId}`);
  }

  public unsubscribeFromGame(gameId: string): void {
    const gameEventSub = this.subscriptions.get(`game-${gameId}`);
    if (gameEventSub) {
      gameEventSub.unsubscribe();
      this.subscriptions.delete(`game-${gameId}`);
    }

    const chatSub = this.subscriptions.get(`chat-${gameId}`);
    if (chatSub) {
      chatSub.unsubscribe();
      this.subscriptions.delete(`chat-${gameId}`);
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

  // Send methods
  public sendChatMessage(gameId: string, message: string): void {
    if (!this.isConnected || !this.client) {
      toast.error('실시간 연결이 필요합니다');
      return;
    }

    this.client.publish({
      destination: `/app/game/${gameId}/chat`,
      body: JSON.stringify({ message })
    });
  }

  public sendGameAction(gameId: string, action: string, payload: any = {}): void {
    if (!this.isConnected || !this.client) {
      toast.error('실시간 연결이 필요합니다');
      return;
    }

    this.client.publish({
      destination: `/app/game/${gameId}/${action}`,
      body: JSON.stringify(payload)
    });
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
    const socket = new SockJS('/ws');

    const stompConfig: StompConfig = {
      webSocketFactory: () => socket,
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

  private onConnect(): void {
    console.log('WebSocket connected');
    this.isConnected = true;
    this.reconnectAttempts = 0;

    // Notify connection callbacks
    this.connectionCallbacks.forEach(callback => callback(true));

    // Re-subscribe to previous subscriptions if any
    if (this.currentGameId) {
      this.subscribeToGame(this.currentGameId);
    }

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
}

// Export singleton instance
export const websocketService = new WebSocketService();
export default websocketService;
