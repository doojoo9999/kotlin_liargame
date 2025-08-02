import {Client} from '@stomp/stompjs'
import SockJS from 'sockjs-client'

/**
 * STOMP WebSocket client for admin monitoring
 * Handles real-time updates for game monitoring dashboard
 */
class AdminStompClient {
    constructor() {
        this.client = null
        this.isConnected = false
        this.subscriptions = new Map()
        this.reconnectAttempts = 0
        this.maxReconnectAttempts = 5
        this.reconnectDelay = 3000
    }

    /**
     * Connect to STOMP WebSocket server
     * @param {string} serverUrl - WebSocket server URL
     * @param {Object} options - Connection options
     */
    connect(serverUrl = 'http://localhost:20021', options = {}) {
        return new Promise((resolve, reject) => {
            try {
                console.log('[DEBUG_LOG] Connecting to STOMP server:', serverUrl)

                this.client = new Client({
                    webSocketFactory: () => new SockJS(`${serverUrl}/ws`),
                    connectHeaders: {
                        'Authorization': `Bearer ${localStorage.getItem('adminAccessToken')}`,
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
                    console.log('[DEBUG_LOG] STOMP connected:', frame)
                    this.isConnected = true
                    this.reconnectAttempts = 0
                    resolve(this.client)
                }

                this.client.onStompError = (frame) => {
                    console.error('[DEBUG_LOG] STOMP error:', frame)
                    this.isConnected = false
                    reject(new Error(`STOMP error: ${frame.headers['message']}`))
                }

                this.client.onWebSocketError = (error) => {
                    console.error('[DEBUG_LOG] WebSocket error:', error)
                    this.isConnected = false
                    reject(error)
                }

                this.client.onDisconnect = (frame) => {
                    console.log('[DEBUG_LOG] STOMP disconnected:', frame)
                    this.isConnected = false
                    this.handleReconnect()
                }

                this.client.activate()
            } catch (error) {
                console.error('[DEBUG_LOG] Failed to create STOMP client:', error)
                reject(error)
            }
        })
    }

    /**
     * Handle reconnection attempts
     */
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

    /**
     * Subscribe to a topic
     * @param {string} topic - Topic to subscribe to
     * @param {Function} callback - Callback function for messages
     * @returns {Object} Subscription object
     */
    subscribe(topic, callback) {
        if (!this.isConnected || !this.client) {
            console.warn('[DEBUG_LOG] STOMP not connected, cannot subscribe to:', topic)
            return null
        }

        console.log('[DEBUG_LOG] Subscribing to STOMP topic:', topic)

        const subscription = this.client.subscribe(topic, (message) => {
            try {
                const data = JSON.parse(message.body)
                console.log('[DEBUG_LOG] Received STOMP message from', topic, ':', data)
                callback(data)
            } catch (error) {
                console.error('[DEBUG_LOG] Failed to parse STOMP message:', error)
                callback(message.body)
            }
        })

        this.subscriptions.set(topic, subscription)
        return subscription
    }

    /**
     * Unsubscribe from a topic
     * @param {string} topic - Topic to unsubscribe from
     */
    unsubscribe(topic) {
        const subscription = this.subscriptions.get(topic)
        if (subscription) {
            console.log('[DEBUG_LOG] Unsubscribing from STOMP topic:', topic)
            subscription.unsubscribe()
            this.subscriptions.delete(topic)
        }
    }

    /**
     * Send a message to a destination
     * @param {string} destination - Destination to send to
     * @param {Object} body - Message body
     * @param {Object} headers - Additional headers
     */
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
        console.log('[DEBUG_LOG] Disconnecting from STOMP server')
        
        // Unsubscribe from all topics
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