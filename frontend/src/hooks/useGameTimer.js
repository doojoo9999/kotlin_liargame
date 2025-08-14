import {useEffect} from 'react'
import {ACTION_TYPES, GAME_STATUS} from '../context/gameConstants'

export const useGameTimer = (state, dispatch, gameActions) => {
  const {
    submitHint,
    castVote,
    submitDefense,
    castSurvivalVote,
    guessWord
  } = gameActions

  // Timer management useEffect
  useEffect(() => {
    let timerInterval = null
    
    // Only run timer if game is active and timer > 0
    if (state.gameTimer > 0 && state.gameStatus !== GAME_STATUS.WAITING && state.currentRoom) {
      console.log('[DEBUG_LOG] Starting timer countdown:', state.gameTimer)
      
      timerInterval = setInterval(() => {
        dispatch({ 
          type: ACTION_TYPES.SET_GAME_TIMER, 
          payload: Math.max(0, state.gameTimer - 1) 
        })
      }, 1000)
    }
    
    // Auto-execute actions when timer expires
    if (state.gameTimer === 0 && state.gameStatus !== GAME_STATUS.WAITING && state.currentRoom) {
      console.log('[DEBUG_LOG] Timer expired, executing auto action for status:', state.gameStatus)
      
      const executeAutoAction = async () => {
        try {
          const gameNumber = state.currentRoom.gameNumber
          
          switch (state.gameStatus) {
            case GAME_STATUS.SPEAKING:
              // Auto-submit empty hint
              console.log('[DEBUG_LOG] Auto-submitting empty hint')
              await submitHint('')
              break
              
            case GAME_STATUS.VOTING:
              // Auto-vote for random player (excluding self)
              const availablePlayers = state.roomPlayers.filter(p => 
                p.id !== state.currentUser?.id && p.isAlive !== false
              )
              if (availablePlayers.length > 0) {
                const randomPlayer = availablePlayers[Math.floor(Math.random() * availablePlayers.length)]
                console.log('[DEBUG_LOG] Auto-voting for random player:', randomPlayer.nickname)
                await castVote(gameNumber, randomPlayer.id)
              }
              break
              
            case 'DEFENSE':
              // Auto-submit empty defense
              console.log('[DEBUG_LOG] Auto-submitting empty defense')
              await submitDefense('')
              break
              
            case 'SURVIVAL_VOTING':
              // Auto-vote to eliminate (false)
              console.log('[DEBUG_LOG] Auto-voting to eliminate')
              await castSurvivalVote(false)
              break
              
            case 'WORD_GUESS':
              // Auto-submit empty word guess
              console.log('[DEBUG_LOG] Auto-submitting empty word guess')
              await guessWord('')
              break
              
            default:
              console.log('[DEBUG_LOG] No auto action defined for status:', state.gameStatus)
          }
        } catch (error) {
          console.error('[ERROR] Failed to execute auto action:', error)
        }
      }
      
      // Execute auto action with slight delay to ensure state consistency
      setTimeout(executeAutoAction, 100)
    }
    
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval)
      }
    }
  }, [
    state.gameTimer, 
    state.gameStatus, 
    state.currentRoom, 
    state.roomPlayers, 
    state.currentUser,
    dispatch,
    submitHint,
    castVote,
    submitDefense,
    castSurvivalVote,
    guessWord
  ])

  // Server timer synchronization useEffect
  useEffect(() => {
    // This effect handles server-sent timer updates
    // The timer value from server takes precedence over client countdown
    console.log('[DEBUG_LOG] Timer synchronized from server:', state.gameTimer)
  }, [state.gameTimer])

  return {
    gameTimer: state.gameTimer,
    gameStatus: state.gameStatus
  }
}