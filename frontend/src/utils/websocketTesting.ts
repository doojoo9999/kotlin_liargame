// WebSocket Testing and Development Utilities
import type {WebSocketEvents} from '@/api/websocket'
import {gameWebSocket} from '@/api/websocket'

// Development WebSocket tester
export class WebSocketTester {
  private listeners: Map<string, Function[]> = new Map()
  
  constructor() {
    // Set up test event listeners
    this.setupTestListeners()
  }

  // Test connection
  async testConnection(gameNumber: number, playerId: string): Promise<boolean> {
    try {
      await gameWebSocket.connect(gameNumber, playerId)
      console.log('[WS Test] Connection test successful')
      return true
    } catch (error) {
      console.error('[WS Test] Connection test failed:', error)
      return false
    }
  }

  // Test message sending
  testSendMessage(type: keyof WebSocketEvents, data: any): boolean {
    const success = gameWebSocket.send(type, data)
    console.log(`[WS Test] Send ${type}:`, success, data)
    return success
  }

  // Test chat functionality
  testChat(message: string): boolean {
    return this.testSendMessage('CHAT_MESSAGE', { content: message, type: 'DISCUSSION' })
  }

  // Test ready status
  testReady(ready: boolean): boolean {
    return this.testSendMessage(ready ? 'PLAYER_READY' : 'PLAYER_UNREADY', { ready })
  }

  // Test voting
  testVote(targetPlayerId: string): boolean {
    return this.testSendMessage('PLAYER_VOTED', { targetPlayerId })
  }

  // Get connection status
  getStatus() {
    return {
      isConnected: gameWebSocket.isConnected(),
      connectionState: gameWebSocket.getConnectionState(),
      reconnectAttempts: gameWebSocket.getReconnectAttempts()
    }
  }

  // Performance test
  performanceTest(messageCount: number = 10) {
    console.log(`[WS Test] Starting performance test with ${messageCount} messages`)
    const startTime = performance.now()

    for (let i = 0; i < messageCount; i++) {
      this.testChat(`Test message ${i + 1}`)
    }

    const endTime = performance.now()
    const duration = endTime - startTime
    const messagesPerSecond = messageCount / (duration / 1000)

    console.log(`[WS Test] Performance test completed:`)
    console.log(`- Duration: ${duration.toFixed(2)}ms`)
    console.log(`- Messages/second: ${messagesPerSecond.toFixed(2)}`)

    return { duration, messagesPerSecond }
  }

  // Stress test for connection stability
  async stressTest(): Promise<void> {
    console.log('[WS Test] Starting stress test')

    // Test rapid connect/disconnect
    for (let i = 0; i < 5; i++) {
      console.log(`[WS Test] Stress test cycle ${i + 1}`)

      try {
        gameWebSocket.disconnect()
        await new Promise(resolve => setTimeout(resolve, 100))
        await gameWebSocket.connect(1, 'test-player')
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`[WS Test] Stress test failed at cycle ${i + 1}:`, error)
      }
    }

    console.log('[WS Test] Stress test completed')
  }

  // Memory leak test
  memoryLeakTest() {
    console.log('[WS Test] Starting memory leak test')

    // Add many event listeners
    const cleanup: (() => void)[] = []

    for (let i = 0; i < 100; i++) {
      const unsubscribe = gameWebSocket.on('CHAT_MESSAGE', () => {
        // Empty handler for testing
      })
      cleanup.push(unsubscribe)
    }

    console.log('[WS Test] Added 100 event listeners')

    // Cleanup after delay
    setTimeout(() => {
      cleanup.forEach(fn => fn())
      console.log('[WS Test] Cleaned up all event listeners')
    }, 1000)
  }

  // Test event ordering
  testEventOrdering() {
    console.log('[WS Test] Testing event ordering')

    const events: string[] = []
    const cleanup: (() => void)[] = []

    // Add listeners to track event order
    const eventTypes: (keyof WebSocketEvents)[] = [
      'CHAT_MESSAGE',
      'PLAYER_VOTED',
      'TIMER_UPDATE',
      'GAME_STATE_UPDATE'
    ]

    eventTypes.forEach(eventType => {
      const unsubscribe = gameWebSocket.on(eventType, () => {
        events.push(eventType)
      })
      cleanup.push(unsubscribe)
    })

    // Send test events
    this.testChat('Order test 1')
    this.testVote('test-player')
    this.testChat('Order test 2')

    // Check order after delay
    setTimeout(() => {
      console.log('[WS Test] Event order:', events)
      cleanup.forEach(fn => fn())
    }, 500)
  }

  private setupTestListeners() {
    // Connection events
    gameWebSocket.on('CONNECT', (data) => {
      console.log('[WS Test] Connected:', data)
    })

    gameWebSocket.on('DISCONNECT', (data) => {
      console.log('[WS Test] Disconnected:', data)
    })

    gameWebSocket.on('ERROR', (data) => {
      console.error('[WS Test] Error:', data)
    })

    // Game events
    gameWebSocket.on('GAME_STATE_UPDATE', (data) => {
      console.log('[WS Test] Game State Update:', data)
    })

    gameWebSocket.on('PLAYER_JOINED', (data) => {
      console.log('[WS Test] Player Joined:', data)
    })

    gameWebSocket.on('PLAYER_LEFT', (data) => {
      console.log('[WS Test] Player Left:', data)
    })

    gameWebSocket.on('CHAT_MESSAGE', (data) => {
      console.log('[WS Test] Chat Message:', data)
    })
  }
}

