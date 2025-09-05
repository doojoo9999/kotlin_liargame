import {Client, IMessage, StompSubscription} from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import {useSocketStore} from '@/shared/stores/socketStore'
import {logger} from '@/shared/utils/logger'

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface WebSocketConfig {
  url: string
  heartbeatIncoming?: number
  heartbeatOutgoing?: number
  reconnectDelay?: number
  maxReconnectAttempts?: number
}

export interface Subscription {
  destination: string
  unsubscribe: () => void
}

class MainWebSocketManager {
  private static instance: MainWebSocketManager
  private client: Client
  private config: WebSocketConfig
  private subscriptions = new Map<string, { callback: (message: any) => void; subscription: StompSubscription | null }>()
  private reconnectAttempts = 0
  private reconnectTimer: NodeJS.Timeout | null = null
  private connectionPromise: Promise<void> | null = null
  private pingInterval: NodeJS.Timeout | null = null
  private lastPingTime = 0
  private latency = 0

  private constructor(config: WebSocketConfig) {
    this.config = {
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      reconnectDelay: 1000,
      maxReconnectAttempts: 5,
      ...config
    }

    this.client = new Client({
      webSocketFactory: () => new SockJS(this.config.url),
      heartbeatIncoming: this.config.heartbeatIncoming,
      heartbeatOutgoing: this.config.heartbeatOutgoing,
      reconnectDelay: this.config.reconnectDelay,
      onConnect: this.onConnect.bind(this),
      onDisconnect: this.onDisconnect.bind(this),
      onStompError: this.onError.bind(this),
      onWebSocketClose: this.onWebSocketClose.bind(this),
      debug: (str) => {
        if (import.meta.env.DEV) {
          logger.infoLog('[WebSocket]', str)
        }
      }
    })
  }

  public static getInstance(config?: WebSocketConfig): MainWebSocketManager {
    if (!MainWebSocketManager.instance) {
      if (!config) {
        throw new Error('WebSocket config is required for first initialization')
      }
      MainWebSocketManager.instance = new MainWebSocketManager(config)
    }
    return MainWebSocketManager.instance
  }

  public async connect(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      useSocketStore.getState().setConnectionState('connecting')

      const onConnect = () => {
        this.client.onConnect = this.onConnect.bind(this)
        resolve()
      }

      const onError = (error: any) => {
        this.client.onConnect = this.onConnect.bind(this)
        reject(error)
      }

      this.client.onConnect = onConnect
      this.client.onStompError = onError
      this.client.activate()
    })

    try {
      await this.connectionPromise
    } finally {
      this.connectionPromise = null
    }
  }

  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    this.stopPingMonitoring()
    this.subscriptions.clear()

    if (this.client.connected) {
      this.client.deactivate()
    }

    useSocketStore.getState().setConnectionState('disconnected')
  }

  public subscribe(destination: string, callback: (message: any) => void): Subscription {
    this.subscriptions.set(destination, { callback, subscription: null })

    if (this.client.connected) {
      const subscription = this.client.subscribe(destination, (message: IMessage) => {
        try {
          const data = JSON.parse(message.body)
          callback(data)
        } catch (error) {
          logger.errorLog('[WebSocket] Failed to parse message:', error)
          callback(message.body)
        }
      })

      this.subscriptions.set(destination, { callback, subscription })
      logger.infoLog(`[WebSocket] Subscribed to ${destination}`)
    }

    return {
      destination,
      unsubscribe: () => this.unsubscribe(destination)
    }
  }

  public unsubscribe(destination: string): void {
    const sub = this.subscriptions.get(destination)
    if (sub?.subscription) {
      sub.subscription.unsubscribe()
    }
    this.subscriptions.delete(destination)
    logger.infoLog(`[WebSocket] Unsubscribed from ${destination}`)
  }

  public send(destination: string, message: any): void {
    if (!this.client.connected) {
      logger.warnLog('[WebSocket] Cannot send message - not connected')
      return
    }

    try {
      this.client.publish({
        destination,
        body: JSON.stringify(message)
      })
    } catch (error) {
      logger.errorLog('[WebSocket] Failed to send message:', error)
    }
  }

  public getConnectionState(): ConnectionState {
    return useSocketStore.getState().connectionState
  }

  public getLatency(): number {
    return this.latency
  }

  public isConnected(): boolean {
    return this.client.connected
  }

  private onConnect(): void {
    logger.infoLog('[WebSocket] Connected successfully')
    useSocketStore.getState().setConnectionState('connected')
    this.reconnectAttempts = 0
    this.startPingMonitoring()
    this.resubscribeAll()
  }

  private onDisconnect(): void {
    logger.infoLog('[WebSocket] Disconnected')
    useSocketStore.getState().setConnectionState('disconnected')
    this.stopPingMonitoring()
    this.attemptReconnect()
  }

  private onError(frame: any): void {
    logger.errorLog('[WebSocket] STOMP Error:', frame.headers?.message, frame.body)
    useSocketStore.getState().setConnectionState('error')
  }

  private onWebSocketClose(event: CloseEvent): void {
    logger.warnLog('[WebSocket] Connection closed:', event.code, event.reason)
    if (!event.wasClean) {
      this.attemptReconnect()
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts!) {
      logger.errorLog('[WebSocket] Max reconnection attempts reached')
      useSocketStore.getState().setConnectionState('error')
      return
    }

    this.reconnectAttempts++
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000)

    logger.infoLog(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)

    this.reconnectTimer = setTimeout(() => {
      this.connect()
    }, delay)
  }

  private startPingMonitoring(): void {
    this.pingInterval = setInterval(() => {
      this.sendPing()
    }, 30000) // 30초마다 핑
  }

  private stopPingMonitoring(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }

  private sendPing(): void {
    if (this.client.connected) {
      this.lastPingTime = Date.now()
      this.client.publish({
        destination: '/app/ping',
        body: JSON.stringify({ timestamp: this.lastPingTime })
      })
    }
  }

  private handlePong(message: IMessage): void {
    try {
      const data = JSON.parse(message.body)
      this.latency = Date.now() - data.timestamp
      useSocketStore.getState().setLatency(this.latency)
    } catch (error) {
      logger.errorLog('[WebSocket] Failed to parse pong message:', error)
    }
  }

  private resubscribeAll(): void {
    for (const [destination, { callback }] of this.subscriptions) {
      if (this.client.connected) {
        const subscription = this.client.subscribe(destination, (message: IMessage) => {
          try {
            const data = JSON.parse(message.body)
            callback(data)
          } catch (error) {
            logger.errorLog('[WebSocket] Failed to parse message:', error)
            callback(message.body)
          }
        })
        this.subscriptions.set(destination, { callback, subscription })
      }
    }
    logger.infoLog('[WebSocket] Resubscribed to all topics')
  }
}

export { MainWebSocketManager }
