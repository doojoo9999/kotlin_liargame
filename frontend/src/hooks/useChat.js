import {useCallback, useRef} from 'react'
import * as gameApi from '../api/gameApi'
import gameStompClient from '../socket/gameStompClient'
import {ACTION_TYPES, ERROR_KEYS, LOADING_KEYS} from '../context/gameConstants'

export const useChat = (state, dispatch) => {
  const loadChatHistoryRef = useRef(false)

  // Helper function to set loading state
  const setLoading = useCallback((type, value) => {
    dispatch({ type: ACTION_TYPES.SET_LOADING, payload: { type, value } })
  }, [dispatch])
  
  // Helper function to set error state
  const setError = useCallback((type, value) => {
    dispatch({ type: ACTION_TYPES.SET_ERROR, payload: { type, value } })
  }, [dispatch])

  // Send chat message via WebSocket
  const sendChatMessage = useCallback((gameNumber, message) => {
    try {
      // gameNumber가 없으면 현재 방 번호 사용
      const roomNumber = gameNumber || state.currentRoom?.gameNumber

      if (!roomNumber) {
        console.warn('[DEBUG_LOG] No gameNumber provided and no current room, cannot send message')
        return false
      }

      if (!gameStompClient.isClientConnected()) {
        console.warn('[DEBUG_LOG] WebSocket not connected, cannot send message')
        return false
      }

      console.log('[DEBUG_LOG] Sending chat message:', message, 'to game:', roomNumber)
      return gameStompClient.sendChatMessage(roomNumber, message)

    } catch (error) {
      console.error('[ERROR] Failed to send chat message:', error)
      return false
    }
  }, [state.currentRoom])

  // Load chat history with duplicate prevention
  const loadChatHistory = useCallback(async (gameNumber) => {
    // Prevent multiple simultaneous calls using ref instead of state
    if (loadChatHistoryRef.current) {
      console.log('[DEBUG_LOG] Chat history already loading, skipping duplicate request')
      return []
    }

    try {
      console.log('[DEBUG_LOG] ========== loadChatHistory Start ==========')
      console.log('[DEBUG_LOG] Loading chat history for game:', gameNumber)
      
      loadChatHistoryRef.current = true
      setLoading(LOADING_KEYS.CHAT_HISTORY, true)
      
      const messages = await gameApi.getChatHistory(gameNumber)
      console.log('[DEBUG_LOG] API returned messages:', messages)
      console.log('[DEBUG_LOG] Number of messages:', Array.isArray(messages) ? messages.length : 'Not an array')
      
      if (Array.isArray(messages)) {
        // 시간순 정렬
        const sortedMessages = messages.sort((a, b) => 
          new Date(a.timestamp) - new Date(b.timestamp)
        )
        
        console.log('[DEBUG_LOG] Sorted messages for display:')
        sortedMessages.forEach((msg, index) => {
          console.log(`[DEBUG_LOG]   ${index + 1}. ${msg.playerNickname}: ${msg.content}`)
        })
        
        dispatch({ type: ACTION_TYPES.SET_CHAT_MESSAGES, payload: sortedMessages })
        console.log('[SUCCESS] Chat history loaded successfully')
      } else {
        console.warn('[WARN] Invalid chat history format')
        dispatch({ type: ACTION_TYPES.SET_CHAT_MESSAGES, payload: [] })
      }
      
      console.log('[DEBUG_LOG] ========== loadChatHistory End ==========')
      return messages
    } catch (error) {
      console.error('[ERROR] Failed to load chat history:', error)
      dispatch({ type: ACTION_TYPES.SET_CHAT_MESSAGES, payload: [] })
      setError(ERROR_KEYS.SOCKET, '채팅 기록 로드 실패')
      return []
    } finally {
      setLoading(LOADING_KEYS.CHAT_HISTORY, false)
      loadChatHistoryRef.current = false
    }
  }, [dispatch, setLoading, setError])

  // Add chat message to state (for WebSocket updates)
  const addChatMessage = useCallback((message) => {
    dispatch({ type: ACTION_TYPES.ADD_CHAT_MESSAGE, payload: message })
  }, [dispatch])

  // Clear all chat messages
  const clearChatMessages = useCallback(() => {
    dispatch({ type: ACTION_TYPES.CLEAR_CHAT_MESSAGES })
  }, [dispatch])

  // Set chat messages (for loading history)
  const setChatMessages = useCallback((messages) => {
    dispatch({ type: ACTION_TYPES.SET_CHAT_MESSAGES, payload: messages })
  }, [dispatch])

  return {
    sendChatMessage,
    loadChatHistory,
    addChatMessage,
    clearChatMessages,
    setChatMessages,
    chatMessages: state.chatMessages,
    loading: state.loading[LOADING_KEYS.CHAT_HISTORY],
    error: state.error[ERROR_KEYS.SOCKET]
  }
}