// Mock WebSocket server for testing
export class MockWebSocketServer {
  private listeners: Map<string, Function[]> = new Map()
  private connected = false
  
  // Simulate server responses
  simulatePlayerJoin(playerId: string, playerNickname: string) {
    if (!this.connected) return
    
    console.log('[Mock Server] Simulating player join:', playerNickname)
    // This would normally come from the actual server
    this.broadcast('PLAYER_JOINED', {
      type: 'JOIN',
      playerId,
      playerNickname,
      data: {}
    })
  }

  simulateGameStart(gameNumber: number) {
    if (!this.connected) return
    
    console.log('[Mock Server] Simulating game start')
    this.broadcast('GAME_START', {
      gameNumber,
      gameState: 'IN_PROGRESS',
      currentPhase: 'SPEECH'
    })
  }

  simulateTimerUpdate(timeRemaining: number) {
    if (!this.connected) return
    
    this.broadcast('TIMER_UPDATE', { timeRemaining })
  }

  simulateChatMessage(playerId: string, playerNickname: string, content: string) {
    if (!this.connected) return
    
    this.broadcast('CHAT_MESSAGE', {
      id: Date.now().toString(),
      gameNumber: 1,
      playerId,
      playerNickname,
      content,
      type: 'DISCUSSION',
      timestamp: new Date().toISOString()
    })
  }

  simulateVoteCast(voterPlayerId: string, targetPlayerId: string) {
    if (!this.connected) return
    
    this.broadcast('PLAYER_VOTED', {
      voterPlayerId,
      targetPlayerId,
      remainingVotes: 2
    })
  }

  connect() {
    this.connected = true
    console.log('[Mock Server] Connected')
  }

  disconnect() {
    this.connected = false
    console.log('[Mock Server] Disconnected')
  }

  private broadcast(eventType: string, data: any) {
    // In a real implementation, this would send via WebSocket
    console.log(`[Mock Server] Broadcasting ${eventType}:`, data)
  }
}

// Development utilities
export const webSocketDev = {
  tester: new WebSocketTester(),
  mockServer: new MockWebSocketServer(),
  
  // Quick test functions
  quickConnectionTest: async () => {
    const tester = new WebSocketTester()
    return await tester.testConnection(1, 'dev-player')
  },
  
  quickChatTest: (message: string = 'Hello from dev tools!') => {
    const tester = new WebSocketTester()
    return tester.testChat(message)
  },
  
  // Log all WebSocket activity
  enableDebugLogging: () => {
    const originalConsoleLog = console.log
    
    gameWebSocket.on('CONNECT', (data) => originalConsoleLog('[WS Debug] CONNECT:', data))
    gameWebSocket.on('DISCONNECT', (data) => originalConsoleLog('[WS Debug] DISCONNECT:', data))
    gameWebSocket.on('ERROR', (data) => originalConsoleLog('[WS Debug] ERROR:', data))
    gameWebSocket.on('CHAT_MESSAGE', (data) => originalConsoleLog('[WS Debug] CHAT_MESSAGE:', data))
    gameWebSocket.on('GAME_STATE_UPDATE', (data) => originalConsoleLog('[WS Debug] GAME_STATE_UPDATE:', data))
    
    console.log('[WS Debug] Debug logging enabled')
  }
}

// Make available in development environment
if (process.env.NODE_ENV === 'development') {
  (window as any).webSocketDev = webSocketDev
  console.log('WebSocket development tools available at window.webSocketDev')
}