import {useCallback, useMemo} from 'react'
import useAuthStore from './authStore'
import useRoomStore from './roomStore'
import useSocketStore from './socketStore'
import useGameStore from './gameStore'
import useSubjectStore from './subjectStore'
import * as gameApi from '../api/gameApi'

/**
 * Unified hook that provides access to all game-related state and actions
 * This replaces the original useGame hook from GameContext
 */
export const useGame = () => {
  // Auth store
  const {
    currentUser,
    isAuthenticated,
    loading: authLoading,
    error: authError,
    login,
    logout,
    clearError: clearAuthError,
  } = useAuthStore()

  // Room store
  const {
    roomList,
    currentRoom,
    currentPage,
    loading: roomLoading,
    error: roomError,
    fetchRooms,
    createRoom,
    joinRoom,
    leaveRoom,
    getCurrentRoom,
    fetchRoomDetails,
    updateRoomInList,
    navigateToLobby,
    navigateToRoom,
    clearError: clearRoomError,
  } = useRoomStore()

  // Socket store
  const {
    socketConnected,
    chatMessages,
    roomPlayers,
    currentTurnPlayerId,
    loading: socketLoading,
    error: socketError,
    connectSocket,
    disconnectSocket,
    connectToRoom,
    sendChatMessage,
    loadChatHistory,
    setRoomPlayers,
    updatePlayerInRoom,
    setCurrentTurnPlayer,
    addChatMessage,
    setChatMessages,
    clearChatMessages,
    clearError: clearSocketError,
  } = useSocketStore()

  // Game store
  const {
    gameStatus,
    currentRound,
    playerRole,
    assignedWord,
    gameTimer,
    votingResults,
    gameResults,
    accusedPlayerId,
    defendingPlayerId,
    setGameStatus,
    setCurrentRound,
    setPlayerRole,
    setAssignedWord,
    setGameTimer,
    setVotingResults,
    setGameResults,
    setAccusedPlayer,
    setDefendingPlayer,
    startGame,
    castVote,
    handleGameUpdate,
    isGameInProgress,
    isPlayerLiar,
    isPlayerCitizen,
    canVote,
    canStartGame,
    resetGameState,
  } = useGameStore()

  // Subject store
  const {
    subjects,
    loading: subjectsLoading,
    error: subjectsError,
    fetchSubjects,
    getSubjectById,
    addSubject,
    addWord,
    handleSubjectUpdate,
    searchSubjects,
    getSubjectsByCategory,
    clearError: clearSubjectsError,
  } = useSubjectStore()

  // Combine loading states
  const loading = useMemo(() => ({
    auth: authLoading,
    rooms: roomLoading.rooms,
    room: roomLoading.room,
    socket: socketLoading.socket,
    chatHistory: socketLoading.chatHistory,
    subjects: subjectsLoading,
  }), [authLoading, roomLoading, socketLoading, subjectsLoading])

  // Combine error states
  const error = useMemo(() => ({
    auth: authError,
    rooms: roomError.rooms,
    room: roomError.room,
    socket: socketError.socket,
    subjects: subjectsError,
  }), [authError, roomError, socketError, subjectsError])

  // Helper functions
  const setLoading = (type, value) => {
    // This is handled individually by each store now
    console.warn('setLoading is deprecated - use individual store loading states')
  }

  const setError = (type, value) => {
    // This is handled individually by each store now
    console.warn('setError is deprecated - use individual store error clearing functions')
  }

  const clearError = (type) => {
    switch (type) {
      case 'auth':
        clearAuthError()
        break
      case 'rooms':
      case 'room':
        clearRoomError(type)
        break
      case 'socket':
        clearSocketError()
        break
      case 'subjects':
        clearSubjectsError()
        break
      default:
        console.warn('Unknown error type:', type)
    }
  }

  // DefenseComponent에서 사용할 함수
  const submitDefense = useCallback(async (gameNumber, defenseText) => {
    try {
      const response = await gameApi.submitDefense(gameNumber, defenseText)
      console.log('[DEBUG_LOG] Defense submitted successfully')
      return response
    } catch (error) {
      console.error('[ERROR] Failed to submit defense:', error)
      throw error
    }
  }, [])

  // FinalJudgmentComponent에서 사용할 함수
  const castFinalJudgment = useCallback(async (gameNumber, judgment) => {
    try {
      const response = await gameApi.castFinalJudgment(gameNumber, judgment)
      console.log('[DEBUG_LOG] Final judgment cast successfully')
      return response
    } catch (error) {
      console.error('[ERROR] Failed to cast final judgment:', error)
      throw error
    }
  }, [])

  // LiarGuessComponent에서 사용할 함수
  const submitLiarGuess = useCallback(async (gameNumber, guess) => {
    try {
      const response = await gameApi.submitLiarGuess(gameNumber, guess)
      console.log('[DEBUG_LOG] Liar guess submitted successfully')
      return response
    } catch (error) {
      console.error('[ERROR] Failed to submit liar guess:', error)
      throw error
    }
  }, [])

  // Return the unified API
  return {
    // State - Auth
    currentUser,
    isAuthenticated,

    // State - Room
    roomList,
    currentRoom,
    currentPage,

    // State - Socket/Chat
    socketConnected,
    chatMessages,
    roomPlayers,
    currentTurnPlayerId,

    // State - Game
    gameStatus,
    currentRound,
    playerRole,
    assignedWord,
    gameTimer,
    votingResults,
    gameResults,
    accusedPlayerId,
    defendingPlayerId,

    // State - Subjects
    subjects,

    // State - Loading & Error
    loading,
    error,

    // Actions - Auth
    login,
    logout,

    // Actions - Room
    fetchRooms,
    createRoom,
    joinRoom,
    leaveRoom,
    getCurrentRoom,
    fetchRoomDetails,
    updateRoomInList,

    // Actions - Navigation
    navigateToLobby,
    navigateToRoom,

    // Actions - Socket/Chat
    connectSocket,
    disconnectSocket,
    connectToRoom,
    sendChatMessage,
    loadChatHistory,
    setRoomPlayers,
    updatePlayerInRoom,
    setCurrentTurnPlayer,
    addChatMessage,
    setChatMessages,
    clearChatMessages,

    // Actions - Game
    setGameStatus,
    setCurrentRound,
    setPlayerRole,
    setAssignedWord,
    setGameTimer,
    setVotingResults,
    setGameResults,
    setAccusedPlayer,
    setDefendingPlayer,
    startGame,
    castVote,
    handleGameUpdate,
    resetGameState,
    submitDefense,
    castFinalJudgment,
    submitLiarGuess,

    // Actions - Subjects
    fetchSubjects,
    getSubjectById,
    addSubject,
    addWord,
    searchSubjects,
    getSubjectsByCategory,

    // Actions - Game State Queries
    isGameInProgress,
    isPlayerLiar,
    isPlayerCitizen,
    canVote,
    canStartGame,

    // Actions - Utility
    setLoading, // Deprecated
    setError,   // Deprecated
    clearError,
  }
}

