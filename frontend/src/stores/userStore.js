import {defineStore} from 'pinia'
import axios from 'axios'

export const useUserStore = defineStore('user', {
  state: () => ({
    userId: null,
    username: '',
    isAuthenticated: false,
    loading: false,
    error: null
  }),
  
  actions: {
    async login(username) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.post('/api/v1/auth/login', { username })
        
        this.userId = response.data.userId
        this.username = username
        this.isAuthenticated = true
        
        // Store user info in localStorage for persistence
        localStorage.setItem('userId', this.userId)
        localStorage.setItem('username', this.username)
        
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
      this.username = ''
      this.isAuthenticated = false
      
      // Clear localStorage
      localStorage.removeItem('userId')
      localStorage.removeItem('username')
    },
    
    // Check if user is already logged in from localStorage
    checkAuth() {
      const userId = localStorage.getItem('userId')
      const username = localStorage.getItem('username')
      
      if (userId && username) {
        this.userId = userId
        this.username = username
        this.isAuthenticated = true
        return true
      }
      
      return false
    }
  }
})