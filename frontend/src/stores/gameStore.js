import {defineStore} from 'pinia'
import axios from 'axios'

export const useGameStore = defineStore('game', {
  state: () => ({
    gameNumber: null,
    gameState: null,
    players: [],
    currentRound: 0,
    gCurrentRound: 0,
    subject: '',
    word: '',
    yourWord: '',
    isLiar: false,
    yourRole: null,
    
    gameMode: null,
    
    gGameMode: null,
    gameResult: null,
    loading: false,
    error: null,
    selectedSubjects: []
  }),
  
  actions: {
    async createGame(gameName, playerCount, timeLimit, roundCount, password = null, liarAwarenessMode = false, differentWordMode = false) {
      this.loading = true
      this.error = null
      
      try {
        const request = {
          gName: gameName,
          gParticipants: playerCount,
          gTotalRounds: roundCount,
          gPassword: password,
          gTimeLimit: timeLimit,
          liarAwarenessMode: liarAwarenessMode,
          differentWordMode: differentWordMode
        }
        
        if (this.selectedSubjects.length > 0) {
          request.subjectIds = this.selectedSubjects.map(subject => subject.id)
          request.useRandomSubjects = false
        } else {
          request.useRandomSubjects = true
          request.randomSubjectCount = 1
        }
        
        const response = await axios.post('/api/v1/game/create', request)
        
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
        
        this._updateGameStateVariables(response.data)
        
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to join game'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async leaveGame(gameNumber) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.post('/api/v1/game/leave', {
          gNumber: gameNumber
        })
        
        this.resetGameState()
        
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('refresh-game-rooms'))
        }, 500)
        
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to leave game'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async startGame(gameNumber) {
      this.loading = true
      this.error = null
      
      try {
        const request = {
          gNumber: gameNumber
        }
        
        const response = await axios.post('/api/v1/game/start', request)
        
        this.gameState = response.data
        
        
        this._updateGameStateVariables(response.data)
        
        
        this.selectedSubjects = []
        
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
        this._updateGameStateVariables(response.data)
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
        
        this._updateGameStateVariables(response.data)
        
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
        this._updateGameStateVariables(response.data)
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
        this._updateGameStateVariables(response.data)
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
        
        if (response.data.gameState) {
          this.gameState = response.data.gameState
          this._updateGameStateVariables(response.data.gameState)
        } else {
          
          this._updateGameStateVariables(response.data)
        }
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
        
        
        this._updateGameStateVariables(response.data)

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
        
        
        this._updateGameStateVariables(response.data)
        
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
      this.gCurrentRound = 0
      this.subject = ''
      this.word = ''
      this.yourWord = ''
      this.isLiar = false
      this.yourRole = null
      this.gameMode = null
      this.gGameMode = null
      this.gameResult = null
      this.error = null
      this.selectedSubjects = []
    },
    
    setSelectedSubjects(subjects) {
      this.selectedSubjects = subjects
    },
    
    
    
    _updateGameStateVariables(data) {
      
      if (data.players) {
        this.players = data.players
      }
      
      
      
      
      if (data.currentRound !== undefined) {
        this.currentRound = data.currentRound
      }
      if (data.gCurrentRound !== undefined) {
        this.gCurrentRound = data.gCurrentRound
      }
      
      
      
      if (data.gameMode !== undefined) {
        this.gameMode = data.gameMode
      }
      if (data.gGameMode !== undefined) {
        this.gGameMode = data.gGameMode
      }
      
      if (data.yourRole !== undefined) {
        this.yourRole = data.yourRole
        this.isLiar = data.yourRole === 'LIAR'
      }
      
      if (data.yourWord !== undefined) {
        this.yourWord = data.yourWord
      }
      
      if (data.subject !== undefined) {
        this.subject = data.subject
      }
      
      if (data.word !== undefined) {
        this.word = data.word
      }
    }
  }
})
