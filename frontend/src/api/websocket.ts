// Enhanced WebSocket Client for Real-time Game Communication
import {API_CONFIG} from './client'

// WebSocket Event Types
export interface WebSocketEvents {
  // Connection Events
  CONNECT: 'connect'
  DISCONNECT: 'disconnect'
  RECONNECT: 'reconnect'
  ERROR: 'error'
  
  // Game Room Events
  PLAYER_JOINED: 'player_joined'
  PLAYER_LEFT: 'player_left'
  PLAYER_READY: 'player_ready'
  PLAYER_UNREADY: 'player_unready'
  PLAYER_READY_UPDATE: 'player_ready_update'
  ROOM_SETTINGS_UPDATED: 'room_settings_updated'
  
  // Enhanced Game Events
  COUNTDOWN_STARTED: 'countdown_started'
  COUNTDOWN_CANCELLED: 'countdown_cancelled'
  CONNECTION_STATUS_UPDATE: 'connection_status_update'
  VOTING_PROGRESS: 'voting_progress'
  PLAYER_RECONNECTED: 'player_reconnected'
  
  // Game Flow Events
  GAME_START: 'game_start'
  PHASE_CHANGE: 'phase_change'
  TURN_CHANGE: 'turn_change'
  ROUND_START: 'round_start'
  ROUND_END: 'round_end'
  GAME_END: 'game_end'
  
  // Player Actions
  PLAYER_VOTED: 'player_voted'
  DEFENSE_START: 'defense_start'
  DEFENSE_END: 'defense_end'
  WORD_GUESSED: 'word_guessed'
  
  // Chat Events
  CHAT_MESSAGE: 'chat_message'
  TYPING_START: 'typing_start'
  TYPING_STOP: 'typing_stop'
  
  // Timer Events
  TIMER_UPDATE: 'timer_update'
  TIMER_START: 'timer_start'
  TIMER_STOP: 'timer_stop'
  
  // System Events
  GAME_STATE_UPDATE: 'game_state_update'
  ERROR_MESSAGE: 'error_message'
  HEARTBEAT: 'heartbeat'
}

// Message Types
export interface WebSocketMessage<T = any> {
  type: keyof WebSocketEvents
  gameNumber?: number
  playerId?: string
  timestamp: string
  data: T
}

export interface GameStateUpdate {
  gameNumber: number
  gameState: 'WAITING' | 'IN_PROGRESS' | 'FINISHED'
  currentPhase: string
  players: Array<{
    id: string
    nickname: string
    isReady: boolean
    isHost: boolean
    isOnline: boolean
    isAlive?: boolean
    role?: string
  }>
  currentRound?: number
  totalRounds?: number
  timeRemaining?: number
  currentTurnPlayerId?: string
  votingResults?: any
}

export interface ChatMessage {
  id: string
  gameNumber: number
  playerId: string
  playerNickname: string
  content: string
  type: 'DISCUSSION' | 'HINT' | 'DEFENSE' | 'SYSTEM'
  timestamp: string
}

export interface PlayerAction {
  type: 'JOIN' | 'LEAVE' | 'READY' | 'UNREADY' | 'VOTE' | 'DEFEND' | 'GUESS_WORD'
  playerId: string
  playerNickname: string
  data?: any
}

// Connection States
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'

// WebSocket Client Configuration
interface WebSocketConfig {
  url: string
  reconnectAttempts: number
  reconnectDelay: number
  heartbeatInterval: number
  connectionTimeout: number
}

// Default Configuration
const DEFAULT_CONFIG: WebSocketConfig = {
  url: API_CONFIG.WS_URL,
  reconnectAttempts: 10,
  reconnectDelay: 1000,
  heartbeatInterval: 30000,
  connectionTimeout: 10000,
}

