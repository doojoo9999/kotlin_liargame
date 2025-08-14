import {useCallback} from 'react'
import {loginUser, logoutUser} from '../api/authAPI.js'
import {ActionTypes} from '../state/gameActions.js'

// Authentication Business Logic Hook
// This module handles authentication logic with state management integration

export const useAuthLogic = (dispatch, setLoading, setError) => {
  
  const login = useCallback(async (nickname) => {
    try {
      setLoading('auth', true)
      setError('auth', null)

      const userData = await loginUser(nickname)
      
      dispatch({ type: ActionTypes.SET_USER, payload: userData })
      setLoading('auth', false)
      
      return userData
    } catch (error) {
      console.error('Login failed:', error)
      setError('auth', '로그인에 실패했습니다.')
      setLoading('auth', false)
      throw error
    }
  }, [dispatch, setLoading, setError])

  const logout = useCallback(() => {
    try {
      logoutUser()

      dispatch({ type: ActionTypes.LOGOUT })
      dispatch({ type: ActionTypes.CLEAR_CURRENT_ROOM })
      dispatch({ type: ActionTypes.CLEAR_CHAT_MESSAGES })
      dispatch({ type: ActionTypes.RESET_GAME_STATE })
    } catch (error) {
      console.error('Logout error:', error)
    }
  }, [dispatch])

  return {
    login,
    logout
  }
}