import {useEffect} from 'react'
import {connectWebSocket, disconnectWebSocket} from '../websocket/socketConnectionManager.js'
import {subscribeToGameEvents, subscribeToRoomConnection} from '../websocket/socketSubscriptionManager.js'
import {ActionTypes} from '../state/gameActions.js'

// Socket Effects Hook
// This module handles WebSocket-related useEffect logic

export const useSocketEffects = (
  currentRoom, 
  socketConnected, 
  dispatch, 
  setLoading, 
  setError,
  loadChatHistory
) => {
  
  // Effect for managing WebSocket connection based on room state
  useEffect(() => {
    const handleSocketConnection = async () => {
      if (currentRoom && !socketConnected) {
        try {
          console.log('[DEBUG_LOG] Connecting WebSocket for room:', currentRoom.gameNumber)
          setLoading('socket', true)
          
          await connectWebSocket()
          dispatch({ type: ActionTypes.SET_SOCKET_CONNECTION, payload: true })
          
          // Subscribe to game events
          subscribeToGameEvents(currentRoom.gameNumber, dispatch)
          
          setLoading('socket', false)
          console.log('[DEBUG_LOG] WebSocket connected and subscriptions set up')
          
        } catch (error) {
          console.error('[ERROR] Failed to connect WebSocket:', error)
          setError('socket', error.message)
          setLoading('socket', false)
        }
      }
    }

    handleSocketConnection()
  }, [currentRoom, socketConnected, dispatch, setLoading, setError])

  // Effect for room connection setup
  useEffect(() => {
    const setupRoomConnection = async () => {
      if (currentRoom && socketConnected) {
        try {
          console.log('[DEBUG_LOG] Setting up room connection for:', currentRoom.gameNumber)
          
          await subscribeToRoomConnection(
            currentRoom.gameNumber, 
            dispatch, 
            loadChatHistory
          )
          
          console.log('[DEBUG_LOG] Room connection setup completed')
          
        } catch (error) {
          console.error('[ERROR] Failed to setup room connection:', error)
          setError('socket', error.message)
        }
      }
    }

    setupRoomConnection()
  }, [currentRoom, socketConnected, dispatch, loadChatHistory, setError])

  // Effect for cleanup when component unmounts or room changes
  useEffect(() => {
    return () => {
      if (socketConnected) {
        console.log('[DEBUG_LOG] Cleaning up WebSocket connection')
        try {
          disconnectWebSocket()
          dispatch({ type: ActionTypes.SET_SOCKET_CONNECTION, payload: false })
          dispatch({ type: ActionTypes.CLEAR_CHAT_MESSAGES })
        } catch (error) {
          console.error('[ERROR] Failed to cleanup WebSocket:', error)
        }
      }
    }
  }, []) // Empty dependency array for cleanup on unmount only

  // Effect for handling socket connection state changes
  useEffect(() => {
    if (!socketConnected && currentRoom) {
      console.log('[DEBUG_LOG] WebSocket disconnected while in room, may need reconnection')
    }
  }, [socketConnected, currentRoom])

}