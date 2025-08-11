import React from 'react'
import {Box, Divider, Typography, useTheme} from '@mui/material'
import GameStatusCard from './GameStatusCard'
import ActionGuide from './ActionGuide'
import SystemNotifications from './SystemNotifications'

const LeftInfoPanel = ({
  gameStatus = 'WAITING',
  currentRound = 1,
  gameTimer = 0,
  currentUser,
  currentTurnPlayerId,
  players = [],
  isCurrentTurn = false,
  playerRole,
  assignedWord,
  accusedPlayerId,
  systemMessages = [],
  gamePhase,
  subject,
  votingResults,
  hintSubmitted = false,
  defenseSubmitted = false,
  survivalVoteSubmitted = false,
  wordGuessSubmitted = false,
  onDismissNotification,
  maxHeight
}) => {
  const theme = useTheme()

  // Calculate panel sections based on available space and content priority
  const getSectionHeights = () => {
    switch (gameStatus) {
      case 'WAITING':
        return {
          gameStatus: '30%',
          actionGuide: '40%',
          notifications: '30%'
        }
      case 'HINT_PHASE':
      case 'SPEAKING':
        return {
          gameStatus: '25%',
          actionGuide: '50%',
          notifications: '25%'
        }
      case 'VOTING':
      case 'DEFENSE':
      case 'SURVIVAL_VOTING':
        return {
          gameStatus: '35%',
          actionGuide: '40%',
          notifications: '25%'
        }
      case 'WORD_GUESS':
        return {
          gameStatus: '30%',
          actionGuide: '45%',
          notifications: '25%'
        }
      case 'RESULTS':
      case 'FINISHED':
        return {
          gameStatus: '25%',
          actionGuide: '30%',
          notifications: '45%'
        }
      default:
        return {
          gameStatus: '30%',
          actionGuide: '40%',
          notifications: '30%'
        }
    }
  }

  const sectionHeights = getSectionHeights()

  return (
    <Box
      sx={{
        height: maxHeight || '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.palette.background.paper,
        borderRight: 1,
        borderColor: 'divider',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText
        }}
      >
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
          게임 정보
        </Typography>
      </Box>

      {/* Game Status Card Section */}
      <Box
        sx={{
          height: sectionHeights.gameStatus,
          overflow: 'auto',
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <GameStatusCard
          gameStatus={gameStatus}
          currentRound={currentRound}
          gameTimer={gameTimer}
          playerRole={playerRole}
          assignedWord={assignedWord}
          subject={subject}
          gamePhase={gamePhase}
          players={players}
          currentTurnPlayerId={currentTurnPlayerId}
          accusedPlayerId={accusedPlayerId}
          votingResults={votingResults}
        />
      </Box>

      <Divider />

      {/* Action Guide Section */}
      <Box
        sx={{
          height: sectionHeights.actionGuide,
          overflow: 'auto',
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <ActionGuide
          gameStatus={gameStatus}
          isCurrentTurn={isCurrentTurn}
          currentUser={currentUser}
          currentTurnPlayerId={currentTurnPlayerId}
          players={players}
          playerRole={playerRole}
          gameTimer={gameTimer}
          hintSubmitted={hintSubmitted}
          defenseSubmitted={defenseSubmitted}
          survivalVoteSubmitted={survivalVoteSubmitted}
          wordGuessSubmitted={wordGuessSubmitted}
          accusedPlayerId={accusedPlayerId}
        />
      </Box>

      <Divider />

      {/* System Notifications Section */}
      <Box
        sx={{
          height: sectionHeights.notifications,
          overflow: 'auto',
          flex: 1,
          minHeight: 0
        }}
      >
        <SystemNotifications
          messages={systemMessages}
          gameStatus={gameStatus}
          onDismissNotification={onDismissNotification}
          maxMessages={20}
        />
      </Box>
    </Box>
  )
}

export default LeftInfoPanel