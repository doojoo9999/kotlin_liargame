import {create} from 'zustand'
import {subscribeWithSelector} from 'zustand/middleware'
import useAuthStore from './authStore'
import useRoomStore from './roomStore'
import useSocketStore from './socketStore'

const useGameStore = create(
  subscribeWithSelector((set, get) => ({
    gameStatus: 'WAITING', // 'WAITING' | 'SPEAKING' | 'VOTING' | 'RESULTS' | 'FINISHED'
    currentRound: 0,
    playerRole: null, // 'LIAR' | 'CITIZEN' | null
    assignedWord: null, // The word/keyword assigned to the player
    gameTimer: 0, // Remaining time for current phase
    votingResults: null,
    gameResults: null,
    accusedPlayerId: null,
    defendingPlayerId: null,

    setGameStatus: (status) => {
      console.log('[DEBUG_LOG] Setting game status to:', status)
      set({ gameStatus: status })
    },

    setCurrentRound: (round) => {
      console.log('[DEBUG_LOG] Setting current round to:', round)
      set({ currentRound: round })
    },

    setPlayerRole: (role) => {
      console.log('[DEBUG_LOG] Setting player role to:', role)
      set({ playerRole: role })
    },

    setAssignedWord: (word) => {
      console.log('[DEBUG_LOG] Setting assigned word to:', word)
      set({ assignedWord: word })
    },

    setGameTimer: (timer) => {
      set({ gameTimer: timer })
    },

    setVotingResults: (results) => {
      console.log('[DEBUG_LOG] Setting voting results:', results)
      set({ votingResults: results })
    },

    setGameResults: (results) => {
      console.log('[DEBUG_LOG] Setting game results:', results)
      set({ gameResults: results })
    },

    setAccusedPlayer: (playerId) => {
      console.log('[DEBUG_LOG] Setting accused player:', playerId)
      set({ accusedPlayerId: playerId })
    },

    setDefendingPlayer: (playerId) => {
      console.log('[DEBUG_LOG] Setting defending player:', playerId)
      set({ defendingPlayerId: playerId })
    },

    startGame: () => {
      const socketStore = useSocketStore.getState()
      const roomStore = useRoomStore.getState()
      
      if (socketStore.socketConnected && roomStore.currentRoom) {
        console.log('[DEBUG_LOG] Starting game for room:', roomStore.currentRoom.gameNumber)
        socketStore.startGame()
        
        set({
          gameStatus: 'SPEAKING',
          currentRound: 1 
        })
      } else {
        console.warn('[DEBUG_LOG] Cannot start game - not connected or no room')
      }
    },

    castVote: (playerId) => {
      const socketStore = useSocketStore.getState()
      const roomStore = useRoomStore.getState()
      
      if (socketStore.socketConnected && roomStore.currentRoom) {
        console.log('[DEBUG_LOG] Casting vote for player:', playerId)
        socketStore.castVote(playerId)
        
        set({ accusedPlayerId: playerId })
      } else {
        console.warn('[DEBUG_LOG] Cannot cast vote - not connected or no room')
      }
    },

    handleGameUpdate: (update) => {
      console.log('[DEBUG_LOG] Handling game update:', update)
      
      switch (update.type) {
        case 'GAME_STARTED':
          set({
            gameStatus: 'SPEAKING',
            currentRound: update.round || 1,
            playerRole: update.playerRole || null,
            assignedWord: update.assignedWord || null
          })
          break
          
        case 'ROUND_STARTED':
          set({
            gameStatus: 'SPEAKING',
            currentRound: update.round,
            gameTimer: update.timer || 0
          })
          break
          
        case 'VOTING_STARTED':
          set({
            gameStatus: 'VOTING',
            gameTimer: update.timer || 0
          })
          break
          
        case 'VOTING_ENDED':
          set({
            gameStatus: 'RESULTS',
            votingResults: update.results,
            accusedPlayerId: update.accusedPlayerId || null
          })
          break
          
        case 'DEFENSE_STARTED':
          set({
            gameStatus: 'DEFENSE',
            defendingPlayerId: update.defendingPlayerId,
            gameTimer: update.timer || 0
          })
          break
          
        case 'GAME_ENDED':
          set({
            gameStatus: 'FINISHED',
            gameResults: update.results,
            votingResults: update.votingResults || null
          })
          break
          
        case 'TIMER_UPDATE':
          set({ gameTimer: update.timer })
          break
          
        case 'ROLE_ASSIGNED':
          set({
            playerRole: update.role,
            assignedWord: update.word || null
          })
          break
          
        default:
          console.log('[DEBUG_LOG] Unknown game update type:', update.type)
      }
    },

    isGameInProgress: () => {
      const { gameStatus } = get()
      return ['SPEAKING', 'VOTING', 'RESULTS', 'DEFENSE'].includes(gameStatus)
    },

    isPlayerLiar: () => {
      return get().playerRole === 'LIAR'
    },

    isPlayerCitizen: () => {
      return get().playerRole === 'CITIZEN'
    },

    canVote: () => {
      const { gameStatus, accusedPlayerId } = get()
      return gameStatus === 'VOTING' && !accusedPlayerId
    },

    canStartGame: () => {
      const { gameStatus } = get()
      const roomStore = useRoomStore.getState()
      const authStore = useAuthStore.getState()
      
      const isHost = roomStore.currentRoom?.players?.find(
        p => p.id === authStore.currentUser?.id
      )?.isHost
      
      return gameStatus === 'WAITING' && isHost
    },

    resetGameState: () => {
      console.log('[DEBUG_LOG] Resetting game state')
      set({
        gameStatus: 'WAITING',
        currentRound: 0,
        playerRole: null,
        assignedWord: null,
        gameTimer: 0,
        votingResults: null,
        gameResults: null,
        accusedPlayerId: null,
        defendingPlayerId: null
      })
    },

    reset: () => {
      get().resetGameState()
    }
  }))
)

useAuthStore.subscribe(
  (state) => state.isAuthenticated,
  (isAuthenticated) => {
    if (!isAuthenticated) {
      useGameStore.getState().reset()
    }
  }
)

useRoomStore.subscribe(
  (state) => state.currentRoom,
  (currentRoom, previousRoom) => {
    if (previousRoom && !currentRoom) {
      useGameStore.getState().resetGameState()
    }
  }
)

export default useGameStore