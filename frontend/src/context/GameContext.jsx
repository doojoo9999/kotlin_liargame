import React, {createContext, useContext, useEffect, useReducer, useRef} from 'react'
import * as gameApi from '../api/gameApi'
import {getSocketClient} from '../socket/socketClient'

/**
 * Game Context for managing global application state
 * Handles currentUser, currentRoom, roomList, and related operations
 */

// Initial state
const initialState = {
  // User state
  currentUser: null,
  isAuthenticated: false,
  
  // Room state
  currentRoom: null,
  roomList: [],
  subjects: [],
  
  // WebSocket state
  socketConnected: false,
  chatMessages: [],
  roomPlayers: [],
  currentTurnPlayerId: null,
  
  // Game logic state
  gameStatus: 'WAITING', // 'WAITING' | 'SPEAKING' | 'VOTING' | 'RESULTS' | 'FINISHED'
  currentRound: 0,
  playerRole: null, // 'LIAR' | 'CITIZEN' | null
  assignedWord: null, // The word/keyword assigned to the player
  gameTimer: 0, // Remaining time for current phase
  votingResults: null,
  gameResults: null,
  accusedPlayerId: null,
  defendingPlayerId: null,
  
  // UI state
  loading: {
    rooms: false,
    room: false,
    auth: false,
    subjects: false,
    socket: false
  },
  error: {
    rooms: null,
    room: null,
    auth: null,
    subjects: null,
    socket: null
  },
  
  // App state
  currentPage: 'lobby' // 'lobby' | 'room'
}

// Action types
const ActionTypes = {
  // Loading actions
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  
  // Auth actions
  SET_USER: 'SET_USER',
  LOGOUT: 'LOGOUT',
  
  // Room actions
  SET_ROOM_LIST: 'SET_ROOM_LIST',
  SET_CURRENT_ROOM: 'SET_CURRENT_ROOM',
  CLEAR_CURRENT_ROOM: 'CLEAR_CURRENT_ROOM',
  UPDATE_ROOM_IN_LIST: 'UPDATE_ROOM_IN_LIST',
  
  // Subject actions
  SET_SUBJECTS: 'SET_SUBJECTS',
  
  // WebSocket actions
  SET_SOCKET_CONNECTION: 'SET_SOCKET_CONNECTION',
  ADD_CHAT_MESSAGE: 'ADD_CHAT_MESSAGE',
  SET_CHAT_MESSAGES: 'SET_CHAT_MESSAGES',
  CLEAR_CHAT_MESSAGES: 'CLEAR_CHAT_MESSAGES',
  SET_ROOM_PLAYERS: 'SET_ROOM_PLAYERS',
  UPDATE_PLAYER_IN_ROOM: 'UPDATE_PLAYER_IN_ROOM',
  SET_CURRENT_TURN_PLAYER: 'SET_CURRENT_TURN_PLAYER',
  
  // Game logic actions
  SET_GAME_STATUS: 'SET_GAME_STATUS',
  SET_CURRENT_ROUND: 'SET_CURRENT_ROUND',
  SET_PLAYER_ROLE: 'SET_PLAYER_ROLE',
  SET_ASSIGNED_WORD: 'SET_ASSIGNED_WORD',
  SET_GAME_TIMER: 'SET_GAME_TIMER',
  SET_VOTING_RESULTS: 'SET_VOTING_RESULTS',
  SET_GAME_RESULTS: 'SET_GAME_RESULTS',
  SET_ACCUSED_PLAYER: 'SET_ACCUSED_PLAYER',
  SET_DEFENDING_PLAYER: 'SET_DEFENDING_PLAYER',
  RESET_GAME_STATE: 'RESET_GAME_STATE',
  
  // Navigation actions
  SET_CURRENT_PAGE: 'SET_CURRENT_PAGE'
}

