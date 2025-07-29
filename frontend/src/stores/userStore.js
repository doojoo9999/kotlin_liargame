import {defineStore} from 'pinia'
import axios from 'axios'

export const useUserStore = defineStore('user', {
  state: () => ({
    userId: null,
    nickname: '',
    isAuthenticated: false,
    loading: false,
    error: null
  }),
  
  actions: {
    async login(nickname) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.post('/api/v1/auth/login', { nickname })
        
        this.userId = response.data.userId
        this.nickname = nickname
        this.isAuthenticated = true
        
        // Store user info in localStorage for persistence
        localStorage.setItem('userId', this.userId)
        localStorage.setItem('nickname', this.nickname)
        
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Login failed'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    logout() {
      this.userId = null
      this.nickname = ''
      this.isAuthenticated = false
      
      // Clear localStorage
      localStorage.removeItem('userId')
      localStorage.removeItem('nickname')
    },
    
    // Check if user is already logged in from localStorage
    checkAuth() {
      const userId = localStorage.getItem('userId')
      const nickname = localStorage.getItem('nickname')
      
      if (userId && nickname) {
        this.userId = userId
        this.nickname = nickname
        this.isAuthenticated = true
        return true
      }
      
      return false
    }
  }
})