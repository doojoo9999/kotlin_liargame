import React, {createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef} from 'react'
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
  votingData: null,
  votingProgress: { voted: 0, total: 0 },
  myVote: null, // The player ID that current user voted for
  gameResults: null,
  accusedPlayerId: null,
  defendingPlayerId: null,
  defenseText: null,
  survivalVotingProgress: { spare: 0, eliminate: 0, total: 0 },
  mySurvivalVote: null, // true for spare, false for eliminate
  wordGuessResult: null, // { correct: boolean, guessedWord: string, actualWord: string }
  finalGameResult: null, // { winner: 'LIAR' | 'CITIZEN', message: string }
  moderatorMessage: null,
  
  // UI state
  loading: {
    rooms: false,
    room: false,
    auth: false,
    subjects: false,
    socket: false,
    chatHistory: false
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
  SET_VOTING_DATA: 'SET_VOTING_DATA',
  SET_VOTING_PROGRESS: 'SET_VOTING_PROGRESS',
  SET_MY_VOTE: 'SET_MY_VOTE',
  SET_GAME_RESULTS: 'SET_GAME_RESULTS',
  SET_ACCUSED_PLAYER: 'SET_ACCUSED_PLAYER',
  SET_DEFENDING_PLAYER: 'SET_DEFENDING_PLAYER',
  SET_DEFENSE_TEXT: 'SET_DEFENSE_TEXT',
  SET_SURVIVAL_VOTING_PROGRESS: 'SET_SURVIVAL_VOTING_PROGRESS',
  SET_MY_SURVIVAL_VOTE: 'SET_MY_SURVIVAL_VOTE',
  SET_WORD_GUESS_RESULT: 'SET_WORD_GUESS_RESULT',
  SET_FINAL_GAME_RESULT: 'SET_FINAL_GAME_RESULT',
  RESET_GAME_STATE: 'RESET_GAME_STATE',
  
  // Navigation actions
  SET_CURRENT_PAGE: 'SET_CURRENT_PAGE',
  
  // Moderator message actions
  SET_MODERATOR_MESSAGE: 'SET_MODERATOR_MESSAGE'
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
      localStorage.removeItem('userData')
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
      // 중복 주제 검사: 이미 존재하는 ID를 가진 주제는 추가하지 않음
      const subjectExists = state.subjects.some(subject => subject.id === action.payload.id);
      if (subjectExists) {
        console.log('[DEBUG_LOG] Subject already exists in state, not adding duplicate:', action.payload);
        return state;
      }
      return {
        ...state,
        subjects: [...state.subjects, action.payload]
      }
      
    case ActionTypes.SET_CURRENT_PAGE:
      return {
        ...state,
        currentPage: action.payload
      }
      
    case ActionTypes.SET_MODERATOR_MESSAGE:
      return {
        ...state,
        moderatorMessage: action.payload
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
      
    case ActionTypes.SET_VOTING_DATA:
      return {
        ...state,
        votingData: action.payload
      }
      
    case ActionTypes.SET_VOTING_PROGRESS:
      return {
        ...state,
        votingProgress: action.payload
      }
      
    case ActionTypes.SET_MY_VOTE:
      return {
        ...state,
        myVote: action.payload
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
      
    case ActionTypes.SET_DEFENSE_TEXT:
      return {
        ...state,
        defenseText: action.payload
      }
      
    case ActionTypes.SET_SURVIVAL_VOTING_PROGRESS:
      return {
        ...state,
        survivalVotingProgress: action.payload
      }
      
    case ActionTypes.SET_MY_SURVIVAL_VOTE:
      return {
        ...state,
        mySurvivalVote: action.payload
      }
      
    case ActionTypes.SET_WORD_GUESS_RESULT:
      return {
        ...state,
        wordGuessResult: action.payload
      }
      
    case ActionTypes.SET_FINAL_GAME_RESULT:
      return {
        ...state,
        finalGameResult: action.payload
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
        defendingPlayerId: null,
        defenseText: null,
        survivalVotingProgress: { spare: 0, eliminate: 0, total: 0 },
        mySurvivalVote: null,
        wordGuessResult: null,
        finalGameResult: null
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

      const result = await gameApi.login(nickname)
      const userData = {
        id: result.userId,
        nickname: nickname
      }
      
      localStorage.setItem('userData', JSON.stringify(userData))
      
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
      if (gameStompClient.isClientConnected()) {
        gameStompClient.disconnect()
      }

      socketRef.current = null

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

      const rooms = await gameApi.getAllRooms()

      if (!Array.isArray(rooms)) {
        console.error('[ERROR] API response is not array:', rooms)
        dispatch({ type: ActionTypes.SET_ROOM_LIST, payload: [] })
        setError('rooms', 'API 응답 오류가 발생했습니다.')
        setLoading('rooms', false)
        return
      }

      const mappedRooms = rooms.map(room => ({
        gameNumber: room.gameNumber,
        title: room.title || room.gameName,
        host: room.host || room.gameOwner,
        playerCount: room.playerCount || room.currentPlayers || 0,
        currentPlayers: room.playerCount || room.currentPlayers || 0,
        maxPlayers: room.maxPlayers || room.gameParticipants,
        hasPassword: room.hasPassword || (room.gamePassword != null),
        subject: room.subject || room.citizenSubject?.content,
        state: room.state || room.gameState,
        players: room.players || []

      }))

      console.log('[DEBUG] Mapped rooms:', mappedRooms.length)
      dispatch({ type: ActionTypes.SET_ROOM_LIST, payload: mappedRooms })
      setLoading('rooms', false)

    } catch (error) {
      console.error('Failed to fetch rooms:', error)
      setError('rooms', '방 목록을 불러오는데 실패했습니다.')
      dispatch({ type: ActionTypes.SET_ROOM_LIST, payload: [] })
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
        title: roomData.gameName,
        maxPlayers: roomData.gameParticipants,
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
        password: roomData.gamePassword,
        rounds: roomData.gameTotalRounds
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

      const response = await gameApi.joinRoom(gameNumber, password)

      dispatch({ type: ActionTypes.SET_CURRENT_ROOM, payload: response })

      await connectToRoom(gameNumber)

      setLoading('room', false)
      return response
    } catch (error) {
      console.error('Failed to join room:', error)
      setError('room', '방 입장에 실패했습니다.')
      setLoading('room', false)
      throw error
    }
  }

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
        gameNumber: parseInt(gameNumber)
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

  const fetchSubjects = useCallback(async () => {
    if (state.loading.subjects || state.subjects.length > 0) {
      console.log('[DEBUG_LOG] Skipping subjects fetch - already loading or has data')
      return
    }

    try {
      setLoading('subjects', true)
      setError('subjects', null)

      console.log('[DEBUG_LOG] Fetching subjects from API')
      const subjects = await gameApi.getAllSubjects()

      if (Array.isArray(subjects)) {
        dispatch({ type: ActionTypes.SET_SUBJECTS, payload: subjects })
        console.log('[DEBUG_LOG] Subjects loaded successfully:', subjects.length)
      } else {
        setError('subjects', '주제 목록을 불러오는데 실패했습니다.')
      }

    } catch (error) {
      console.error('Failed to fetch subjects:', error)
      setError('subjects', '주제 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading('subjects', false)
    }
  }, [state.loading.subjects, state.subjects.length])


  const getSubjectById = async (subjectId) => {
    try {
      const subject = state.subjects.find(s => s.id === subjectId)
      if (subject) return subject
      
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

      const newSubject = await gameApi.addSubject(name)

      console.log('[DEBUG_LOG] Subject added successfully - will be updated via WebSocket:', newSubject)

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

  const navigateToLobby = () => {
    dispatch({ type: ActionTypes.SET_CURRENT_PAGE, payload: 'lobby' })
    dispatch({ type: ActionTypes.CLEAR_CURRENT_ROOM })
  }

  const navigateToRoom = () => {
    dispatch({ type: ActionTypes.SET_CURRENT_PAGE, payload: 'room' })
  }

  const connectSocket = useCallback(async (gameNumber) => {
    try {
      console.log('[DEBUG_LOG] Connecting to WebSocket for game:', gameNumber)
      setLoading('socket', true)

      await gameStompClient.connect()
      dispatch({ type: ActionTypes.SET_SOCKET_CONNECTION, payload: true })

      const handleChatMessage = (message) => {
        console.log('[DEBUG_LOG] Received chat message via WebSocket:', message)
        dispatch({ type: ActionTypes.ADD_CHAT_MESSAGE, payload: message })
      }

      const handleGameUpdate = (update) => {
        console.log('[DEBUG_LOG] Received game update:', update)
        
        // Handle PLAYER_JOINED and PLAYER_LEFT events
        if (update.type === 'PLAYER_JOINED' || update.type === 'PLAYER_LEFT') {
          // Update room players if available
          if (update.roomData && update.roomData.players) {
            dispatch({ type: ActionTypes.SET_ROOM_PLAYERS, payload: update.roomData.players })
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
            dispatch({ type: ActionTypes.SET_CURRENT_ROOM, payload: updatedRoom })
          }
          
          // Update room in the room list as well
          if (update.roomData) {
            dispatch({ 
              type: ActionTypes.UPDATE_ROOM_IN_LIST, 
              payload: {
                gameNumber: update.roomData.gameNumber,
                currentPlayers: update.roomData.currentPlayers,
                maxPlayers: update.roomData.maxPlayers,
                title: update.roomData.title,
                subject: update.roomData.subject,
                subjects: update.roomData.subjects || [], // Include subjects array
                state: update.roomData.state
              }
            })
          }
        }
      }

      const handlePlayerUpdate = (players) => {
        console.log('[DEBUG_LOG] Received player update:', players)
        dispatch({ type: ActionTypes.SET_ROOM_PLAYERS, payload: players })
      }

      gameStompClient.subscribeToGameChat(gameNumber, handleChatMessage)
      gameStompClient.subscribeToGameRoom(gameNumber, handleGameUpdate)
      gameStompClient.subscribeToPlayerUpdates(gameNumber, handlePlayerUpdate)
      
      // 사회자 메시지 구독
      gameStompClient.subscribe(`/topic/game/${gameNumber}/moderator`, (message) => {
        const moderatorMessage = JSON.parse(message.body)
        console.log('[DEBUG_LOG] Moderator message received:', moderatorMessage)
        
        // 사회자 메시지 상태 업데이트
        dispatch({ 
          type: ActionTypes.SET_MODERATOR_MESSAGE, 
          payload: moderatorMessage.content 
        })
        
        // 3초 후 메시지 숨기기
        setTimeout(() => {
          dispatch({ 
            type: ActionTypes.SET_MODERATOR_MESSAGE, 
            payload: null 
          })
        }, 3000)
      })
      
      // 턴 변경 구독
      gameStompClient.subscribe(`/topic/game/${gameNumber}/turn`, (message) => {
        const turnMessage = JSON.parse(message.body)
        console.log('[DEBUG_LOG] Turn change received:', turnMessage)
        
        dispatch({ 
          type: ActionTypes.SET_CURRENT_TURN_PLAYER, 
          payload: turnMessage.currentSpeakerId 
        })
      })

      console.log('[DEBUG_LOG] WebSocket subscriptions set up for game:', gameNumber)
      setLoading('socket', false)

    } catch (error) {
      console.error('Failed to connect socket:', error)
      setError('socket', error.message)
      setLoading('socket', false)
    }
  }, [])


  const disconnectSocket = useCallback(() => {
    try {
      console.log('[DEBUG_LOG] Disconnecting STOMP client')

      if (gameStompClient.isClientConnected()) {
        gameStompClient.disconnect()
      }

      socketRef.current = null

      dispatch({ type: ActionTypes.SET_SOCKET_CONNECTION, payload: false })
      dispatch({ type: ActionTypes.CLEAR_CHAT_MESSAGES })

    } catch (error) {
      console.error('[ERROR] Failed to disconnect socket:', error)
    }
  }, [dispatch])


  const startGame = async () => {
    try {
      if (!state.currentRoom) {
        throw new Error('No current room available')
      }

      setLoading('room', true)
      setError('room', null)

      console.log('[DEBUG_LOG] Starting game for room:', state.currentRoom.gameNumber)
      
      // Use REST API instead of WebSocket since backend has no WebSocket handler for 'start'
      const result = await gameApi.startGame(state.currentRoom.gameNumber)
      
      console.log('[DEBUG_LOG] Game started successfully:', result)
      setLoading('room', false)
      
      return result
    } catch (error) {
      console.error('[ERROR] Failed to start game:', error)
      setError('room', error.message || '게임 시작에 실패했습니다.')
      setLoading('room', false)
      throw error
    }
  }

  const castVote = async (gameNumber, targetPlayerId) => {
    try {
      if (!state.currentRoom) {
        throw new Error('No current room available')
      }

      if (!targetPlayerId) {
        throw new Error('Target player ID is required')
      }

      setLoading('room', true)
      setError('room', null)

      console.log('[DEBUG_LOG] Casting vote for player:', targetPlayerId, 'in game:', gameNumber)

      // Call API to cast vote
      const result = await gameApi.castVote(gameNumber, targetPlayerId)

      // Update local state
      dispatch({ type: ActionTypes.SET_MY_VOTE, payload: targetPlayerId })

      // Send WebSocket message for real-time updates
      if (gameStompClient.isClientConnected()) {
        gameStompClient.sendGameAction(gameNumber, 'vote', { targetPlayerId })
      }

      console.log('[DEBUG_LOG] Vote cast successfully:', result)
      setLoading('room', false)

      return result
    } catch (error) {
      console.error('[ERROR] Failed to cast vote:', error)
      setError('room', error.message || '투표에 실패했습니다.')
      setLoading('room', false)
      throw error
    }
  }

  const submitHint = async (hint) => {
    try {
      if (!state.currentRoom) {
        throw new Error('No current room available')
      }

      if (!hint || !hint.trim()) {
        throw new Error('Hint cannot be empty')
      }

      setLoading('room', true)
      setError('room', null)

      console.log('[DEBUG_LOG] Submitting hint:', hint, 'for game:', state.currentRoom.gameNumber)
      
      // Call API to submit hint
      const result = await gameApi.submitHint(state.currentRoom.gameNumber, hint.trim())
      
      // Send WebSocket message for real-time updates
      if (gameStompClient.isClientConnected()) {
        gameStompClient.sendGameAction(state.currentRoom.gameNumber, 'hint', { hint: hint.trim() })
      }

      console.log('[DEBUG_LOG] Hint submitted successfully:', result)
      setLoading('room', false)
      
      return result
    } catch (error) {
      console.error('[ERROR] Failed to submit hint:', error)
      setError('room', error.message || '힌트 제출에 실패했습니다.')
      setLoading('room', false)
      throw error
    }
  }

  const submitDefense = async (defenseText) => {
    try {
      if (!state.currentRoom) {
        throw new Error('No current room available')
      }

      if (!defenseText || !defenseText.trim()) {
        throw new Error('Defense text cannot be empty')
      }

      setLoading('room', true)
      setError('room', null)

      console.log('[DEBUG_LOG] Submitting defense:', defenseText, 'for game:', state.currentRoom.gameNumber)
      
      // Call API to submit defense
      const result = await gameApi.submitDefense(state.currentRoom.gameNumber, defenseText.trim())
      
      // Update local state with defense text
      dispatch({ type: ActionTypes.SET_DEFENSE_TEXT, payload: defenseText.trim() })
      
      // Send WebSocket message for real-time updates
      if (gameStompClient.isClientConnected()) {
        gameStompClient.sendGameAction(state.currentRoom.gameNumber, 'defense', { 
          defenseText: defenseText.trim(),
          accusedPlayerId: state.accusedPlayerId 
        })
      }

      console.log('[DEBUG_LOG] Defense submitted successfully:', result)
      setLoading('room', false)
      
      return result
    } catch (error) {
      console.error('[ERROR] Failed to submit defense:', error)
      setError('room', error.message || '변론 제출에 실패했습니다.')
      setLoading('room', false)
      throw error
    }
  }

  const castSurvivalVote = async (survival) => {
    try {
      if (!state.currentRoom) {
        throw new Error('No current room available')
      }

      if (typeof survival !== 'boolean') {
        throw new Error('Survival vote must be boolean')
      }

      setLoading('room', true)
      setError('room', null)

      console.log('[DEBUG_LOG] Casting survival vote:', survival, 'for game:', state.currentRoom.gameNumber)
      
      // Call API to cast survival vote
      const result = await gameApi.castSurvivalVote(state.currentRoom.gameNumber, survival)
      
      // Update local state with survival vote
      dispatch({ type: ActionTypes.SET_MY_SURVIVAL_VOTE, payload: survival })
      
      // Send WebSocket message for real-time updates
      if (gameStompClient.isClientConnected()) {
        gameStompClient.sendGameAction(state.currentRoom.gameNumber, 'survival-vote', { 
          survival: survival,
          accusedPlayerId: state.accusedPlayerId 
        })
      }

      console.log('[DEBUG_LOG] Survival vote cast successfully:', result)
      setLoading('room', false)
      
      return result
    } catch (error) {
      console.error('[ERROR] Failed to cast survival vote:', error)
      setError('room', error.message || '생존 투표에 실패했습니다.')
      setLoading('room', false)
      throw error
    }
  }

  const guessWord = async (guessedWord) => {
    try {
      if (!state.currentRoom) {
        throw new Error('No current room available')
      }

      if (!guessedWord || !guessedWord.trim()) {
        throw new Error('Guessed word cannot be empty')
      }

      setLoading('room', true)
      setError('room', null)

      console.log('[DEBUG_LOG] Guessing word:', guessedWord, 'for game:', state.currentRoom.gameNumber)
      
      // Call API to guess word
      const result = await gameApi.guessWord(state.currentRoom.gameNumber, guessedWord.trim())
      
      // Update local state with guess result
      if (result.guessResult) {
        dispatch({ type: ActionTypes.SET_WORD_GUESS_RESULT, payload: result.guessResult })
      }
      
      // Update final game result if available
      if (result.gameResult) {
        dispatch({ type: ActionTypes.SET_FINAL_GAME_RESULT, payload: result.gameResult })
      }
      
      // Send WebSocket message for real-time updates
      if (gameStompClient.isClientConnected()) {
        gameStompClient.sendGameAction(state.currentRoom.gameNumber, 'word-guess', { 
          guessedWord: guessedWord.trim(),
          result: result
        })
      }

      console.log('[DEBUG_LOG] Word guess submitted successfully:', result)
      setLoading('room', false)
      
      return result
    } catch (error) {
      console.error('[ERROR] Failed to guess word:', error)
      setError('room', error.message || '단어 추리에 실패했습니다.')
      setLoading('room', false)
      throw error
    }
  }

  const sendChatMessage = (gameNumber, message) => {
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
  }

  const loadChatHistory = useCallback(async (gameNumber) => {
    // Prevent multiple simultaneous calls
    if (state.loading.chatHistory) {
      console.log('[DEBUG_LOG] Chat history already loading, skipping duplicate request')
      return []
    }

    try {
      console.log('[DEBUG_LOG] ========== loadChatHistory Start ==========')
      console.log('[DEBUG_LOG] Loading chat history for game:', gameNumber)
      
      setLoading('chatHistory', true)
      
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
        
        dispatch({ type: ActionTypes.SET_CHAT_MESSAGES, payload: sortedMessages })
        console.log('[SUCCESS] Chat history loaded successfully')
      } else {
        console.warn('[WARN] Invalid chat history format')
        dispatch({ type: ActionTypes.SET_CHAT_MESSAGES, payload: [] })
      }
      
      console.log('[DEBUG_LOG] ========== loadChatHistory End ==========')
      return messages
    } catch (error) {
      console.error('[ERROR] Failed to load chat history:', error)
      dispatch({ type: ActionTypes.SET_CHAT_MESSAGES, payload: [] })
      setError('socket', '채팅 기록 로드 실패')
      return []
    } finally {
      setLoading('chatHistory', false)
    }
  }, [state.loading.chatHistory])


  const connectToRoom = useCallback(async (gameNumber, retryCount = 0) => {
    const MAX_RETRIES = 3

    if (retryCount >= MAX_RETRIES) {
      console.error('[ERROR] Max connection retries reached')
      setError('socket', 'WebSocket 연결에 실패했습니다.')
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
      socketRef.current = gameStompClient // ✅ gameStompClient 객체 자체를 저장

      gameStompClient.subscribeToGameChat(gameNumber, (message) => {
        console.log('[DEBUG_LOG] Received chat message:', message)
        dispatch({ type: ActionTypes.ADD_CHAT_MESSAGE, payload: message })
      })

      gameStompClient.subscribeToGameRoom(gameNumber, (update) => {
        console.log('[DEBUG_LOG] Received room update:', update)
        
        // Handle PLAYER_JOINED and PLAYER_LEFT events
        if (update.type === 'PLAYER_JOINED' || update.type === 'PLAYER_LEFT') {
          // Update room players if available
          if (update.roomData && update.roomData.players) {
            dispatch({ type: ActionTypes.SET_ROOM_PLAYERS, payload: update.roomData.players })
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
              subjects: update.roomData.subjects || [], // Include subjects array from backend
              state: update.roomData.state,
              players: update.roomData.players || []
            }
            
            console.log('[DEBUG_LOG] Updating currentRoom with roomData (including subjects):', updatedRoom)
            dispatch({ type: ActionTypes.SET_CURRENT_ROOM, payload: updatedRoom })
          }
          
          // Update room in the room list as well
          if (update.roomData) {
            dispatch({ 
              type: ActionTypes.UPDATE_ROOM_IN_LIST, 
              payload: {
                gameNumber: update.roomData.gameNumber,
                currentPlayers: update.roomData.currentPlayers,
                maxPlayers: update.roomData.maxPlayers,
                title: update.roomData.title,
                subject: update.roomData.subject,
                subjects: update.roomData.subjects || [], // Include subjects array
                state: update.roomData.state
              }
            })
          }
        }
      })

      gameStompClient.subscribeToPlayerUpdates(gameNumber, (playerUpdate) => {
        console.log('[DEBUG_LOG] Received player update:', playerUpdate)
        dispatch({ type: ActionTypes.SET_ROOM_PLAYERS, payload: playerUpdate.players || [] })
      })

      dispatch({ type: ActionTypes.SET_SOCKET_CONNECTION, payload: true })
      console.log('[SUCCESS] Connected to game room:', gameNumber)
      console.log('[DEBUG_LOG] ========== connectToRoom End ==========')

    } catch (error) {
      console.error('[ERROR] connectToRoom failed:', error)

      if (retryCount < MAX_RETRIES) {
        console.log(`[DEBUG_LOG] Retrying connection... (${retryCount + 1}/${MAX_RETRIES})`)
        setTimeout(() => {
          connectToRoom(gameNumber, retryCount + 1)
        }, 2000 * (retryCount + 1))
      } else {
        setError('socket', 'WebSocket 연결에 실패했습니다.')
        dispatch({ type: ActionTypes.SET_SOCKET_CONNECTION, payload: false })
      }
    }
  }, [loadChatHistory, dispatch, setError])





  const fetchRoomDetails = async (gameNumber) => {
    try {
      console.log('[DEBUG_LOG] Fetching room details for game:', gameNumber)

      const roomDetails = await gameApi.getRoomDetails(gameNumber)

      if (!roomDetails) {
        console.error('[DEBUG_LOG] No room details received')
        return null
      }

      const normalizedRoom = {
        gameNumber: roomDetails.gameNumber || gameNumber,
        title: roomDetails.title || (roomDetails.gameName ? `${roomDetails.gameName} #${gameNumber}` : `게임방 #${gameNumber}`),
        host: roomDetails.host || roomDetails.gameOwner || roomDetails.hostNickname || '알 수 없음',
        currentPlayers: parseInt(roomDetails.currentPlayers || roomDetails.playerCount || 0),
        maxPlayers: parseInt(roomDetails.maxPlayers || roomDetails.gameParticipants || 8),
        subject: roomDetails.subject || roomDetails.citizenSubject?.content || roomDetails.citizenSubject || roomDetails.subjectName || '주제 없음',
        // Fix: Properly handle subjects array from GameStateResponse
        subjects: Array.isArray(roomDetails.subjects) && roomDetails.subjects.length > 0 
          ? roomDetails.subjects 
          : (roomDetails.citizenSubject ? [roomDetails.citizenSubject] : []),
        state: roomDetails.state || roomDetails.gameState || 'WAITING',
        round: parseInt(roomDetails.currentRound || roomDetails.gameCurrentRound || 1),
        players: Array.isArray(roomDetails.players) ? roomDetails.players : [],
        hasPassword: roomDetails.hasPassword || false,
        createdAt: roomDetails.createdAt,
        updatedAt: new Date().toISOString()
      }

      console.log('[DEBUG_LOG] Normalized room details:', normalizedRoom)

      dispatch({ type: ActionTypes.SET_CURRENT_ROOM, payload: normalizedRoom })

      if (normalizedRoom.players && normalizedRoom.players.length > 0) {
        dispatch({ type: ActionTypes.SET_ROOM_PLAYERS, payload: normalizedRoom.players })
      }

      return normalizedRoom
    } catch (error) {
      console.error('[DEBUG_LOG] Failed to fetch room details:', error)
      throw error
    }
  }


  const completeSpeech = useCallback(async (gameNumber) => {
    try {
      console.log('[DEBUG_LOG] Speech completed successfully')
      await gameApi.completeSpeech(gameNumber)
    } catch (error) {
      console.error('Failed to complete speech:', error)
      throw error
    }
  }, [])

  useEffect(() => {
    const userData = localStorage.getItem('userData')
    if (userData) {
      try {
        const parsedUserData = JSON.parse(userData)
        dispatch({ 
          type: ActionTypes.SET_USER, 
          payload: parsedUserData
        })
      } catch (error) {
        console.error('Failed to parse userData from localStorage:', error)
        localStorage.removeItem('userData')
      }
    }
  }, [])

  useEffect(() => {
    if (state.isAuthenticated && state.currentPage === 'lobby') {
      fetchRooms()
    }
  }, [state.isAuthenticated, state.currentPage])

  // Timer management useEffect
  useEffect(() => {
    let timerInterval = null
    
    // Only run timer if game is active and timer > 0
    if (state.gameTimer > 0 && state.gameStatus !== 'WAITING' && state.currentRoom) {
      console.log('[DEBUG_LOG] Starting timer countdown:', state.gameTimer)
      
      timerInterval = setInterval(() => {
        dispatch({ 
          type: ActionTypes.SET_GAME_TIMER, 
          payload: Math.max(0, state.gameTimer - 1) 
        })
      }, 1000)
    }
    
    // Auto-execute actions when timer expires
    if (state.gameTimer === 0 && state.gameStatus !== 'WAITING' && state.currentRoom) {
      console.log('[DEBUG_LOG] Timer expired, executing auto action for status:', state.gameStatus)
      
      const executeAutoAction = async () => {
        try {
          const gameNumber = state.currentRoom.gameNumber
          
          switch (state.gameStatus) {
            case 'SPEAKING':
              // Auto-submit empty hint
              console.log('[DEBUG_LOG] Auto-submitting empty hint')
              await submitHint('')
              break
              
            case 'VOTING':
              // Auto-vote for random player (excluding self)
              const availablePlayers = state.roomPlayers.filter(p => 
                p.id !== state.currentUser?.id && p.isAlive !== false
              )
              if (availablePlayers.length > 0) {
                const randomPlayer = availablePlayers[Math.floor(Math.random() * availablePlayers.length)]
                console.log('[DEBUG_LOG] Auto-voting for random player:', randomPlayer.nickname)
                await castVote(randomPlayer.id)
              }
              break
              
            case 'DEFENSE':
              // Auto-submit empty defense
              console.log('[DEBUG_LOG] Auto-submitting empty defense')
              await submitDefense('')
              break
              
            case 'SURVIVAL_VOTING':
              // Auto-vote to eliminate (false)
              console.log('[DEBUG_LOG] Auto-voting to eliminate')
              await castSurvivalVote(false)
              break
              
            case 'WORD_GUESS':
              // Auto-submit empty word guess
              console.log('[DEBUG_LOG] Auto-submitting empty word guess')
              await guessWord('')
              break
              
            default:
              console.log('[DEBUG_LOG] No auto action defined for status:', state.gameStatus)
          }
        } catch (error) {
          console.error('[ERROR] Failed to execute auto action:', error)
        }
      }
      
      // Execute auto action with slight delay to ensure state consistency
      setTimeout(executeAutoAction, 100)
    }
    
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval)
      }
    }
  }, [state.gameTimer, state.gameStatus, state.currentRoom, state.roomPlayers, state.currentUser])

  // Server timer synchronization useEffect
  useEffect(() => {
    // This effect handles server-sent timer updates
    // The timer value from server takes precedence over client countdown
    console.log('[DEBUG_LOG] Timer synchronized from server:', state.gameTimer)
  }, [state.gameTimer])

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
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
    sendChatMessage,
    loadChatHistory,
    
    // Game functions
    startGame,
    castVote,
    submitHint,
    submitDefense,
    castSurvivalVote,
    guessWord,
    completeSpeech,

    // Game Connection
    connectToRoom,
    fetchRoomDetails
  }), [
    state,
    login,
    logout,
    fetchRooms,
    createRoom,
    joinRoom,
    leaveRoom,
    getCurrentRoom,
    fetchSubjects,
    addSubject,
    addWord,
    navigateToLobby,
    navigateToRoom,
    connectSocket,
    disconnectSocket,
    sendChatMessage,
    loadChatHistory,
    startGame,
    castVote,
    submitHint,
    submitDefense,
    castSurvivalVote,
    guessWord,
    completeSpeech,
    connectToRoom,
    fetchRoomDetails
  ])

  // Note: Removed duplicate STOMP subscription to '/topic/subjects' 
  // Subject updates are now handled by subjectStore which properly handles both SUBJECT_ADDED and WORD_ADDED events

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  )
}

export const useGame = () => {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}

export default GameContext