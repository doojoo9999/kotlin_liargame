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

    private constructor() {
        this.client.onConnect = () => {
            useSocketStore.getState().setConnectionState('connected');
            logger.infoLog('WebSocket connected via SocketManager');
            this.resubscribeAll();
        };
        this.client.onDisconnect = () => {
            useSocketStore.getState().setConnectionState('idle');
            logger.infoLog('WebSocket disconnected');
        };
        this.client.onStompError = (frame) => {
            useSocketStore.getState().setConnectionState('error');
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
        await this.connect();
        this.client.publish({ destination, body });
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
}

export const socketManager = SocketManager.getInstance();