// Reducer function
const gameReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.type]: action.payload.value
        }
      }
      
    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: {
          ...state.error,
          [action.payload.type]: action.payload.value
        }
      }
      
    case ActionTypes.SET_USER:
      return {
        ...state,
        currentUser: action.payload,
        isAuthenticated: !!action.payload
      }
      
    case ActionTypes.LOGOUT:
      localStorage.removeItem('accessToken')
      return {
        ...state,
        currentUser: null,
        isAuthenticated: false,
        currentRoom: null,
        currentPage: 'lobby'
      }
      
    case ActionTypes.SET_ROOM_LIST:
      return {
        ...state,
        roomList: action.payload
      }
      
    case ActionTypes.SET_CURRENT_ROOM:
      return {
        ...state,
        currentRoom: action.payload,
        currentPage: 'room'
      }
      
    case ActionTypes.CLEAR_CURRENT_ROOM:
      return {
        ...state,
        currentRoom: null,
        currentPage: 'lobby'
      }
      
    case ActionTypes.UPDATE_ROOM_IN_LIST:
      return {
        ...state,
        roomList: state.roomList.map(room =>
          room.gameNumber === action.payload.gameNumber
            ? { ...room, ...action.payload }
            : room
        )
      }
      
    case ActionTypes.SET_SUBJECTS:
      return {
        ...state,
        subjects: action.payload
      }
      
    case ActionTypes.SET_CURRENT_PAGE:
      return {
        ...state,
        currentPage: action.payload
      }
      
    // WebSocket actions
    case ActionTypes.SET_SOCKET_CONNECTION:
      return {
        ...state,
        socketConnected: action.payload
      }
      
    case ActionTypes.ADD_CHAT_MESSAGE:
      return {
        ...state,
        chatMessages: [...state.chatMessages, action.payload]
      }
      
    case ActionTypes.SET_CHAT_MESSAGES:
      return {
        ...state,
        chatMessages: action.payload
      }
      
    case ActionTypes.CLEAR_CHAT_MESSAGES:
      return {
        ...state,
        chatMessages: []
      }
      
    case ActionTypes.SET_ROOM_PLAYERS:
      return {
        ...state,
        roomPlayers: action.payload
      }
      
    case ActionTypes.UPDATE_PLAYER_IN_ROOM:
      return {
        ...state,
        roomPlayers: state.roomPlayers.map(player =>
          player.id === action.payload.id
            ? { ...player, ...action.payload }
            : player
        )
      }
      
    case ActionTypes.SET_CURRENT_TURN_PLAYER:
      return {
        ...state,
        currentTurnPlayerId: action.payload
      }
      
    // Game logic actions
    case ActionTypes.SET_GAME_STATUS:
      return {
        ...state,
        gameStatus: action.payload
      }
      
    case ActionTypes.SET_CURRENT_ROUND:
      return {
        ...state,
        currentRound: action.payload
      }
      
    case ActionTypes.SET_PLAYER_ROLE:
      return {
        ...state,
        playerRole: action.payload
      }
      
    case ActionTypes.SET_ASSIGNED_WORD:
      return {
        ...state,
        assignedWord: action.payload
      }
      
    case ActionTypes.SET_GAME_TIMER:
      return {
        ...state,
        gameTimer: action.payload
      }
      
    case ActionTypes.SET_VOTING_RESULTS:
      return {
        ...state,
        votingResults: action.payload
      }
      
    case ActionTypes.SET_GAME_RESULTS:
      return {
        ...state,
        gameResults: action.payload
      }
      
    case ActionTypes.SET_ACCUSED_PLAYER:
      return {
        ...state,
        accusedPlayerId: action.payload
      }
      
    case ActionTypes.SET_DEFENDING_PLAYER:
      return {
        ...state,
        defendingPlayerId: action.payload
      }
      
    case ActionTypes.RESET_GAME_STATE:
      return {
        ...state,
        gameStatus: 'WAITING',
        currentRound: 0,
        playerRole: null,
        assignedWord: null,
        gameTimer: 0,
        votingResults: null,
        gameResults: null,
        accusedPlayerId: null,
        defendingPlayerId: null
      }
      
    default:
      return state
  }
}

// Create context
const GameContext = createContext()

