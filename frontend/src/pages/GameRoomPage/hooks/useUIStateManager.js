// useUIStateManager hook
// Extracts UI state management logic from GameRoomPage
// Handles dialog states, speech bubbles, tutorial state, and other UI-related state

import {useCallback, useState} from 'react'

export const useUIStateManager = () => {
  // Dialog states
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [tutorialOpen, setTutorialOpen] = useState(false)
  const [showGameResult, setShowGameResult] = useState(false)
  
  // Other UI state
  const [speechBubbles, setSpeechBubbles] = useState({})
  const [newMessageCount, setNewMessageCount] = useState(0)

  // Dialog handlers
  const openLeaveDialog = useCallback(() => {
    setLeaveDialogOpen(true)
  }, [])

  const closeLeaveDialog = useCallback(() => {
    setLeaveDialogOpen(false)
  }, [])

  const openTutorial = useCallback(() => {
    setTutorialOpen(true)
  }, [])

  const closeTutorial = useCallback(() => {
    setTutorialOpen(false)
  }, [])

  const showGameResultScreen = useCallback(() => {
    setShowGameResult(true)
  }, [])

  const hideGameResultScreen = useCallback(() => {
    setShowGameResult(false)
  }, [])

  // Speech bubble handlers
  const updateSpeechBubbles = useCallback((bubbles) => {
    setSpeechBubbles(bubbles)
  }, [])

  const clearSpeechBubbles = useCallback(() => {
    setSpeechBubbles({})
  }, [])

  // Message count handlers
  const incrementMessageCount = useCallback(() => {
    setNewMessageCount(prev => prev + 1)
  }, [])

  const resetMessageCount = useCallback(() => {
    setNewMessageCount(0)
  }, [])

  // UI state object
  const uiState = {
    dialogs: {
      leaveDialogOpen,
      tutorialOpen,
      showGameResult
    },
    speechBubbles,
    newMessageCount
  }

  // UI action handlers
  const uiActions = {
    dialogs: {
      openLeaveDialog,
      closeLeaveDialog,
      openTutorial,
      closeTutorial,
      showGameResultScreen,
      hideGameResultScreen
    },
    speechBubbles: {
      updateSpeechBubbles,
      clearSpeechBubbles
    },
    messages: {
      incrementMessageCount,
      resetMessageCount
    }
  }

  return {
    uiState,
    uiActions
  }
}

export default useUIStateManager