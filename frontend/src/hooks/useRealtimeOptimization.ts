// Performance optimization hooks for real-time features
import {useCallback, useLayoutEffect, useMemo, useRef} from 'react'
import {useGameStore} from '@/stores'

// Debounce hook for chat and other user inputs
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    }) as T,
    [callback, delay]
  )
}

// Throttle hook for frequent updates like timer ticks
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  limit: number
): T {
  const inThrottle = useRef(false)

  return useCallback(
    ((...args: Parameters<T>) => {
      if (!inThrottle.current) {
        callback(...args)
        inThrottle.current = true
        setTimeout(() => {
          inThrottle.current = false
        }, limit)
      }
    }) as T,
    [callback, limit]
  )
}

// Optimized selector hook to prevent unnecessary re-renders
export function useGameStoreSelector<T>(
  selector: (state: ReturnType<typeof useGameStore.getState>) => T
): T {
  return useGameStore(selector)
}


// Batch state updates to prevent cascade of re-renders
export function useBatchedUpdates() {
  const batchRef = useRef<(() => void)[]>([])
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const batchUpdate = useCallback((update: () => void) => {
    batchRef.current.push(update)
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      const updates = batchRef.current
      batchRef.current = []
      
      // Execute all batched updates
      updates.forEach(update => update())
    }, 0) // Next tick
  }, [])

  return { batchUpdate }
}

// Optimized chat message renderer
export function useOptimizedChatMessages(maxVisible: number = 50) {
  const messages = useGameStoreSelector(state => state.chatMessages)
  
  // Only render the most recent messages for performance
  const visibleMessages = useMemo(() => {
    return messages.slice(-maxVisible)
  }, [messages, maxVisible])

  // Track if new messages require scroll
  const shouldScrollToBottom = useRef(false)
  
  useLayoutEffect(() => {
    shouldScrollToBottom.current = true
  }, [messages.length])

  return {
    visibleMessages,
    shouldScrollToBottom: shouldScrollToBottom.current,
    totalMessages: messages.length
  }
}

// Connection status optimization - prevent frequent re-renders
export function useOptimizedConnectionStatus() {
  const connectionState = useGameStoreSelector(state => state.connectionState)
  const reconnectAttempts = useGameStoreSelector(state => state.reconnectAttempts)
  
  // Memoize connection display info to prevent re-renders
  const connectionInfo = useMemo(() => {
    const isConnected = connectionState === 'connected'
    const isReconnecting = connectionState === 'reconnecting'
    const hasError = connectionState === 'error'
    
    let statusText = connectionState
    let statusColor = 'gray'
    
    if (isConnected) {
      statusText = 'connected'
      statusColor = 'green'
    } else if (isReconnecting) {
      statusText = 'reconnecting'
      statusColor = 'yellow'
    } else if (hasError) {
      statusText = 'error'
      statusColor = 'red'
    }
    
    return {
      isConnected,
      isReconnecting,
      hasError,
      statusText,
      statusColor,
      reconnectAttempts
    }
  }, [connectionState, reconnectAttempts])
  
  return connectionInfo
}

// Timer optimization - prevent excessive updates
export function useOptimizedTimer() {
  const timer = useGameStoreSelector(state => state.timer)
  
  // Throttle timer updates to improve performance
  const throttledTimer = useMemo(() => {
    return {
      ...timer,
      // Round to nearest second to prevent sub-second re-renders
      timeRemaining: Math.ceil(timer.timeRemaining)
    }
  }, [timer.timeRemaining, timer.isActive, timer.phase])
  
  return throttledTimer
}

// Voting panel optimization
export function useOptimizedVoting() {
  const voting = useGameStoreSelector(state => state.voting)
  const players = useGameStoreSelector(state => state.players)
  
  // Memoize voting calculations
  const votingInfo = useMemo(() => {
    const eligibleVoters = players.filter(p => p.isOnline && p.isAlive !== false)
    const votesCast = Object.keys(voting.votes).length
    const votesRemaining = Math.max(0, eligibleVoters.length - votesCast)
    const votingComplete = votesCast === eligibleVoters.length
    
    // Calculate vote distribution
    const voteDistribution = Object.values(voting.votes).reduce((acc, targetId) => {
      acc[targetId] = (acc[targetId] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return {
      ...voting,
      eligibleVoters: eligibleVoters.length,
      votesCast,
      votesRemaining,
      votingComplete,
      voteDistribution
    }
  }, [voting, players])
  
  return votingInfo
}

// Player list optimization - prevent re-renders on every player update
export function useOptimizedPlayers() {
  const players = useGameStoreSelector(state => state.players)
  const currentPlayer = useGameStoreSelector(state => state.currentPlayer)
  
  // Memoize player calculations
  const playerInfo = useMemo(() => {
    const onlinePlayers = players.filter(p => p.isOnline)
    const readyPlayers = players.filter(p => p.isReady)
    const hostPlayer = players.find(p => p.isHost)
    
    return {
      players,
      currentPlayer,
      onlinePlayers,
      readyPlayers,
      hostPlayer,
      totalPlayers: players.length,
      onlineCount: onlinePlayers.length,
      readyCount: readyPlayers.length,
      allReady: readyPlayers.length === onlinePlayers.length && onlinePlayers.length > 0
    }
  }, [players, currentPlayer])
  
  return playerInfo
}

// Memory cleanup for WebSocket events
export function useWebSocketCleanup(dependencies: any[] = []) {
  const cleanupFunctions = useRef<(() => void)[]>([])
  
  const addCleanup = useCallback((cleanup: () => void) => {
    cleanupFunctions.current.push(cleanup)
  }, [])
  
  useLayoutEffect(() => {
    return () => {
      // Execute all cleanup functions
      cleanupFunctions.current.forEach(cleanup => cleanup())
      cleanupFunctions.current = []
    }
  }, dependencies)
  
  return { addCleanup }
}