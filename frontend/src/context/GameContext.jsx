import React, {createContext, useContext, useEffect, useReducer} from 'react'
import * as gameApi from '../api/gameApi'

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
  
  // UI state
  loading: {
    rooms: false,
    room: false,
    auth: false,
    subjects: false
  },
  error: {
    rooms: null,
    room: null,
    auth: null,
    subjects: null
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
      
    default:
      return state
  }
}

// Create context
const GameContext = createContext()

// Context provider component
export const GameProvider = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState)
  
  // Helper function to set loading state
  const setLoading = (type, value) => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: { type, value } })
  }
  
  // Helper function to set error state
  const setError = (type, value) => {
    dispatch({ type: ActionTypes.SET_ERROR, payload: { type, value } })
  }
  
  // Authentication functions
  const login = async (nickname) => {
    try {
      setLoading('auth', true)
      setError('auth', null)
      
      const response = await gameApi.login(nickname)
      localStorage.setItem('accessToken', response.accessToken)
      
      const user = { nickname, accessToken: response.accessToken }
      dispatch({ type: ActionTypes.SET_USER, payload: user })
      
      return user
    } catch (error) {
      setError('auth', error.response?.data?.message || 'Login failed')
      throw error
    } finally {
      setLoading('auth', false)
    }
  }
  
  const logout = () => {
    dispatch({ type: ActionTypes.LOGOUT })
  }
  
  // Room functions
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
      
      // Refresh room list after creating
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
      
      return roomData
    } catch (error) {
      // Use dummy data if API fails
      console.warn('API failed, using dummy data:', error.message)
      const dummyRoom = gameApi.dummyData.gameState
      dispatch({ type: ActionTypes.SET_CURRENT_ROOM, payload: dummyRoom })
      return dummyRoom
    } finally {
      setLoading('room', false)
    }
  }
  
  const leaveRoom = async (gameNumber) => {
    try {
      setLoading('room', true)
      setError('room', null)
      
      await gameApi.leaveRoom(gameNumber)
      dispatch({ type: ActionTypes.CLEAR_CURRENT_ROOM })
      
      // Refresh room list after leaving
      await fetchRooms()
      
      return true
    } catch (error) {
      setError('room', error.response?.data?.message || 'Failed to leave room')
      // Still clear current room even if API fails
      dispatch({ type: ActionTypes.CLEAR_CURRENT_ROOM })
      throw error
    } finally {
      setLoading('room', false)
    }
  }
  
  // Subject functions
  const fetchSubjects = async () => {
    try {
      setLoading('subjects', true)
      setError('subjects', null)
      
      const subjects = await gameApi.getAllSubjects()
      dispatch({ type: ActionTypes.SET_SUBJECTS, payload: subjects })
      
      return subjects
    } catch (error) {
      // Use dummy data if API fails
      console.warn('API failed, using dummy data:', error.message)
      dispatch({ type: ActionTypes.SET_SUBJECTS, payload: gameApi.dummyData.subjects })
      return gameApi.dummyData.subjects
    } finally {
      setLoading('subjects', false)
    }
  }
  
  // Navigation functions
  const navigateToLobby = () => {
    dispatch({ type: ActionTypes.SET_CURRENT_PAGE, payload: 'lobby' })
  }
  
  const navigateToRoom = () => {
    dispatch({ type: ActionTypes.SET_CURRENT_PAGE, payload: 'room' })
  }
  
  // Initialize data on mount
  useEffect(() => {
    // Check for existing token
    const token = localStorage.getItem('accessToken')
    if (token) {
      // In a real app, you might want to validate the token with the server
      dispatch({ type: ActionTypes.SET_USER, payload: { accessToken: token } })
    }
    
    // Load initial data
    fetchRooms()
    fetchSubjects()
  }, [])
  
  // Context value
  const value = {
    // State
    ...state,
    
    // Actions
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
    setError
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