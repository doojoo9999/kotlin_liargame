import {defineStore} from 'pinia'
import axios from 'axios'
import {io} from 'socket.io-client'

export const useChatStore = defineStore('chat', {
  state: () => ({
    messages: [],
    socket: null,
    connected: false,
    loading: false,
    error: null
  }),
  
  actions: {
    initSocket(gameNumber) {
      // Close existing socket if any
      if (this.socket) {
        this.socket.disconnect()
      }
      
      // Create new socket connection
      this.socket = io(import.meta.env.VITE_SOCKET_URL || window.location.origin, {
        path: '/ws'
      })
      
      // Set up event listeners
      this.socket.on('connect', () => {
        this.connected = true
        console.log('Socket connected')
        
        // Subscribe to game chat topic
        this.socket.emit('subscribe', `/topic/chat.${gameNumber}`)
      })
      
      this.socket.on('disconnect', () => {
        this.connected = false
        console.log('Socket disconnected')
      })
      
      this.socket.on(`/topic/chat.${gameNumber}`, (message) => {
        this.addMessage(message)
      })
      
      return this.socket
    },
    
    disconnectSocket() {
      if (this.socket) {
        this.socket.disconnect()
        this.socket = null
        this.connected = false
      }
    },
    
    addMessage(message) {
      this.messages.push(message)
    },
    
    async sendMessage(gameNumber, content, type) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.post('/api/v1/chat/send', {
          gNumber: gameNumber,
          content,
          type
        })
        
        // The message will be added via socket
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to send message'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async sendMessageViaSocket(gameNumber, content, type) {
      if (!this.socket || !this.connected) {
        throw new Error('Socket not connected')
      }
      
      const message = {
        gNumber: gameNumber,
        content,
        type
      }
      
      this.socket.emit('chat.send', message)
    },
    
    async getChatHistory(gameNumber, type = null, round = null, limit = 50) {
      this.loading = true
      this.error = null
      
      try {
        let url = `/api/v1/chat/history?gNumber=${gameNumber}&limit=${limit}`
        
        if (type) {
          url += `&type=${type}`
        }
        
        if (round) {
          url += `&round=${round}`
        }
        
        const response = await axios.get(url)
        
        this.messages = response.data
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to get chat history'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async getPostRoundMessages(gameNumber, limit = 10) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.get(`/api/v1/chat/post-round/${gameNumber}?limit=${limit}`)
        
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to get post-round messages'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    clearMessages() {
      this.messages = []
    }
  }
})