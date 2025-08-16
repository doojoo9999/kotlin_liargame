import React, {createContext, useCallback} from 'react'
import {useGame as useGameZustand} from '../stores/useGame'

// Import effect management hooks
import {useAuthEffects} from '../hooks/useAuthEffects.js'
import {useTimerEffects} from '../hooks/useTimerEffects.js'
import {useSocketEffects} from '../hooks/useSocketEffects.js'

// Import logging utilities
import {debugLog} from '../utils/logger.js'

/**
 * React Context for Game State Management
 * 
 * NOTE: This Context serves as a compatibility Provider for DI (Dependency Injection) purposes.
 * Actual state and actions are provided through Zustand stores via useGameZustand.
 * 
 * Architecture Decision:
 * - useGame() returns Zustand store directly (external contract maintained)
 * - GameProvider initializes side effects (auth, timer, socket) for the component tree
 * - No contextValue is provided as all state management is handled by Zustand
 */
const GameContext = createContext()

/**
 * Lightweight Context Provider Component
 * 
 * This Provider serves as a compatibility layer and DI point for effect initialization.
 * It does not provide contextValue as all state management is handled by Zustand stores.
 */
const GameProvider = ({ children }) => {
  // Get Zustand store data for effect initialization
  const zustandStore = useGameZustand()
  const { 
    currentRoom, 
    socketConnected, 
    gameTimer,
    loadChatHistory,
    setLoading,
    setError,
    connectSocket,
    disconnectSocket,
    clearChatMessages,
    login
  } = zustandStore

  /**
   * Dispatch function that maps ActionTypes to Zustand store actions
   */
  const dispatch = useCallback((action) => {
    const { type, payload } = action
    
    switch (type) {
      case 'SET_USER':
        // Handle user authentication - for compatibility with useAuthEffects
        // The actual auth initialization is handled by authStore.initializeAuth()
        // This case exists to prevent the "Unhandled action type" warning
        console.log('[DEBUG_LOG] SET_USER action dispatched, user data:', payload)
        break
      case 'SET_SOCKET_CONNECTION':
        if (payload) {
          connectSocket()
        } else {
          disconnectSocket()
        }
        break
      case 'CLEAR_CHAT_MESSAGES':
        clearChatMessages()
        break
      default:
        console.warn(`Unhandled action type: ${type}`)
    }
  }, [connectSocket, disconnectSocket, clearChatMessages, login])

  /**
   * Connection function placeholder
   * 
   * NOTE: This is a placeholder function that only logs the connection attempt.
   * Actual WebSocket connection logic is handled by useSocketEffects hook.
   * This function exists for backward compatibility and logging purposes.
   */
  const connectToRoom = useCallback(async (gameNumber) => {
    if (import.meta.env.DEV) {
      debugLog('connectToRoom called - actual connection handled by useSocketEffects', { gameNumber })
    }
    // Real connection logic is in useSocketEffects hook
  }, [])

  // Initialize effects in proper order with clear dependencies
  // Order matters: Auth -> Timer -> Socket (socket depends on auth/room state)
  
  /**
   * Auth Effects: Handle authentication state changes and session management
   */
  useAuthEffects(dispatch)

  /**
   * Timer Effects: Handle game timer updates and timer-related state
   * Depends on: gameTimer state from Zustand
   */
  useTimerEffects(gameTimer)

  /**
   * Socket Effects: Handle WebSocket connections, room joining, and real-time updates
   * Depends on: currentRoom, socketConnected state and loadChatHistory action from Zustand
   * 
   * This is where the actual room connection logic is implemented.
   * The connectToRoom function above is just a placeholder for compatibility.
   */
  useSocketEffects(
    currentRoom,
    socketConnected,
    dispatch,
    setLoading,
    setError,
    loadChatHistory
  )

  if (import.meta.env.DEV) {
    debugLog('GameProvider initialized with effect hooks')
  }

  // Return children without Context value - all state comes from Zustand
  return <>{children}</>
}

export const useGame = () => {
  return useGameZustand()
}

export { GameProvider }
export default GameContext