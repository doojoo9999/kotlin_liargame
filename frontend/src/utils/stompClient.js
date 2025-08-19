import {Client} from '@stomp/stompjs'
import SockJS from 'sockjs-client'


class AdminStompClient {
    constructor() {
        this.client = null
        this.isConnected = false
        this.subscriptions = new Map()      // topic -> Subscription (세션 종속)
        this.topicHandlers = new Map()      // topic -> handler (논리적 구독)
        this.reconnectAttempts = 0
        this.maxReconnectAttempts = 5
        this.reconnectDelay = 3000
        this.isConnecting = false
        this.connectionPromise = null
    }


    connect(serverUrl = 'http://localhost:20021', options = {}) {
        // If already connected, return immediately
        if (this.isConnected && this.client && this.client.connected) {
            console.log('[DEBUG_LOG] Admin STOMP already connected')
            return Promise.resolve(this.client)
        }

        // If already connecting, return the existing promise
        if (this.isConnecting && this.connectionPromise) {
            console.log('[DEBUG_LOG] Admin STOMP connection already in progress')
            return this.connectionPromise
        }

        // Reset reconnect attempts when explicitly connecting
        this.reconnectAttempts = 0

        // Set connecting state and create new connection promise
        this.isConnecting = true
        this.connectionPromise = new Promise((resolve, reject) => {
            try {
                console.log('[DEBUG_LOG] Connecting to STOMP server:', serverUrl)

                // Clean up any existing client
                if (this.client) {
                    console.log('[DEBUG_LOG] Cleaning up existing admin client before new connection')
                    this.client.deactivate()
                    this.client = null
                }

                this.client = new Client({
                    webSocketFactory: () => new SockJS(`${serverUrl}/ws`, null, {
                        withCredentials: true // 세션 쿠키 포함
                    }),
                    connectHeaders: {
                        ...options.headers
                    },
                    debug: (str) => {
                        console.log('[DEBUG_LOG] STOMP:', str)
                    },
                    reconnectDelay: this.reconnectDelay,
                    heartbeatIncoming: 4000,
                    heartbeatOutgoing: 4000,
                })

                this.client.onConnect = (frame) => {
                    console.log('[DEBUG_LOG] Admin STOMP connected:', frame)
                    this.isConnected = true
                    this.isConnecting = false
                    this.connectionPromise = null
                    this.reconnectAttempts = 0

                    // 세션마다 재구독 - 보존된 토픽 목록을 순회하며 재구독 수행
                    this.subscriptions.clear()
                    this.topicHandlers.forEach((handler, topic) => {
                        console.log('[DEBUG_LOG] Restoring admin subscription for topic:', topic)
                        const subscription = this.client.subscribe(topic, (message) => {
                            try {
                                const data = JSON.parse(message.body)
                                console.log('[DEBUG_LOG] Received admin STOMP message from', topic, ':', data)
                                handler(data)
                            } catch (error) {
                                console.error('[DEBUG_LOG] Failed to parse admin STOMP message:', error)
                                handler(message.body)
                            }
                        })
                        this.subscriptions.set(topic, subscription)
                    })

                    resolve(this.client)
                }

                this.client.onStompError = (frame) => {
                    console.error('[DEBUG_LOG] Admin STOMP error:', frame)
                    this.isConnected = false
                    this.isConnecting = false
                    this.connectionPromise = null
                    reject(new Error(`STOMP error: ${frame.headers['message']}`))
                }

                this.client.onWebSocketError = (error) => {
                    console.error('[DEBUG_LOG] Admin WebSocket error:', error)
                    this.isConnected = false
                    this.isConnecting = false
                    this.connectionPromise = null
                    reject(error)
                }

                this.client.onDisconnect = (frame) => {
                    console.log('[DEBUG_LOG] Admin STOMP disconnected:', frame)
                    this.isConnected = false
                    this.isConnecting = false
                    this.connectionPromise = null
                    // onDisconnect 시에는 실제 subscription Map만 비우고, 토픽→핸들러 Map은 유지
                    this.subscriptions.clear()
                    this.handleReconnect()
                }

                this.client.activate()
            } catch (error) {
                console.error('[DEBUG_LOG] Failed to create Admin STOMP client:', error)
                this.isConnecting = false
                this.connectionPromise = null
                reject(error)
            }
        })
        return this.connectionPromise
    }

    handleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('[DEBUG_LOG] Max STOMP reconnection attempts reached')
            return
        }

        this.reconnectAttempts++
        console.log(`[DEBUG_LOG] STOMP reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)

        setTimeout(() => {
            if (!this.isConnected && this.client) {
                this.client.activate()
            }
        }, this.reconnectDelay * this.reconnectAttempts)
    }


    subscribe(topic, callback) {
        // 논리적 구독 보관 - 핸들러를 항상 저장
        if (!this.topicHandlers.has(topic)) {
            this.topicHandlers.set(topic, callback)
        }

        // 이미 물리적으로 구독되어 있으면 기존 구독 반환
        if (this.subscriptions.has(topic)) {
            console.log('[DEBUG_LOG] Already subscribed to admin topic:', topic, '- returning existing subscription')
            return this.subscriptions.get(topic)
        }

        // 연결되어 있으면 즉시 물리적 구독, 아니면 onConnect에서 복원
        if (!this.isConnected || !this.client) {
            console.warn('[DEBUG_LOG] Admin STOMP not connected, subscription will be restored on reconnection:', topic)
            return null
        }

        console.log('[DEBUG_LOG] Subscribing to admin STOMP topic:', topic)

        const subscription = this.client.subscribe(topic, (message) => {
            try {
                const data = JSON.parse(message.body)
                console.log('[DEBUG_LOG] Received admin STOMP message from', topic, ':', data)
                callback(data)
            } catch (error) {
                console.error('[DEBUG_LOG] Failed to parse admin STOMP message:', error)
                callback(message.body)
            }
        })

        this.subscriptions.set(topic, subscription)
        return subscription
    }


    unsubscribe(topic) {
        const subscription = this.subscriptions.get(topic)
        if (subscription) {
            console.log('[DEBUG_LOG] Unsubscribing from admin STOMP topic:', topic)
            subscription.unsubscribe()
        }
        // 두 Map 모두에서 제거 (논리적 구독도 해제)
        this.subscriptions.delete(topic)
        this.topicHandlers.delete(topic)
    }

    send(destination, body = {}, headers = {}) {
        if (!this.isConnected || !this.client) {
            console.warn('[DEBUG_LOG] STOMP not connected, cannot send message to:', destination)
            return
        }

        console.log('[DEBUG_LOG] Sending STOMP message to', destination, ':', body)
        this.client.publish({
            destination,
            body: JSON.stringify(body),
            headers: {
                'content-type': 'application/json',
                ...headers
            }
        })
    }

    /**
     * Disconnect from STOMP server
     */
    disconnect() {
        console.log('[DEBUG_LOG] Disconnecting from admin STOMP server')
        
        // 의도적 종료: 모든 구독 해제 및 두 Map 모두 정리
        this.subscriptions.forEach((subscription, topic) => {
            subscription.unsubscribe()
        })
        this.subscriptions.clear()
        this.topicHandlers.clear()

        if (this.client) {
            this.client.deactivate()
            this.client = null
        }
        
        this.isConnected = false
        this.isConnecting = false
        this.connectionPromise = null
        this.reconnectAttempts = 0
    }

    /**
     * Check if client is connected
     * @returns {boolean} Connection status
     */
    isClientConnected() {
        return this.isConnected && this.client && this.client.connected
    }
}

// Create singleton instance
const adminStompClient = new AdminStompClient()

export default adminStompClient