// WebSocket Connection Hook with Store Integration
import {useCallback, useEffect, useRef, useState} from 'react'
import {useGameStore} from '../store/gameStore'
import {type ChatMessage, type GameEvent, websocketService} from '../services/websocketService'
import {useToast} from './useToast'

export function useWebSocketConnection() {
  const isInitialized = useRef(false)
  const { toast } = useToast()
  
  // Store actions
  const {
    setConnectionState,
    setReconnectAttempts,
    handleGameStateUpdate,
    handlePlayerJoined,
    handlePlayerLeft,
    handlePlayerReady,
    handlePhaseChange,
    handleTimerUpdate,
    handleVoteUpdate,
    handleChatMessage,
    addTypingPlayer,
    removeTypingPlayer,
    setError,
    gameId,
    connectionState
  } = useGameStore()

  const [isConnecting, setIsConnecting] = useState(false)

  // Connection management
  const connect = useCallback(async () => {
    if (isConnecting || connectionState.isConnected) return

    setIsConnecting(true)
    setError(null)

    try {
      await websocketService.connect()
      setConnectionState({
        isConnected: true,
        lastHeartbeat: Date.now(),
        reconnectAttempts: 0
      })
      toast.success('실시간 연결이 성공했습니다')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '연결에 실패했습니다'
      setError(errorMessage)
      toast.error(errorMessage)
      throw error
    } finally {
      setIsConnecting(false)
    }
  }, [isConnecting, connectionState.isConnected, setConnectionState, setError, toast])

  const disconnect = useCallback(() => {
    websocketService.disconnect()
    setConnectionState({
      isConnected: false,
      lastHeartbeat: 0,
      reconnectAttempts: 0
    })
  }, [setConnectionState])

  // Game subscription management
  const subscribeToGame = useCallback((gameId: string) => {
    if (!connectionState.isConnected) {
      console.warn('Cannot subscribe - not connected')
      return
    }
    websocketService.subscribeToGame(gameId)
  }, [connectionState.isConnected])

  const unsubscribeFromGame = useCallback((gameId: string) => {
    websocketService.unsubscribeFromGame(gameId)
  }, [])

  // Event handlers setup
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true

      // Setup WebSocket event listeners
      const unsubscribeGameEvent = websocketService.onGameEvent('*', (event: GameEvent) => {
        switch (event.type) {
          case 'GAME_STATE_UPDATED':
            handleGameStateUpdate(event.payload)
            break
          case 'PLAYER_JOINED':
            handlePlayerJoined(event.payload)
            break
          case 'PLAYER_LEFT':
            handlePlayerLeft(event.payload.playerId)
            break
          case 'ROUND_STARTED':
            handlePhaseChange('SPEECH')
            break
          case 'GAME_ENDED':
            handlePhaseChange('GAME_OVER')
            break
          default:
            console.log('Unhandled game event:', event)
        }
      })

      const unsubscribeChat = websocketService.onChatMessage((message: ChatMessage) => {
        handleChatMessage(message)
      })

      // Connection status listener
      const unsubscribeConnection = websocketService.addConnectionCallback((connected: boolean) => {
        setConnectionState({
          isConnected: connected,
          lastHeartbeat: connected ? Date.now() : 0,
          reconnectAttempts: websocketService.getReconnectAttempts()
        })
      })

      return () => {
        unsubscribeGameEvent()
        unsubscribeChat()
        websocketService.removeConnectionCallback(unsubscribeConnection)
      }
    }
  }, [handleGameStateUpdate, handlePlayerJoined, handlePlayerLeft, handlePhaseChange, handleChatMessage, setConnectionState])

  // Auto-subscribe to current game
  useEffect(() => {
    if (connectionState.isConnected && gameId) {
      subscribeToGame(gameId)
    }
  }, [connectionState.isConnected, gameId, subscribeToGame])

  // Send message methods
  const sendChatMessage = useCallback((message: string) => {
    if (!gameId) return
    websocketService.sendChatMessage(gameId, message)
  }, [gameId])

  const sendGameAction = useCallback((action: string, payload: any = {}) => {
    if (!gameId) return
    websocketService.sendGameAction(gameId, action, payload)
  }, [gameId])

  return {
    // Connection state
    isConnected: connectionState.isConnected,
    isConnecting,
    reconnectAttempts: connectionState.reconnectAttempts,

    // Connection methods
    connect,
    disconnect,
    subscribeToGame,
    unsubscribeFromGame,

    // Send methods
    sendChatMessage,
    sendGameAction,

    // Game-specific send methods
    sendHint: useCallback((hint: string) => {
      if (!gameId) return
      websocketService.sendHint(gameId, hint)
    }, [gameId]),

    sendVote: useCallback((targetUserId: number) => {
      if (!gameId) return
      websocketService.sendVote(gameId, targetUserId)
    }, [gameId]),

    sendDefense: useCallback((defenseText: string) => {
      if (!gameId) return
      websocketService.sendDefense(gameId, defenseText)
    }, [gameId]),

    sendFinalVote: useCallback((voteForExecution: boolean) => {
      if (!gameId) return
      websocketService.sendFinalVote(gameId, voteForExecution)
    }, [gameId]),

    sendWordGuess: useCallback((guess: string) => {
      if (!gameId) return
      websocketService.sendWordGuess(gameId, guess)
    }, [gameId])
  }
}