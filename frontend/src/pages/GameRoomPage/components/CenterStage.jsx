import React from 'react'
import { Box, Button, Paper, Typography } from '@mui/material'
import { PlayArrow as PlayIcon } from '@mui/icons-material'
import GameModerator from '../../../components/GameModerator'
import GameInfoDisplay from '../../../components/GameInfoDisplay'
import EnhancedGameTimer from '../../../components/EnhancedGameTimer'
import InteractiveVotingSystem from '../../../components/InteractiveVotingSystem'
import DefenseComponent from '../../../components/DefenseComponent'
import SurvivalVotingComponent from '../../../components/SurvivalVotingComponent'
import WordGuessComponent from '../../../components/WordGuessComponent'
import HintInputComponent from '../../../components/HintInputComponent'

const CenterStage = React.memo(function CenterStage({
  isMobile,
  gameStatus,
  players,
  effectiveCurrentTurnPlayerId,
  gameTimer,
  currentRoom,
  currentRound,
  assignedWord,
  playerRole,
  isHost,
  onStartGame,
  castVote,
  socketConnected,
  onDefenseSubmit,
  onSurvivalVoteSubmit,
  onWordGuessSubmit,
  onRestartGame,
  onHintSubmit,
  submissionStates,
  loadingRoom,
  accusedPlayerId,
  currentUser,
  mySurvivalVote,
  survivalVotingProgress,
  wordGuessResult,
  finalGameResult,
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: '100%' }}>
      <GameModerator
        gameStatus={gameStatus}
        currentPlayer={players.find(p => p.id === effectiveCurrentTurnPlayerId)}
        timer={gameTimer}
      />

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
            : currentRoom?.subject?.name || currentRoom?.subject?.content || currentRoom?.subject || '주제 없음',
          status: gameStatus === 'WAITING' ? '대기 중' :
            gameStatus === 'SPEAKING' ? '발언 단계' :
              gameStatus === 'VOTING' ? '투표 단계' :
                gameStatus === 'RESULTS' ? '결과 발표' :
                  gameStatus === 'FINISHED' ? '게임 종료' : '게임 진행 중'
        }}
      />

      {gameStatus === 'WAITING' && isHost() && (
        <Button
          variant="contained"
          size="large"
          startIcon={<PlayIcon />}
          onClick={onStartGame}
          sx={{
            mb: 2,
            px: 4,
            py: 1.5,
            fontSize: '1.1rem',
            backgroundColor: 'success.main',
            '&:hover': { backgroundColor: 'success.dark' },
          }}
        >
          게임 시작
        </Button>
      )}

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
            maxWidth: 400,
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

      {gameStatus !== 'WAITING' && gameTimer > 0 && (
        <EnhancedGameTimer
          gameTimer={gameTimer}
          maxTime={60}
          gameStatus={gameStatus}
          onTimeExpired={() => console.log('[DEBUG_LOG] Timer expired in CenterStage')}
          size={isMobile ? 100 : 140}
        />
      )}

      {gameStatus === 'VOTING' && (
        <Box sx={{ mb: 2, width: '100%' }}>
          <InteractiveVotingSystem
            players={players}
            onVote={castVote}
            disabled={!socketConnected}
          />
        </Box>
      )}

      {gameStatus === 'DEFENSE' && (
        <Box sx={{ mb: 2, width: '100%' }}>
          <DefenseComponent
            gameTimer={gameTimer}
            onSubmitDefense={onDefenseSubmit}
            isSubmitted={submissionStates?.defense?.submitted}
            isLoading={loadingRoom}
            error={submissionStates?.defense?.error}
            accusedPlayerId={accusedPlayerId}
            currentUserId={currentUser?.id}
            accusedPlayerName={players.find(p => p.id === accusedPlayerId)?.nickname}
          />
        </Box>
      )}

      {gameStatus === 'SURVIVAL_VOTING' && (
        <Box sx={{ mb: 2, width: '100%' }}>
          <SurvivalVotingComponent
            gameTimer={gameTimer}
            onCastSurvivalVote={onSurvivalVoteSubmit}
            isVoted={submissionStates?.survivalVote?.submitted || mySurvivalVote !== null}
            isLoading={loadingRoom}
            error={submissionStates?.survivalVote?.error}
            accusedPlayer={players.find(p => p.id === accusedPlayerId)}
            votingProgress={survivalVotingProgress}
            players={players}
          />
        </Box>
      )}

      {gameStatus === 'WORD_GUESS' && (
        <Box sx={{ mb: 2, width: '100%' }}>
          <WordGuessComponent
            gameTimer={gameTimer}
            onGuessWord={onWordGuessSubmit}
            onRestartGame={onRestartGame}
            isSubmitted={submissionStates?.wordGuess?.submitted}
            isLoading={loadingRoom}
            error={submissionStates?.wordGuess?.error}
            playerRole={playerRole}
            guessResult={wordGuessResult}
            gameResult={finalGameResult}
          />
        </Box>
      )}

      {(gameStatus === 'SPEAKING' || gameStatus === 'HINT_PHASE') && (
        <Box sx={{ mb: 2, width: '100%' }}>
          {/* Keep the existing HintInputComponent usage through prop */}
          {/* We pass onHintSubmit handler and state via props */}
          {/* To avoid tight coupling, the actual component remains inside GameRoomPage or here? */}
          {/* We keep it here to mimic original structure */}
          {/* eslint-disable-next-line react/jsx-no-undef */}
          <HintInputComponent
            gameTimer={gameTimer}
            onSubmitHint={onHintSubmit}
            isSubmitted={submissionStates?.hint?.submitted}
            isLoading={loadingRoom}
            error={submissionStates?.hint?.error}
          />
        </Box>
      )}
    </Box>
  )
})

CenterStage.displayName = 'CenterStage'
export default CenterStage
