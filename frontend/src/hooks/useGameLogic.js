import {useCallback} from 'react'
import {
    castPlayerSurvivalVote,
    castPlayerVote,
    completeSpeechTurn,
    guessGameWord,
    startGameSession,
    submitPlayerDefense,
    submitPlayerHint
} from '../api/gamePlayAPI.js'
import {ActionTypes} from '../state/gameActions.js'
import gameStompClient from '../socket/gameStompClient'

// Game Play Business Logic Hook  
// This module handles game play logic with state management integration

export const useGameLogic = (state, dispatch, setLoading, setError) => {
  
  const startGame = useCallback(async () => {
    try {
      if (!state.currentRoom) {
        throw new Error('No current room available')
      }

      setLoading('room', true)
      setError('room', null)

      const result = await startGameSession(state.currentRoom.gameNumber)
      
      setLoading('room', false)
      return result
    } catch (error) {
      console.error('[ERROR] Failed to start game:', error)
      setError('room', error.message || '게임 시작에 실패했습니다.')
      setLoading('room', false)
      throw error
    }
  }, [state.currentRoom, setLoading, setError])

  const castVote = useCallback(async (gameNumber, targetPlayerId) => {
    try {
      if (!state.currentRoom) {
        throw new Error('No current room available')
      }

      setLoading('room', true)
      setError('room', null)

      const result = await castPlayerVote(gameNumber, targetPlayerId)

      // Update local state
      dispatch({ type: ActionTypes.SET_MY_VOTE, payload: targetPlayerId })

      // Send WebSocket message for real-time updates
      if (gameStompClient.isClientConnected()) {
        gameStompClient.sendGameAction(gameNumber, 'vote', { targetPlayerId })
      }

      setLoading('room', false)
      return result
    } catch (error) {
      console.error('[ERROR] Failed to cast vote:', error)
      setError('room', error.message || '투표에 실패했습니다.')
      setLoading('room', false)
      throw error
    }
  }, [state.currentRoom, dispatch, setLoading, setError])

  const submitHint = useCallback(async (hint) => {
    try {
      if (!state.currentRoom) {
        throw new Error('No current room available')
      }

      setLoading('room', true)
      setError('room', null)
      
      const result = await submitPlayerHint(state.currentRoom.gameNumber, hint)
      
      // Send WebSocket message for real-time updates
      if (gameStompClient.isClientConnected()) {
        gameStompClient.sendGameAction(state.currentRoom.gameNumber, 'hint', { hint: hint.trim() })
      }

      setLoading('room', false)
      return result
    } catch (error) {
      console.error('[ERROR] Failed to submit hint:', error)
      setError('room', error.message || '힌트 제출에 실패했습니다.')
      setLoading('room', false)
      throw error
    }
  }, [state.currentRoom, setLoading, setError])

  const submitDefense = useCallback(async (defenseText) => {
    try {
      if (!state.currentRoom) {
        throw new Error('No current room available')
      }

      setLoading('room', true)
      setError('room', null)
      
      const result = await submitPlayerDefense(state.currentRoom.gameNumber, defenseText)
      
      // Update local state with defense text
      dispatch({ type: ActionTypes.SET_DEFENSE_TEXT, payload: defenseText.trim() })
      
      // Send WebSocket message for real-time updates
      if (gameStompClient.isClientConnected()) {
        gameStompClient.sendGameAction(state.currentRoom.gameNumber, 'defense', { 
          defenseText: defenseText.trim(),
          accusedPlayerId: state.accusedPlayerId 
        })
      }

      setLoading('room', false)
      return result
    } catch (error) {
      console.error('[ERROR] Failed to submit defense:', error)
      setError('room', error.message || '변론 제출에 실패했습니다.')
      setLoading('room', false)
      throw error
    }
  }, [state.currentRoom, state.accusedPlayerId, dispatch, setLoading, setError])

  const castSurvivalVote = useCallback(async (survival) => {
    try {
      if (!state.currentRoom) {
        throw new Error('No current room available')
      }

      setLoading('room', true)
      setError('room', null)
      
      const result = await castPlayerSurvivalVote(state.currentRoom.gameNumber, survival)
      
      // Update local state with survival vote
      dispatch({ type: ActionTypes.SET_MY_SURVIVAL_VOTE, payload: survival })
      
      // Send WebSocket message for real-time updates
      if (gameStompClient.isClientConnected()) {
        gameStompClient.sendGameAction(state.currentRoom.gameNumber, 'survival-vote', { 
          survival: survival,
          accusedPlayerId: state.accusedPlayerId 
        })
      }

      setLoading('room', false)
      return result
    } catch (error) {
      console.error('[ERROR] Failed to cast survival vote:', error)
      setError('room', error.message || '생존 투표에 실패했습니다.')
      setLoading('room', false)
      throw error
    }
  }, [state.currentRoom, state.accusedPlayerId, dispatch, setLoading, setError])

  const guessWord = useCallback(async (guessedWord) => {
    try {
      if (!state.currentRoom) {
        throw new Error('No current room available')
      }

      setLoading('room', true)
      setError('room', null)
      
      const result = await guessGameWord(state.currentRoom.gameNumber, guessedWord)
      
      // Send WebSocket message for real-time updates
      if (gameStompClient.isClientConnected()) {
        gameStompClient.sendGameAction(state.currentRoom.gameNumber, 'word-guess', { 
          guessedWord: guessedWord.trim()
        })
      }

      setLoading('room', false)
      return result
    } catch (error) {
      console.error('[ERROR] Failed to guess word:', error)
      setError('room', error.message || '단어 추측에 실패했습니다.')
      setLoading('room', false)
      throw error
    }
  }, [state.currentRoom, setLoading, setError])

  const completeSpeech = useCallback(async () => {
    try {
      if (!state.currentRoom) {
        throw new Error('No current room available')
      }

      setLoading('room', true)
      setError('room', null)
      
      const result = await completeSpeechTurn(state.currentRoom.gameNumber)
      
      // Send WebSocket message for real-time updates
      if (gameStompClient.isClientConnected()) {
        gameStompClient.sendGameAction(state.currentRoom.gameNumber, 'speech-complete', {})
      }

      setLoading('room', false)
      return result
    } catch (error) {
      console.error('[ERROR] Failed to complete speech:', error)
      setError('room', error.message || '발언 완료에 실패했습니다.')
      setLoading('room', false)
      throw error
    }
  }, [state.currentRoom, setLoading, setError])

  return {
    startGame,
    castVote,
    submitHint,
    submitDefense,
    castSurvivalVote,
    guessWord,
    completeSpeech
  }
}