// Enhanced WebSocket Client
export class GameWebSocketClient {
  private ws: WebSocket | null = null
  private config: WebSocketConfig
  private connectionState: ConnectionState = 'disconnected'
  private reconnectAttempts = 0
  private heartbeatTimer: NodeJS.Timeout | null = null
  private connectionTimer: NodeJS.Timeout | null = null
  private eventHandlers: Map<string, Set<Function>> = new Map()
  private gameNumber: number | null = null
  private playerId: string | null = null
  private lastHeartbeat: number = 0

  constructor(config?: Partial<WebSocketConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  // Connection Management
  async connect(gameNumber?: number, playerId?: string): Promise<void> {
    if (this.connectionState === 'connected' || this.connectionState === 'connecting') {
      return
    }

    this.gameNumber = gameNumber || null
    this.playerId = playerId || null
    this.connectionState = 'connecting'
    this.emit('CONNECT', { state: 'connecting' })

    return new Promise((resolve, reject) => {
      try {
        // Build WebSocket URL with parameters
        let wsUrl = this.config.url
        const params = new URLSearchParams()
        
        if (this.gameNumber) params.append('gameNumber', this.gameNumber.toString())
        if (this.playerId) params.append('playerId', this.playerId)
        
        // Add auth token
        const token = localStorage.getItem('auth-token')
        if (token) params.append('token', token)

        if (params.toString()) {
          wsUrl += '?' + params.toString()
        }

        this.ws = new WebSocket(wsUrl)

        // Connection timeout
        this.connectionTimer = setTimeout(() => {
          if (this.connectionState === 'connecting') {
            this.ws?.close()
            this.connectionState = 'error'
            reject(new Error('Connection timeout'))
          }
        }, this.config.connectionTimeout)

        this.ws.onopen = () => {
          console.log('[WebSocket] Connected to game server')
          this.clearConnectionTimer()
          this.connectionState = 'connected'
          this.reconnectAttempts = 0
          this.startHeartbeat()
          this.emit('CONNECT', { state: 'connected' })
          resolve()
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data)
        }

        this.ws.onclose = (event) => {
          console.log('[WebSocket] Connection closed:', event.code, event.reason)
          this.clearConnectionTimer()
          this.stopHeartbeat()
          
          if (this.connectionState !== 'disconnected') {
            this.connectionState = 'disconnected'
            this.emit('DISCONNECT', { code: event.code, reason: event.reason })
            
            // Attempt reconnection unless explicitly closed
            if (event.code !== 1000) {
              this.handleReconnect()
            }
          }
        }

        this.ws.onerror = (error) => {
          console.error('[WebSocket] Connection error:', error)
          this.clearConnectionTimer()
          this.connectionState = 'error'
          this.emit('ERROR', { error, phase: 'connection' })
          reject(error)
        }

      } catch (error) {
        this.connectionState = 'error'
        this.emit('ERROR', { error, phase: 'setup' })
        reject(error)
      }
    })
  }

  disconnect(): void {
    this.connectionState = 'disconnected'
    this.clearConnectionTimer()
    this.stopHeartbeat()

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }

    this.emit('DISCONNECT', { code: 1000, reason: 'Client disconnect' })
  }

  // Send Messages
  send<T = any>(type: keyof WebSocketEvents, data: T): boolean {
    if (!this.isConnected()) {
      console.warn('[WebSocket] Cannot send message: not connected')
      return false
    }

    const message: WebSocketMessage<T> = {
      type,
      gameNumber: this.gameNumber || undefined,
      playerId: this.playerId || undefined,
      timestamp: new Date().toISOString(),
      data
    }

    try {
      this.ws!.send(JSON.stringify(message))

      if (process.env.NODE_ENV === 'development') {
        console.log('[WebSocket] Sent:', type, data)
      }

      return true
    } catch (error) {
      console.error('[WebSocket] Failed to send message:', error)
      this.emit('ERROR', { error, phase: 'message_send', message })
      return false
    }
  }

  // Event System
  on<T = any>(event: keyof WebSocketEvents, handler: (data: T) => void): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }

    this.eventHandlers.get(event)!.add(handler)

    // Return unsubscribe function
    return () => {
      this.eventHandlers.get(event)?.delete(handler)
    }
  }

  off(event: keyof WebSocketEvents, handler?: Function): void {
    if (handler) {
      this.eventHandlers.get(event)?.delete(handler)
    } else {
      this.eventHandlers.delete(event)
    }
  }

  // Utility Methods
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  getConnectionState(): ConnectionState {
    return this.connectionState
  }

  getReconnectAttempts(): number {
    return this.reconnectAttempts
  }

  updateGameContext(gameNumber: number, playerId: string): void {
    this.gameNumber = gameNumber
    this.playerId = playerId
  }

  // Game-specific convenience methods
  joinRoom(gameNumber: number, playerId: string): boolean {
    return this.send('PLAYER_JOINED', { gameNumber, playerId })
  }

  leaveRoom(): boolean {
    return this.send('PLAYER_LEFT', {})
  }

  setReady(ready: boolean): boolean {
    return this.send(ready ? 'PLAYER_READY' : 'PLAYER_UNREADY', { ready })
  }

  sendChat(message: string, type: 'DISCUSSION' | 'HINT' | 'DEFENSE' = 'DISCUSSION'): boolean {
    return this.send('CHAT_MESSAGE', { content: message, type })
  }

  castVote(targetPlayerId: string): boolean {
    return this.send('PLAYER_VOTED', { targetPlayerId })
  }

  startTyping(): boolean {
    return this.send('TYPING_START', {})
  }

  stopTyping(): boolean {
    return this.send('TYPING_STOP', {})
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.config.reconnectAttempts) {
      console.error('[WebSocket] Max reconnection attempts reached')
      this.connectionState = 'error'
      this.emit('ERROR', { error: 'Max reconnection attempts reached' })
      return
    }

    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      30000
    )

    this.reconnectAttempts++
    this.connectionState = 'reconnecting'
    this.emit('RECONNECT', {
      attempt: this.reconnectAttempts,
      maxAttempts: this.config.reconnectAttempts,
      delay
    })

    setTimeout(() => {
      if (this.connectionState === 'reconnecting') {
        console.log(`[WebSocket] Reconnection attempt ${this.reconnectAttempts}/${this.config.reconnectAttempts}`)
        this.connect(this.gameNumber || undefined, this.playerId || undefined)
      }
    }, delay)
  }

  // Message Handling
  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data)

      // Handle heartbeat responses
      if (message.type === 'HEARTBEAT') {
        this.lastHeartbeat = Date.now()
        return
      }

      // Log received message (in development)
      if (process.env.NODE_ENV === 'development') {
        console.log('[WebSocket] Received:', message.type, message.data)
      }

      // Emit to registered handlers
      this.emit(message.type, message.data)

    } catch (error) {
      console.error('[WebSocket] Failed to parse message:', error, data)
      this.emit('ERROR', { error, phase: 'message_parse', rawData: data })
    }
  }

  private emit<T = any>(event: keyof WebSocketEvents, data: T): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          console.error(`[WebSocket] Error in event handler for ${event}:`, error)
        }
      })
    }
  }

  // Heartbeat Management
  private startHeartbeat(): void {
    this.lastHeartbeat = Date.now()

    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.send('HEARTBEAT', { timestamp: Date.now() })

        // Check if we missed heartbeat responses
        const timeSinceLastHeartbeat = Date.now() - this.lastHeartbeat
        if (timeSinceLastHeartbeat > this.config.heartbeatInterval * 2) {
          console.warn('[WebSocket] Heartbeat timeout, reconnecting...')
          this.ws?.close(1006, 'Heartbeat timeout')
        }
      }
    }, this.config.heartbeatInterval)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private clearConnectionTimer(): void {
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer)
      this.connectionTimer = null
    }
  }
}

// Singleton instance
export const gameWebSocket = new GameWebSocketClient()

// React Hook for WebSocket
export function useGameWebSocket() {
  return gameWebSocket
}