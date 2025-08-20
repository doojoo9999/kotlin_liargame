import {Client} from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class StompClient {
  constructor() {
    this.stompClient = null;
    this.subscriptions = new Map();
  }

  connect(url, onConnectCallback) {
    if (this.stompClient && this.stompClient.active) {
      console.log('STOMP client is already connected.');
      return;
    }

    const socketFactory = () => new SockJS(url);

    this.stompClient = new Client({
      webSocketFactory: socketFactory,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('STOMP client connected.');
        if (onConnectCallback) {
          onConnectCallback();
        }
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
      },
    });

    this.stompClient.activate();
  }

  disconnect() {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
      this.subscriptions.clear();
      console.log('STOMP client disconnected.');
    }
  }

  subscribe(destination, callback) {
    if (this.stompClient && this.stompClient.active) {
      if (this.subscriptions.has(destination)) {
        console.warn(`Already subscribed to ${destination}.`);
        return;
      }
      const subscription = this.stompClient.subscribe(destination, (message) => {
        callback(JSON.parse(message.body));
      });
      this.subscriptions.set(destination, subscription);
      return subscription;
    } else {
      console.error('STOMP client is not connected.');
    }
  }

  unsubscribe(destination) {
    if (this.subscriptions.has(destination)) {
      this.subscriptions.get(destination).unsubscribe();
      this.subscriptions.delete(destination);
    }
  }

  publish({ destination, body }) {
    if (this.stompClient && this.stompClient.active) {
      this.stompClient.publish({
        destination,
        body: JSON.stringify(body),
      });
    } else {
      console.error('STOMP client is not connected.');
    }
  }
}

// Export a singleton instance
export const stompClient = new StompClient();
