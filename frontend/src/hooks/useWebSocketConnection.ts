// WebSocket Connection Hook with Store Integration
import {useCallback, useEffect, useRef, useState} from 'react'
import {useGameStore} from '@/stores'
import {type GameStateUpdate, gameWebSocket, type PlayerAction} from '@/api/websocket'
import type {ChatMessage} from '@/types/gameFlow'
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
    connectWebSocket,
    disconnectWebSocket,
    setConnectionError,
    connectionState
  } = useGameStore()

  const [isConnecting, setIsConnecting] = useState(false)

  // Connection management
  const connect = useCallback(async () => {
    const isConnected = connectionState === 'connected'
    if (isConnecting || isConnected) return

    setIsConnecting(true)
    setConnectionError(null)

    try {
      await connectWebSocket()
      toast.success('실시간 연결이 성공했습니다')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '연결에 실패했습니다'
      setConnectionError(errorMessage)
      toast.error(errorMessage)
      throw error
    } finally {
      setIsConnecting(false)
    }
  }, [connectionState, connectWebSocket, isConnecting, setConnectionError, toast])

  const disconnect = useCallback(() => {
    disconnectWebSocket()
    toast.info('실시간 연결이 종료되었습니다')
  }, [disconnectWebSocket, toast])

  const retry = useCallback(async () => {
    const isConnected = connectionState === 'connected'
    if (isConnected) {
      disconnect()
      // Wait a bit before reconnecting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    return connect()
  }, [connectionState, connect, disconnect])

  // Setup event listeners
  const setupEventListeners = useCallback(() => {
    if (isInitialized.current) return
    isInitialized.current = true

    console.log('[WebSocket Hook] Setting up event listeners')

    // Connection Events
    const unsubscribeConnect = gameWebSocket.on('CONNECT', (data: { state: string }) => {
      console.log('[WebSocket Hook] Connected:', data.state)
      setConnectionState(data.state === 'connected' ? 'connected' : 'connecting')
      if (data.state === 'connected') {
        setError(null)
        toast({
          title: "Connected",
          description: "Real-time connection established",
        })
      }
    })

    const unsubscribeDisconnect = gameWebSocket.on('DISCONNECT', (data: { code: number, reason: string }) => {
      console.log('[WebSocket Hook] Disconnected:', data.code, data.reason)
      setConnectionState('disconnected')
      
      if (data.code !== 1000) { // Not a normal closure
        toast({
          title: "Connection Lost",
          description: "Attempting to reconnect...",
          variant: "destructive",
        })
      }
    })

    const unsubscribeReconnect = gameWebSocket.on('RECONNECT', (data: { attempt: number, maxAttempts: number, delay: number }) => {
      console.log('[WebSocket Hook] Reconnecting:', data.attempt, '/', data.maxAttempts)
      setConnectionState('reconnecting')
      setReconnectAttempts(data.attempt)
      
      toast({
        title: "Reconnecting",
        description: `Attempt ${data.attempt}/${data.maxAttempts}`,
      })
    })

    const unsubscribeError = gameWebSocket.on('ERROR', (data: { error: any, phase?: string }) => {
      console.error('[WebSocket Hook] Error:', data.error, data.phase)
      setConnectionState('error')
      setError(`Connection error: ${data.error instanceof Error ? data.error.message : 'Unknown error'}`)
      
      toast({
        title: "Connection Error",
        description: "Please check your internet connection",
        variant: "destructive",
      })
    })

    // Game State Events
    const unsubscribeGameState = gameWebSocket.on('GAME_STATE_UPDATE', (data: GameStateUpdate) => {
      console.log('[WebSocket Hook] Game state update:', data)
      handleGameStateUpdate(data)
    })

    // Player Events
    const unsubscribePlayerJoined = gameWebSocket.on('PLAYER_JOINED', (data: PlayerAction) => {
      console.log('[WebSocket Hook] Player joined:', data.playerNickname)
      handlePlayerJoined({
        id: data.playerId,
        nickname: data.playerNickname,
        isReady: false,
        isHost: false,
        isOnline: true,
      })
      
      toast({
        title: "Player Joined",
        description: `${data.playerNickname} joined the game`,
      })
    })

    const unsubscribePlayerLeft = gameWebSocket.on('PLAYER_LEFT', (data: PlayerAction) => {
      console.log('[WebSocket Hook] Player left:', data.playerNickname)
      handlePlayerLeft(data.playerId)
      
      toast({
        title: "Player Left",
        description: `${data.playerNickname} left the game`,
      })
    })

    const unsubscribePlayerReady = gameWebSocket.on('PLAYER_READY', (data: PlayerAction) => {
      console.log('[WebSocket Hook] Player ready:', data.playerNickname, data.data?.ready)
      handlePlayerReady(data.playerId, data.data?.ready || true)
    })

    const unsubscribePlayerUnready = gameWebSocket.on('PLAYER_UNREADY', (data: PlayerAction) => {
      console.log('[WebSocket Hook] Player unready:', data.playerNickname)
      handlePlayerReady(data.playerId, false)
    })

    // Game Flow Events
    const unsubscribeGameStart = gameWebSocket.on('GAME_START', (data: any) => {
      console.log('[WebSocket Hook] Game started:', data)
      handlePhaseChange('SPEECH')
      
      toast({
        title: "Game Started!",
        description: "Good luck finding the liar!",
      })
    })

    const unsubscribePhaseChange = gameWebSocket.on('PHASE_CHANGE', (data: { phase: string, timeLimit?: number }) => {
      console.log('[WebSocket Hook] Phase change:', data.phase)
      handlePhaseChange(data.phase as any)
      
      // Show phase notifications
      const phaseNames: Record<string, string> = {
        'SPEECH': 'Discussion Phase',
        'VOTING_FOR_LIAR': 'Voting Phase',
        'DEFENDING': 'Defense Phase',
        'VOTING_FOR_SURVIVAL': 'Final Vote',
        'GUESSING_WORD': 'Liar Guessing',
        'GAME_OVER': 'Game Over'
      }
      
      const phaseName = phaseNames[data.phase] || data.phase
      toast({
        title: "Phase Change",
        description: `Now in ${phaseName}`,
      })
    })

    const unsubscribeRoundStart = gameWebSocket.on('ROUND_START', (data: { round: number, topic?: string, word?: string }) => {
      console.log('[WebSocket Hook] Round started:', data.round)
      
      toast({
        title: `Round ${data.round}`,
        description: data.topic ? `Topic: ${data.topic}` : "New round started",
      })
    })

    const unsubscribeGameEnd = gameWebSocket.on('GAME_END', (data: any) => {
      console.log('[WebSocket Hook] Game ended:', data)
      handlePhaseChange('GAME_OVER')
      
      toast({
        title: "Game Finished!",
        description: "Check the results",
      })
    })

    // Timer Events
    const unsubscribeTimerUpdate = gameWebSocket.on('TIMER_UPDATE', (data: { timeRemaining: number }) => {
      handleTimerUpdate(data.timeRemaining)
    })

    const unsubscribeTimerStart = gameWebSocket.on('TIMER_START', (data: { timeRemaining: number, phase: string }) => {
      console.log('[WebSocket Hook] Timer started:', data.timeRemaining, data.phase)
      // Timer will be updated via TIMER_UPDATE events
    })

    const unsubscribeTimerStop = gameWebSocket.on('TIMER_STOP', () => {
      console.log('[WebSocket Hook] Timer stopped')
      handleTimerUpdate(0)
    })

    // Voting Events  
    const unsubscribePlayerVoted = gameWebSocket.on('PLAYER_VOTED', (data: any) => {
      console.log('[WebSocket Hook] Player voted:', data)
      
      if (data.voterNickname && data.targetNickname) {
        toast({
          title: "Vote Cast",
          description: `${data.voterNickname} voted for ${data.targetNickname}`,
        })
      }
      
      // Update vote count if provided
      if (data.votes) {
        handleVoteUpdate(data.votes)
      }
    })

    const unsubscribeDefenseStart = gameWebSocket.on('DEFENSE_START', (data: { targetPlayerId: string, targetNickname: string }) => {
      console.log('[WebSocket Hook] Defense started:', data.targetNickname)
      
      toast({
        title: "Defense Phase",
        description: `${data.targetNickname} can now defend themselves`,
      })
    })

    // Chat Events
    const unsubscribeChatMessage = gameWebSocket.on('CHAT_MESSAGE', (data: ChatMessage) => {
      console.log('[WebSocket Hook] Chat message:', data.playerName, data.content)
      handleChatMessage(data)
    })

    const unsubscribeTypingStart = gameWebSocket.on('TYPING_START', (data: { playerId: string, playerNickname: string }) => {
      console.log('[WebSocket Hook] Player started typing:', data.playerNickname)
      addTypingPlayer(data.playerId)
    })

    const unsubscribeTypingStop = gameWebSocket.on('TYPING_STOP', (data: { playerId: string, playerNickname: string }) => {
      console.log('[WebSocket Hook] Player stopped typing:', data.playerNickname)
      removeTypingPlayer(data.playerId)
    })

    // Error Events
    const unsubscribeErrorMessage = gameWebSocket.on('ERROR_MESSAGE', (data: { message: string, code?: string }) => {
      console.error('[WebSocket Hook] Server error:', data.message)
      setError(data.message)
      
      toast({
        title: "Error",
        description: data.message,
        variant: "destructive",
      })
    })

    // Return cleanup function
    return () => {
      console.log('[WebSocket Hook] Cleaning up event listeners')
      unsubscribeConnect()
      unsubscribeDisconnect()
      unsubscribeReconnect()
      unsubscribeError()
      unsubscribeGameState()
      unsubscribePlayerJoined()
      unsubscribePlayerLeft()
      unsubscribePlayerReady()
      unsubscribePlayerUnready()
      unsubscribeGameStart()
      unsubscribePhaseChange()
      unsubscribeRoundStart()
      unsubscribeGameEnd()
      unsubscribeTimerUpdate()
      unsubscribeTimerStart()
      unsubscribeTimerStop()
      unsubscribePlayerVoted()
      unsubscribeDefenseStart()
      unsubscribeChatMessage()
      unsubscribeTypingStart()
      unsubscribeTypingStop()
      unsubscribeErrorMessage()
      isInitialized.current = false
    }
  }, [
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
    toast
  ])

  // Setup listeners on mount
  useEffect(() => {
    const cleanup = setupEventListeners()
    return cleanup
  }, [setupEventListeners])

  // Game action helpers
  const joinRoom = useCallback((gameNumber: number, playerId: string) => {
    return gameWebSocket.joinRoom(gameNumber, playerId)
  }, [])

  const leaveRoom = useCallback(() => {
    return gameWebSocket.leaveRoom()
  }, [])

  const setReady = useCallback((ready: boolean) => {
    return gameWebSocket.setReady(ready)
  }, [])

  const sendChat = useCallback((message: string, type: 'DISCUSSION' | 'HINT' | 'DEFENSE' = 'DISCUSSION') => {
    return gameWebSocket.sendChat(message, type)
  }, [])

  const castVote = useCallback((targetPlayerId: string) => {
    return gameWebSocket.castVote(targetPlayerId)
  }, [])

  const startTyping = useCallback(() => {
    return gameWebSocket.startTyping()
  }, [])

  const stopTyping = useCallback(() => {
    return gameWebSocket.stopTyping()
  }, [])

  return {
    // Connection management
    connect,
    disconnect,
    retry,
    isConnected: gameWebSocket.isConnected(),
    connectionState: gameWebSocket.getConnectionState(),
    reconnectAttempts: gameWebSocket.getReconnectAttempts(),
    
    // Game actions
    joinRoom,
    leaveRoom,
    setReady,
    sendChat,
    castVote,
    startTyping,
    stopTyping,
  }
}

// Separate hook for WebSocket actions only (lighter weight)
export function useWebSocketActions() {
  const sendChat = useCallback((message: string, type: 'DISCUSSION' | 'HINT' | 'DEFENSE' = 'DISCUSSION') => {
    return gameWebSocket.sendChat(message, type)
  }, [])

  const castVote = useCallback((targetPlayerId: string) => {
    return gameWebSocket.castVote(targetPlayerId)
  }, [])

  const setReady = useCallback((ready: boolean) => {
    return gameWebSocket.setReady(ready)
  }, [])

  const startTyping = useCallback(() => {
    return gameWebSocket.startTyping()
  }, [])

  const stopTyping = useCallback(() => {
    return gameWebSocket.stopTyping()
  }, [])

  return {
    sendChat,
    castVote,
    setReady,
    startTyping,
    stopTyping,
    isConnected: gameWebSocket.isConnected(),
  }
}