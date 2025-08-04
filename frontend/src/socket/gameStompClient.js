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

    connect(serverUrl = 'http://localhost:20021', options = {}) {
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
                this.client = new Client({
                    webSocketFactory: () => new SockJS(`${serverUrl}/ws`),
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
                    this.isConnected = true
                    this.isConnecting = false
                    this.connectionPromise = null
                    this.reconnectAttempts = 0
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
        const topic = `/topic/game.${gameNumber}`
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

    subscribe(topic, callback) {
        if (!this.isConnected || !this.client) {
            console.warn('[DEBUG_LOG] Game STOMP not connected, cannot subscribe to:', topic)
            return null
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
            gNumber: parseInt(gameNumber),
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