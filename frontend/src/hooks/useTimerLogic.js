import {useCallback} from 'react'
import {ActionTypes} from '../state/gameActions.js'

// Timer Management Business Logic Hook
// This module handles timer logic with state management integration

export const useTimerLogic = (dispatch) => {
  
  const setGameTimer = useCallback((timerValue) => {
    dispatch({ type: ActionTypes.SET_GAME_TIMER, payload: timerValue })
  }, [dispatch])

  const resetGameTimer = useCallback(() => {
    dispatch({ type: ActionTypes.SET_GAME_TIMER, payload: 0 })
  }, [dispatch])

  const updateGameTimer = useCallback((newTime) => {
    if (typeof newTime === 'number' && newTime >= 0) {
      dispatch({ type: ActionTypes.SET_GAME_TIMER, payload: newTime })
    }
  }, [dispatch])

  return {
    setGameTimer,
    resetGameTimer,
    updateGameTimer
  }
}