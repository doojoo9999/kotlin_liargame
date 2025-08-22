import type {StompSubscription} from '@stomp/stompjs';
import {Client} from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import {logger} from '../utils/logger';

const WEBSOCKET_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:20021'}/ws`;

/**
 * This file is responsible for creating and configuring a single STOMP client instance.
 * It exports a DEACTIVATED client. The SocketManager is responsible for activating and managing it.
 * This separation of concerns makes the architecture cleaner.
 * - stompClient.ts: Low-level configuration (URL, timeouts, etc.)
 * - SocketManager.ts: High-level management (connection state, subscriptions, publishing)
 */
export const stompClient = new Client({
    webSocketFactory: () => new SockJS(WEBSOCKET_URL),
    debug: (str) => {
        if (import.meta.env.DEV) {
            logger.debugLog('STOMP Debug', str);
        }
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
});

// Exporting StompSubscription type for convenience in other files
export type { StompSubscription };
