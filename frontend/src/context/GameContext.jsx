import React, {createContext, useCallback, useMemo, useReducer} from 'react'
import {useGame as useGameZustand} from '../stores/useGame'

// Import separated modules
import {initialState} from '../state/gameState.js'
import {ActionTypes} from '../state/gameActions.js'
import {gameReducer} from '../state/gameReducer.js'

// Import business logic hooks
import {useAuthLogic} from '../hooks/useAuthLogic.js'
import {useRoomLogic} from '../hooks/useRoomLogic.js'
import {useGameLogic} from '../hooks/useGameLogic.js'
import {useChatLogic} from '../hooks/useChatLogic.js'
import {useTimerLogic} from '../hooks/useTimerLogic.js'

// Import effect management hooks
import {useAuthEffects} from '../hooks/useAuthEffects.js'
import {useTimerEffects} from '../hooks/useTimerEffects.js'
import {useSocketEffects} from '../hooks/useSocketEffects.js'

// Import subject API functions
import {createSubject, createWord, fetchAllSubjects} from '../api/subjectAPI.js'

// Create context
const GameContext = createContext()

// Context provider component
const GameProvider = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState)
  
  // Helper functions for loading and error management
  const setLoading = useCallback((type, value) => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: { type, value } })
  }, [])
  
  const setError = useCallback((type, value) => {
    dispatch({ type: ActionTypes.SET_ERROR, payload: { type, value } })
  }, [])
  
  // Subject management functions
  const fetchSubjects = useCallback(async () => {
    if (state.loading.subjects || state.subjects.length > 0) {
      console.log('[DEBUG_LOG] Skipping subjects fetch - already loading or has data')
      return
    }

    try {
      setLoading('subjects', true)
      setError('subjects', null)
      const subjects = await fetchAllSubjects()
      dispatch({ type: ActionTypes.SET_SUBJECTS, payload: subjects })
    } catch (error) {
      console.error('Failed to fetch subjects:', error)
      setError('subjects', '주제 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading('subjects', false)
    }
  }, [state.loading.subjects, state.subjects.length, setLoading, setError])

  const addSubject = useCallback(async (name) => {
    try {
      setLoading('subjects', true)
      setError('subjects', null)
      await createSubject(name)
      setLoading('subjects', false)
    } catch (error) {
      console.error('Failed to add subject:', error)
      setError('subjects', '주제 추가에 실패했습니다.')
      setLoading('subjects', false)
      throw error
    }
  }, [setLoading, setError])

  const addWord = useCallback(async (subject, word) => {
    try {
      setLoading('subjects', true)
      setError('subjects', null)
      const result = await createWord(subject, word)
      setLoading('subjects', false)
      return result
    } catch (error) {
      console.error('Failed to add word:', error)
      setError('subjects', '답안 추가에 실패했습니다.')
      setLoading('subjects', false)
      throw error
    }
  }, [setLoading, setError])

  // Connection function placeholder (needs WebSocket integration)
  const connectToRoom = useCallback(async (gameNumber) => {
    console.log('[DEBUG_LOG] Connecting to room:', gameNumber)
    // WebSocket connection logic will be handled by useSocketEffects
  }, [])

  // Initialize business logic hooks
  const authLogic = useAuthLogic(dispatch, setLoading, setError)
  const roomLogic = useRoomLogic(state, dispatch, setLoading, setError, connectToRoom)
  const gameLogic = useGameLogic(state, dispatch, setLoading, setError)
  const chatLogic = useChatLogic(dispatch, setLoading, setError)
  const timerLogic = useTimerLogic(dispatch)

  // Initialize effects
  useAuthEffects(dispatch)
  useTimerEffects(state.gameTimer, dispatch)
  useSocketEffects(
    state.currentRoom,
    state.socketConnected,
    dispatch,
    setLoading,
    setError,
    chatLogic.loadHistory
  )

  // Memoize context value
  const contextValue = useMemo(() => ({
    // State
    state,
    
    // Auth functions
    login: authLogic.login,
    logout: authLogic.logout,
    
    // Room functions
    fetchRooms: roomLogic.fetchRooms,
    createRoom: roomLogic.createRoom,
    joinRoom: roomLogic.joinRoom,
    leaveRoom: roomLogic.leaveRoom,
    getCurrentRoom: roomLogic.getCurrentRoom,
    navigateToLobby: roomLogic.navigateToLobby,
    navigateToRoom: roomLogic.navigateToRoom,
    
    // Subject functions
    fetchSubjects,
    addSubject,
    addWord,
    
    // Game functions
    startGame: gameLogic.startGame,
    castVote: gameLogic.castVote,
    submitHint: gameLogic.submitHint,
    submitDefense: gameLogic.submitDefense,
    castSurvivalVote: gameLogic.castSurvivalVote,
    guessWord: gameLogic.guessWord,
    completeSpeech: gameLogic.completeSpeech,
    
    // Chat functions
    sendChatMessage: chatLogic.sendMessage,
    loadChatHistory: chatLogic.loadHistory,
    
    // Timer functions
    setGameTimer: timerLogic.setGameTimer,
    
    // Connection functions
    connectToRoom,
    fetchRoomDetails: roomLogic.getCurrentRoom
  }), [
    state, authLogic, roomLogic, gameLogic, chatLogic, timerLogic,
    fetchSubjects, addSubject, addWord, connectToRoom
  ])

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  )
}

export const useGame = () => {
  return useGameZustand()
}

export { GameProvider }
export default GameContext