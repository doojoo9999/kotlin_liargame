import type {IMessage, StompSubscription} from '@stomp/stompjs';
import {stompClient} from './stompClient';
import {logger} from '../utils/logger';
import {useSocketStore} from '../stores/socketStore';

type SubscriptionCallback = (message: IMessage) => void;

class SocketManager {
    private static instance: SocketManager;
    private client = stompClient;
    private subscriptions = new Map<string, { callback: SubscriptionCallback, subscription: StompSubscription | null }>();
    private connectionPromise: Promise<void> | null = null;
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private readonly HEARTBEAT_INTERVAL = 8000; // 8초마다 하트비트 전송 (백엔드 타임아웃 25초보다 충분히 짧게)

    private constructor() {
        this.client.onConnect = () => {
            useSocketStore.getState().setConnectionState('connected');
            logger.infoLog('WebSocket connected via SocketManager');
            this.startHeartbeat();
            this.resubscribeAll();
        };
        this.client.onDisconnect = () => {
            useSocketStore.getState().setConnectionState('idle');
            this.stopHeartbeat();
            logger.infoLog('WebSocket disconnected');
        };
        this.client.onStompError = (frame) => {
            useSocketStore.getState().setConnectionState('error');
            this.stopHeartbeat();
            logger.errorLog('STOMP Error', frame.headers['message'], frame.body);
        };
    }

    public static getInstance(): SocketManager {
        if (!SocketManager.instance) {
            SocketManager.instance = new SocketManager();
        }
        return SocketManager.instance;
    }

    public async subscribe(destination: string, callback: SubscriptionCallback): Promise<StompSubscription> {
        this.subscriptions.set(destination, { callback, subscription: null });
        await this.connect();

        const subInfo = this.subscriptions.get(destination);
        if (subInfo && subInfo.subscription) {
            logger.warnLog(`Returning existing subscription for ${destination}.`);
            return subInfo.subscription;
        }

        const subscription = this.client.subscribe(destination, callback);
        this.subscriptions.set(destination, { callback, subscription });
        logger.infoLog(`Subscribed to ${destination}`);
        return subscription;
    }

    public unsubscribe(destination: string) {
        const subInfo = this.subscriptions.get(destination);
        if (subInfo && subInfo.subscription) {
            subInfo.subscription.unsubscribe();
        }
        this.subscriptions.delete(destination);
        logger.infoLog(`Unsubscribed from ${destination}`);
    }

    public async publish(destination: string, body: string) {
        try {
            console.log('[SocketManager] Attempting to publish message:', { destination, body });
            console.log('[SocketManager] Current client state:', {
                active: this.client.active,
                connected: this.client.connected,
                state: this.client.state
            });

            await this.connect();

            if (!this.client.connected) {
                console.error('[SocketManager] Client not connected, cannot publish message');
                throw new Error('WebSocket client is not connected');
            }

            console.log('[SocketManager] Publishing message to:', destination);
            this.client.publish({ destination, body });
            console.log('[SocketManager] Message published successfully');
        } catch (error) {
            console.error('[SocketManager] Failed to publish message:', error);
            throw error;
        }
    }

    public disconnect() {
        try {
            console.log('[SocketManager] 연결 해제 시작');

            // 하트비트 중지
            this.stopHeartbeat();

            // 모든 구독 해제
            this.subscriptions.forEach((subInfo, destination) => {
                if (subInfo.subscription) {
                    console.log('[SocketManager] 구독 해제:', destination);
                    subInfo.subscription.unsubscribe();
                }
            });
            this.subscriptions.clear();

            // STOMP 클라이언트 비활성화
            if (this.client.active) {
                console.log('[SocketManager] STOMP 클라이언트 비활성화');
                this.client.deactivate();
            }

            // 연결 상태 초기화
            useSocketStore.getState().setConnectionState('idle');
            this.connectionPromise = null;

            console.log('[SocketManager] 연결 해제 완료');
        } catch (error) {
            console.error('[SocketManager] 연결 해제 중 오류:', error);
        }
    }

    // 호환성을 위한 on/off 메서드
    public on(event: string, callback: (message: IMessage) => void): void {
        logger.warnLog(`on() method called with event: ${event}. Use subscribe() instead.`);
        // 이벤트 기반 구독을 위한 래퍼
        void this.subscribe(`/topic/${event}`, callback);
    }

    public off(event: string): void {
        logger.warnLog(`off() method called with event: ${event}. Use unsubscribe() instead.`);
        // 이벤트 기반 구독 해제를 위한 래퍼
        this.unsubscribe(`/topic/${event}`);
    }

    private connect(): Promise<void> {
        const currentState = useSocketStore.getState().connectionState;
        if (currentState === 'connected') {
            return Promise.resolve();
        }
        if (this.connectionPromise) {
            return this.connectionPromise;
        }

        useSocketStore.getState().setConnectionState('connecting');
        this.connectionPromise = new Promise((resolve, reject) => {
            const originalOnConnect = this.client.onConnect;
            const originalOnStompError = this.client.onStompError;

            this.client.onConnect = (frame) => {
                originalOnConnect?.(frame);
                resolve();
                this.connectionPromise = null;
            };
            this.client.onStompError = (frame) => {
                originalOnStompError?.(frame);
                reject(new Error(frame.headers['message']));
                this.connectionPromise = null;
            };

            if (!this.client.active) {
                this.client.activate();
            }
        });
        return this.connectionPromise;
    }

    private resubscribeAll() {
        logger.infoLog('Resubscribing to all destinations after reconnect...');
        this.subscriptions.forEach((subInfo, destination) => {
            subInfo.subscription = this.client.subscribe(destination, subInfo.callback);
            logger.infoLog(`Successfully resubscribed to ${destination}`);
        });
    }

    private startHeartbeat() {
        this.stopHeartbeat(); // 기존 하트비트 정리

        // 하트비트 응답 구독
        this.subscribe('/user/topic/heartbeat', (message) => {
            const heartbeatResponse = JSON.parse(message.body);
            console.log('[SocketManager] Received heartbeat response:', heartbeatResponse);
        }).catch(error => {
            console.error('[SocketManager] Failed to subscribe to heartbeat response:', error);
        });

        this.heartbeatInterval = setInterval(() => {
            if (this.client.connected) {
                try {
                    console.log('[SocketManager] Sending heartbeat to backend');
                    this.client.publish({
                        destination: '/app/heartbeat',
                        body: JSON.stringify({
                            timestamp: new Date().toISOString(),
                            type: 'HEARTBEAT_PING'
                        })
                    });
                } catch (error) {
                    console.error('[SocketManager] Failed to send heartbeat:', error);
                }
            }
        }, this.HEARTBEAT_INTERVAL);

        console.log('[SocketManager] Heartbeat started with interval:', this.HEARTBEAT_INTERVAL);
    }

    private stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
            console.log('[SocketManager] Heartbeat stopped');
        }
    }
}

export const socketManager = SocketManager.getInstance();
