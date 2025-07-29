import {defineStore} from 'pinia'
import axios from 'axios'

export const useGameStore = defineStore('game', {
  state: () => ({
    gameNumber: null,
    gameState: null,
    players: [],
    currentRound: 0,
    subject: '',
    word: '',
    isLiar: false,
    gameResult: null,
    loading: false,
    error: null
  }),
  
  actions: {
    async createGame(playerCount, timeLimit, roundCount, password = null) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.post('/api/v1/game/create', {
          playerCount,
          timeLimit,
          roundCount,
          password
        })
        
        this.gameNumber = response.data
        return this.gameNumber
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to create game'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async joinGame(gameNumber, password = null) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.post('/api/v1/game/join', {
          gNumber: gameNumber,
          gPassword: password
        })
        
        this.gameNumber = gameNumber
        this.gameState = response.data
        this.players = response.data.players || []
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to join game'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async startGame(gameNumber) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.post('/api/v1/game/start', {
          gNumber: gameNumber
        })
        
        this.gameState = response.data
        this.currentRound = response.data.currentRound || 0
        this.subject = response.data.subject || ''
        this.word = response.data.word || ''
        this.isLiar = response.data.isLiar || false
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to start game'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async giveHint(gameNumber, hint) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.post('/api/v1/game/hint', {
          gNumber: gameNumber,
          hint
        })
        
        this.gameState = response.data
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to give hint'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async votePlayer(gameNumber, targetPlayerId) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.post('/api/v1/game/vote', {
          gNumber: gameNumber,
          targetPlayerId
        })
        
        this.gameState = response.data
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to vote'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async defend(gameNumber, defense) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.post('/api/v1/game/defend', {
          gNumber: gameNumber,
          defense
        })
        
        this.gameState = response.data
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to defend'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async survivalVote(gameNumber, targetPlayerId) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.post('/api/v1/game/survival-vote', {
          gNumber: gameNumber,
          targetPlayerId
        })
        
        this.gameState = response.data
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to vote for survival'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async guessWord(gameNumber, word) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.post('/api/v1/game/guess-word', {
          gNumber: gameNumber,
          word
        })
        
        this.gameResult = response.data
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to guess word'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async getGameState(gameNumber) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.get(`/api/v1/game/${gameNumber}`)
        
        this.gameState = response.data
        this.players = response.data.players || []
        this.currentRound = response.data.currentRound || 0
        this.subject = response.data.subject || ''
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to get game state'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async getGameResult(gameNumber) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.get(`/api/v1/game/result/${gameNumber}`)
        
        this.gameResult = response.data
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to get game result'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async endRound(gameNumber) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.post('/api/v1/game/end-of-round', {
          gNumber: gameNumber
        })
        
        this.gameState = response.data
        this.currentRound = response.data.currentRound || 0
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to end round'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    resetGameState() {
      this.gameNumber = null
      this.gameState = null
      this.players = []
      this.currentRound = 0
      this.subject = ''
      this.word = ''
      this.isLiar = false
      this.gameResult = null
      this.error = null
    }
  }
})