// useRoomEventHandlers hook
// Extracts event handling logic from GameRoomPage
// Handles chat, room actions, player actions, and game events

import {useCallback} from 'react'
import {useToast} from '../../../components/EnhancedToastSystem'

export const useRoomEventHandlers = ({ gameState, gameActions, uiActions }) => {
  const { addToast } = useToast()
  
  // Extract needed values from gameState
  const { currentRoom, socketConnected, currentUser, players, gameStatus } = gameState
  const { sendChatMessage, leaveRoom, navigateToLobby, startGame } = gameActions

  // Chat event handlers
  const handleSendChatMessage = useCallback((content) => {
    if (!currentRoom?.gameNumber) {
      addToast('채팅을 보낼 수 없습니다. 방 정보를 확인해주세요.', 'error')
      return
    }

    if (!socketConnected) {
      addToast('서버 연결이 끊어졌습니다. 재연결을 기다려주세요.', 'warning')
      return
    }

    try {
      sendChatMessage(currentRoom.gameNumber, content)
    } catch (error) {
      console.error('[ERROR] Failed to send chat message:', error)
      addToast('메시지 전송에 실패했습니다.', 'error')
    }
  }, [currentRoom?.gameNumber, socketConnected, addToast, sendChatMessage])

  // Room management handlers
  const handleLeaveRoom = useCallback(async () => {
    try {
      if (currentRoom) {
        await leaveRoom(currentRoom.gameNumber)
      }
      uiActions.dialogs.closeLeaveDialog()
      navigateToLobby()
    } catch (error) {
      console.error('Failed to leave room:', error)
      navigateToLobby()
    }
  }, [currentRoom, leaveRoom, navigateToLobby, uiActions.dialogs])

  const handleStartGame = useCallback(() => {
    console.log('[DEBUG_LOG] Host starting game')
    startGame()
  }, [startGame])

  // Player interaction handlers
  const handleAddFriend = useCallback((player) => {
    if (!currentUser) {
      addToast('로그인이 필요합니다.', 'info')
      return
    }
    if (player?.nickname && player.nickname === currentUser?.nickname) {
      addToast('본인은 친구로 추가할 수 없습니다.', 'warning')
      return
    }
    addToast(`${player?.nickname || '플레이어'}님을 친구로 추가했어요. (준비 중)`, 'success')
  }, [currentUser, addToast])

  const handleReportPlayer = useCallback((player) => {
    if (!player) return
    addToast(`${player.nickname}님을 신고했습니다. (검토 예정)`, 'info')
  }, [addToast])

  // Game event handlers
  const handleTimerExpired = useCallback(() => {
    console.log('[DEBUG_LOG] Timer expired in GameRoomPage, current status:', gameStatus)
  }, [gameStatus])

  const handleRestartGameWithClear = useCallback(() => {
    uiActions.speechBubbles.clearSpeechBubbles()
    // handleRestartGame will be passed from submission flows
  }, [uiActions.speechBubbles])

  // Utility functions
  const isHost = useCallback(() => {
    if (!currentUser || !players.length) return false
    const currentPlayer = players.find(p => p.nickname === currentUser.nickname)
    return currentPlayer && players.indexOf(currentPlayer) === 0
  }, [currentUser, players])

  // Dialog handlers (integrated with UI actions)
  const handleOpenTutorial = useCallback(() => {
    uiActions.dialogs.openTutorial()
  }, [uiActions.dialogs])

  const handleOpenLeaveDialog = useCallback(() => {
    uiActions.dialogs.openLeaveDialog()
  }, [uiActions.dialogs])

  return {
    // Chat handlers
    handleSendChatMessage,
    
    // Room management handlers
    handleLeaveRoom,
    handleStartGame,
    
    // Player interaction handlers
    handleAddFriend,
    handleReportPlayer,
    
    // Game event handlers
    handleTimerExpired,
    handleRestartGameWithClear,
    
    // Dialog handlers
    handleOpenTutorial,
    handleOpenLeaveDialog,
    
    // Utility functions
    isHost
  }
}

export default useRoomEventHandlers