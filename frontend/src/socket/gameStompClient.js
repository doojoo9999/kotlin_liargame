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
    }

    connect(serverUrl = 'http://localhost:20021', options = {}) {
        return new Promise((resolve, reject) => {
            try {
                console.log('[DEBUG_LOG] Game STOMP connecting to:', serverUrl)

                // ✅ 일반 사용자 토큰 우선 사용
                const accessToken = localStorage.getItem('accessToken')
                const adminToken = localStorage.getItem('adminAccessToken')
                const token = accessToken || adminToken

                if (!token) {
                    console.error('[DEBUG_LOG] No authentication token found')
                    reject(new Error('No authentication token available'))
                    return
                }

                console.log('[DEBUG_LOG] Using token for WebSocket:', token.substring(0, 20) + '...')

                this.client = new Client({
                    webSocketFactory: () => new SockJS(`${serverUrl}/ws`),
                    connectHeaders: {
                        'Authorization': `Bearer ${token}`,
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
                    this.reconnectAttempts = 0
                    resolve(this.client)
                }

                this.client.onStompError = (frame) => {
                    console.error('[DEBUG_LOG] Game STOMP error:', frame)
                    this.isConnected = false
                    reject(new Error(`STOMP error: ${frame.headers['message']}`))
                }

                this.client.onWebSocketError = (error) => {
                    console.error('[DEBUG_LOG] Game WebSocket error:', error)
                    this.isConnected = false
                    reject(error)
                }

                this.client.onDisconnect = (frame) => {
                    console.log('[DEBUG_LOG] Game STOMP disconnected:', frame)
                    this.isConnected = false
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

        this.reconnectAttempts++
        console.log(`[DEBUG_LOG] Game STOMP reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)

        setTimeout(() => {
            if (!this.isConnected && this.client) {
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
        this.reconnectAttempts = 0
    }

    isClientConnected() {
        return this.isConnected && this.client && this.client.connected
    }
}

// 싱글톤 인스턴스 생성
const gameStompClient = new GameStompClient()

export default gameStompClient