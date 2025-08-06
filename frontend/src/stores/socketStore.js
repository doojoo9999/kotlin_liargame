import {create} from 'zustand'
import {subscribeWithSelector} from 'zustand/middleware'
import gameStompClient from '../socket/gameStompClient'
import * as gameApi from '../api/gameApi'
import useAuthStore from './authStore'
import useRoomStore from './roomStore'

const useSocketStore = create(
  subscribeWithSelector((set, get) => ({
    // State
    socketConnected: false,
    chatMessages: [],
    roomPlayers: [],
    currentTurnPlayerId: null,
    loading: {
      socket: false,
      chatHistory: false,
    },
    error: {
      socket: null,
    },

    // WebSocket connection management
    connectSocket: async (gameNumber) => {
      try {
        console.log('[DEBUG_LOG] Connecting to WebSocket for game:', gameNumber)
        set(state => ({ 
          loading: { ...state.loading, socket: true },
          error: { ...state.error, socket: null }
        }))

        await gameStompClient.connect()
        
        const handleChatMessage = (message) => {
          console.log('[DEBUG_LOG] Received chat message via WebSocket:', message)
          set(state => ({
            chatMessages: [...state.chatMessages, message]
          }))
        }

        const handleGameUpdate = (update) => {
          console.log('[DEBUG_LOG] Received game update:', update)
          // Forward game updates to gameStore (avoid circular dependency)
          import('./gameStore').then(({ default: gameStore }) => {
            gameStore.getState().handleGameUpdate(update)
          })
        }

        const handlePlayerUpdate = (players) => {
          console.log('[DEBUG_LOG] Received player update:', players)
          set({ roomPlayers: players })
        }

        gameStompClient.subscribeToGameChat(gameNumber, handleChatMessage)
        gameStompClient.subscribeToGameRoom(gameNumber, handleGameUpdate)
        gameStompClient.subscribeToPlayerUpdates(gameNumber, handlePlayerUpdate)

        console.log('[DEBUG_LOG] WebSocket subscriptions set up for game:', gameNumber)
        set(state => ({
          socketConnected: true,
          loading: { ...state.loading, socket: false }
        }))

      } catch (error) {
        console.error('Failed to connect socket:', error)
        set(state => ({
          error: { ...state.error, socket: error.message },
          loading: { ...state.loading, socket: false }
        }))
      }
    },

    disconnectSocket: () => {
      try {
        console.log('[DEBUG_LOG] Disconnecting STOMP client')

        if (gameStompClient.isClientConnected()) {
          gameStompClient.disconnect()
        }

        set({
          socketConnected: false,
          chatMessages: [],
          error: { socket: null }
        })

      } catch (error) {
        console.error('[ERROR] Failed to disconnect socket:', error)
      }
    },

    connectToRoom: async (gameNumber, retryCount = 0) => {
      const MAX_RETRIES = 3

      if (retryCount >= MAX_RETRIES) {
        console.error('[ERROR] Max connection retries reached')
        set(state => ({
          error: { ...state.error, socket: 'WebSocket 연결에 실패했습니다.' }
        }))
        return
      }

      try {
        console.log('[DEBUG_LOG] ========== connectToRoom Start ==========')
        console.log('[DEBUG_LOG] Connecting to game room:', gameNumber)

        console.log('[DEBUG_LOG] Cleaning up existing socket connection')
        if (gameStompClient.isClientConnected()) {
          gameStompClient.disconnect()
        }

        console.log('[DEBUG_LOG] Loading chat history before WebSocket connection')
        await get().loadChatHistory(gameNumber)

        console.log('[DEBUG_LOG] Establishing WebSocket connection')
        const client = await gameStompClient.connect('http://localhost:20021')

        gameStompClient.subscribeToGameChat(gameNumber, (message) => {
          console.log('[DEBUG_LOG] Received chat message:', message)
          set(state => ({
            chatMessages: [...state.chatMessages, message]
          }))
        })

        gameStompClient.subscribeToGameRoom(gameNumber, (update) => {
          console.log('[DEBUG_LOG] Received room update:', update)
          if (update.type === 'PLAYER_JOINED' || update.type === 'PLAYER_LEFT') {
            set({ roomPlayers: update.players || [] })
          } else {
            // Forward game updates to gameStore
            import('./gameStore').then(({ default: gameStore }) => {
              gameStore.getState().handleGameUpdate(update)
            })
          }
        })

        gameStompClient.subscribeToPlayerUpdates(gameNumber, (playerUpdate) => {
          console.log('[DEBUG_LOG] Received player update:', playerUpdate)
          set({ roomPlayers: playerUpdate.players || [] })
        })

        set({ socketConnected: true })
        console.log('[SUCCESS] Connected to game room:', gameNumber)
        console.log('[DEBUG_LOG] ========== connectToRoom End ==========')

      } catch (error) {
        console.error('[ERROR] connectToRoom failed:', error)

        if (retryCount < MAX_RETRIES) {
          console.log(`[DEBUG_LOG] Retrying connection... (${retryCount + 1}/${MAX_RETRIES})`)
          setTimeout(() => {
            get().connectToRoom(gameNumber, retryCount + 1)
          }, 2000 * (retryCount + 1))
        } else {
          set(state => ({
            error: { ...state.error, socket: 'WebSocket 연결에 실패했습니다.' },
            socketConnected: false
          }))
        }
      }
    },

    // Chat functions
    sendChatMessage: (message) => {
      try {
        const { currentRoom } = useRoomStore.getState()
        
        if (!currentRoom?.gameNumber) {
          console.warn('[DEBUG_LOG] No current room, cannot send message')
          return false
        }

        if (!get().socketConnected || !gameStompClient.isClientConnected()) {
          console.warn('[DEBUG_LOG] WebSocket not connected, cannot send message')
          return false
        }

        console.log('[DEBUG_LOG] Sending chat message:', message)
        return gameStompClient.sendChatMessage(currentRoom.gameNumber, message)

      } catch (error) {
        console.error('[ERROR] Failed to send chat message:', error)
        return false
      }
    },

    loadChatHistory: async (gameNumber) => {
      // Prevent multiple simultaneous calls
      if (get().loading.chatHistory) {
        console.log('[DEBUG_LOG] Chat history already loading, skipping duplicate request')
        return []
      }

      try {
        console.log('[DEBUG_LOG] ========== loadChatHistory Start ==========')
        console.log('[DEBUG_LOG] Loading chat history for game:', gameNumber)
        
        set(state => ({ 
          loading: { ...state.loading, chatHistory: true }
        }))
        
        const messages = await gameApi.getChatHistory(gameNumber)
        console.log('[DEBUG_LOG] API returned messages:', messages)
        console.log('[DEBUG_LOG] Number of messages:', Array.isArray(messages) ? messages.length : 'Not an array')
        
        if (Array.isArray(messages)) {
          // Sort by timestamp
          const sortedMessages = messages.sort((a, b) => 
            new Date(a.timestamp) - new Date(b.timestamp)
          )
          
          console.log('[DEBUG_LOG] Sorted messages for display:')
          sortedMessages.forEach((msg, index) => {
            console.log(`[DEBUG_LOG]   ${index + 1}. ${msg.playerNickname}: ${msg.content}`)
          })
          
          set({ chatMessages: sortedMessages })
          console.log('[SUCCESS] Chat history loaded successfully')
        } else {
          console.warn('[WARN] Invalid chat history format')
          set({ chatMessages: [] })
        }
        
        console.log('[DEBUG_LOG] ========== loadChatHistory End ==========')
        return messages
      } catch (error) {
        console.error('[ERROR] Failed to load chat history:', error)
        set({ 
          chatMessages: [],
          error: { socket: '채팅 기록 로드 실패' }
        })
        return []
      } finally {
        set(state => ({ 
          loading: { ...state.loading, chatHistory: false }
        }))
      }
    },

    // Player management
    setRoomPlayers: (players) => {
      set({ roomPlayers: players })
    },

    updatePlayerInRoom: (updatedPlayer) => {
      set(state => ({
        roomPlayers: state.roomPlayers.map(player =>
          player.id === updatedPlayer.id
            ? { ...player, ...updatedPlayer }
            : player
        )
      }))
    },

    setCurrentTurnPlayer: (playerId) => {
      set({ currentTurnPlayerId: playerId })
    },

    // Message management
    addChatMessage: (message) => {
      set(state => ({
        chatMessages: [...state.chatMessages, message]
      }))
    },

    setChatMessages: (messages) => {
      set({ chatMessages: messages })
    },

    clearChatMessages: () => {
      set({ chatMessages: [] })
    },

    // Game actions via WebSocket
    startGame: () => {
      const { currentRoom } = useRoomStore.getState()
      if (get().socketConnected && gameStompClient.isClientConnected() && currentRoom) {
        console.log('[DEBUG_LOG] Starting game for room:', currentRoom.gameNumber)
        gameStompClient.sendGameAction(currentRoom.gameNumber, 'start')
      }
    },

    castVote: (playerId) => {
      const { currentRoom } = useRoomStore.getState()
      if (get().socketConnected && gameStompClient.isClientConnected() && currentRoom) {
        console.log('[DEBUG_LOG] Casting vote for player:', playerId)
        gameStompClient.sendGameAction(currentRoom.gameNumber, 'vote', { targetPlayerId: playerId })
      }
    },

    // Error handling
    clearError: () => {
      set(state => ({
        error: { ...state.error, socket: null }
      }))
    },

    // Reset store
    reset: () => {
      // Disconnect socket first
      get().disconnectSocket()
      
      set({
        socketConnected: false,
        chatMessages: [],
        roomPlayers: [],
        currentTurnPlayerId: null,
        loading: { socket: false, chatHistory: false },
        error: { socket: null }
      })
    }
  }))
)

// Subscribe to auth changes to handle cleanup on logout
useAuthStore.subscribe(
  (state) => state.isAuthenticated,
  (isAuthenticated) => {
    if (!isAuthenticated) {
      useSocketStore.getState().reset()
    }
  }
)

// Subscribe to room changes to handle WebSocket connections
useRoomStore.subscribe(
  (state) => state.currentRoom,
  (currentRoom, previousRoom) => {
    const socketStore = useSocketStore.getState()
    
    // If we left a room, disconnect
    if (previousRoom && !currentRoom) {
      socketStore.disconnectSocket()
    }
    
    // If we joined a room, connect to it
    if (currentRoom && currentRoom.gameNumber) {
      socketStore.connectToRoom(currentRoom.gameNumber)
    }
  }
)

export default useSocketStore