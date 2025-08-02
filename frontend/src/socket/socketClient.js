import {io} from 'socket.io-client'

/**
 * WebSocket client for Liar Game real-time communication
 * Handles connection, room management, chat, and player synchronization
 */

class SocketClient {
  constructor() {
    this.socket = null
    this.isConnected = false
    this.currentRoom = null
    this.eventListeners = new Map()
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000
  }

  /**
   * Connect to WebSocket server
   * @param {string} serverUrl - WebSocket server URL
   * @param {Object} options - Connection options
   */
  connect(serverUrl, options = {}) {
    try {
      console.log('[DEBUG_LOG] Connecting to WebSocket server:', serverUrl)
      
      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        ...options
      })

      this.setupEventListeners()
      return this.socket
    } catch (error) {
      console.error('[DEBUG_LOG] Failed to connect to WebSocket:', error)
      throw error
    }
  }

  /**
   * Setup basic WebSocket event listeners
   */
  setupEventListeners() {
    if (!this.socket) return

    // Connection events
    this.socket.on('connect', () => {
      console.log('[DEBUG_LOG] WebSocket connected')
      this.isConnected = true
      this.reconnectAttempts = 0
      this.emit('connection_status', { connected: true })
    })

    this.socket.on('disconnect', (reason) => {
      console.log('[DEBUG_LOG] WebSocket disconnected:', reason)
      this.isConnected = false
      this.emit('connection_status', { connected: false, reason })
      
      // Auto-reconnect if not manually disconnected
      if (reason !== 'io client disconnect') {
        this.handleReconnect()
      }
    })

    this.socket.on('connect_error', (error) => {
      console.error('[DEBUG_LOG] WebSocket connection error:', error)
      this.emit('connection_error', error)
      this.handleReconnect()
    })

    // Chat events
    this.socket.on('receiveMessage', (data) => {
      console.log('[DEBUG_LOG] Received message:', data)
      this.emit('receiveMessage', data)
    })

    // Player events
    this.socket.on('updatePlayers', (players) => {
      console.log('[DEBUG_LOG] Players updated:', players)
      this.emit('updatePlayers', players)
    })

    this.socket.on('currentTurn', (playerId) => {
      console.log('[DEBUG_LOG] Current turn player:', playerId)
      this.emit('currentTurn', playerId)
    })

    // Room events
    this.socket.on('roomUpdate', (roomData) => {
      console.log('[DEBUG_LOG] Room updated:', roomData)
      this.emit('roomUpdate', roomData)
    })

    // Game events
    this.socket.on('gameStateUpdate', (gameState) => {
      console.log('[DEBUG_LOG] Game state updated:', gameState)
      this.emit('gameStateUpdate', gameState)
    })
  }

  /**
   * Handle reconnection attempts
   */
  handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[DEBUG_LOG] Max reconnection attempts reached')
      this.emit('max_reconnect_attempts_reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    
    console.log(`[DEBUG_LOG] Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`)
    
    setTimeout(() => {
      if (this.socket && !this.isConnected) {
        this.socket.connect()
      }
    }, delay)
  }

  /**
   * Join a game room
   * @param {number} roomId - Room ID to join
   * @param {string} userId - User ID
   */
  joinRoom(roomId, userId) {
    if (!this.socket || !this.isConnected) {
      console.warn('[DEBUG_LOG] Cannot join room: not connected')
      return
    }

    console.log('[DEBUG_LOG] Joining room:', roomId)
    this.currentRoom = roomId
    this.socket.emit('joinRoom', { roomId, userId })
  }

  /**
   * Leave current room
   */
  leaveRoom() {
    if (!this.socket || !this.currentRoom) {
      console.warn('[DEBUG_LOG] Cannot leave room: not in a room')
      return
    }

    console.log('[DEBUG_LOG] Leaving room:', this.currentRoom)
    this.socket.emit('leaveRoom', { roomId: this.currentRoom })
    this.currentRoom = null
  }

  /**
   * Send a chat message
   * @param {string} message - Message content
   * @param {string} sender - Sender name
   */
  sendMessage(message, sender) {
    if (!this.socket || !this.isConnected || !this.currentRoom) {
      console.warn('[DEBUG_LOG] Cannot send message: not connected or not in room')
      return
    }

    const messageData = {
      roomId: this.currentRoom,
      message,
      sender,
      timestamp: new Date().toISOString()
    }

    console.log('[DEBUG_LOG] Sending message:', messageData)
    this.socket.emit('sendMessage', messageData)
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event).push(callback)
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback to remove
   */
  off(event, callback) {
    if (!this.eventListeners.has(event)) return
    
    const listeners = this.eventListeners.get(event)
    const index = listeners.indexOf(callback)
    if (index > -1) {
      listeners.splice(index, 1)
    }
  }

  /**
   * Emit event to listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (!this.eventListeners.has(event)) return
    
    this.eventListeners.get(event).forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error(`[DEBUG_LOG] Error in event listener for ${event}:`, error)
      }
    })
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.socket) {
      console.log('[DEBUG_LOG] Disconnecting from WebSocket')
      this.leaveRoom()
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
      this.currentRoom = null
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      currentRoom: this.currentRoom,
      reconnectAttempts: this.reconnectAttempts
    }
  }
}

// Create singleton instance
const socketClient = new SocketClient()

/**
 * Dummy WebSocket simulation for testing without backend
 */