/**
 * Hook for accessing only authentication state and actions
 */
export const useAuth = () => {
  return useAuthStore()
}

/**
 * Hook for accessing only room state and actions
 */
export const useRoom = () => {
  return useRoomStore()
}

/**
 * Hook for accessing only socket/chat state and actions
 */
export const useSocket = () => {
  return useSocketStore()
}

/**
 * Hook for accessing only game logic state and actions
 */
export const useGameLogic = () => {
  return useGameStore()
}

/**
 * Hook for accessing only subject state and actions
 */
export const useSubjects = () => {
  return useSubjectStore()
}

/**
 * Hook for accessing combined loading states across all stores
 */
export const useLoading = () => {
  const authLoading = useAuthStore(state => state.loading)
  const roomLoading = useRoomStore(state => state.loading)
  const socketLoading = useSocketStore(state => state.loading)
  const subjectsLoading = useSubjectStore(state => state.loading)

  return useMemo(() => ({
    auth: authLoading,
    rooms: roomLoading.rooms,
    room: roomLoading.room,
    socket: socketLoading.socket,
    chatHistory: socketLoading.chatHistory,
    subjects: subjectsLoading,
    // Helper to check if any loading is active
    isAnyLoading: authLoading || 
                  roomLoading.rooms || 
                  roomLoading.room || 
                  socketLoading.socket || 
                  socketLoading.chatHistory || 
                  subjectsLoading,
  }), [authLoading, roomLoading, socketLoading, subjectsLoading])
}

/**
 * Hook for accessing combined error states across all stores
 */
export const useErrors = () => {
  const authError = useAuthStore(state => state.error)
  const roomError = useRoomStore(state => state.error)
  const socketError = useSocketStore(state => state.error)
  const subjectsError = useSubjectStore(state => state.error)

  return useMemo(() => ({
    auth: authError,
    rooms: roomError.rooms,
    room: roomError.room,
    socket: socketError.socket,
    subjects: subjectsError,
    // Helper to check if any error exists
    hasAnyError: !!(authError || 
                    roomError.rooms || 
                    roomError.room || 
                    socketError.socket || 
                    subjectsError),
  }), [authError, roomError, socketError, subjectsError])
}

export default useGame