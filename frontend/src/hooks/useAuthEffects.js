import {useEffect} from 'react'
import {ActionTypes} from '../state/gameActions.js'

// Authentication Effects Hook
// This module handles authentication-related useEffect logic

export const useAuthEffects = (dispatch) => {
  
  // Effect for initializing user from localStorage on mount
  useEffect(() => {
    const initializeUser = () => {
      try {
        const savedUserData = localStorage.getItem('userData')
        if (savedUserData) {
          const userData = JSON.parse(savedUserData)
          console.log('[DEBUG_LOG] Restoring user from localStorage:', userData)
          dispatch({ type: ActionTypes.SET_USER, payload: userData })
        }
      } catch (error) {
        console.error('[ERROR] Failed to restore user from localStorage:', error)
        localStorage.removeItem('userData') // Clean up corrupted data
      }
    }

    initializeUser()
  }, [dispatch])

  // Effect for handling user authentication state changes
  useEffect(() => {
    const handleAuthStateChange = () => {
      // This effect can be extended to handle additional auth state changes
      // such as token expiration, session management, etc.
      console.log('[DEBUG_LOG] Authentication state initialized')
    }

    handleAuthStateChange()
  }, [])

}