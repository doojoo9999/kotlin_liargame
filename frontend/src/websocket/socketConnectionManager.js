import gameStompClient from '../socket/gameStompClient'

// WebSocket Connection Manager
// This module handles only connection and disconnection logic

export const connectWebSocket = async () => {
  console.log('[DEBUG_LOG] Connecting to WebSocket')
  await gameStompClient.connect()
  return true
}

export const disconnectWebSocket = () => {
  try {
    console.log('[DEBUG_LOG] Disconnecting STOMP client')

    if (gameStompClient.isClientConnected()) {
      gameStompClient.disconnect()
    }

    console.log('[DEBUG_LOG] WebSocket disconnected successfully')
    return true
  } catch (error) {
    console.error('[ERROR] Failed to disconnect socket:', error)
    throw error
  }
}

export const isWebSocketConnected = () => {
  return gameStompClient.isClientConnected()
}