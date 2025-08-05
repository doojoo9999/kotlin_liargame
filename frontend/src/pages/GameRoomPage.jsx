import React, {useEffect, useState} from 'react'
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

function GameRoomPage() {
  const {
    currentRoom,
    currentUser,
    loading,
    error,
    socketConnected,
    roomPlayers,
    currentTurnPlayerId,
    gameStatus,
    currentRound,
    playerRole,
    assignedWord,
    gameTimer,
    votingResults,
    gameResults,
    // ... 기타 상태들
    disconnectSocket,
    connectToRoom,
    leaveRoom,
    navigateToLobby,
    startGame,
    castVote
  } = useGame()

  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [speechBubbles, setSpeechBubbles] = useState({})
  const [selectedVoteTarget, setSelectedVoteTarget] = useState(null)

    useEffect(() => {
        if (!currentRoom) {
            console.log('[DEBUG_LOG] No currentRoom available')
            return
        }

        const gameNumber = currentRoom.gameNumber
        console.log('[DEBUG_LOG] Connecting to room:', gameNumber)

        if (gameNumber) {
            const init = async () => {
                try {
                    await connectToRoom(gameNumber)
                } catch (error) {
                    console.error('[DEBUG_LOG] Failed to initialize room:', error)
                }
            }

            init()
        } else {
            console.error('[DEBUG_LOG] gameNumber is undefined:', currentRoom)
        }

        return () => {
            console.log('[DEBUG_LOG] GameRoomPage unmounting, disconnecting WebSocket')
            try {
                disconnectSocket()
            } catch (error) {
                console.error('[DEBUG_LOG] Failed to disconnect WebSocket on unmount:', error)
            }
        }
    }, [currentRoom?.gameNumber])


  // Handle connection status changes
  useEffect(() => {
    if (socketConnected) {
      console.log('[DEBUG_LOG] WebSocket connected in GameRoomPage')
    } else {
      console.log('[DEBUG_LOG] WebSocket disconnected in GameRoomPage')
    }
  }, [socketConnected])

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

  // Handle start game
  const handleStartGame = () => {
    console.log('[DEBUG_LOG] Host starting game')
    startGame()
  }

  // Check if current user is host
  const isHost = () => {
    if (!currentUser || !players.length) return false
    const currentPlayer = players.find(p => p.nickname === currentUser.nickname)
    return currentPlayer?.isHost || false
  }

  // Handle voting
  const handleVoteSelect = (playerId) => {
    if (gameStatus !== 'VOTING') return
    setSelectedVoteTarget(playerId)
  }

  const handleVoteConfirm = () => {
    if (!selectedVoteTarget) return
    console.log('[DEBUG_LOG] Casting vote for player:', selectedVoteTarget)
    castVote(selectedVoteTarget)
    setSelectedVoteTarget(null)
  }

  const handleVoteCancel = () => {
    setSelectedVoteTarget(null)
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

  // Use real-time player data from WebSocket, fallback to currentRoom.players
  const players = roomPlayers.length > 0 ? roomPlayers : (currentRoom.players || [])
  const playerPositions = distributePlayersToPositions(players)
  const roomStateInfo = getRoomStateInfo(currentRoom.gameState)
  
  // Use real-time current turn player ID from WebSocket
  const effectiveCurrentTurnPlayerId = currentTurnPlayerId || currentRoom.currentTurnPlayerId

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top App Bar */}
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {currentRoom.title || '제목 없음'} #{currentRoom.gameNumber}
            {currentRoom.subject?.name && ` - [${currentRoom.subject.name}]`}
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
                {players.length}/{currentRoom.maxPlayers || parseInt(localStorage.getItem('lastCreatedRoomMaxPlayers')) || 8}
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
              <Box
                onClick={() => gameStatus === 'VOTING' && handleVoteSelect(player.id)}
                sx={{
                  cursor: gameStatus === 'VOTING' ? 'pointer' : 'default',
                  border: gameStatus === 'VOTING' && selectedVoteTarget === player.id ? '3px solid #ff9800' : 'none',
                  borderRadius: 2,
                  p: gameStatus === 'VOTING' ? 0.5 : 0,
                  backgroundColor: gameStatus === 'VOTING' && selectedVoteTarget === player.id ? 'rgba(255, 152, 0, 0.1)' : 'transparent'
                }}
              >
                <PlayerProfile
                  player={player}
                  isCurrentTurn={effectiveCurrentTurnPlayerId === player.id}
                />
              </Box>
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
              <Box
                onClick={() => gameStatus === 'VOTING' && handleVoteSelect(player.id)}
                sx={{
                  cursor: gameStatus === 'VOTING' ? 'pointer' : 'default',
                  border: gameStatus === 'VOTING' && selectedVoteTarget === player.id ? '3px solid #ff9800' : 'none',
                  borderRadius: 2,
                  p: gameStatus === 'VOTING' ? 0.5 : 0,
                  backgroundColor: gameStatus === 'VOTING' && selectedVoteTarget === player.id ? 'rgba(255, 152, 0, 0.1)' : 'transparent'
                }}
              >
                <PlayerProfile
                  player={player}
                  isCurrentTurn={effectiveCurrentTurnPlayerId === player.id}
                />
              </Box>
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
              <Box
                onClick={() => gameStatus === 'VOTING' && handleVoteSelect(player.id)}
                sx={{
                  cursor: gameStatus === 'VOTING' ? 'pointer' : 'default',
                  border: gameStatus === 'VOTING' && selectedVoteTarget === player.id ? '3px solid #ff9800' : 'none',
                  borderRadius: 2,
                  p: gameStatus === 'VOTING' ? 0.5 : 0,
                  backgroundColor: gameStatus === 'VOTING' && selectedVoteTarget === player.id ? 'rgba(255, 152, 0, 0.1)' : 'transparent'
                }}
              >
                <PlayerProfile
                  player={player}
                  isCurrentTurn={effectiveCurrentTurnPlayerId === player.id}
                />
              </Box>
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
              <Box
                onClick={() => gameStatus === 'VOTING' && handleVoteSelect(player.id)}
                sx={{
                  cursor: gameStatus === 'VOTING' ? 'pointer' : 'default',
                  border: gameStatus === 'VOTING' && selectedVoteTarget === player.id ? '3px solid #ff9800' : 'none',
                  borderRadius: 2,
                  p: gameStatus === 'VOTING' ? 0.5 : 0,
                  backgroundColor: gameStatus === 'VOTING' && selectedVoteTarget === player.id ? 'rgba(255, 152, 0, 0.1)' : 'transparent'
                }}
              >
                <PlayerProfile
                  player={player}
                  isCurrentTurn={effectiveCurrentTurnPlayerId === player.id}
                />
              </Box>
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
            gameState={currentRoom?.gameState}
            gamePhase={currentRoom?.gamePhase}
            round={currentRound}
            timeRemaining={gameTimer}
            word={assignedWord}
            subject={currentRoom?.subject}
            gameInfo={{
              round: currentRound || 1,
              topic: currentRoom?.subject?.name || currentRoom?.subject?.content || '주제 없음',
              status: gameStatus === 'WAITING' ? '대기 중' : 
                      gameStatus === 'SPEAKING' ? '발언 단계' :
                      gameStatus === 'VOTING' ? '투표 단계' :
                      gameStatus === 'RESULTS' ? '결과 발표' :
                      gameStatus === 'FINISHED' ? '게임 종료' : '게임 진행 중'
            }}/>

          {/* Game Start Button - Only visible for host when game is waiting */}
          {gameStatus === 'WAITING' && isHost() && (
            <Button
              variant="contained"
              size="large"
              startIcon={<PlayIcon />}
              onClick={handleStartGame}
              sx={{
                mb: 2,
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                backgroundColor: 'success.main',
                '&:hover': {
                  backgroundColor: 'success.dark'
                }
              }}
            >
              게임 시작
            </Button>
          )}

          {/* Player Role and Word Display - Only visible during game */}
          {gameStatus !== 'WAITING' && (playerRole || assignedWord) && (
            <Paper 
              sx={{ 
                p: 2, 
                mb: 2, 
                backgroundColor: playerRole === 'LIAR' ? 'error.light' : 'primary.light',
                color: 'white',
                textAlign: 'center',
                minWidth: 300
              }}
            >
              <Typography variant="h6" gutterBottom>
                {playerRole === 'LIAR' ? '🎭 라이어' : '👥 시민'}
              </Typography>
              <Typography variant="body1">
                키워드: <strong>{assignedWord || '???'}</strong>
              </Typography>
              {currentRound > 0 && (
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                  라운드 {currentRound} | 남은 시간: {gameTimer}초
                </Typography>
              )}
            </Paper>
          )}

          {/* Game Status Display */}
          {gameStatus !== 'WAITING' && (
            <Paper sx={{ p: 2, mb: 2, textAlign: 'center', minWidth: 300 }}>
              <Typography variant="h6" gutterBottom>
                {gameStatus === 'SPEAKING' && '🎤 발언 단계'}
                {gameStatus === 'VOTING' && '🗳️ 투표 단계'}
                {gameStatus === 'RESULTS' && '📊 결과 발표'}
                {gameStatus === 'FINISHED' && '🏁 게임 종료'}
              </Typography>
              {gameTimer > 0 && (
                <Typography variant="h4" color="primary">
                  {gameTimer}초
                </Typography>
              )}
              {gameStatus === 'SPEAKING' && currentTurnPlayerId && (
                <Typography variant="body1" sx={{ mt: 1 }}>
                  {players.find(p => p.id === currentTurnPlayerId)?.nickname || 'Unknown'}님의 차례
                </Typography>
              )}
              {gameStatus === 'VOTING' && !selectedVoteTarget && (
                <Typography variant="body1" sx={{ mt: 1 }}>
                  라이어라고 생각하는 플레이어를 선택하세요
                </Typography>
              )}
              {gameStatus === 'VOTING' && selectedVoteTarget && (
                <Typography variant="body1" sx={{ mt: 1 }}>
                  {players.find(p => p.id === selectedVoteTarget)?.nickname}님을 선택했습니다
                </Typography>
              )}
            </Paper>
          )}

          {/* Voting Confirmation Buttons */}
          {gameStatus === 'VOTING' && selectedVoteTarget && (
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Button
                variant="contained"
                color="error"
                onClick={handleVoteConfirm}
                sx={{ px: 3 }}
              >
                투표 확정
              </Button>
              <Button
                variant="outlined"
                onClick={handleVoteCancel}
                sx={{ px: 3 }}
              >
                취소
              </Button>
            </Box>
          )}

          {/* Chat Window */}
          <Paper sx={{ width: 400, height: 300 }}>
            <ChatWindow />
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