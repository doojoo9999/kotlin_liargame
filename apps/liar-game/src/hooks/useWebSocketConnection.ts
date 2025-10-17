import {useCallback} from 'react'
import {useConnectionStore} from '@/stores/connectionStore'

interface WebSocketConnectionState {
  status: string
  isConnected: boolean
  connect: () => Promise<void>
  disconnect: () => void
  retry: () => Promise<void>
}

export function useWebSocketConnection(): WebSocketConnectionState {
  const status = useConnectionStore((state) => state.status)

  const connect = useCallback(async () => {
    // Legacy hook placeholder: connection lifecycle handled by useGameRecovery/useGameWebSocket
    return Promise.resolve()
  }, [])

  const disconnect = useCallback(() => {
    // Legacy hook placeholder: connection lifecycle handled elsewhere
  }, [])

  const retry = useCallback(async () => {
    return Promise.resolve()
  }, [])

  return {
    status,
    isConnected: status === 'connected',
    connect,
    disconnect,
    retry,
  }
}

interface WebSocketActions {
  sendChat: (message: string, type?: string) => Promise<void>
  castVote: (targetPlayerId: string) => Promise<void>
  setReady: (ready: boolean) => Promise<void>
  startTyping: () => void
  stopTyping: () => void
  isConnected: boolean
}

export function useWebSocketActions(): WebSocketActions {
  const isConnected = useConnectionStore((state) => state.status === 'connected')

  const noopAsync = useCallback(async () => {
    return Promise.resolve()
  }, [])

  const noop = useCallback(() => {
    // Placeholder
  }, [])

  return {
    sendChat: noopAsync,
    castVote: noopAsync,
    setReady: noopAsync,
    startTyping: noop,
    stopTyping: noop,
    isConnected,
  }
}
