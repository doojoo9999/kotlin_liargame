import {create} from 'zustand'
import {subscribeWithSelector} from 'zustand/middleware'
import * as gameApi from '../api/gameApi'
import gameStompClient from '../socket/gameStompClient'

const useAuthStore = create(
  subscribeWithSelector((set) => ({
    // State
    currentUser: null,
    isAuthenticated: false,
    loading: false,
    error: null,

    // Actions
    login: async (nickname) => {
      try {
        set({ loading: true, error: null })

        let result
        try {
          result = await gameApi.login(nickname)
        } catch (err) {
          // If server rejects with 400 (e.g., legacy endpoint not accepting this payload),
          // try to create/register the user as a fallback to keep the app usable.
          if (err?.response?.status === 400) {
            // Try to create/register the user, then retry login to establish session
            result = await gameApi.addUser(nickname, null)
            try {
              await gameApi.login(nickname)
            } catch (loginErr) {
              // If login still fails after registration, continue with created user data
              console.warn('[AUTH] Login after registration failed, proceeding without session:', loginErr)
            }
          } else {
            throw err
          }
        }
        const userData = {
          id: result.userId,
          nickname: nickname,
          role: 'user'
        }
        
        localStorage.setItem('userData', JSON.stringify(userData))
        
        set({ 
          currentUser: userData, 
          isAuthenticated: true,
          loading: false 
        })
        
        return userData
      } catch (error) {
        console.error('Login failed:', error)
        set({ 
          error: '로그인에 실패했습니다.',
          loading: false 
        })
        throw error
      }
    },

    logout: () => {
      try {
        // Disconnect WebSocket if connected
        if (gameStompClient.isClientConnected()) {
          gameStompClient.disconnect()
        }

        // Clear localStorage
        localStorage.removeItem('userData')

        // Reset auth state
        set({ 
          currentUser: null, 
          isAuthenticated: false,
          error: null 
        })

        // Note: Other stores will handle their own cleanup via subscriptions
        console.log('User logged out successfully')
      } catch (error) {
        console.error('Logout error:', error)
      }
    },

    // Initialize user from localStorage
    initializeAuth: () => {
      try {
        const userData = localStorage.getItem('userData')
        if (userData) {
          const parsedUserData = JSON.parse(userData)
          const normalizedUserData = parsedUserData && typeof parsedUserData === 'object'
            ? { role: 'user', ...parsedUserData }
            : { role: 'user' }
          set({ 
            currentUser: normalizedUserData, 
            isAuthenticated: true 
          })
          console.log('User restored from localStorage:', parsedUserData)
        }
      } catch (error) {
        console.error('Failed to parse userData from localStorage:', error)
        localStorage.removeItem('userData')
        set({ 
          currentUser: null, 
          isAuthenticated: false 
        })
      }
    },

    // Clear error
    clearError: () => set({ error: null }),

    // Set loading state (for external use)
    setLoading: (loading) => set({ loading }),
  }))
)

// Initialize auth on store creation
useAuthStore.getState().initializeAuth()

export default useAuthStore