class DummySocketClient {
  constructor() {
    this.isConnected = false
    this.currentRoom = null
    this.eventListeners = new Map()
    this.dummyMessages = [
      { id: 1, sender: 'System', message: '게임이 시작되었습니다!', isSystem: true },
      { id: 2, sender: 'Player1', message: '안녕하세요!' },
      { id: 3, sender: 'Player2', message: '반갑습니다!' }
    ]
    this.dummyPlayers = [
      { id: 1, nickname: 'Player1', avatarUrl: 'https://via.placeholder.com/60/FF5733/FFFFFF?text=P1', isHost: true },
      { id: 2, nickname: 'Player2', avatarUrl: 'https://via.placeholder.com/60/33FF57/FFFFFF?text=P2', isHost: false },
      { id: 3, nickname: 'Player3', avatarUrl: 'https://via.placeholder.com/60/3357FF/FFFFFF?text=P3', isHost: false },
      { id: 4, nickname: 'Player4', avatarUrl: 'https://via.placeholder.com/60/FF33F5/FFFFFF?text=P4', isHost: false }
    ]
    this.messageId = 4
    this.gameInProgress = false
    this.currentGamePhase = 'WAITING'
    this.currentTurnIndex = 0
    this.liarId = 2 // Player2 is the liar in simulation
  }

  // Add socket property to simulate real socket behavior
  get socket() {
    return {
      emit: (event, data) => {
        console.log('[DEBUG_LOG] Dummy WebSocket: Received emit', event, data)

        if (event === 'startGame') {
          this.simulateGameStart()
        } else if (event === 'castVote') {
          this.simulateVoteCast(data.targetPlayerId)
        }
      }
    }
  }

  connect(serverUrl, options = {}) {
    console.log('[DEBUG_LOG] Dummy WebSocket: Simulating connection to', serverUrl)

    setTimeout(() => {
      this.isConnected = true
      this.emit('connection_status', { connected: true })
      console.log('[DEBUG_LOG] Dummy WebSocket: Connected')
    }, 1000)

    return this
  }

  joinRoom(roomId, userId) {
    console.log('[DEBUG_LOG] Dummy WebSocket: Joining room', roomId)
    this.currentRoom = roomId

    // Simulate receiving initial room data
    setTimeout(() => {
      this.emit('updatePlayers', this.dummyPlayers)
      this.emit('receiveMessage', {
        id: this.messageId++,
        sender: 'System',
        message: `${userId}님이 입장했습니다.`,
        isSystem: true,
        timestamp: new Date().toISOString()
      })
    }, 500)
  }

  leaveRoom() {
    console.log('[DEBUG_LOG] Dummy WebSocket: Leaving room')
    this.currentRoom = null
  }

  sendMessage(message, sender) {
    console.log('[DEBUG_LOG] Dummy WebSocket: Sending message', { message, sender })

    // Echo the message back
    setTimeout(() => {
      this.emit('receiveMessage', {
        id: this.messageId++,
        sender,
        message,
        isSystem: false,
        timestamp: new Date().toISOString()
      })
    }, 100)

    // Simulate other players responding (only during speaking phase)
    if (this.currentGamePhase === 'SPEAKING') {
      setTimeout(() => {
        const responses = [
          '좋은 생각이네요!',
          '동의합니다.',
          '흥미로운 관점이에요.',
          '저도 그렇게 생각해요.'
        ]
        const randomResponse = responses[Math.floor(Math.random() * responses.length)]
        const randomPlayer = this.dummyPlayers[Math.floor(Math.random() * this.dummyPlayers.length)]

        this.emit('receiveMessage', {
          id: this.messageId++,
          sender: randomPlayer.nickname,
          message: randomResponse,
          isSystem: false,
          timestamp: new Date().toISOString()
        })
      }, 2000 + Math.random() * 3000)
    }
  }

