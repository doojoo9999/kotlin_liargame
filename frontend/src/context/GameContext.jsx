import React, {createContext, useCallback, useContext, useEffect, useReducer, useRef} from 'react'
import * as gameApi from '../api/gameApi'
import gameStompClient from '../socket/gameStompClient'


const initialState = {
  currentUser: null,
  isAuthenticated: false,

  currentRoom: null,
  roomList: [],
  subjects: [],

  socketConnected: false,
  chatMessages: [],
  roomPlayers: [],
  currentTurnPlayerId: null,

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
  ADD_SUBJECT: 'ADD_SUBJECT',
  
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
      localStorage.removeItem('refreshToken')
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

    case ActionTypes.ADD_SUBJECT:
      return {
        ...state,
        subjects: [...state.subjects, action.payload]
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

  // Auth functions
  const login = async (nickname) => {
    try {
      setLoading('auth', true)
      setError('auth', null)

      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('adminAccessToken')
      localStorage.removeItem('adminRefreshToken')


      const result = await gameApi.login(nickname)
      const userData = {
        id: result.userId,
        nickname: nickname,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      }
      
      localStorage.setItem('accessToken', result.accessToken)
      localStorage.setItem('refreshToken', result.refreshToken)
      
      dispatch({ type: ActionTypes.SET_USER, payload: userData })
      setLoading('auth', false)
      
      return userData
    } catch (error) {
      console.error('Login failed:', error)
      setError('auth', '로그인에 실패했습니다.')
      setLoading('auth', false)
      throw error
    }
  }

  const logout = () => {
    try {
      // Disconnect socket if connected
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      
      dispatch({ type: ActionTypes.LOGOUT })
      dispatch({ type: ActionTypes.CLEAR_CURRENT_ROOM })
      dispatch({ type: ActionTypes.CLEAR_CHAT_MESSAGES })
      dispatch({ type: ActionTypes.RESET_GAME_STATE })
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Room functions
  const fetchRooms = async () => {
    try {
      setLoading('rooms', true)
      setError('rooms', null)
      
      // ✅ 실제 API만 사용
      const rooms = await gameApi.getAllRooms()
      
      // 안전한 배열 검증
      if (!Array.isArray(rooms)) {
        console.error('[ERROR] API response is not array:', rooms)
        dispatch({ type: ActionTypes.SET_ROOM_LIST, payload: [] })
        setError('rooms', 'API 응답 오류가 발생했습니다.')
        setLoading('rooms', false)
        return
      }
      
      console.log('[DEBUG] Fetched rooms:', rooms.length)
      dispatch({ type: ActionTypes.SET_ROOM_LIST, payload: rooms })
      setLoading('rooms', false)
      
    } catch (error) {
      console.error('Failed to fetch rooms:', error)
      setError('rooms', '방 목록을 불러오는데 실패했습니다.')
      dispatch({ type: ActionTypes.SET_ROOM_LIST, payload: [] }) // 빈 배열로 초기화
      setLoading('rooms', false)
    }
  }

  const createRoom = async (roomData) => {
    try {
      setLoading('room', true)
      setError('room', null)
      
      const result = await gameApi.createRoom(roomData)
      
      // 실제 생성된 방 정보를 사용하도록 수정
      const createdRoom = {
        gameNumber: result.gameNumber || result,
        title: roomData.gName,
        maxPlayers: roomData.gParticipants,
        currentPlayers: 1,
        gameState: 'WAITING',
        subject: roomData.subjectIds?.length > 0 ? await getSubjectById(roomData.subjectIds[0]) : null,
        players: [{
          id: state.currentUser.id,
          nickname: state.currentUser.nickname,
          isHost: true,
          isAlive: true,
          avatarUrl: null
        }],
        password: roomData.gPassword,
        rounds: roomData.gTotalRounds
      }
      
      dispatch({ type: ActionTypes.SET_CURRENT_ROOM, payload: createdRoom })
      
      // Refresh room list
      await fetchRooms()
      
      setLoading('room', false)
      return createdRoom
    } catch (error) {
      console.error('Failed to create room:', error)
      setError('room', '방 생성에 실패했습니다.')
      setLoading('room', false)
      throw error
    }
  }

  const joinRoom = async (gameNumber, password = '') => {
    try {
      setLoading('room', true)
      setError('room', null)
      
      await gameApi.joinRoom(gameNumber, password)
      const roomInfo = await gameApi.getRoomInfo(gameNumber)
      
      dispatch({ type: ActionTypes.SET_CURRENT_ROOM, payload: roomInfo })
      dispatch({ type: ActionTypes.CLEAR_CHAT_MESSAGES })
      
      // ✅ STOMP 연결 추가
      await connectSocket(gameNumber)
      
      setLoading('room', false)
    } catch (error) {
      console.error('Failed to join room:', error)
      setError('room', '방 입장에 실패했습니다.')
      setLoading('room', false)
      throw error
    }
  }

  // getCurrentRoom 함수 추가
  const getCurrentRoom = async (gameNumber) => {
    try {
      setLoading('room', true)
      setError('room', null)
      
      // ✅ 실제 API만 사용
      const roomData = await gameApi.getRoomDetails(gameNumber)
      
      if (!roomData) {
        throw new Error('방 정보를 찾을 수 없습니다.')
      }
      
      // 플레이어 데이터 구조 검증
      if (roomData.players && Array.isArray(roomData.players)) {
        roomData.players = roomData.players.map((player, index) => ({
          id: player.id || index + 1, // id가 없으면 인덱스 사용
          nickname: player.nickname || `Player${index + 1}`,
          isHost: player.isHost || false,
          isAlive: player.isAlive !== false, // 기본값 true
          avatar: player.avatar || null
        }))
      } else {
        roomData.players = []
      }
      
      dispatch({ type: ActionTypes.SET_CURRENT_ROOM, payload: roomData })
      setLoading('room', false)
      return roomData
      
    } catch (error) {
      console.error('Failed to get room details:', error)
      setError('room', '방 정보를 불러오는데 실패했습니다.')
      setLoading('room', false)
      throw error
    }
  }

  const leaveRoom = async (gameNumber) => {
    try {
      console.log('[DEBUG_LOG] Leaving room with gameNumber:', gameNumber)
      const response = await gameApi.leaveRoom({
        gNumber: parseInt(gameNumber)
      })
      console.log('[DEBBUG_LOG] Leave room response:', response)

      setCurrentRoom(null)
      setRoomPlayers([])
      setGameStatus('WAITING')
      return response

      } catch (error) {
      console.error('Failed to leave room:', error)
      throw error
    }
  }

  const fetchSubjects = async () => {
    try {
      setLoading('subjects', true)
      setError('subjects', null)
      
      // Use dummy data if needed (fix: use correct environment variable)
      const useDummy = import.meta.env.VITE_USE_DUMMY_DATA === 'true'
      
      if (useDummy) {
        console.log('[DEBUG_LOG] Using dummy subjects data (environment setting)')
        dispatch({ type: ActionTypes.SET_SUBJECTS, payload: gameApi.dummyData.subjects })
      } else {
        console.log('[DEBUG_LOG] Fetching subjects from API')
        const subjects = await gameApi.getAllSubjects()

        if (!Array.isArray(subjects)) {
          console.error('[ERROR] Expected subjects array but got:', typeof subjects, subjects)
          setError('subjects', '주제 데이터 형식이 올바르지 않습니다.')
          dispatch({ type: ActionTypes.SET_SUBJECTS, payload: [] })
          setLoading('subjects', false)
          return
        }

        const validSubjects = subjects.filter(subject => 
          subject && 
          typeof subject === 'object' && 
          subject.hasOwnProperty('id') && 
          subject.hasOwnProperty('name') &&
          subject.name &&
          typeof subject.name === 'string'
        )
        
        if (validSubjects.length !== subjects.length) {
          console.warn('[WARN] Some subjects have invalid structure:', 
            subjects.filter(s => !validSubjects.includes(s)))
        }
        
        console.log('[DEBUG_LOG] Successfully fetched subjects:', validSubjects.length, 'subjects')
        dispatch({ type: ActionTypes.SET_SUBJECTS, payload: validSubjects })
      }
      
      setLoading('subjects', false)
    } catch (error) {
      console.error('Failed to fetch subjects:', error)
      setError('subjects', '주제 목록을 불러오는데 실패했습니다.')
      dispatch({ type: ActionTypes.SET_SUBJECTS, payload: [] })
      setLoading('subjects', false)
    }
  }

  const getSubjectById = async (subjectId) => {
    try {
      // subjects 배열에서 찾기
      const subject = state.subjects.find(s => s.id === subjectId)
      if (subject) return subject
      
      // 없으면 API에서 가져오기 (필요시)
      const allSubjects = await gameApi.getAllSubjects()
      const foundSubject = allSubjects.find(s => s.id === subjectId)
      return foundSubject || { id: subjectId, name: '알 수 없는 주제' }
    } catch (error) {
      console.error('Failed to get subject:', error)
      return { id: subjectId, name: '주제 오류' }
    }
  }

  const addSubject = async (name) => {
    try {
      setLoading('subjects', true)
      setError('subjects', null)

      await gameApi.addSubject(name)

      await fetchSubjects()

      setLoading('subjects', false)
    } catch (error) {
      console.error('Failed to add subject:', error)
      setError('subjects', '주제 추가에 실패했습니다.')
      setLoading('subjects', false)
      throw error
    }
  }



  const addWord = async (subject, word) => {
    try {
      setLoading('subjects', true)
      setError('subjects', null)
      
      const result = await gameApi.addWord(subject, word)
      
      setLoading('subjects', false)
      return result
    } catch (error) {
      console.error('Failed to add word:', error)
      setError('subjects', '답안 추가에 실패했습니다.')
      setLoading('subjects', false)
      throw error
    }
  }

  // Navigation functions
  const navigateToLobby = () => {
    dispatch({ type: ActionTypes.SET_CURRENT_PAGE, payload: 'lobby' })
    dispatch({ type: ActionTypes.CLEAR_CURRENT_ROOM })
  }

  const navigateToRoom = () => {
    dispatch({ type: ActionTypes.SET_CURRENT_PAGE, payload: 'room' })
  }

  // WebSocket functions - STOMP 버전으로 교체
  const connectSocket = useCallback(async (gameNumber) => {
    if (gameStompClient.isClientConnected()) {
      console.log('[DEBUG_LOG] STOMP already connected')
      return gameStompClient
    }

    try {
      setLoading('socket', true)
      setError('socket', null)
      
      console.log('[DEBUG_LOG] Connecting to STOMP server...')
      
      // STOMP 연결
      await gameStompClient.connect()
      
      // 게임방 관련 토픽 구독
      if (gameNumber) {
        gameStompClient.subscribeToGameRoom(gameNumber, (data) => {
          console.log('[DEBUG_LOG] Game state update:', data)
          if (data.status) {
            dispatch({ type: ActionTypes.SET_GAME_STATUS, payload: data.status })
          }
          if (data.round) {
            dispatch({ type: ActionTypes.SET_CURRENT_ROUND, payload: data.round })
          }
          if (data.timeRemaining) {
            dispatch({ type: ActionTypes.SET_GAME_TIMER, payload: data.timeRemaining })
          }
        })
        
        gameStompClient.subscribeToGameChat(gameNumber, (data) => {
          console.log('[DEBUG_LOG] Chat message received:', data)
          const message = {
            id: data.id || Date.now(),
            sender: data.sender || data.nickname,
            content: data.message || data.content,
            isSystem: data.isSystem || false,
            timestamp: data.timestamp || new Date().toISOString()
          }
          dispatch({ type: ActionTypes.ADD_CHAT_MESSAGE, payload: message })
        })
        
        gameStompClient.subscribeToPlayerUpdates(gameNumber, (data) => {
          console.log('[DEBUG_LOG] Players updated:', data)
          dispatch({ type: ActionTypes.SET_ROOM_PLAYERS, payload: data })
          
          // 현재 방 정보도 업데이트
          if (state.currentRoom) {
            dispatch({ 
              type: ActionTypes.SET_CURRENT_ROOM, 
              payload: { ...state.currentRoom, players: data } 
            })
          }
        })
      }
      
      dispatch({ type: ActionTypes.SET_SOCKET_CONNECTION, payload: true })
      setLoading('socket', false)
      
      console.log('[DEBUG_LOG] STOMP connection successful')
      return gameStompClient
      
    } catch (error) {
      console.error('[DEBUG_LOG] STOMP connection failed:', error)
      setError('socket', 'WebSocket 연결에 실패했습니다.')
      setLoading('socket', false)
      dispatch({ type: ActionTypes.SET_SOCKET_CONNECTION, payload: false })
      throw error
    }
  }, [])

  const disconnectSocket = useCallback(() => {
    console.log('[DEBUG_LOG] Disconnecting STOMP client')
    gameStompClient.disconnect()
    dispatch({ type: ActionTypes.SET_SOCKET_CONNECTION, payload: false })
  }, [])

  // Game functions - STOMP 버전
  const startGame = () => {
    if (gameStompClient.isClientConnected() && state.currentRoom) {
      console.log('[DEBUG_LOG] Starting game for room:', state.currentRoom.gameNumber)
      gameStompClient.sendGameAction(state.currentRoom.gameNumber, 'start')
    }
  }

  const castVote = (playerId) => {
    if (gameStompClient.isClientConnected() && state.currentRoom) {
      console.log('[DEBUG_LOG] Casting vote for player:', playerId)
      gameStompClient.sendGameAction(state.currentRoom.gameNumber, 'vote', { targetPlayerId: playerId })
    }
  }

  const sendChatMessage = (content) => {
    if (gameStompClient.isClientConnected() && state.currentRoom) {
      console.log('[DEBUG_LOG] Sending chat message via STOMP:', content)
      gameStompClient.sendChatMessage(state.currentRoom.gameNumber, content)
    } else {
      console.error('Cannot send message: STOMP not connected or no current room')
    }
  }

  // Auto-authenticate on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      // Verify token and set user if valid
      // For now, just assume it's valid
      const nickname = localStorage.getItem('nickname')
      if (nickname) {
        dispatch({ 
          type: ActionTypes.SET_USER, 
          payload: { 
            nickname, 
            accessToken: token 
          } 
        })
      }
    }
  }, [])

  // Auto-fetch rooms when authenticated
  useEffect(() => {
    if (state.isAuthenticated && state.currentPage === 'lobby') {
      fetchRooms()
    }
  }, [state.isAuthenticated, state.currentPage])

  // Context value
  const contextValue = {
    // State
    ...state,
    
    // Auth functions
    login,
    logout,
    
    // Room functions
    fetchRooms,
    createRoom,
    joinRoom,
    leaveRoom,
    getCurrentRoom,
    
    // Subject functions
    fetchSubjects,
    addSubject,
    addWord,
    
    // Navigation functions
    navigateToLobby,
    navigateToRoom,
    
    // WebSocket functions
    connectSocket,
    disconnectSocket,
    
    // Game functions
    startGame,
    castVote,
    sendChatMessage
  }

  return (
    <GameContext.Provider value={contextValue}>
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