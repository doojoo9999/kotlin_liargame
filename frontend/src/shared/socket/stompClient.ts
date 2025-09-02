import type {StompSubscription} from '@stomp/stompjs';
import {Client} from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import {logger} from '../utils/logger';

const base = (import.meta.env.VITE_WEBSOCKET_URL as string) || (import.meta.env.VITE_API_BASE_URL as string) || window.location.origin;
const normalized = base.endsWith('/ws') ? base : `${base.replace(/\/$/, '')}/ws`;
const WEBSOCKET_URL = normalized;

/**
 * This file is responsible for creating and configuring a single STOMP client instance.
 * It exports a DEACTIVATED client. The SocketManager is responsible for activating and managing it.
 * This separation of concerns makes the architecture cleaner.
 * - stompClient.ts: Low-level configuration (URL, timeouts, etc.)
 * - SocketManager.ts: High-level management (connection state, subscriptions, publishing)
 */
export const stompClient = new Client({
    webSocketFactory: () => {
        console.log('[stompClient] Creating WebSocket connection to:', WEBSOCKET_URL);
        return new SockJS(WEBSOCKET_URL);
    },
    debug: (str) => {
        if (import.meta.env.DEV) {
            console.log('[STOMP Debug]', str);
            logger.debugLog('STOMP Debug', str);
        }
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    // WebSocket 연결 시간 초과 설정
    connectionTimeout: 10000,
    // 더 나은 에러 처리를 위한 설정
    onWebSocketError: (event) => {
        console.error('[stompClient] WebSocket error:', event);
        logger.errorLog('WebSocket error:', event);
    },
    onWebSocketClose: (event) => {
        console.log('[stompClient] WebSocket closed:', event);
        logger.infoLog('WebSocket closed:', event);
    }
});

// Exporting StompSubscription type for convenience in other files
export type { StompSubscription };
