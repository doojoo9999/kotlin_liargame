// useGameStateManager hook
// Extracts game state management logic from GameRoomPage
// Handles game context integration and derived state calculations

import {useMemo} from 'react'
import {useGame} from '../../../context/GameContext'

export const useGameStateManager = () => {
  const {
    currentRoom,
    currentUser,
    loading,
    error,
    socketConnected,
    roomPlayers,
    currentTurnPlayerId,
    gameStatus,
    gamePhase,
    currentRound,
    playerRole,
    assignedWord,
    gameTimer,
    votingResults,
    accusedPlayerId,
    survivalVotingProgress,
    mySurvivalVote,
    wordGuessResult,
    finalGameResult,
    chatMessages,
    sendChatMessage,
    disconnectSocket,
    connectToRoom,
    leaveRoom,
    navigateToLobby,
    startGame,
    castVote,
    submitHint,
    submitDefense,
    castSurvivalVote,
    guessWord
  } = useGame()

  // Derived state calculations
  const players = useMemo(() =>
    roomPlayers.length > 0 ? roomPlayers : (currentRoom?.players || []),
    [roomPlayers, currentRoom?.players]
  )

  // Game state object for easy access
  const gameState = useMemo(() => ({
    currentRoom,
    currentUser,
    loading,
    error,
    socketConnected,
    players,
    currentTurnPlayerId,
    gameStatus,
    gamePhase,
    currentRound,
    playerRole,
    assignedWord,
    gameTimer,
    votingResults,
    accusedPlayerId,
    survivalVotingProgress,
    mySurvivalVote,
    wordGuessResult,
    finalGameResult,
    chatMessages
  }), [
    currentRoom,
    currentUser,
    loading,
    error,
    socketConnected,
    players,
    currentTurnPlayerId,
    gameStatus,
    gamePhase,
    currentRound,
    playerRole,
    assignedWord,
    gameTimer,
    votingResults,
    accusedPlayerId,
    survivalVotingProgress,
    mySurvivalVote,
    wordGuessResult,
    finalGameResult,
    chatMessages
  ])

  // Game actions object for easy access
  const gameActions = useMemo(() => ({
    sendChatMessage,
    disconnectSocket,
    connectToRoom,
    leaveRoom,
    navigateToLobby,
    startGame,
    castVote,
    submitHint,
    submitDefense,
    castSurvivalVote,
    guessWord
  }), [
    sendChatMessage,
    disconnectSocket,
    connectToRoom,
    leaveRoom,
    navigateToLobby,
    startGame,
    castVote,
    submitHint,
    submitDefense,
    castSurvivalVote,
    guessWord
  ])

  return {
    gameState,
    gameActions
  }
}

export default useGameStateManager