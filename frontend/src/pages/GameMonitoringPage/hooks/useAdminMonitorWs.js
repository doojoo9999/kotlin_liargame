import { useEffect, useState, useCallback } from 'react'
import adminStompClient from '../../../utils/stompClient'
import { debugLog, wsLog, errorLog } from '../../../utils/logger'

/**
 * Hook for managing admin monitoring WebSocket connection and real-time updates
 * Handles connection lifecycle and message processing with proper cleanup
 */
export default function useAdminMonitorWs({
  onStatsUpdate,
  onGameRoomUpdate,
  onPlayerUpdate,
  onRoomTerminated,
  apiBaseUrl
}) {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState(null)

  const handleMessage = useCallback((data) => {
    wsLog('Received admin monitoring update:', data)
    
    try {
      switch (data.type) {
        case 'STATS_UPDATE':
          if (onStatsUpdate && data.stats) {
            onStatsUpdate(data.stats)
          }
          break
          
        case 'GAME_ROOM_UPDATE':
          if (onGameRoomUpdate) {
            if (data.gameRoom) {
              // Update specific room
              onGameRoomUpdate(data.gameRoom)
            } else {
              // Refresh all rooms (fallback)
              onGameRoomUpdate(null)
            }
          }
          break
          
        case 'PLAYER_UPDATE':
          if (onPlayerUpdate) {
            if (data.players) {
              // Full player list update
              onPlayerUpdate(data.players)
            } else if (data.player) {
              // Single player update
              onPlayerUpdate([data.player], 'single')
            } else {
              // Refresh all players (fallback)
              onPlayerUpdate(null)
            }
          }
          break
          
        case 'ROOM_TERMINATED':
          if (onRoomTerminated && data.gameNumber) {
            onRoomTerminated(data.gameNumber)
          }
          break
          
        default:
          wsLog('Unknown admin monitoring update type:', data.type)
      }
    } catch (error) {
      errorLog('Error processing WebSocket message:', error)
    }
  }, [onStatsUpdate, onGameRoomUpdate, onPlayerUpdate, onRoomTerminated])

  const connectWebSocket = useCallback(async () => {
    try {
      wsLog('Connecting to admin monitoring WebSocket')
      setConnectionError(null)
      
      await adminStompClient.connect(apiBaseUrl)
      setIsConnected(true)

      // Subscribe to admin monitoring topic
      adminStompClient.subscribe('/topic/admin/monitor', handleMessage)

      wsLog('Admin monitoring WebSocket connected and subscribed')
    } catch (error) {
      errorLog('Failed to connect admin monitoring WebSocket:', error)
      setIsConnected(false)
      setConnectionError('실시간 업데이트 연결에 실패했습니다. 페이지를 새로고침해주세요.')
    }
  }, [apiBaseUrl, handleMessage])

  const disconnectWebSocket = useCallback(() => {
    try {
      wsLog('Disconnecting admin monitoring WebSocket')
      adminStompClient.unsubscribe('/topic/admin/monitor')
      adminStompClient.disconnect()
      setIsConnected(false)
      setConnectionError(null)
    } catch (error) {
      errorLog('Error disconnecting WebSocket:', error)
    }
  }, [])

  // Connection effect
  useEffect(() => {
    if (apiBaseUrl) {
      connectWebSocket()
    }

    // Cleanup on unmount
    return () => {
      disconnectWebSocket()
    }
  }, [apiBaseUrl, connectWebSocket, disconnectWebSocket])

  // Reconnection logic on error
  useEffect(() => {
    if (connectionError && apiBaseUrl) {
      const reconnectTimer = setTimeout(() => {
        wsLog('Attempting to reconnect WebSocket...')
        connectWebSocket()
      }, 5000) // Retry after 5 seconds

      return () => clearTimeout(reconnectTimer)
    }
  }, [connectionError, apiBaseUrl, connectWebSocket])

  return {
    isConnected,
    connectionError,
    reconnect: connectWebSocket,
    disconnect: disconnectWebSocket
  }
}