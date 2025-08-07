import React, {useEffect, useState} from 'react'
import {
    Alert,
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
    Typography,
    useMediaQuery,
    useTheme
} from '@mui/material'
import {
    ExitToApp as ExitIcon,
    Help as HelpIcon,
    Pause as PauseIcon,
    People as PeopleIcon,
    PlayArrow as PlayIcon
} from '@mui/icons-material'
import {useGame} from '../context/GameContext'
import {useToast} from '../components/EnhancedToastSystem'
import PlayerProfile from '../components/PlayerProfile'
import PlayerSpeechBubble from '../components/PlayerSpeechBubble'
import EnhancedChatSystem from '../components/EnhancedChatSystem'
import GameInfoDisplay from '../components/GameInfoDisplay'
import HintInputComponent from '../components/HintInputComponent'
import VotingComponent from '../components/VotingComponent'
import DefenseComponent from '../components/DefenseComponent'
import SurvivalVotingComponent from '../components/SurvivalVotingComponent'
import WordGuessComponent from '../components/WordGuessComponent'
import GameTimerComponent from '../components/GameTimerComponent'
import ResponsiveGameLayout from '../components/ResponsiveGameLayout'
import GameResultScreen from '../components/GameResultScreen'
import GameTutorialSystem, {ActionGuidance} from '../components/GameTutorialSystem'

