import {defineStore} from 'pinia'
import axios from 'axios'

export const useUserStore = defineStore('user', {
  state: () => ({
    userId: null,
    nickname: '',
    token: null,
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

        const token = response.data.accessToken
        if (!token) {
          throw new Error('No token received from server')
        }
        
        this.userId = response.data.userId || 'unknown'
        this.nickname = nickname
        this.token = token
        this.isAuthenticated = true
        
        localStorage.setItem('userId', this.userId)
        localStorage.setItem('nickname', this.nickname)
        localStorage.setItem('token', token)
        
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
      this.token = null
      this.isAuthenticated = false

      localStorage.removeItem('userId')
      localStorage.removeItem('nickname')
      localStorage.removeItem('token')
    },

    checkAuth() {
      const userId = localStorage.getItem('userId')
      const nickname = localStorage.getItem('nickname')
      const token = localStorage.getItem('token')
      
      if (userId && nickname && token) {
        this.userId = userId
        this.nickname = nickname
        this.token = token
        this.isAuthenticated = true
        return true
      }
      
      return false
    },

    getToken() {
      return this.token || localStorage.getItem('token')
    }
  }
})
