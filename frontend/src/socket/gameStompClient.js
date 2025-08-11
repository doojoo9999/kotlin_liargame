import {Client} from '@stomp/stompjs'
import SockJS from 'sockjs-client'

class GameStompClient {
    constructor() {
        this.client = null
        this.isConnected = false
        this.subscriptions = new Map()
        this.reconnectAttempts = 0
        this.maxReconnectAttempts = 5
        this.reconnectDelay = 3000
        this.isConnecting = false
        this.connectionPromise = null
    }

            async connect(serverUrl = 'http://119.201.51.128:20021', options = {}) {
        // If already connected, return immediately
        if (this.isConnected && this.client && this.client.connected) {
            console.log('[DEBUG_LOG] Game STOMP already connected')
            return Promise.resolve(this.client)
        }

        // If already connecting, return the existing promise
        if (this.isConnecting && this.connectionPromise) {
            console.log('[DEBUG_LOG] Game STOMP connection already in progress')
            return this.connectionPromise
        }

        // Reset reconnect attempts when explicitly connecting
        this.reconnectAttempts = 0

        // 세션 상태 로깅
        console.log('[DEBUG_LOG] Starting WebSocket connection, cookies should be sent automatically')

        // Set connecting state and create new connection promise
        this.isConnecting = true
        this.connectionPromise = new Promise((resolve, reject) => {
            try {
                console.log('[DEBUG_LOG] Game STOMP connecting to:', serverUrl)

                // Clean up any existing client
                if (this.client) {
                    console.log('[DEBUG_LOG] Cleaning up existing client before new connection')
                    this.client.deactivate()
                    this.client = null
                }

                // 세션 기반 인증 사용 (JWT 토큰 제거)
                console.log('[DEBUG_LOG] Creating SockJS with withCredentials=true to ensure cookies are sent')

                this.client = new Client({
                    webSocketFactory: () => new SockJS(`${serverUrl}/ws`, null, {
                        withCredentials: true // 세션 쿠키 포함
                    }),
                    connectHeaders: {
                        ...options.headers
                    },
                    debug: (str) => {
                        console.log('[DEBUG_LOG] Game STOMP:', str)
                    },
                    reconnectDelay: this.reconnectDelay,
                    heartbeatIncoming: 4000,
                    heartbeatOutgoing: 4000,
                })

                this.client.onConnect = (frame) => {
                    console.log('[DEBUG_LOG] Game STOMP connected:', frame)

                    // 연결 성공 시 세션 정보 확인
                    console.log('[DEBUG_LOG] Connection headers:', frame.headers)
                    console.log('[DEBUG_LOG] Connection body:', frame.body)

                    // 상태 업데이트
                    this.isConnected = true
                    this.isConnecting = false
                    this.connectionPromise = null
                    this.reconnectAttempts = 0

                    // 사용자 정보 확인
                    fetch('/api/v1/auth/me', { credentials: 'include' })
                        .then(response => response.json())
                        .then(user => {
                            console.log('[DEBUG_LOG] Current user for WebSocket:', user)
                        })
                        .catch(error => {
                            console.error('[DEBUG_LOG] Failed to get user info:', error)
                        })

                    resolve(this.client)
                }

                this.client.onStompError = (frame) => {
                    console.error('[DEBUG_LOG] Game STOMP error:', frame)
                    this.isConnected = false
                    this.isConnecting = false
                    this.connectionPromise = null
                    reject(new Error(`STOMP error: ${frame.headers['message']}`))
                }

                this.client.onWebSocketError = (error) => {
                    console.error('[DEBUG_LOG] Game WebSocket error:', error)
                    this.isConnected = false
                    this.isConnecting = false
                    this.connectionPromise = null
                    reject(error)
                }

                this.client.onDisconnect = (frame) => {
                    console.log('[DEBUG_LOG] Game STOMP disconnected:', frame)
                    this.isConnected = false
                    this.isConnecting = false
                    this.connectionPromise = null
                    this.handleReconnect()
                }

                this.client.activate()
            } catch (error) {
                console.error('[DEBUG_LOG] Failed to create Game STOMP client:', error)
                reject(error)
            }
        })
    }

    handleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('[DEBUG_LOG] Max Game STOMP reconnection attempts reached')
            // Dispatch custom event to notify UI components
            window.dispatchEvent(new CustomEvent('websocket:maxRetriesReached', {
                detail: {
                    client: 'gameStompClient',
                    attempts: this.reconnectAttempts,
                    maxAttempts: this.maxReconnectAttempts
                }
            }))
            return
        }

        // Don't reconnect if already connected or connecting
        if (this.isConnected || this.isConnecting) {
            console.log('[DEBUG_LOG] Skipping reconnect - already connected or connecting')
            return
        }

        this.reconnectAttempts++
        console.log(`[DEBUG_LOG] Game STOMP reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)

        setTimeout(() => {
            // Double-check connection state before attempting reconnect
            if (!this.isConnected && !this.isConnecting && this.client) {
                console.log('[DEBUG_LOG] Attempting to reactivate STOMP client')
                this.client.activate()
            }
        }, this.reconnectDelay * this.reconnectAttempts)
    }

    // 게임방 구독
    subscribeToGameRoom(gameNumber, callback) {
        const topic = `/topic/room.${gameNumber}`
        return this.subscribe(topic, callback)
    }

    // 채팅 구독
    subscribeToGameChat(gameNumber, callback) {
        const topic = `/topic/chat.${gameNumber}`
        return this.subscribe(topic, callback)
    }

    // 플레이어 업데이트 구독
    subscribeToPlayerUpdates(gameNumber, callback) {
        const topic = `/topic/players.${gameNumber}`
        return this.subscribe(topic, callback)
    }

    subscribe(topic, callback, timeout = 10000) {
        // Check if already subscribed to this topic
        if (this.subscriptions.has(topic)) {
            console.log('[DEBUG_LOG] Already subscribed to topic:', topic, '- returning existing subscription')
            return Promise.resolve(this.subscriptions.get(topic))
        }

        // If already connected, subscribe immediately
        if (this.isConnected && this.client && this.client.connected) {
            return Promise.resolve(this._doSubscribe(topic, callback))
        }

        // If not connected, wait for connection then subscribe
        console.log('[DEBUG_LOG] Game STOMP not connected, waiting for connection to subscribe to:', topic)
        
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`Subscription timeout for topic: ${topic}`))
            }, timeout)

            const attemptSubscribe = async () => {
                try {
                    // Check again if already subscribed (race condition prevention)
                    if (this.subscriptions.has(topic)) {
                        clearTimeout(timeoutId)
                        console.log('[DEBUG_LOG] Subscription already exists for:', topic)
                        resolve(this.subscriptions.get(topic))
                        return
                    }

                    // Try to connect if not already connecting
                    if (!this.isConnected && !this.isConnecting) {
                        console.log('[DEBUG_LOG] Initiating connection for subscription to:', topic)
                        await this.connect()
                    }
                    
                    // Wait for connection to be established
                    if (this.connectionPromise) {
                        await this.connectionPromise
                    }
                    
                    // Double-check connection state and subscription status
                    if (this.isConnected && this.client && this.client.connected) {
                        // Final check for duplicate subscription
                        if (this.subscriptions.has(topic)) {
                            clearTimeout(timeoutId)
                            console.log('[DEBUG_LOG] Subscription created by another call for:', topic)
                            resolve(this.subscriptions.get(topic))
                            return
                        }
                        
                        clearTimeout(timeoutId)
                        const subscription = this._doSubscribe(topic, callback)
                        resolve(subscription)
                    } else {
                        throw new Error('Failed to establish connection for subscription')
                    }
                } catch (error) {
                    clearTimeout(timeoutId)
                    console.error('[DEBUG_LOG] Failed to subscribe after connection attempt:', error)
                    reject(error)
                }
            }

            attemptSubscribe()
        })
    }

    _doSubscribe(topic, callback) {
        // Check if already subscribed to this topic
        if (this.subscriptions.has(topic)) {
            console.log('[DEBUG_LOG] Already subscribed to topic:', topic, '- skipping duplicate subscription')
            return this.subscriptions.get(topic)
        }

        console.log('[DEBUG_LOG] Game STOMP subscribing to:', topic)

        const subscription = this.client.subscribe(topic, (message) => {
            try {
                const data = JSON.parse(message.body)
                console.log('[DEBUG_LOG] Game STOMP received from', topic, ':', data)
                callback(data)
            } catch (error) {
                console.error('[DEBUG_LOG] Failed to parse Game STOMP message:', error)
                callback(message.body)
            }
        })

        this.subscriptions.set(topic, subscription)
        return subscription
    }

    unsubscribe(topic) {
        const subscription = this.subscriptions.get(topic)
        if (subscription) {
            console.log('[DEBUG_LOG] Game STOMP unsubscribing from:', topic)
            subscription.unsubscribe()
            this.subscriptions.delete(topic)
        }
    }

    // 채팅 메시지 전송
    sendChatMessage(gameNumber, message) {
        const destination = `/app/chat.send`
        this.send(destination, {
            gameNumber: parseInt(gameNumber),
            content: message
        })
    }

    // 게임 액션 전송
    sendGameAction(gameNumber, action, data = {}) {
        const destination = `/app/game/${gameNumber}/${action}`
        this.send(destination, data)
    }

    send(destination, body = {}, headers = {}) {
        if (!this.isConnected || !this.client) {
            console.warn('[DEBUG_LOG] Game STOMP not connected, cannot send to:', destination)
            return false
        }

        console.log('[DEBUG_LOG] Game STOMP sending to', destination, ':', body)

        try {
            this.client.publish({
                destination,
                body: JSON.stringify(body),
                headers: {
                    'content-type': 'application/json',
                    ...headers
                }
            })
            return true
        } catch (error) {
            console.error('[DEBUG_LOG] Failed to send STOMP message:', error)
            return false
        }
    }

    disconnect() {
        console.log('[DEBUG_LOG] Game STOMP disconnecting')

        // 모든 구독 해제
        this.subscriptions.forEach((subscription, topic) => {
            this.unsubscribe(topic)
        })

        if (this.client) {
            this.client.deactivate()
            this.client = null
        }

        this.isConnected = false
        this.isConnecting = false
        this.connectionPromise = null
        this.reconnectAttempts = 0
    }

    isClientConnected() {
        return this.isConnected && this.client && this.client.connected
    }
}

// 싱글톤 인스턴스 생성
const gameStompClient = new GameStompClient()

export default gameStompClient