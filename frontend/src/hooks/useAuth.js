import {useCallback, useEffect} from 'react'
import * as gameApi from '../api/gameApi'
import gameStompClient from '../socket/gameStompClient'
import {ACTION_TYPES, ERROR_KEYS, LOADING_KEYS} from '../context/gameConstants'

export const useAuth = (state, dispatch) => {
  // Helper function to set loading state
  const setLoading = useCallback((type, value) => {
    dispatch({ type: ACTION_TYPES.SET_LOADING, payload: { type, value } })
  }, [dispatch])
  
  // Helper function to set error state
  const setError = useCallback((type, value) => {
    dispatch({ type: ACTION_TYPES.SET_ERROR, payload: { type, value } })
  }, [dispatch])

  // Initialize user from localStorage on mount
  useEffect(() => {
    const userData = localStorage.getItem('userData')
    if (userData) {
      try {
        const parsedUserData = JSON.parse(userData)
        dispatch({ 
          type: ACTION_TYPES.SET_USER, 
          payload: parsedUserData
        })
      } catch (error) {
        console.error('Failed to parse userData from localStorage:', error)
        localStorage.removeItem('userData')
      }
    }
  }, [dispatch])

  // Login function
  const login = useCallback(async (nickname) => {
    try {
      setLoading(LOADING_KEYS.AUTH, true)
      setError(ERROR_KEYS.AUTH, null)

      const result = await gameApi.login(nickname)
      const userData = {
        id: result.userId,
        nickname: nickname
      }
      
      localStorage.setItem('userData', JSON.stringify(userData))
      
      dispatch({ type: ACTION_TYPES.SET_USER, payload: userData })
      setLoading(LOADING_KEYS.AUTH, false)
      
      return userData
    } catch (error) {
      console.error('Login failed:', error)
      setError(ERROR_KEYS.AUTH, '로그인에 실패했습니다.')
      setLoading(LOADING_KEYS.AUTH, false)
      throw error
    }
  }, [dispatch, setLoading, setError])

  // Logout function
  const logout = useCallback(() => {
    try {
      // Disconnect WebSocket if connected
      if (gameStompClient.isClientConnected()) {
        gameStompClient.disconnect()
      }

      // Clear all related state
      dispatch({ type: ACTION_TYPES.LOGOUT })
      dispatch({ type: ACTION_TYPES.CLEAR_CURRENT_ROOM })
      dispatch({ type: ACTION_TYPES.CLEAR_CHAT_MESSAGES })
      dispatch({ type: ACTION_TYPES.RESET_GAME_STATE })
    } catch (error) {
      console.error('Logout error:', error)
    }
  }, [dispatch])

  return {
    login,
    logout,
    currentUser: state.currentUser,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading[LOADING_KEYS.AUTH],
    error: state.error[ERROR_KEYS.AUTH]
  }
}