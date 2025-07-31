import {defineStore} from 'pinia'
import axios from 'axios'
import {io} from 'socket.io-client'

export const useChatStore = defineStore('chat', {
  state: () => ({
    messages: [],
    lobbyMessages: [],
    inGameMessages: [],
    socket: null,
    connected: false,
    loading: false,
    error: null,
    fallbackMode: false,
    reconnectTimer: null,
    maxReconnectAttempts: 5,
    currentReconnectAttempt: 0,
    currentGameNumber: null
  }),
  
  actions: {
    initSocket(gameNumber) {
      if (this.socket) {
        this.socket.disconnect()
      }
      
      
      this.currentGameNumber = gameNumber
      
      try {
        
        const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin
        console.log('Connecting to socket at:', socketUrl)
        
        this.socket = io(socketUrl, {
          path: '/ws',
          transports: ['websocket'],  
          upgrade: false,             
          reconnectionAttempts: 5,    
          timeout: 10000,             
          reconnectionDelay: 1000,    
          forceNew: true              
        })
        
        this.socket.on('connect', () => {
          this.connected = true
          console.log('Socket connected successfully')
          
          this.socket.emit('subscribe', `/topic/chat.${gameNumber}`)
        })
        
        this.socket.on('disconnect', () => {
          this.connected = false
          console.log('Socket disconnected')
        })
        
        this.socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error.message)
          console.error('Socket connection error details:', error)
          this.error = `Socket connection error: ${error.message}`
          
          
          if (this.socket.io && this.socket.io.engine && this.socket.io.engine.transport) {
            console.log('Socket transport:', this.socket.io.engine.transport.name)
            console.log('Socket protocol:', this.socket.io.engine.transport.protocol)
            console.log('Socket URL:', socketUrl + '/ws')
          }
          
          
          if (error.message.includes('403') || error.message.includes('Forbidden')) {
            console.log('403 Forbidden error detected, switching to fallback mode')
            this.enableFallbackMode(this.currentGameNumber)
          }
        })
        
        this.socket.on('connect_timeout', () => {
          console.error('Socket connection timeout')
          console.log('Socket transport at timeout:', this.socket.io?.engine?.transport?.name)
          this.error = 'Socket connection timeout'
          
          
          console.log('Connection timeout, switching to fallback mode')
          this.enableFallbackMode(this.currentGameNumber)
        })
        
        this.socket.on('reconnect_failed', () => {
          console.error('Socket reconnection failed after maximum attempts')
          this.error = 'Socket reconnection failed after maximum attempts'
          
          
          if (this.socket.io && this.socket.io.engine) {
            console.log('Final socket state:', {
              readyState: this.socket.io.engine.readyState,
              transport: this.socket.io.engine.transport?.name
            })
          }
          
          
          console.log('Reconnection attempts failed, switching to fallback mode')
          this.enableFallbackMode(this.currentGameNumber)
        })
        
        this.socket.on('reconnect_attempt', (attemptNumber) => {
          console.log(`Socket reconnection attempt #${attemptNumber}`)
        })
        
        this.socket.on('error', (error) => {
          console.error('Socket general error:', error)
          this.error = `Socket error: ${error.message || 'Unknown error'}`
        })
        
        this.socket.on(`/topic/chat.${gameNumber}`, (message) => {
          this.addMessage(message)
        })
        
        return this.socket
      } catch (error) {
        console.error('Failed to initialize socket:', error)
        this.error = `Failed to initialize socket: ${error.message}`
        this.connected = false
        return null
      }
    },
    
    disconnectSocket() {
      if (this.socket) {
        this.socket.disconnect()
        this.socket = null
        this.connected = false
      }
      
      
      if (this.reconnectTimer) {
        clearInterval(this.reconnectTimer)
        this.reconnectTimer = null
      }
      
      this.fallbackMode = false
      this.currentReconnectAttempt = 0
    },
    
    enableFallbackMode(gameNumber) {
      if (this.fallbackMode) return; 
      
      
      const gNumber = gameNumber || this.currentGameNumber;
      
      
      if (!gNumber) {
        console.error('Cannot enable fallback mode: No game number available');
        return;
      }
      
      console.log(`Switching to fallback mode for chat updates (Game #${gNumber})`)
      this.fallbackMode = true
      this.currentReconnectAttempt = 0
      
      
      if (this.socket) {
        this.socket.disconnect()
        this.socket = null
      }
      
      
      this.reconnectTimer = setInterval(async () => {
        try {
          
          await this.getChatHistory(gNumber)
          console.log(`Fallback: Successfully fetched chat messages via REST API for game #${gNumber}`)
        } catch (error) {
          console.error(`Fallback: Failed to fetch chat messages for game #${gNumber}:`, error)
        }
        
        
        this.currentReconnectAttempt++
        if (this.currentReconnectAttempt <= this.maxReconnectAttempts) {
          console.log(`Fallback: Attempting to reconnect WebSocket (${this.currentReconnectAttempt}/${this.maxReconnectAttempts}) for game #${gNumber}`)
          try {
            
            this.initSocket(gNumber)
          } catch (error) {
            console.error(`Fallback: Failed to reconnect WebSocket for game #${gNumber}:`, error)
          }
        } else if (this.reconnectTimer) {
          
          console.log(`Fallback: Maximum WebSocket reconnection attempts reached for game #${gNumber}, continuing with polling`)
        }
      }, 5000) 
    },
    
    addMessage(message) {
      this.messages.push(message)
      
      
      if (message.type === 'LOBBY') {
        this.lobbyMessages.push(message)
      } else if (['HINT', 'DISCUSSION', 'DEFENSE', 'POST_ROUND'].includes(message.type)) {
        this.inGameMessages.push(message)
      }
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
        
        
        if (type === 'LOBBY') {
          this.lobbyMessages = response.data
        } else if (['HINT', 'DISCUSSION', 'DEFENSE', 'POST_ROUND'].includes(type)) {
          this.inGameMessages = response.data
        } else {
          
          this.messages = response.data
          this.lobbyMessages = response.data.filter(msg => msg.type === 'LOBBY')
          this.inGameMessages = response.data.filter(msg => 
            ['HINT', 'DISCUSSION', 'DEFENSE', 'POST_ROUND'].includes(msg.type)
          )
        }
        
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
      this.lobbyMessages = []
      this.inGameMessages = []
    }
  }
})
