import {useCallback} from 'react'
import * as gameApi from '../api/gameApi'
import gameStompClient from '../socket/gameStompClient'
import {ACTION_TYPES, ERROR_KEYS, LOADING_KEYS} from '../context/gameConstants'

export const useGameActions = (state, dispatch) => {
  // Helper function to set loading state
  const setLoading = useCallback((type, value) => {
    dispatch({ type: ACTION_TYPES.SET_LOADING, payload: { type, value } })
  }, [dispatch])
  
  // Helper function to set error state
  const setError = useCallback((type, value) => {
    dispatch({ type: ACTION_TYPES.SET_ERROR, payload: { type, value } })
  }, [dispatch])

  // Start game
  const startGame = useCallback(async () => {
    try {
      if (!state.currentRoom) {
        throw new Error('No current room available')
      }

      setLoading(LOADING_KEYS.ROOM, true)
      setError(ERROR_KEYS.ROOM, null)

      console.log('[DEBUG_LOG] Starting game for room:', state.currentRoom.gameNumber)
      
      // Use REST API instead of WebSocket since backend has no WebSocket handler for 'start'
      const result = await gameApi.startGame(state.currentRoom.gameNumber)
      
      console.log('[DEBUG_LOG] Game started successfully:', result)
      setLoading(LOADING_KEYS.ROOM, false)
      
      return result
    } catch (error) {
      console.error('[ERROR] Failed to start game:', error)
      setError(ERROR_KEYS.ROOM, error.message || '게임 시작에 실패했습니다.')
      setLoading(LOADING_KEYS.ROOM, false)
      throw error
    }
  }, [state.currentRoom, setLoading, setError])

  // Cast vote for a player
  const castVote = useCallback(async (gameNumber, targetPlayerId) => {
    try {
      if (!state.currentRoom) {
        throw new Error('No current room available')
      }

      if (!targetPlayerId) {
        throw new Error('Target player ID is required')
      }

      setLoading(LOADING_KEYS.ROOM, true)
      setError(ERROR_KEYS.ROOM, null)

      console.log('[DEBUG_LOG] Casting vote for player:', targetPlayerId, 'in game:', gameNumber)

      // Call API to cast vote
      const result = await gameApi.castVote(gameNumber, targetPlayerId)

      // Update local state
      dispatch({ type: ACTION_TYPES.SET_MY_VOTE, payload: targetPlayerId })

      // Send WebSocket message for real-time updates
      if (gameStompClient.isClientConnected()) {
        gameStompClient.sendGameAction(gameNumber, 'vote', { targetPlayerId })
      }

      console.log('[DEBUG_LOG] Vote cast successfully:', result)
      setLoading(LOADING_KEYS.ROOM, false)

      return result
    } catch (error) {
      console.error('[ERROR] Failed to cast vote:', error)
      setError(ERROR_KEYS.ROOM, error.message || '투표에 실패했습니다.')
      setLoading(LOADING_KEYS.ROOM, false)
      throw error
    }
  }, [state.currentRoom, dispatch, setLoading, setError])

  // Submit hint
  const submitHint = useCallback(async (hint) => {
    try {
      if (!state.currentRoom) {
        throw new Error('No current room available')
      }

      if (!hint || !hint.trim()) {
        throw new Error('Hint cannot be empty')
      }

      setLoading(LOADING_KEYS.ROOM, true)
      setError(ERROR_KEYS.ROOM, null)

      console.log('[DEBUG_LOG] Submitting hint:', hint, 'for game:', state.currentRoom.gameNumber)
      
      // Call API to submit hint
      const result = await gameApi.submitHint(state.currentRoom.gameNumber, hint.trim())
      
      // Send WebSocket message for real-time updates
      if (gameStompClient.isClientConnected()) {
        gameStompClient.sendGameAction(state.currentRoom.gameNumber, 'hint', { hint: hint.trim() })
      }

      console.log('[DEBUG_LOG] Hint submitted successfully:', result)
      setLoading(LOADING_KEYS.ROOM, false)
      
      return result
    } catch (error) {
      console.error('[ERROR] Failed to submit hint:', error)
      setError(ERROR_KEYS.ROOM, error.message || '힌트 제출에 실패했습니다.')
      setLoading(LOADING_KEYS.ROOM, false)
      throw error
    }
  }, [state.currentRoom, setLoading, setError])

  // Submit defense
  const submitDefense = useCallback(async (defenseText) => {
    try {
      if (!state.currentRoom) {
        throw new Error('No current room available')
      }

      if (!defenseText || !defenseText.trim()) {
        throw new Error('Defense text cannot be empty')
      }

      setLoading(LOADING_KEYS.ROOM, true)
      setError(ERROR_KEYS.ROOM, null)

      console.log('[DEBUG_LOG] Submitting defense:', defenseText, 'for game:', state.currentRoom.gameNumber)
      
      // Call API to submit defense
      const result = await gameApi.submitDefense(state.currentRoom.gameNumber, defenseText.trim())
      
      // Update local state with defense text
      dispatch({ type: ACTION_TYPES.SET_DEFENSE_TEXT, payload: defenseText.trim() })
      
      // Send WebSocket message for real-time updates
      if (gameStompClient.isClientConnected()) {
        gameStompClient.sendGameAction(state.currentRoom.gameNumber, 'defense', { 
          defenseText: defenseText.trim(),
          accusedPlayerId: state.accusedPlayerId 
        })
      }

      console.log('[DEBUG_LOG] Defense submitted successfully:', result)
      setLoading(LOADING_KEYS.ROOM, false)
      
      return result
    } catch (error) {
      console.error('[ERROR] Failed to submit defense:', error)
      setError(ERROR_KEYS.ROOM, error.message || '변론 제출에 실패했습니다.')
      setLoading(LOADING_KEYS.ROOM, false)
      throw error
    }
  }, [state.currentRoom, state.accusedPlayerId, dispatch, setLoading, setError])

  // Cast survival vote
  const castSurvivalVote = useCallback(async (survival) => {
    try {
      if (!state.currentRoom) {
        throw new Error('No current room available')
      }

      if (typeof survival !== 'boolean') {
        throw new Error('Survival vote must be boolean')
      }

      setLoading(LOADING_KEYS.ROOM, true)
      setError(ERROR_KEYS.ROOM, null)

      console.log('[DEBUG_LOG] Casting survival vote:', survival, 'for game:', state.currentRoom.gameNumber)
      
      // Call API to cast survival vote
      const result = await gameApi.castSurvivalVote(state.currentRoom.gameNumber, survival)
      
      // Update local state with survival vote
      dispatch({ type: ACTION_TYPES.SET_MY_SURVIVAL_VOTE, payload: survival })
      
      // Send WebSocket message for real-time updates
      if (gameStompClient.isClientConnected()) {
        gameStompClient.sendGameAction(state.currentRoom.gameNumber, 'survival-vote', { 
          survival: survival,
          accusedPlayerId: state.accusedPlayerId 
        })
      }

      console.log('[DEBUG_LOG] Survival vote cast successfully:', result)
      setLoading(LOADING_KEYS.ROOM, false)
      
      return result
    } catch (error) {
      console.error('[ERROR] Failed to cast survival vote:', error)
      setError(ERROR_KEYS.ROOM, error.message || '생존 투표에 실패했습니다.')
      setLoading(LOADING_KEYS.ROOM, false)
      throw error
    }
  }, [state.currentRoom, state.accusedPlayerId, dispatch, setLoading, setError])

  // Guess word
  const guessWord = useCallback(async (guessedWord) => {
    try {
      if (!state.currentRoom) {
        throw new Error('No current room available')
      }

      if (!guessedWord || !guessedWord.trim()) {
        throw new Error('Guessed word cannot be empty')
      }

      setLoading(LOADING_KEYS.ROOM, true)
      setError(ERROR_KEYS.ROOM, null)

      console.log('[DEBUG_LOG] Guessing word:', guessedWord, 'for game:', state.currentRoom.gameNumber)
      
      // Call API to guess word
      const result = await gameApi.guessWord(state.currentRoom.gameNumber, guessedWord.trim())
      
      // Update local state with guess result
      if (result.guessResult) {
        dispatch({ type: ACTION_TYPES.SET_WORD_GUESS_RESULT, payload: result.guessResult })
      }
      
      // Update final game result if available
      if (result.gameResult) {
        dispatch({ type: ACTION_TYPES.SET_FINAL_GAME_RESULT, payload: result.gameResult })
      }
      
      // Send WebSocket message for real-time updates
      if (gameStompClient.isClientConnected()) {
        gameStompClient.sendGameAction(state.currentRoom.gameNumber, 'word-guess', { 
          guessedWord: guessedWord.trim() 
        })
      }

      console.log('[DEBUG_LOG] Word guessed successfully:', result)
      setLoading(LOADING_KEYS.ROOM, false)
      
      return result
    } catch (error) {
      console.error('[ERROR] Failed to guess word:', error)
      setError(ERROR_KEYS.ROOM, error.message || '단어 추리에 실패했습니다.')
      setLoading(LOADING_KEYS.ROOM, false)
      throw error
    }
  }, [state.currentRoom, dispatch, setLoading, setError])

  // Complete speech (for auto-actions)
  const completeSpeech = useCallback(async (gameNumber) => {
    try {
      console.log('[DEBUG_LOG] Speech completed successfully')
      await gameApi.completeSpeech(gameNumber)
    } catch (error) {
      console.error('Failed to complete speech:', error)
      throw error
    }
  }, [])

  return {
    startGame,
    castVote,
    submitHint,
    submitDefense,
    castSurvivalVote,
    guessWord,
    completeSpeech,
    loading: state.loading[LOADING_KEYS.ROOM],
    error: state.error[ERROR_KEYS.ROOM]
  }
}