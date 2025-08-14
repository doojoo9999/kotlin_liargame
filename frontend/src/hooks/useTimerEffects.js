import {useEffect, useRef} from 'react'
import {ActionTypes} from '../state/gameActions.js'

// Timer Effects Hook
// This module handles timer-related useEffect logic

export const useTimerEffects = (gameTimer, dispatch) => {
  const timerIntervalRef = useRef(null)
  
  // Effect for managing game timer countdown
  useEffect(() => {
    if (gameTimer > 0) {
      console.log('[DEBUG_LOG] Starting timer countdown from:', gameTimer)
      
      timerIntervalRef.current = setInterval(() => {
        dispatch({ 
          type: ActionTypes.SET_GAME_TIMER, 
          payload: (prevTimer) => Math.max(0, prevTimer - 1) 
        })
      }, 1000)
      
      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current)
          timerIntervalRef.current = null
          console.log('[DEBUG_LOG] Timer countdown cleared')
        }
      }
    } else if (gameTimer === 0 && timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
      console.log('[DEBUG_LOG] Timer reached zero, countdown stopped')
    }
  }, [gameTimer, dispatch])
  
  // Cleanup effect
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
    }
  }, [])
  
  // Effect for timer state changes
  useEffect(() => {
    if (gameTimer === 0) {
      console.log('[DEBUG_LOG] Timer expired')
      // Additional logic for when timer expires can be added here
    }
  }, [gameTimer])

}