import {useCallback, useEffect, useState} from 'react'
import {gameWebSocket} from '@/api/websocket'
import type {
    ConnectionStatusResponse,
    CountdownResponse,
    GameEndResponse,
    PlayerReadyResponse,
    VotingStatusResponse
} from '@/types/realtime'
import {gameApi} from '@/api/gameApi'

export interface RealtimeGameStatus {
  readyPlayers: PlayerReadyResponse[]
  countdown: CountdownResponse | null
  connectionStatus: ConnectionStatusResponse | null
  votingStatus: VotingStatusResponse | null
  gameEnd: GameEndResponse | null
  isConnected: boolean
  connectionState: string
}

export function useRealtimeGameStatus(gameNumber: number | null, playerId?: number) {
  const [status, setStatus] = useState<RealtimeGameStatus>({
    readyPlayers: [],
    countdown: null,
    connectionStatus: null,
    votingStatus: null,
    gameEnd: null,
    isConnected: false,
    connectionState: 'disconnected'
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load initial data from APIs
  const loadInitialData = useCallback(async () => {
    if (!gameNumber || loading) return

    setLoading(true)
    try {
      const [readyData, countdownData, connectionData, votingData] = await Promise.allSettled([
        gameApi.getReadyStatus(gameNumber),
        gameApi.getCountdownStatus(gameNumber),
        gameApi.getConnectionStatus(gameNumber),
        gameApi.getVotingStatus(gameNumber)
      ])

      setStatus(prev => ({
        ...prev,
        readyPlayers: readyData.status === 'fulfilled' ? readyData.value : [],
        countdown: countdownData.status === 'fulfilled' ? countdownData.value : null,
        connectionStatus: connectionData.status === 'fulfilled' ? connectionData.value : null,
        votingStatus: votingData.status === 'fulfilled' ? votingData.value : null,
      }))

      setError(null)
    } catch (err) {
      console.error('Failed to load initial game status:', err)
      setError('게임 상태를 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }, [gameNumber, loading])

  // WebSocket event handlers
  useEffect(() => {
    if (!gameNumber) return

    const handleConnect = () => {
      setStatus(prev => ({ ...prev, isConnected: true, connectionState: 'connected' }))
      loadInitialData()
    }

    const handleDisconnect = () => {
      setStatus(prev => ({ ...prev, isConnected: false, connectionState: 'disconnected' }))
    }

    const handleReconnect = () => {
      setStatus(prev => ({ ...prev, connectionState: 'reconnecting' }))
    }

    const handleError = () => {
      setStatus(prev => ({ ...prev, connectionState: 'error' }))
      setError('연결 오류가 발생했습니다.')
    }

    // Player readiness updates
    const handlePlayerReadyUpdate = (data: any) => {
      setStatus(prev => {
        const updated = prev.readyPlayers.map(p => 
          p.playerId === data.playerId 
            ? { ...p, isReady: data.isReady }
            : p
        )
        
        // Add new player if not exists
        if (!updated.find(p => p.playerId === data.playerId)) {
          updated.push({
            playerId: data.playerId,
            nickname: data.nickname,
            isReady: data.isReady,
            isOwner: data.isOwner || false
          })
        }
        
        return { ...prev, readyPlayers: updated }
      })
    }

    // Countdown updates
    const handleCountdownStarted = (data: any) => {
      setStatus(prev => ({
        ...prev,
        countdown: {
          isActive: true,
          startedAt: data.startedAt,
          endTime: data.endTime,
          durationSeconds: data.durationSeconds,
          remainingSeconds: data.durationSeconds
        }
      }))
    }

    const handleCountdownCancelled = () => {
      setStatus(prev => ({
        ...prev,
        countdown: prev.countdown ? { ...prev.countdown, isActive: false } : null
      }))
    }

    // Connection status updates
    const handleConnectionStatusUpdate = (data: ConnectionStatusResponse) => {
      setStatus(prev => ({ ...prev, connectionStatus: data }))
    }

    // Voting progress updates
    const handleVotingProgress = (data: any) => {
      setStatus(prev => ({
        ...prev,
        votingStatus: prev.votingStatus ? {
          ...prev.votingStatus,
          votingPhase: data.votingPhase,
          currentVotes: data.currentVotes,
          requiredVotes: data.requiredVotes,
          activePlayersCount: data.activePlayersCount
        } : null
      }))
    }

    // Player reconnection
    const handlePlayerReconnected = () => {
      // Refresh connection status
      if (gameNumber) {
        gameApi.getConnectionStatus(gameNumber)
          .then(connectionData => {
            setStatus(prev => ({ ...prev, connectionStatus: connectionData }))
          })
          .catch(console.error)
      }
    }

    // Game end
    const handleGameEnd = (data: GameEndResponse) => {
      setStatus(prev => ({ ...prev, gameEnd: data }))
    }

    // Register event listeners
    const unsubscribers = [
      gameWebSocket.on('CONNECT', handleConnect),
      gameWebSocket.on('DISCONNECT', handleDisconnect),
      gameWebSocket.on('RECONNECT', handleReconnect),
      gameWebSocket.on('ERROR', handleError),
      gameWebSocket.on('PLAYER_READY_UPDATE', handlePlayerReadyUpdate),
      gameWebSocket.on('COUNTDOWN_STARTED', handleCountdownStarted),
      gameWebSocket.on('COUNTDOWN_CANCELLED', handleCountdownCancelled),
      gameWebSocket.on('CONNECTION_STATUS_UPDATE', handleConnectionStatusUpdate),
      gameWebSocket.on('VOTING_PROGRESS', handleVotingProgress),
      gameWebSocket.on('PLAYER_RECONNECTED', handlePlayerReconnected),
      gameWebSocket.on('GAME_END', handleGameEnd),
    ]

    // Connect WebSocket if not already connected
    if (!gameWebSocket.isConnected()) {
      gameWebSocket.connect(gameNumber, playerId?.toString())
        .catch(err => {
          console.error('Failed to connect WebSocket:', err)
          setError('실시간 연결에 실패했습니다.')
        })
    } else {
      gameWebSocket.updateGameContext(gameNumber, playerId?.toString() || '')
      loadInitialData()
    }

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe())
    }
  }, [gameNumber, playerId, loadInitialData])

  // Real-time countdown update
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (status.countdown?.isActive && status.countdown.remainingSeconds && status.countdown.remainingSeconds > 0) {
      interval = setInterval(() => {
        setStatus(prev => {
          if (!prev.countdown || !prev.countdown.isActive) return prev
          
          const remaining = prev.countdown.remainingSeconds ? prev.countdown.remainingSeconds - 1 : 0
          if (remaining <= 0) {
            return { 
              ...prev, 
              countdown: { ...prev.countdown, isActive: false, remainingSeconds: 0 }
            }
          }
          
          return { 
            ...prev, 
            countdown: { ...prev.countdown, remainingSeconds: remaining }
          }
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [status.countdown?.isActive, status.countdown?.remainingSeconds])

  // API action methods
  const actions = {
    toggleReady: async () => {
      if (!gameNumber) return false
      try {
        await gameApi.toggleReady(gameNumber)
        return true
      } catch (err) {
        setError('준비 상태를 변경할 수 없습니다.')
        return false
      }
    },

    startCountdown: async () => {
      if (!gameNumber) return false
      try {
        await gameApi.startCountdown(gameNumber)
        return true
      } catch (err) {
        setError('카운트다운을 시작할 수 없습니다.')
        return false
      }
    },

    cancelCountdown: async () => {
      if (!gameNumber) return false
      try {
        await gameApi.cancelCountdown(gameNumber)
        return true
      } catch (err) {
        setError('카운트다운을 취소할 수 없습니다.')
        return false
      }
    },

    refreshStatus: loadInitialData
  }

  return {
    status,
    loading,
    error,
    actions,
    clearError: () => setError(null)
  }
}

// Individual hooks for specific status types
export function useRealtimeReadyStatus(gameNumber: number | null) {
  const { status, actions, loading, error } = useRealtimeGameStatus(gameNumber)
  return {
    readyPlayers: status.readyPlayers,
    toggleReady: actions.toggleReady,
    loading,
    error
  }
}

export function useRealtimeCountdown(gameNumber: number | null) {
  const { status, actions, loading, error } = useRealtimeGameStatus(gameNumber)
  return {
    countdown: status.countdown,
    startCountdown: actions.startCountdown,
    cancelCountdown: actions.cancelCountdown,
    loading,
    error
  }
}

export function useRealtimeConnectionStatus(gameNumber: number | null) {
  const { status, loading, error } = useRealtimeGameStatus(gameNumber)
  return {
    connectionStatus: status.connectionStatus,
    isConnected: status.isConnected,
    connectionState: status.connectionState,
    loading,
    error
  }
}

export function useRealtimeVotingStatus(gameNumber: number | null) {
  const { status, loading, error } = useRealtimeGameStatus(gameNumber)
  return {
    votingStatus: status.votingStatus,
    loading,
    error
  }
}