// Context provider component
export const GameProvider = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState)
  const socketRef = useRef(null)
  
  // Helper function to set loading state
  const setLoading = (type, value) => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: { type, value } })
  }
  
  // Helper function to set error state
  const setError = (type, value) => {
    dispatch({ type: ActionTypes.SET_ERROR, payload: { type, value } })
  }

  // WebSocket functions
  const connectSocket = () => {
    if (socketRef.current) {
      console.log('[DEBUG_LOG] Socket already connected')
      return socketRef.current
    }

    try {
      setLoading('socket', true)
      setError('socket', null)
      
      const socket = getSocketClient()
      socketRef.current = socket
      
      // Setup event listeners
      socket.on('connection_status', (data) => {
        console.log('[DEBUG_LOG] Socket connection status:', data)
        dispatch({ type: ActionTypes.SET_SOCKET_CONNECTION, payload: data.connected })
        if (data.connected) {
          setLoading('socket', false)
        }
      })

      socket.on('connection_error', (error) => {
        console.error('[DEBUG_LOG] Socket connection error:', error)
        setError('socket', 'WebSocket 연결에 실패했습니다.')
        setLoading('socket', false)
      })

      socket.on('receiveMessage', (messageData) => {
        console.log('[DEBUG_LOG] Received chat message:', messageData)
        const message = {
          id: messageData.id || Date.now(),
          sender: messageData.sender,
          content: messageData.message,
          isSystem: messageData.isSystem || false,
          timestamp: messageData.timestamp || new Date().toISOString()
        }
        dispatch({ type: ActionTypes.ADD_CHAT_MESSAGE, payload: message })
      })

      socket.on('updatePlayers', (players) => {
        console.log('[DEBUG_LOG] Players updated:', players)
        dispatch({ type: ActionTypes.SET_ROOM_PLAYERS, payload: players })
        
        // Also update current room players if we have a current room
        if (state.currentRoom) {
          dispatch({ 
            type: ActionTypes.SET_CURRENT_ROOM, 
            payload: { ...state.currentRoom, players } 
          })
        }
      })

      socket.on('currentTurn', (playerId) => {
        console.log('[DEBUG_LOG] Current turn player:', playerId)
        dispatch({ type: ActionTypes.SET_CURRENT_TURN_PLAYER, payload: playerId })
      })

      socket.on('roomUpdate', (roomData) => {
        console.log('[DEBUG_LOG] Room updated:', roomData)
        if (state.currentRoom && roomData.gameNumber === state.currentRoom.gameNumber) {
          dispatch({ type: ActionTypes.SET_CURRENT_ROOM, payload: roomData })
        }
      })

      socket.on('gameStateUpdate', (gameState) => {
        console.log('[DEBUG_LOG] Game state updated:', gameState)
        if (state.currentRoom) {
          dispatch({ 
            type: ActionTypes.SET_CURRENT_ROOM, 
            payload: { ...state.currentRoom, ...gameState } 
          })
        }
      })

      // Game logic events
      socket.on('gameStarted', (data) => {
        console.log('[DEBUG_LOG] Game started:', data)
        dispatch({ type: ActionTypes.SET_GAME_STATUS, payload: 'SPEAKING' })
        dispatch({ type: ActionTypes.SET_CURRENT_ROUND, payload: data.round || 1 })
        
        // Add system message
        dispatch({ 
          type: ActionTypes.ADD_CHAT_MESSAGE, 
          payload: {
            id: Date.now(),
            sender: 'System',
            content: '게임이 시작되었습니다!',
            isSystem: true,
            timestamp: new Date().toISOString()
          }
        })
      })

      socket.on('assignRole', (data) => {
        console.log('[DEBUG_LOG] Role assigned:', data)
        dispatch({ type: ActionTypes.SET_PLAYER_ROLE, payload: data.role })
        dispatch({ type: ActionTypes.SET_ASSIGNED_WORD, payload: data.keyword })
        
        // Add system message with role info
        const roleText = data.role === 'LIAR' ? '라이어' : '시민'
        dispatch({ 
          type: ActionTypes.ADD_CHAT_MESSAGE, 
          payload: {
            id: Date.now(),
            sender: 'System',
            content: `당신의 역할: ${roleText} | 키워드: ${data.keyword}`,
            isSystem: true,
            timestamp: new Date().toISOString()
          }
        })
      })

      socket.on('turnStart', (data) => {
        console.log('[DEBUG_LOG] Turn started:', data)
        dispatch({ type: ActionTypes.SET_CURRENT_TURN_PLAYER, payload: data.playerId })
        dispatch({ type: ActionTypes.SET_GAME_TIMER, payload: data.timeLimit || 30 })
        dispatch({ type: ActionTypes.SET_GAME_STATUS, payload: 'SPEAKING' })
        
        // Add system message
        const playerName = state.roomPlayers.find(p => p.id === data.playerId)?.nickname || 'Unknown'
        dispatch({ 
          type: ActionTypes.ADD_CHAT_MESSAGE, 
          payload: {
            id: Date.now(),
            sender: 'System',
            content: `${playerName}님의 발언 시간입니다. (${data.timeLimit || 30}초)`,
            isSystem: true,
            timestamp: new Date().toISOString()
          }
        })
      })

      socket.on('startVote', (data) => {
        console.log('[DEBUG_LOG] Voting started:', data)
        dispatch({ type: ActionTypes.SET_GAME_STATUS, payload: 'VOTING' })
        dispatch({ type: ActionTypes.SET_GAME_TIMER, payload: data.timeLimit || 30 })
        dispatch({ type: ActionTypes.SET_CURRENT_TURN_PLAYER, payload: null })
        
        // Add system message
        dispatch({ 
          type: ActionTypes.ADD_CHAT_MESSAGE, 
          payload: {
            id: Date.now(),
            sender: 'System',
            content: `투표를 시작합니다! (${data.timeLimit || 30}초)`,
            isSystem: true,
            timestamp: new Date().toISOString()
          }
        })
      })

      socket.on('roundResult', (data) => {
        console.log('[DEBUG_LOG] Round result:', data)
        dispatch({ type: ActionTypes.SET_GAME_STATUS, payload: 'RESULTS' })
        dispatch({ type: ActionTypes.SET_VOTING_RESULTS, payload: data })
        dispatch({ type: ActionTypes.SET_GAME_TIMER, payload: 0 })
        
        // Add result messages
        const liarName = state.roomPlayers.find(p => p.id === data.liarId)?.nickname || 'Unknown'
        const votedName = state.roomPlayers.find(p => p.id === data.votedPlayerId)?.nickname || 'Unknown'
        
        dispatch({ 
          type: ActionTypes.ADD_CHAT_MESSAGE, 
          payload: {
            id: Date.now(),
            sender: 'System',
            content: `라이어는 ${liarName}님이었습니다!`,
            isSystem: true,
            timestamp: new Date().toISOString()
          }
        })
        
        dispatch({ 
          type: ActionTypes.ADD_CHAT_MESSAGE, 
          payload: {
            id: Date.now() + 1,
            sender: 'System',
            content: `가장 많이 투표받은 플레이어: ${votedName}님`,
            isSystem: true,
            timestamp: new Date().toISOString()
          }
        })
        
        dispatch({ 
          type: ActionTypes.ADD_CHAT_MESSAGE, 
          payload: {
            id: Date.now() + 2,
            sender: 'System',
            content: `${data.winner === 'LIAR' ? '라이어' : '시민'}이 승리했습니다!`,
            isSystem: true,
            timestamp: new Date().toISOString()
          }
        })
      })

      socket.on('gameEnded', (data) => {
        console.log('[DEBUG_LOG] Game ended:', data)
        dispatch({ type: ActionTypes.SET_GAME_STATUS, payload: 'FINISHED' })
        dispatch({ type: ActionTypes.SET_GAME_RESULTS, payload: data })
        
        // Add system message
        dispatch({ 
          type: ActionTypes.ADD_CHAT_MESSAGE, 
          payload: {
            id: Date.now(),
            sender: 'System',
            content: '게임이 종료되었습니다.',
            isSystem: true,
            timestamp: new Date().toISOString()
          }
        })
      })

      // Connect to server
      socket.connect()
      
      return socket
    } catch (error) {
      console.error('[DEBUG_LOG] Failed to setup socket:', error)
      setError('socket', 'WebSocket 설정에 실패했습니다.')
      setLoading('socket', false)
      throw error
    }
  }

  const disconnectSocket = () => {
    if (socketRef.current) {
      console.log('[DEBUG_LOG] Disconnecting socket')
      socketRef.current.disconnect()
      socketRef.current = null
      dispatch({ type: ActionTypes.SET_SOCKET_CONNECTION, payload: false })
      dispatch({ type: ActionTypes.CLEAR_CHAT_MESSAGES })
      dispatch({ type: ActionTypes.SET_ROOM_PLAYERS, payload: [] })
      dispatch({ type: ActionTypes.SET_CURRENT_TURN_PLAYER, payload: null })
    }
  }

  const joinSocketRoom = (roomId) => {
    if (!socketRef.current) {
      console.warn('[DEBUG_LOG] Cannot join socket room: not connected')
      return
    }

    const userId = state.currentUser?.nickname || 'Anonymous'
    console.log('[DEBUG_LOG] Joining socket room:', roomId, 'as', userId)
    
    // Clear previous chat messages when joining new room
    dispatch({ type: ActionTypes.CLEAR_CHAT_MESSAGES })
    
    socketRef.current.joinRoom(roomId, userId)
  }

  const leaveSocketRoom = () => {
    if (!socketRef.current) {
      console.warn('[DEBUG_LOG] Cannot leave socket room: not connected')
      return
    }

    console.log('[DEBUG_LOG] Leaving socket room')
    socketRef.current.leaveRoom()
    
    // Clear room-specific data
    dispatch({ type: ActionTypes.CLEAR_CHAT_MESSAGES })
    dispatch({ type: ActionTypes.SET_ROOM_PLAYERS, payload: [] })
    dispatch({ type: ActionTypes.SET_CURRENT_TURN_PLAYER, payload: null })
  }

  const sendChatMessage = (message) => {
    if (!socketRef.current) {
      console.warn('[DEBUG_LOG] Cannot send message: socket not connected')
      return
    }

    if (!state.currentRoom) {
      console.warn('[DEBUG_LOG] Cannot send message: not in a room')
      return
    }

    const sender = state.currentUser?.nickname || 'Anonymous'
    console.log('[DEBUG_LOG] Sending chat message:', message, 'from', sender)
    
    socketRef.current.sendMessage(message, sender)
  }

  // Game action functions
  const startGame = () => {
    if (!socketRef.current || !state.currentRoom) {
      console.warn('[DEBUG_LOG] Cannot start game: not connected or not in room')
      return
    }

    console.log('[DEBUG_LOG] Starting game for room:', state.currentRoom.gameNumber)
    socketRef.current.socket?.emit('startGame', { roomId: state.currentRoom.gameNumber })
  }

  const castVote = (targetPlayerId) => {
    if (!socketRef.current || !state.currentRoom) {
      console.warn('[DEBUG_LOG] Cannot cast vote: not connected or not in room')
      return
    }

    console.log('[DEBUG_LOG] Casting vote for player:', targetPlayerId)
    socketRef.current.socket?.emit('castVote', { 
      roomId: state.currentRoom.gameNumber, 
      targetPlayerId 
    })
  }

  const resetGameState = () => {
    dispatch({ type: ActionTypes.RESET_GAME_STATE })
  }
  
  // Authentication functions
  const login = async (nickname) => {
    try {
      setLoading('auth', true)
      setError('auth', null)
      
      console.log('[DEBUG_LOG] Attempting login for:', nickname)
      const response = await gameApi.login(nickname)
      
      localStorage.setItem('accessToken', response.accessToken)
      const userData = { nickname }
      localStorage.setItem('userData', JSON.stringify(userData))
      
      const user = { nickname, accessToken: response.accessToken }
      dispatch({ type: ActionTypes.SET_USER, payload: user })
      
      console.log('[DEBUG_LOG] Login successful, token stored')
      
      try {
        await fetchRooms()
        await fetchSubjects()
      } catch (dataError) {
        console.warn('[DEBUG_LOG] Failed to load initial data after login:', dataError)
      }
      
      return user
    } catch (error) {
      console.error('[DEBUG_LOG] Login failed:', error)
      setError('auth', error.response?.data?.message || '로그인에 실패했습니다.')
      throw error
    } finally {
      setLoading('auth', false)
    }
  }
  
  const logout = () => {
    console.log('[DEBUG_LOG] User logging out, clearing session data')
    
    // Clear all stored authentication data
    localStorage.removeItem('accessToken')
    localStorage.removeItem('userData')
    
    // Disconnect WebSocket if connected
    try {
      if (socketRef.current) {
        disconnectSocket()
      }
    } catch (error) {
      console.warn('[DEBUG_LOG] Error disconnecting WebSocket during logout:', error)
    }
    
    dispatch({ type: ActionTypes.LOGOUT })
  }
  
  const fetchRooms = async () => {
    try {
      setLoading('rooms', true)
      setError('rooms', null)
      
      const response = await gameApi.getAllRooms()
      dispatch({ type: ActionTypes.SET_ROOM_LIST, payload: response.rooms })
      
      return response.rooms
    } catch (error) {
      // Use dummy data if API fails
      console.warn('API failed, using dummy data:', error.message)
      dispatch({ type: ActionTypes.SET_ROOM_LIST, payload: gameApi.dummyData.rooms })
      return gameApi.dummyData.rooms
    } finally {
      setLoading('rooms', false)
    }
  }
  
  const createRoom = async (roomData) => {
    try {
      setLoading('room', true)
      setError('room', null)
      
      const gameNumber = await gameApi.createRoom(roomData)
      
      await fetchRooms()
      
      return gameNumber
    } catch (error) {
      setError('room', error.response?.data?.message || 'Failed to create room')
      throw error
    } finally {
      setLoading('room', false)
    }
  }
  
  const joinRoom = async (gameNumber, password = '') => {
    try {
      setLoading('room', true)
      setError('room', null)
      
      const roomData = await gameApi.joinRoom(gameNumber, password)
      dispatch({ type: ActionTypes.SET_CURRENT_ROOM, payload: roomData })
      
      try {
        if (!socketRef.current) {
          connectSocket()
        }
        setTimeout(() => {
          joinSocketRoom(gameNumber)
        }, 1000)
      } catch (socketError) {
        console.warn('[DEBUG_LOG] Failed to connect to WebSocket:', socketError)
      }
      
      return roomData
    } catch (error) {
      console.warn('API failed, using dummy data:', error.message)
      const dummyRoom = gameApi.dummyData.gameState
      dispatch({ type: ActionTypes.SET_CURRENT_ROOM, payload: dummyRoom })
      
      try {
        if (!socketRef.current) {
          connectSocket()
        }
        setTimeout(() => {
          joinSocketRoom(gameNumber)
        }, 1000)
      } catch (socketError) {
        console.warn('[DEBUG_LOG] Failed to connect to WebSocket in dummy mode:', socketError)
      }
      
      return dummyRoom
    } finally {
      setLoading('room', false)
    }
  }
  
  const leaveRoom = async (gameNumber) => {
    try {
      setLoading('room', true)
      setError('room', null)
      
      try {
        leaveSocketRoom()
      } catch (socketError) {
        console.warn('[DEBUG_LOG] Failed to leave WebSocket room:', socketError)
      }
      
      await gameApi.leaveRoom(gameNumber)
      dispatch({ type: ActionTypes.CLEAR_CURRENT_ROOM })
      
      await fetchRooms()
      
      return true
    } catch (error) {
      setError('room', error.response?.data?.message || 'Failed to leave room')
      try {
        leaveSocketRoom()
      } catch (socketError) {
        console.warn('[DEBUG_LOG] Failed to leave WebSocket room on error:', socketError)
      }
      dispatch({ type: ActionTypes.CLEAR_CURRENT_ROOM })
      throw error
    } finally {
      setLoading('room', false)
    }
  }
  
  const fetchSubjects = async () => {
    try {
      setLoading('subjects', true)
      setError('subjects', null)
      
      const subjects = await gameApi.getAllSubjects()
      dispatch({ type: ActionTypes.SET_SUBJECTS, payload: subjects })
      
      return subjects
    } catch (error) {
      console.warn('API failed, using dummy data:', error.message)
      dispatch({ type: ActionTypes.SET_SUBJECTS, payload: gameApi.dummyData.subjects })
      return gameApi.dummyData.subjects
    } finally {
      setLoading('subjects', false)
    }
  }
  
  const navigateToLobby = () => {
    dispatch({ type: ActionTypes.SET_CURRENT_PAGE, payload: 'lobby' })
  }
  
  const navigateToRoom = () => {
    dispatch({ type: ActionTypes.SET_CURRENT_PAGE, payload: 'room' })
  }
  
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading('auth', true)
        
        const token = localStorage.getItem('accessToken')
        const userData = localStorage.getItem('userData')
        
        if (token && userData) {
          try {
            const user = JSON.parse(userData)
            console.log('[DEBUG_LOG] Restoring user session:', user.nickname)
            dispatch({ type: ActionTypes.SET_USER, payload: { ...user, accessToken: token } })
            
            await fetchRooms()
            await fetchSubjects()
          } catch (parseError) {
            console.warn('[DEBUG_LOG] Failed to parse stored user data, clearing storage')
            localStorage.removeItem('accessToken')
            localStorage.removeItem('userData')
          }
        } else if (token && !userData) {
          console.warn('[DEBUG_LOG] Token exists but no user data, clearing storage')
          localStorage.removeItem('accessToken')
        }
      } catch (error) {
        console.error('[DEBUG_LOG] Error during auth initialization:', error)
        setError('auth', 'Authentication initialization failed')
      } finally {
        setLoading('auth', false)
      }
    }
    
    initializeAuth()
  }, [])
  
  const value = {
    ...state,
    
    login,
    logout,
    fetchRooms,
    createRoom,
    joinRoom,
    leaveRoom,
    fetchSubjects,
    navigateToLobby,
    navigateToRoom,
    setLoading,
    setError,
    
    // WebSocket actions
    connectSocket,
    disconnectSocket,
    joinSocketRoom,
    leaveSocketRoom,
    sendChatMessage,
    
    // Game actions
    startGame,
    castVote,
    resetGameState
  }
  
  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  )
}

// Custom hook to use the game context
export const useGame = () => {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}

export default GameContext