// GameDialogs component
// Extracts dialog rendering logic from GameRoomPage
// Handles leave dialog, tutorial dialog, and game result dialog

import React from 'react'
import {Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography} from '@mui/material'
import GameResultScreen from '../../../components/GameResultScreen'
import GameTutorialSystem from '../../../components/GameTutorialSystem'

const GameDialogs = React.memo(function GameDialogs({
  uiState,
  uiActions,
  eventHandlers,
  gameState,
  gameActions
}) {
  const { dialogs } = uiState
  const { dialogs: dialogActions } = uiActions
  const { handleLeaveRoom } = eventHandlers
  const { finalGameResult } = gameState

  return (
    <>
      {/* Leave Room Confirmation Dialog */}
      <Dialog
        open={dialogs.leaveDialogOpen}
        onClose={dialogActions.closeLeaveDialog}
        aria-labelledby="leave-dialog-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="leave-dialog-title">
          게임방 나가기
        </DialogTitle>
        <DialogContent>
          <Typography>
            정말로 게임방을 나가시겠습니까?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            게임 진행 중에 나가면 다른 플레이어들에게 영향을 줄 수 있습니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={dialogActions.closeLeaveDialog}
            color="primary"
          >
            취소
          </Button>
          <Button
            onClick={handleLeaveRoom}
            color="error"
            variant="contained"
          >
            나가기
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tutorial Dialog */}
      <GameTutorialSystem
        open={dialogs.tutorialOpen}
        onClose={dialogActions.closeTutorial}
      />

      {/* Game Result Dialog/Screen */}
      {dialogs.showGameResult && finalGameResult && (
        <GameResultScreen
          result={finalGameResult}
          onClose={dialogActions.hideGameResultScreen}
          onRestart={() => {
            dialogActions.hideGameResultScreen()
            // Restart logic will be handled by parent component
          }}
        />
      )}
    </>
  )
})

GameDialogs.displayName = 'GameDialogs'

export default GameDialogs