  simulateGameStart() {
    if (this.gameInProgress) return
    
    console.log('[DEBUG_LOG] Dummy WebSocket: Starting game simulation')
    this.gameInProgress = true
    this.currentGamePhase = 'STARTING'
    
    // 1. Game started event
    setTimeout(() => {
      this.emit('gameStarted', { round: 1 })
    }, 500)
    
    // 2. Assign roles
    setTimeout(() => {
      // Assign liar role to current user (for testing)
      this.emit('assignRole', { 
        role: 'LIAR', 
        keyword: '가짜 키워드' 
      })
    }, 1500)
    
    // 3. Start speaking phase
    setTimeout(() => {
      this.currentGamePhase = 'SPEAKING'
      this.startSpeakingRounds()
    }, 2500)
  }

  startSpeakingRounds() {
    const speakingOrder = [...this.dummyPlayers]
    let currentIndex = 0
    
    const nextTurn = () => {
      if (currentIndex >= speakingOrder.length) {
        // All players have spoken, start voting
        setTimeout(() => {
          this.startVoting()
        }, 2000)
        return
      }
      
      const currentPlayer = speakingOrder[currentIndex]
      this.emit('turnStart', { 
        playerId: currentPlayer.id, 
        timeLimit: 30 
      })
      
      // Simulate turn ending after 30 seconds
      setTimeout(() => {
        currentIndex++
        nextTurn()
      }, 8000) // Shortened for demo (8 seconds instead of 30)
    }
    
    nextTurn()
  }

  startVoting() {
    console.log('[DEBUG_LOG] Dummy WebSocket: Starting voting phase')
    this.currentGamePhase = 'VOTING'
    
    this.emit('startVote', { timeLimit: 30 })
    
    // Auto-end voting after timeout if no vote cast
    setTimeout(() => {
      if (this.currentGamePhase === 'VOTING') {
        this.simulateVoteCast(this.liarId) // Auto-vote for liar
      }
    }, 15000) // 15 seconds for demo
  }

  simulateVoteCast(targetPlayerId) {
    if (this.currentGamePhase !== 'VOTING') return
    
    console.log('[DEBUG_LOG] Dummy WebSocket: Vote cast for player', targetPlayerId)
    this.currentGamePhase = 'RESULTS'
    
    // Simulate voting results
    setTimeout(() => {
      const isLiarCaught = targetPlayerId === this.liarId
      
      this.emit('roundResult', {
        liarId: this.liarId,
        votedPlayerId: targetPlayerId,
        winner: isLiarCaught ? 'CITIZEN' : 'LIAR',
        votes: {
          [targetPlayerId]: 3,
          [this.liarId === targetPlayerId ? 1 : 3]: 1
        }
      })
      
      // End game after showing results
      setTimeout(() => {
        this.emit('gameEnded', {
          winner: isLiarCaught ? 'CITIZEN' : 'LIAR',
          finalScore: { citizens: isLiarCaught ? 1 : 0, liar: isLiarCaught ? 0 : 1 }
        })
        
        // Reset game state
        this.gameInProgress = false
        this.currentGamePhase = 'WAITING'
        this.currentTurnIndex = 0
      }, 5000)
    }, 1000)
  }

  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event).push(callback)
  }

  off(event, callback) {
    if (!this.eventListeners.has(event)) return
    
    const listeners = this.eventListeners.get(event)
    const index = listeners.indexOf(callback)
    if (index > -1) {
      listeners.splice(index, 1)
    }
  }

  emit(event, data) {
    if (!this.eventListeners.has(event)) return
    
    this.eventListeners.get(event).forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error(`[DEBUG_LOG] Error in dummy event listener for ${event}:`, error)
      }
    })
  }

  disconnect() {
    console.log('[DEBUG_LOG] Dummy WebSocket: Disconnecting')
    this.isConnected = false
    this.currentRoom = null
    this.emit('connection_status', { connected: false })
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      currentRoom: this.currentRoom,
      reconnectAttempts: 0
    }
  }
}

// Export functions to get appropriate client
export const getSocketClient = () => {
  // Use dummy client if no WebSocket URL is configured or in development mode
  const wsUrl = import.meta.env.VITE_WEBSOCKET_URL
  const useDummy = !wsUrl || import.meta.env.VITE_USE_DUMMY_WEBSOCKET === 'true'
  
  if (useDummy) {
    console.log('[DEBUG_LOG] Using dummy WebSocket client')
    return new DummySocketClient()
  }
  
  return socketClient
}

export const connectToServer = (options = {}) => {
  const client = getSocketClient()
  const serverUrl = import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:20021'
  
  return client.connect(serverUrl, options)
}

export default socketClient