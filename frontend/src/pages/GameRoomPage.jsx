import React, {useState} from 'react'
import {
    Alert,
    AppBar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Paper,
    Toolbar,
    Typography
} from '@mui/material'
import {
    ExitToApp as ExitIcon,
    Pause as PauseIcon,
    People as PeopleIcon,
    PlayArrow as PlayIcon
} from '@mui/icons-material'
import {useGame} from '../context/GameContext'
import PlayerProfile from '../components/PlayerProfile'
import PlayerSpeechBubble from '../components/PlayerSpeechBubble'
import ChatWindow from '../components/ChatWindow'
import GameInfoDisplay from '../components/GameInfoDisplay'

/**
 * GameRoomPage component - Game room interface
 * Features:
 * - Display current room information
 * - Show players arranged around the screen
 * - Integrate chat functionality
 * - Leave room functionality
 * - Game controls (start game, etc.)
 */
function GameRoomPage() {
  const {
    currentRoom,
    currentUser,
    loading,
    error,
    leaveRoom,
    navigateToLobby
  } = useGame()

  // Local state
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [speechBubbles, setSpeechBubbles] = useState({})

  // Handle leave room
  const handleLeaveRoom = async () => {
    try {
      if (currentRoom) {
        await leaveRoom(currentRoom.gameNumber)
      }
      setLeaveDialogOpen(false)
      navigateToLobby()
    } catch (error) {
      console.error('Failed to leave room:', error)
      // Navigate to lobby even if API call fails
      navigateToLobby()
    }
  }

  // Calculate player distribution around the screen
  const calculatePlayerDistribution = (playerCount) => {
    if (playerCount <= 3) {
      return { top: 1, right: 1, bottom: 1, left: 0 }
    } else if (playerCount <= 4) {
      return { top: 1, right: 1, bottom: 1, left: 1 }
    } else if (playerCount <= 8) {
      const perSide = Math.floor(playerCount / 4)
      const remainder = playerCount % 4
      return {
        top: perSide + (remainder > 0 ? 1 : 0),
        right: perSide + (remainder > 1 ? 1 : 0),
        bottom: perSide + (remainder > 2 ? 1 : 0),
        left: perSide
      }
    } else {
      const perSide = Math.floor(playerCount / 4)
      const remainder = playerCount % 4
      return {
        top: perSide + (remainder > 0 ? 1 : 0),
        right: perSide + (remainder > 1 ? 1 : 0),
        bottom: perSide + (remainder > 2 ? 1 : 0),
        left: perSide + (remainder > 3 ? 1 : 0)
      }
    }
  }

  // Distribute players to positions
  const distributePlayersToPositions = (players) => {
    if (!players || players.length === 0) return { top: [], right: [], bottom: [], left: [] }

    const distribution = calculatePlayerDistribution(players.length)
    const positions = { top: [], right: [], bottom: [], left: [] }
    
    let index = 0
    
    // Distribute players clockwise: top -> right -> bottom -> left
    for (let i = 0; i < distribution.top; i++) {
      if (index < players.length) positions.top.push(players[index++])
    }
    for (let i = 0; i < distribution.right; i++) {
      if (index < players.length) positions.right.push(players[index++])
    }
    for (let i = 0; i < distribution.bottom; i++) {
      if (index < players.length) positions.bottom.push(players[index++])
    }
    for (let i = 0; i < distribution.left; i++) {
      if (index < players.length) positions.left.push(players[index++])
    }
    
    return positions
  }

  // Get room state color and text
  const getRoomStateInfo = (state) => {
    switch (state) {
      case 'WAITING':
        return { color: 'success', text: '대기 중', icon: <PauseIcon /> }
      case 'IN_PROGRESS':
        return { color: 'warning', text: '진행 중', icon: <PlayIcon /> }
      case 'FINISHED':
        return { color: 'default', text: '종료', icon: <PauseIcon /> }
      default:
        return { color: 'default', text: state, icon: <PauseIcon /> }
    }
  }

  // Show error if no current room
  if (!currentRoom) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          방 정보를 불러올 수 없습니다. 로비로 돌아가세요.
        </Alert>
        <Button variant="contained" onClick={navigateToLobby} sx={{ mt: 2 }}>
          로비로 돌아가기
        </Button>
      </Container>
    )
  }

  const players = currentRoom.players || []
  const playerPositions = distributePlayersToPositions(players)
  const roomStateInfo = getRoomStateInfo(currentRoom.gameState)

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top App Bar */}
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {currentRoom.subject?.name && `[${currentRoom.subject.name}] `}
            게임 방 #{currentRoom.gameNumber}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              icon={roomStateInfo.icon}
              label={roomStateInfo.text}
              color={roomStateInfo.color}
              variant="outlined"
              sx={{ color: 'white', borderColor: 'white' }}
            />
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'white' }}>
              <PeopleIcon />
              <Typography variant="body2">
                {players.length}/{currentRoom.maxPlayers || 8}
              </Typography>
            </Box>
            
            <Button
              color="inherit"
              startIcon={<ExitIcon />}
              onClick={() => setLeaveDialogOpen(true)}
            >
              나가기
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Error Alert */}
      {error.room && (
        <Alert severity="error" sx={{ m: 2 }}>
          {error.room}
        </Alert>
      )}

      {/* Main Game Area */}
      <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Top Players */}
        <Box
          sx={{
            position: 'absolute',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 2,
            zIndex: 1
          }}
        >
          {playerPositions.top.map((player) => (
            <Box key={player.id} sx={{ position: 'relative' }}>
              <PlayerProfile
                player={player}
                isCurrentTurn={currentRoom.currentTurnPlayerId === player.id}
              />
              {speechBubbles[player.id] && (
                <PlayerSpeechBubble
                  message={speechBubbles[player.id]}
                  position="bottom"
                />
              )}
            </Box>
          ))}
        </Box>

        {/* Right Players */}
        <Box
          sx={{
            position: 'absolute',
            right: 20,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            zIndex: 1
          }}
        >
          {playerPositions.right.map((player) => (
            <Box key={player.id} sx={{ position: 'relative' }}>
              <PlayerProfile
                player={player}
                isCurrentTurn={currentRoom.currentTurnPlayerId === player.id}
              />
              {speechBubbles[player.id] && (
                <PlayerSpeechBubble
                  message={speechBubbles[player.id]}
                  position="left"
                />
              )}
            </Box>
          ))}
        </Box>

        {/* Bottom Players */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 2,
            zIndex: 1
          }}
        >
          {playerPositions.bottom.map((player) => (
            <Box key={player.id} sx={{ position: 'relative' }}>
              <PlayerProfile
                player={player}
                isCurrentTurn={currentRoom.currentTurnPlayerId === player.id}
              />
              {speechBubbles[player.id] && (
                <PlayerSpeechBubble
                  message={speechBubbles[player.id]}
                  position="top"
                />
              )}
            </Box>
          ))}
        </Box>

        {/* Left Players */}
        <Box
          sx={{
            position: 'absolute',
            left: 20,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            zIndex: 1
          }}
        >
          {playerPositions.left.map((player) => (
            <Box key={player.id} sx={{ position: 'relative' }}>
              <PlayerProfile
                player={player}
                isCurrentTurn={currentRoom.currentTurnPlayerId === player.id}
              />
              {speechBubbles[player.id] && (
                <PlayerSpeechBubble
                  message={speechBubbles[player.id]}
                  position="right"
                />
              )}
            </Box>
          ))}
        </Box>

        {/* Center Area - Game Info and Chat */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            zIndex: 2
          }}
        >
          {/* Game Info Display */}
          <GameInfoDisplay
            gameState={currentRoom.gameState}
            gamePhase={currentRoom.gamePhase}
            round={currentRoom.round}
            timeRemaining={currentRoom.timeRemaining}
            word={currentRoom.word}
            subject={currentRoom.subject}
          />

          {/* Chat Window */}
          <Paper sx={{ width: 400, height: 300 }}>
            <ChatWindow gameNumber={currentRoom.gameNumber} />
          </Paper>
        </Box>
      </Box>

      {/* Leave Room Confirmation Dialog */}
      <Dialog open={leaveDialogOpen} onClose={() => setLeaveDialogOpen(false)}>
        <DialogTitle>방 나가기</DialogTitle>
        <DialogContent>
          <Typography>
            정말로 방을 나가시겠습니까?
            {currentRoom.gameState === 'IN_PROGRESS' && (
              <Box component="span" sx={{ color: 'warning.main', display: 'block', mt: 1 }}>
                게임이 진행 중입니다. 나가면 게임에서 제외됩니다.
              </Box>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLeaveDialogOpen(false)}>취소</Button>
          <Button
            onClick={handleLeaveRoom}
            color="error"
            variant="contained"
            disabled={loading.room}
          >
            {loading.room ? <CircularProgress size={20} /> : '나가기'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default GameRoomPage