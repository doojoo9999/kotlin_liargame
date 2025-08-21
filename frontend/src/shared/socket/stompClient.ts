import {Client, type IFrame, type IMessage, type StompSubscription} from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WEBSOCKET_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:20021'}/ws`;

type SubscriptionCallback = (message: IMessage) => void;
interface SubscriptionRequest {
  destination: string;
  callback: SubscriptionCallback;
  subscription?: StompSubscription; // To store the actual subscription object
}

class StompClient {
  private client: Client;
  private subscriptionQueue: Map<string, SubscriptionRequest> = new Map();

  constructor() {
    this.client = new Client({
      webSocketFactory: () => new SockJS(WEBSOCKET_URL),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('WebSocket connected');
        this.processSubscriptionQueue();
      },
      onStompError: (frame: IFrame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
      },
    });
  }

  public connect() {
    if (!this.client.active && !this.client.connected) {
      this.client.activate();
    }
  }

  public subscribe(destination: string, callback: SubscriptionCallback) {
    const request: SubscriptionRequest = { destination, callback };
    this.subscriptionQueue.set(destination, request);

    if (this.client.active) {
      request.subscription = this.client.subscribe(destination, callback);
    }

    // Return a custom unsubscribe function
    return {
      unsubscribe: () => {
        request.subscription?.unsubscribe();
        this.subscriptionQueue.delete(destination);
        console.log(`Unsubscribed from ${destination}`);
      },
    };
  }

  public disconnect() {
    if (this.client.active) {
      this.client.deactivate();
    }
  }

  public isActive(): boolean {
    return this.client.active;
  }

  public publish(destination: string, body: string) {
    this.client.publish({ destination, body });
  }

  private processSubscriptionQueue() {
    this.subscriptionQueue.forEach((req) => {
      console.log(`Processing subscription for: ${req.destination}`);
      req.subscription = this.client.subscribe(req.destination, req.callback);
    });
  }
}

export const stompClient = new StompClient();
