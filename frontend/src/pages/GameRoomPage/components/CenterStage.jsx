import React from 'react'
import {Box, Typography} from '@components/ui'
import GameModerator from '../../../components/GameModerator'
import GameInfoDisplay from '../../../components/GameInfoDisplay'
import {MessageQueue, useMessageQueue} from '../../../components/GameNarrator'
import {CircularTimer, DefensePhase, GameResult, GameWaiting, HintPhase, VotingPhase} from './CenterStage/components'

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
  const { messageQueueRef } = useMessageQueue()

  // Find current turn player
  const currentTurnPlayer = players.find(p => p.id === effectiveCurrentTurnPlayerId)

  // Determine which component to render based on game status
  const renderGamePhase = () => {
    switch (gameStatus) {
      case 'WAITING':
        return (
          <GameWaiting
            isHost={isHost}
            onStartGame={onStartGame}
            isMobile={isMobile}
          />
        )

      case 'SPEAKING':
      case 'HINT_PHASE':
        return (
          <HintPhase
            gameTimer={gameTimer}
            assignedWord={assignedWord}
            currentUser={currentUser}
            currentTurnPlayer={currentTurnPlayer}
            onSubmitHint={onHintSubmit}
            isSubmitted={submissionStates?.hint?.submitted}
            isLoading={loadingRoom}
            error={submissionStates?.hint?.error}
            isMobile={isMobile}
          />
        )

      case 'VOTING':
        return (
          <VotingPhase
            players={players}
            currentUser={currentUser}
            onVote={castVote}
            votingProgress={survivalVotingProgress}
            isVoted={submissionStates?.vote?.submitted}
            isLoading={loadingRoom}
            error={submissionStates?.vote?.error}
            gameTimer={gameTimer}
            isMobile={isMobile}
          />
        )

      case 'DEFENSE':
        return (
          <DefensePhase
            gameTimer={gameTimer}
            accusedPlayer={players.find(p => p.id === accusedPlayerId)}
            currentUser={currentUser}
            onSubmitDefense={onDefenseSubmit}
            isSubmitted={submissionStates?.defense?.submitted}
            isLoading={loadingRoom}
            error={submissionStates?.defense?.error}
            isMobile={isMobile}
          />
        )

      case 'SURVIVAL_VOTING':
        return (
          <VotingPhase
            players={players}
            currentUser={currentUser}
            onVote={onSurvivalVoteSubmit}
            votingProgress={survivalVotingProgress}
            isVoted={submissionStates?.survivalVote?.submitted || mySurvivalVote !== null}
            isLoading={loadingRoom}
            error={submissionStates?.survivalVote?.error}
            gameTimer={gameTimer}
            isMobile={isMobile}
          />
        )

      case 'WORD_GUESS':
      case 'FINISHED':
        return (
          <GameResult
            finalGameResult={finalGameResult}
            players={players}
            currentUser={currentUser}
            playerRole={playerRole}
            onRestartGame={onRestartGame}
            onNavigateToLobby={() => window.location.href = '/lobby'}
            isMobile={isMobile}
          />
        )

      default:
        return (
          <Box $textAlign="center" $padding="24px">
            <Typography variant="body1" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
              게임 상태를 확인하는 중...
            </Typography>
          </Box>
        )
    }
  }

  return (
    <Box $display="flex" $flexDirection="column" $alignItems="center" $gap="16px" $width="100%">
      {/* Message Queue for Narrator System */}
      <MessageQueue
        ref={messageQueueRef}
        isMobile={isMobile}
        position="left"
        style={{ width: '100%', maxWidth: '600px' }}
      />

      {/* Keep existing GameModerator for compatibility */}
      <GameModerator
        gameStatus={gameStatus}
        currentPlayer={currentTurnPlayer}
        timer={gameTimer}
      />

      {/* Keep existing GameInfoDisplay for compatibility */}
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

      {/* Enhanced Timer for Active Game States */}
      {gameStatus !== 'WAITING' && gameStatus !== 'FINISHED' && gameTimer > 0 && (
        <CircularTimer
          timeRemaining={gameTimer}
          maxTime={60}
          size={isMobile ? 100 : 140}
          onTimeExpired={() => console.log('[DEBUG_LOG] Timer expired in CenterStage')}
          isMobile={isMobile}
        />
      )}

      {/* Main Game Phase Component */}
      <Box 
        $width="100%"
        style={{ 
          transition: 'all 0.5s ease-in-out',
          animation: 'fadeInSlide 0.5s ease-out'
        }}
      >
        <style>{`
          @keyframes fadeInSlide {
            0% {
              opacity: 0;
              transform: translateY(20px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
        {renderGamePhase()}
      </Box>
    </Box>
  )
})

CenterStage.displayName = 'CenterStage'
export default CenterStage
