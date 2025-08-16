import gameStompClient from '../socket/gameStompClient'
import {
    createChatMessageHandler,
    createGameUpdateHandler,
    createModeratorMessageHandler,
    createPlayerUpdateHandler,
    createTurnChangeHandler
} from './socketEventHandlers.js'

// WebSocket Subscription Manager
// This module handles only subscription management logic

export const subscribeToGameEvents = (gameNumber, dispatch) => {
  console.log('[DEBUG_LOG] Setting up WebSocket subscriptions for game:', gameNumber)
  
  // Create event handlers
  const handleChatMessage = createChatMessageHandler(dispatch)
  const handleGameUpdate = createGameUpdateHandler(dispatch)
  const handlePlayerUpdate = createPlayerUpdateHandler(dispatch)
  const handleModeratorMessage = createModeratorMessageHandler(dispatch)
  const handleTurnChange = createTurnChangeHandler(dispatch)
  
  // Subscribe to different topics
  gameStompClient.subscribeToGameChat(gameNumber, handleChatMessage)
  gameStompClient.subscribeToGameRoom(gameNumber, handleGameUpdate)
  gameStompClient.subscribeToPlayerUpdates(gameNumber, handlePlayerUpdate)
  
  // Subscribe to moderator messages
  gameStompClient.subscribe(`/topic/game/${gameNumber}/moderator`, handleModeratorMessage)
  
  // Subscribe to turn changes
  gameStompClient.subscribe(`/topic/game/${gameNumber}/turn`, handleTurnChange)
  
  console.log('[DEBUG_LOG] WebSocket subscriptions set up successfully for game:', gameNumber)
}

export const subscribeToRoomConnection = (gameNumber, dispatch, loadChatHistory) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('[DEBUG_LOG] Setting up room connection subscriptions for game:', gameNumber)
      
      // Try to load chat history, but don't let it block room connection
      console.log('[DEBUG_LOG] Loading chat history before WebSocket connection')
      try {
        await loadChatHistory(gameNumber)
      } catch (historyError) {
        console.warn('[WARNING] Failed to load chat history, but continuing with room connection:', historyError.message)
        // Don't block room connection if chat history fails
        if (historyError.message?.includes('429') || historyError.response?.status === 429) {
          console.log('[DEBUG_LOG] Rate limit detected, skipping chat history for now')
        }
      }
      
      // Set up real-time chat subscription
      gameStompClient.subscribeToGameChat(gameNumber, (message) => {
        console.log('[DEBUG_LOG] Received chat message:', message)
        dispatch({ type: 'ADD_CHAT_MESSAGE', payload: message })
      })
      
      console.log('[DEBUG_LOG] Room connection subscriptions completed for game:', gameNumber)
      resolve()
    } catch (error) {
      console.error('[ERROR] Failed to set up room connection subscriptions:', error)
      reject(error)
    }
  })
}

export const unsubscribeFromGameEvents = (gameNumber) => {
  console.log('[DEBUG_LOG] Unsubscribing from game events for game:', gameNumber)
  // Note: gameStompClient should handle unsubscription internally when disconnecting
  // This function is a placeholder for explicit unsubscription if needed
}