import * as gameApi from './gameApi'
import gameStompClient from '../socket/gameStompClient'

// Chat API functions
// This module handles only chat-related API calls and WebSocket messaging

export const sendChatMessage = (gameNumber, message) => {
  try {
    if (!gameNumber || !message) {
      throw new Error('Game number and message are required')
    }

    console.log('[DEBUG_LOG] Sending chat message:', message, 'to game:', gameNumber)
    return gameStompClient.sendChatMessage(gameNumber, message)
  } catch (error) {
    console.error('[ERROR] Failed to send chat message:', error)
    throw error
  }
}

export const loadChatHistory = async (gameNumber) => {
  console.log('[DEBUG_LOG] ========== loadChatHistory Start ==========')
  console.log('[DEBUG_LOG] Loading chat history for game:', gameNumber)
  
  const messages = await gameApi.getChatHistory(gameNumber)
  
  if (Array.isArray(messages)) {
    // Sort messages by timestamp for proper order
    const sortedMessages = messages.sort((a, b) => {
      const timeA = new Date(a.timestamp || a.createdAt || 0).getTime()
      const timeB = new Date(b.timestamp || b.createdAt || 0).getTime()
      return timeA - timeB
    })
    
    console.log('[SUCCESS] Chat history loaded successfully')
    console.log('[DEBUG_LOG] ========== loadChatHistory End ==========')
    return sortedMessages
  } else {
    console.warn('[WARN] Invalid chat history format')
    console.log('[DEBUG_LOG] ========== loadChatHistory End ==========')
    return []
  }
}