function GameRoomPage() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { addToast, showSystemMessage } = useToast()
  
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
    accusedPlayerId,
    defenseText,
    survivalVotingProgress,
    mySurvivalVote,
    wordGuessResult,
    finalGameResult,
    chatMessages,
    sendChatMessage,
    // ... 기타 상태들
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

  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [speechBubbles, setSpeechBubbles] = useState({})
  const [hintSubmitted, setHintSubmitted] = useState(false)
  const [hintError, setHintError] = useState(null)
  const [defenseSubmitted, setDefenseSubmitted] = useState(false)
  const [defenseError, setDefenseError] = useState(null)
  const [survivalVoteSubmitted, setSurvivalVoteSubmitted] = useState(false)
  const [survivalVoteError, setSurvivalVoteError] = useState(null)
  const [wordGuessSubmitted, setWordGuessSubmitted] = useState(false)
  const [wordGuessError, setWordGuessError] = useState(null)
  const [tutorialOpen, setTutorialOpen] = useState(false)
  const [showGameResult, setShowGameResult] = useState(false)
  const [newMessageCount, setNewMessageCount] = useState(0)

  // Enhanced chat message handler
  const handleSendChatMessage = (content) => {
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
  }

  // Timer expiration callback
  const handleTimerExpired = () => {
    console.log('[DEBUG_LOG] Timer expired in GameRoomPage, current status:', gameStatus)
    // The auto-actions are handled in GameContext, but we can add UI feedback here
  }

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


  // Handle hint submission
  const handleHintSubmit = async (hint) => {
    try {
      setHintError(null)
      console.log('[DEBUG_LOG] Submitting hint:', hint)
      await submitHint(hint)
      setHintSubmitted(true)
      console.log('[DEBUG_LOG] Hint submitted successfully')
    } catch (error) {
      console.error('[ERROR] Failed to submit hint:', error)
      setHintError(error.message || '힌트 제출에 실패했습니다.')
    }
  }

  // Handle defense submission
  const handleDefenseSubmit = async (defenseText) => {
    try {
      setDefenseError(null)
      console.log('[DEBUG_LOG] Submitting defense:', defenseText)
      await submitDefense(defenseText)
      setDefenseSubmitted(true)
      console.log('[DEBUG_LOG] Defense submitted successfully')
    } catch (error) {
      console.error('[ERROR] Failed to submit defense:', error)
      setDefenseError(error.message || '변론 제출에 실패했습니다.')
    }
  }

  // Handle survival vote submission
  const handleSurvivalVoteSubmit = async (survival) => {
    try {
      setSurvivalVoteError(null)
      console.log('[DEBUG_LOG] Casting survival vote:', survival)
      await castSurvivalVote(survival)
      setSurvivalVoteSubmitted(true)
      console.log('[DEBUG_LOG] Survival vote cast successfully')
    } catch (error) {
      console.error('[ERROR] Failed to cast survival vote:', error)
      setSurvivalVoteError(error.message || '생존 투표에 실패했습니다.')
    }
  }

  // Handle word guess submission
  const handleWordGuessSubmit = async (guessedWord) => {
    try {
      setWordGuessError(null)
      console.log('[DEBUG_LOG] Submitting word guess:', guessedWord)
      await guessWord(guessedWord)
      setWordGuessSubmitted(true)
      console.log('[DEBUG_LOG] Word guess submitted successfully')
    } catch (error) {
      console.error('[ERROR] Failed to submit word guess:', error)
      setWordGuessError(error.message || '단어 추리에 실패했습니다.')
    }
  }

  // Handle restart game
  const handleRestartGame = () => {
    console.log('[DEBUG_LOG] Restarting game')
    // Reset all local states
    setHintSubmitted(false)
    setHintError(null)
    setDefenseSubmitted(false)
    setDefenseError(null)
    setSurvivalVoteSubmitted(false)
    setSurvivalVoteError(null)
    setWordGuessSubmitted(false)
    setWordGuessError(null)
    setSpeechBubbles({})
    
    // Start a new game
    startGame()
  }

  // Reset hint submission state when game status changes
  useEffect(() => {
    if (gameStatus !== 'SPEAKING' && gameStatus !== 'HINT_PHASE') {
      setHintSubmitted(false)
      setHintError(null)
    }
  }, [gameStatus])

  // Reset defense submission state when game status changes
  useEffect(() => {
    if (gameStatus !== 'DEFENSE') {
      setDefenseSubmitted(false)
      setDefenseError(null)
    }
  }, [gameStatus])

  // Reset survival vote submission state when game status changes
  useEffect(() => {
    if (gameStatus !== 'SURVIVAL_VOTING') {
      setSurvivalVoteSubmitted(false)
      setSurvivalVoteError(null)
    }
  }, [gameStatus])

  // Reset word guess submission state when game status changes
  useEffect(() => {
    if (gameStatus !== 'WORD_GUESS') {
      setWordGuessSubmitted(false)
      setWordGuessError(null)
    }
  }, [gameStatus])

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

  // Prepare components for ResponsiveGameLayout
  const gameInfoComponent = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
      <Typography variant="h6" component="div" sx={{ flexGrow: 1, minWidth: 200 }}>
        {currentRoom.title || `${currentRoom.gameName || '제목 없음'} #${currentRoom.gameNumber}`}
        {currentRoom.subjects && currentRoom.subjects.length > 0 && ` - [${currentRoom.subjects.join(', ')}]`}
        {!currentRoom.subjects && currentRoom.subject && ` - [${currentRoom.subject?.name || currentRoom.subject?.content || '주제 없음'}]`}
      </Typography>
      
      <Chip
        icon={roomStateInfo.icon}
        label={roomStateInfo.text}
        color={roomStateInfo.color}
        variant="outlined"
        size={isMobile ? 'small' : 'medium'}
      />
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <PeopleIcon />
        <Typography variant="body2">
          {players.length}/{currentRoom.maxPlayers || currentRoom.gameParticipants || 8}
        </Typography>
      </Box>
      
      <Button
        variant="outlined"
        startIcon={<HelpIcon />}
        onClick={() => setTutorialOpen(true)}
        size={isMobile ? 'small' : 'medium'}
      >
        도움말
      </Button>
      
      <Button
        color="error"
        variant="outlined"
        startIcon={<ExitIcon />}
        onClick={() => setLeaveDialogOpen(true)}
        size={isMobile ? 'small' : 'medium'}
      >
        나가기
      </Button>
    </Box>
  )

  const chatComponent = (
    <EnhancedChatSystem
      messages={chatMessages || []}
      currentUser={currentUser}
      onSendMessage={handleSendChatMessage}
      disabled={!socketConnected}
    />
  )

  const playersComponent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {players.map((player) => (
        <PlayerProfile
          key={player.id}
          player={player}
          isCurrentTurn={effectiveCurrentTurnPlayerId === player.id}
          compact={isMobile}
        />
      ))}
    </Box>
  )

  const centerComponent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: '100%' }}>
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
          topic: currentRoom?.subjects && currentRoom.subjects.length > 0 
            ? currentRoom.subjects.join(', ') 
            : currentRoom?.subject?.name || currentRoom?.subject?.content || '주제 없음',
          status: gameStatus === 'WAITING' ? '대기 중' : 
                  gameStatus === 'SPEAKING' ? '발언 단계' :
                  gameStatus === 'VOTING' ? '투표 단계' :
                  gameStatus === 'RESULTS' ? '결과 발표' :
                  gameStatus === 'FINISHED' ? '게임 종료' : '게임 진행 중'
        }}
      />

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
            minWidth: isMobile ? 280 : 300,
            width: '100%',
            maxWidth: 400
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
              라운드 {currentRound}
            </Typography>
          )}
        </Paper>
      )}

      {/* Game Timer Component */}
      {gameStatus !== 'WAITING' && gameTimer > 0 && (
        <GameTimerComponent
          gameTimer={gameTimer}
          maxTime={60}
          gameStatus={gameStatus}
          onTimeExpired={handleTimerExpired}
          showCountdown={true}
          size={isMobile ? 100 : 140}
        />
      )}

      {/* Voting Component - Only visible during VOTING phase */}
      {gameStatus === 'VOTING' && (
        <Box sx={{ mb: 2, width: '100%' }}>
          <VotingComponent
            players={players}
            gameTimer={gameTimer}
            gameNumber={currentRoom?.gameNumber}
            onVoteComplete={(targetPlayerId) => {
              console.log('[DEBUG_LOG] Vote completed for player:', targetPlayerId)
            }}
          />
        </Box>
      )}

      {/* Defense Component - Only visible during DEFENSE phase */}
      {gameStatus === 'DEFENSE' && (
        <Box sx={{ mb: 2, width: '100%' }}>
          <DefenseComponent
            gameTimer={gameTimer}
            onSubmitDefense={handleDefenseSubmit}
            isSubmitted={defenseSubmitted}
            isLoading={loading.room}
            error={defenseError}
            accusedPlayerId={accusedPlayerId}
            currentUserId={currentUser?.id}
            accusedPlayerName={players.find(p => p.id === accusedPlayerId)?.nickname}
          />
        </Box>
      )}

      {/* Survival Voting Component - Only visible during SURVIVAL_VOTING phase */}
      {gameStatus === 'SURVIVAL_VOTING' && (
        <Box sx={{ mb: 2, width: '100%' }}>
          <SurvivalVotingComponent
            gameTimer={gameTimer}
            onCastSurvivalVote={handleSurvivalVoteSubmit}
            isVoted={survivalVoteSubmitted || mySurvivalVote !== null}
            isLoading={loading.room}
            error={survivalVoteError}
            accusedPlayer={players.find(p => p.id === accusedPlayerId)}
            votingProgress={survivalVotingProgress}
            players={players}
          />
        </Box>
      )}

      {/* Word Guess Component - Only visible during WORD_GUESS phase */}
      {gameStatus === 'WORD_GUESS' && (
        <Box sx={{ mb: 2, width: '100%' }}>
          <WordGuessComponent
            gameTimer={gameTimer}
            onGuessWord={handleWordGuessSubmit}
            onRestartGame={handleRestartGame}
            isSubmitted={wordGuessSubmitted}
            isLoading={loading.room}
            error={wordGuessError}
            playerRole={playerRole}
            guessResult={wordGuessResult}
            gameResult={finalGameResult}
          />
        </Box>
      )}

      {/* Hint Input - Only visible during SPEAKING or HINT_PHASE */}
      {(gameStatus === 'SPEAKING' || gameStatus === 'HINT_PHASE') && (
        <Box sx={{ mb: 2, width: '100%' }}>
          <HintInputComponent
            gameTimer={gameTimer}
            onSubmitHint={handleHintSubmit}
            isSubmitted={hintSubmitted}
            isLoading={loading.room}
            error={hintError}
          />
        </Box>
      )}
    </Box>
  )

  // Players positioned around the screen for desktop/tablet
  const playersAroundScreen = (
    <>
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
              isCurrentTurn={effectiveCurrentTurnPlayerId === player.id}
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
              isCurrentTurn={effectiveCurrentTurnPlayerId === player.id}
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
              isCurrentTurn={effectiveCurrentTurnPlayerId === player.id}
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
              isCurrentTurn={effectiveCurrentTurnPlayerId === player.id}
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
    </>
  )

  return (
    <>
      {/* Action Guidance */}
      <ActionGuidance
        gameStatus={gameStatus}
        isCurrentTurn={effectiveCurrentTurnPlayerId === currentUser?.id}
        currentPlayer={players.find(p => p.id === effectiveCurrentTurnPlayerId)}
        show={gameStatus !== 'WAITING'}
      />

      {/* Error Alert */}
      {error.room && (
        <Alert 
          severity="error" 
          sx={{ 
            position: 'fixed', 
            top: isMobile ? 120 : 140, 
            left: '50%', 
            transform: 'translateX(-50%)',
            zIndex: 999,
            maxWidth: isMobile ? 'calc(100vw - 32px)' : 400
          }}
        >
          {error.room}
        </Alert>
      )}

      {/* Main Layout */}
      <ResponsiveGameLayout
        gameInfoComponent={gameInfoComponent}
        chatComponent={chatComponent}
        playersComponent={playersComponent}
        centerComponent={centerComponent}
        newMessageCount={newMessageCount}
      >
        {playersAroundScreen}
      </ResponsiveGameLayout>

      {/* Tutorial System */}
      <GameTutorialSystem
        open={tutorialOpen}
        onClose={() => setTutorialOpen(false)}
        showOnFirstVisit={true}
      />

      {/* Game Result Screen */}
      {showGameResult && finalGameResult && (
        <GameResultScreen
          gameResult={finalGameResult}
          players={players}
          liarPlayer={players.find(p => p.isLiar)}
          winningTeam={finalGameResult.winningTeam}
          gameStats={finalGameResult.stats}
          onRestartGame={handleRestartGame}
          onReturnToLobby={navigateToLobby}
        />
      )}

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
    </>
  )
}

export default GameRoomPage