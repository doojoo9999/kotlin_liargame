import {useCallback, useRef} from 'react'
import gameStompClient from '../socket/gameStompClient'
import {ACTION_TYPES, ERROR_KEYS, LOADING_KEYS} from '../context/gameConstants'

export const useWebSocket = (state, dispatch, { loadChatHistory }) => {
  const socketRef = useRef(null)

  // Helper function to set loading state
  const setLoading = useCallback((type, value) => {
    dispatch({ type: ACTION_TYPES.SET_LOADING, payload: { type, value } })
  }, [dispatch])
  
  // Helper function to set error state
  const setError = useCallback((type, value) => {
    dispatch({ type: ACTION_TYPES.SET_ERROR, payload: { type, value } })
  }, [dispatch])

  // WebSocket event handlers
  const createChatMessageHandler = useCallback((dispatch) => (message) => {
    console.log('[DEBUG_LOG] Received chat message via WebSocket:', message)
    dispatch({ type: ACTION_TYPES.ADD_CHAT_MESSAGE, payload: message })
  }, [])

  const createGameUpdateHandler = useCallback((dispatch) => (update) => {
    console.log('[DEBUG_LOG] Received game update:', update)
    
    // Handle PLAYER_JOINED and PLAYER_LEFT events
    if (update.type === 'PLAYER_JOINED' || update.type === 'PLAYER_LEFT') {
      // Update room players if available
      if (update.roomData && update.roomData.players) {
        dispatch({ type: ACTION_TYPES.SET_ROOM_PLAYERS, payload: update.roomData.players })
      }
      
      // Update current room information with roomData
      if (update.roomData) {
        const updatedRoom = {
          gameNumber: update.roomData.gameNumber,
          title: update.roomData.title,
          host: update.roomData.host,
          currentPlayers: update.roomData.currentPlayers,
          maxPlayers: update.roomData.maxPlayers,
          subject: update.roomData.subject,
          subjects: update.roomData.subjects || [],
          state: update.roomData.state,
          players: update.roomData.players || []
        }
        
        console.log('[DEBUG_LOG] Updating currentRoom with roomData (including subjects):', updatedRoom)
        dispatch({ type: ACTION_TYPES.SET_CURRENT_ROOM, payload: updatedRoom })
      }
      
      // Update room in the room list as well
      if (update.roomData) {
        dispatch({ 
          type: ACTION_TYPES.UPDATE_ROOM_IN_LIST, 
          payload: {
            gameNumber: update.roomData.gameNumber,
            currentPlayers: update.roomData.currentPlayers,
            maxPlayers: update.roomData.maxPlayers,
            title: update.roomData.title,
            subject: update.roomData.subject,
            subjects: update.roomData.subjects || [],
            state: update.roomData.state
          }
        })
      }
    }
  }, [])

  const createPlayerUpdateHandler = useCallback((dispatch) => (players) => {
    console.log('[DEBUG_LOG] Received player update:', players)
    dispatch({ type: ACTION_TYPES.SET_ROOM_PLAYERS, payload: players })
  }, [])

  // Connect to WebSocket with subscriptions
  const connectSocket = useCallback(async (gameNumber) => {
    try {
      console.log('[DEBUG_LOG] Connecting to WebSocket for game:', gameNumber)
      setLoading(LOADING_KEYS.SOCKET, true)

      await gameStompClient.connect()
      dispatch({ type: ACTION_TYPES.SET_SOCKET_CONNECTION, payload: true })

      const handleChatMessage = createChatMessageHandler(dispatch)
      const handleGameUpdate = createGameUpdateHandler(dispatch)
      const handlePlayerUpdate = createPlayerUpdateHandler(dispatch)

      gameStompClient.subscribeToGameChat(gameNumber, handleChatMessage)
      gameStompClient.subscribeToGameRoom(gameNumber, handleGameUpdate)
      gameStompClient.subscribeToPlayerUpdates(gameNumber, handlePlayerUpdate)
      
      // 사회자 메시지 구독
      gameStompClient.subscribe(`/topic/game/${gameNumber}/moderator`, (message) => {
        const moderatorMessage = JSON.parse(message.body)
        console.log('[DEBUG_LOG] Moderator message received:', moderatorMessage)
        
        // 사회자 메시지 상태 업데이트
        dispatch({ 
          type: ACTION_TYPES.SET_MODERATOR_MESSAGE, 
          payload: moderatorMessage.content 
        })
        
        // 3초 후 메시지 숨기기
        setTimeout(() => {
          dispatch({ 
            type: ACTION_TYPES.SET_MODERATOR_MESSAGE, 
            payload: null 
          })
        }, 3000)
      })
      
      // 턴 변경 구독
      gameStompClient.subscribe(`/topic/game/${gameNumber}/turn`, (message) => {
        const turnMessage = JSON.parse(message.body)
        console.log('[DEBUG_LOG] Turn change received:', turnMessage)
        
        dispatch({ 
          type: ACTION_TYPES.SET_CURRENT_TURN_PLAYER, 
          payload: turnMessage.currentSpeakerId 
        })
      })

      console.log('[DEBUG_LOG] WebSocket subscriptions set up for game:', gameNumber)
      setLoading(LOADING_KEYS.SOCKET, false)

    } catch (error) {
      console.error('Failed to connect socket:', error)
      setError(ERROR_KEYS.SOCKET, error.message)
      setLoading(LOADING_KEYS.SOCKET, false)
    }
  }, [dispatch, setLoading, setError, createChatMessageHandler, createGameUpdateHandler, createPlayerUpdateHandler])

  // Disconnect from WebSocket
  const disconnectSocket = useCallback(() => {
    try {
      console.log('[DEBUG_LOG] Disconnecting STOMP client')

      if (gameStompClient.isClientConnected()) {
        gameStompClient.disconnect()
      }

      socketRef.current = null

      dispatch({ type: ACTION_TYPES.SET_SOCKET_CONNECTION, payload: false })
      dispatch({ type: ACTION_TYPES.CLEAR_CHAT_MESSAGES })

    } catch (error) {
      console.error('[ERROR] Failed to disconnect socket:', error)
    }
  }, [dispatch])

  // Connect to room with retry logic
  const connectToRoom = useCallback(async (gameNumber, retryCount = 0) => {
    const MAX_RETRIES = 3

    if (retryCount >= MAX_RETRIES) {
      console.error('[ERROR] Max connection retries reached')
      setError(ERROR_KEYS.SOCKET, 'WebSocket 연결에 실패했습니다.')
      return
    }

    // Prevent multiple simultaneous connection attempts to the same room
    if (state.socketConnected && state.currentRoom?.gameNumber === gameNumber) {
      console.log('[DEBUG_LOG] Already connected to room:', gameNumber)
      return
    }

    // Check if already connecting to prevent rapid calls
    if (gameStompClient.isConnecting) {
      console.log('[DEBUG_LOG] Connection already in progress, waiting...')
      try {
        if (gameStompClient.connectionPromise) {
          await gameStompClient.connectionPromise
        }
        return
      } catch (error) {
        console.log('[DEBUG_LOG] Existing connection failed, proceeding with new attempt')
      }
    }

    try {
      console.log('[DEBUG_LOG] ========== connectToRoom Start ==========')
      console.log('[DEBUG_LOG] Connecting to game room:', gameNumber)

      console.log('[DEBUG_LOG] Cleaning up existing socket connection')
      if (gameStompClient.isClientConnected()) {
        gameStompClient.disconnect()
      }

      console.log('[DEBUG_LOG] Loading chat history before WebSocket connection')
      await loadChatHistory(gameNumber)

      console.log('[DEBUG_LOG] Establishing WebSocket connection')
      const client = await gameStompClient.connect('http://localhost:20021')
      socketRef.current = gameStompClient

      // Set up subscriptions
      gameStompClient.subscribeToGameChat(gameNumber, (message) => {
        console.log('[DEBUG_LOG] Received chat message:', message)
        dispatch({ type: ACTION_TYPES.ADD_CHAT_MESSAGE, payload: message })
      })

      gameStompClient.subscribeToGameRoom(gameNumber, (update) => {
        console.log('[DEBUG_LOG] Received room update:', update)
        
        // Handle PLAYER_JOINED and PLAYER_LEFT events
        if (update.type === 'PLAYER_JOINED' || update.type === 'PLAYER_LEFT') {
          // Update room players if available
          if (update.roomData && update.roomData.players) {
            dispatch({ type: ACTION_TYPES.SET_ROOM_PLAYERS, payload: update.roomData.players })
          }
          
          // Update current room information with roomData
          if (update.roomData) {
            const updatedRoom = {
              gameNumber: update.roomData.gameNumber,
              title: update.roomData.title,
              host: update.roomData.host,
              currentPlayers: update.roomData.currentPlayers,
              maxPlayers: update.roomData.maxPlayers,
              subject: update.roomData.subject,
              subjects: update.roomData.subjects || [],
              state: update.roomData.state,
              players: update.roomData.players || []
            }
            
            console.log('[DEBUG_LOG] Updating currentRoom with roomData (including subjects):', updatedRoom)
            dispatch({ type: ACTION_TYPES.SET_CURRENT_ROOM, payload: updatedRoom })
          }
          
          // Update room in the room list as well
          if (update.roomData) {
            dispatch({ 
              type: ACTION_TYPES.UPDATE_ROOM_IN_LIST, 
              payload: {
                gameNumber: update.roomData.gameNumber,
                currentPlayers: update.roomData.currentPlayers,
                maxPlayers: update.roomData.maxPlayers,
                title: update.roomData.title,
                subject: update.roomData.subject,
                subjects: update.roomData.subjects || [],
                state: update.roomData.state
              }
            })
          }
        }
      })

      gameStompClient.subscribeToPlayerUpdates(gameNumber, (playerUpdate) => {
        console.log('[DEBUG_LOG] Received player update:', playerUpdate)
        dispatch({ type: ACTION_TYPES.SET_ROOM_PLAYERS, payload: playerUpdate.players || [] })
      })

      dispatch({ type: ACTION_TYPES.SET_SOCKET_CONNECTION, payload: true })
      console.log('[SUCCESS] Connected to game room:', gameNumber)
      console.log('[DEBUG_LOG] ========== connectToRoom End ==========')

    } catch (error) {
      console.error('[ERROR] connectToRoom failed:', error)

      if (retryCount < MAX_RETRIES) {
        console.log(`[DEBUG_LOG] Retrying connection... (${retryCount + 1}/${MAX_RETRIES})`)
        setTimeout(() => {
          connectToRoom(gameNumber, retryCount + 1)
        }, 2000 * (retryCount + 1)) // Exponential backoff
      } else {
        setError(ERROR_KEYS.SOCKET, 'WebSocket 연결에 실패했습니다.')
      }
    }
  }, [state.socketConnected, state.currentRoom, dispatch, setError, loadChatHistory])

  return {
    connectSocket,
    disconnectSocket,
    connectToRoom,
    socketConnected: state.socketConnected,
    socketRef
  }
}