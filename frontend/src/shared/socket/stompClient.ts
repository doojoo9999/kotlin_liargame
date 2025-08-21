import {Client, type IFrame, type IMessage} from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WEBSOCKET_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:20021'}/ws`;

class StompClient {
  private client: Client;

  constructor() {
    this.client = new Client({
      webSocketFactory: () => new SockJS(WEBSOCKET_URL),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('WebSocket connected');
        // TODO: Handle automatic re-subscription on reconnect
      },
      onStompError: (frame: IFrame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
      },
    });
  }

  public connect() {
    if (!this.client.active) {
      this.client.activate();
    }
  }

  public disconnect() {
    if (this.client.active) {
      this.client.deactivate();
    }
  }

  public subscribe(destination: string, callback: (message: IMessage) => void) {
    // The subscribe method returns a subscription object with an `unsubscribe` method
    const subscription = this.client.subscribe(destination, callback);
    return subscription;
  }

  public publish(destination: string, body: string) {
    this.client.publish({ destination, body });
  }
}

export const stompClient = new StompClient();
