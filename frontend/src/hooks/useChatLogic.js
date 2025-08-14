import {useCallback, useRef} from 'react'
import {loadChatHistory, sendChatMessage} from '../api/chatAPI.js'
import {ActionTypes} from '../state/gameActions.js'

// Chat Business Logic Hook
// This module handles chat logic with state management integration

export const useChatLogic = (dispatch, setLoading, setError) => {
  const loadChatHistoryRef = useRef(false)

  const sendMessage = useCallback((gameNumber, message) => {
    try {
      if (!gameNumber || !message) {
        throw new Error('Game number and message are required')
      }

      return sendChatMessage(gameNumber, message)
    } catch (error) {
      console.error('[ERROR] Failed to send chat message:', error)
      throw error
    }
  }, [])

  const loadHistory = useCallback(async (gameNumber) => {
    if (loadChatHistoryRef.current) {
      console.log('[DEBUG_LOG] Chat history already loading, skipping duplicate request')
      return
    }

    try {
      loadChatHistoryRef.current = true
      setLoading('chatHistory', true)
      
      const sortedMessages = await loadChatHistory(gameNumber)
      
      dispatch({ type: ActionTypes.SET_CHAT_MESSAGES, payload: sortedMessages })
      
    } catch (error) {
      console.error('[ERROR] Failed to load chat history:', error)
      dispatch({ type: ActionTypes.SET_CHAT_MESSAGES, payload: [] })
      throw error
    } finally {
      setLoading('chatHistory', false)
      loadChatHistoryRef.current = false
    }
  }, [dispatch, setLoading])

  const clearMessages = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_CHAT_MESSAGES })
  }, [dispatch])

  const addMessage = useCallback((message) => {
    dispatch({ type: ActionTypes.ADD_CHAT_MESSAGE, payload: message })
  }, [dispatch])

  return {
    sendMessage,
    loadHistory,
    clearMessages,
    addMessage
  }
}