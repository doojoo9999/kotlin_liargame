import React, {useCallback, useEffect, useState} from 'react'
import {Alert, Box, CircularProgress, Typography} from '../components/ui'
import {Alert as MantineAlert, Button as MantineButton, Container as MantineContainer, Stack} from '@mantine/core'
import {motion} from 'framer-motion'
import VictoryAnimation from '../components/VictoryAnimation'
import ResponsiveGameLayout from '../components/ResponsiveGameLayout'
import AdaptiveGameLayout from '../components/AdaptiveGameLayout'
import LeftInfoPanel from '../components/LeftInfoPanel'
import useGameLayout from '../hooks/useGameLayout'
import useSystemMessages from '../hooks/useSystemMessages'
import useGameGuidance from '../hooks/useGameGuidance'
import {ActionGuidance} from '../components/GameTutorialSystem'
import HeaderBar from './GameRoomPage/components/HeaderBar'
import ChatPanel from './GameRoomPage/components/ChatPanel'
import PlayersPanel from './GameRoomPage/components/PlayersPanel'
import CenterStage from './GameRoomPage/components/CenterStage'
import AroundScreenPlayers from './GameRoomPage/components/AroundScreenPlayers'
import useRoomConnectionEffect from './GameRoomPage/hooks/useRoomConnectionEffect'
import usePlayersDistribution from './GameRoomPage/hooks/usePlayersDistribution'
import useRoomStateInfo from './GameRoomPage/hooks/useRoomStateInfo'
import useSubmissionFlows from './GameRoomPage/hooks/useSubmissionFlows'
import useGameStateManager from './GameRoomPage/hooks/useGameStateManager'
import useUIStateManager from './GameRoomPage/hooks/useUIStateManager'
import useRoomEventHandlers from './GameRoomPage/hooks/useRoomEventHandlers'


const GameRoomPage = React.memo(() => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
    
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])
    // Extract game state management
    const { gameState, gameActions } = useGameStateManager()
    
    // Extract UI state management  
    const { uiState, uiActions } = useUIStateManager()
    
    // Extract submission flows (existing hook)
    const {
        submissionStates,
        handleHintSubmit,
        handleDefenseSubmit,
        handleSurvivalVoteSubmit,
        handleWordGuessSubmit,
        handleRestartGame,
    } = useSubmissionFlows({
        gameStatus: gameState.gameStatus,
        submitHint: gameActions.submitHint,
        submitDefense: gameActions.submitDefense,
        castSurvivalVote: gameActions.castSurvivalVote,
        guessWord: gameActions.guessWord,
        startGame: gameActions.startGame,
    })

    // Extract event handlers
    const eventHandlers = useRoomEventHandlers({ 
        gameState, 
        gameActions, 
        uiActions 
    })

    // Enhanced restart handler that clears speech bubbles
    const handleRestartGameWithClear = useCallback(() => {
        uiActions.speechBubbles.clearSpeechBubbles()
        handleRestartGame()
    }, [handleRestartGame, uiActions.speechBubbles])

    // Other hooks that depend on game state
    useGameLayout({
        gameStatus: gameState.gameStatus,
        playerCount: gameState.players.length,
        enableTransitions: true
    })

    const systemMessages = useSystemMessages({
        gameStatus: gameState.gameStatus,
        maxMessages: 10000,
        enableAutoCleanup: true
    })

    useGameGuidance({
        gameStatus: gameState.gameStatus,
        currentUser: gameState.currentUser,
        currentTurnPlayerId: gameState.currentTurnPlayerId,
        players: gameState.players,
        playerRole: gameState.playerRole,
        gameTimer: gameState.gameTimer,
        accusedPlayerId: gameState.accusedPlayerId,
        hintSubmitted: submissionStates.hint.submitted,
        defenseSubmitted: submissionStates.defense.submitted,
        survivalVoteSubmitted: submissionStates.survivalVote.submitted,
        wordGuessSubmitted: submissionStates.wordGuess.submitted
    })

    useRoomConnectionEffect({
        gameNumber: gameState.currentRoom?.gameNumber,
        connectToRoom: gameActions.connectToRoom,
        disconnectSocket: gameActions.disconnectSocket,
        addToast: eventHandlers.addToast,
    })

    useEffect(() => {
        if (gameState.socketConnected) {
            console.log('[DEBUG_LOG] WebSocket connected in GameRoomPage')
        } else {
            console.log('[DEBUG_LOG] WebSocket disconnected in GameRoomPage')
        }
    }, [gameState.socketConnected])

    // Organized handlers object for easy component prop passing
    const handlers = {
        chat: { 
            handleSendChatMessage: eventHandlers.handleSendChatMessage 
        },
        game: {
            handleStartGame: eventHandlers.handleStartGame,
            handleLeaveRoom: eventHandlers.handleLeaveRoom,
            handleRestartGame: handleRestartGameWithClear,
            handleHintSubmit,
            handleDefenseSubmit,
            handleSurvivalVoteSubmit,
            handleWordGuessSubmit,
            handleTimerExpired: eventHandlers.handleTimerExpired,
        },
        player: { 
            handleAddFriend: eventHandlers.handleAddFriend, 
            handleReportPlayer: eventHandlers.handleReportPlayer, 
            isHost: eventHandlers.isHost 
        },
        dialogs: {
            handleOpenTutorial: eventHandlers.handleOpenTutorial,
            handleOpenLeaveDialog: eventHandlers.handleOpenLeaveDialog
        }
    }

    if (!gameState.currentRoom) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <MantineContainer size="lg" style={{ paddingTop: '32px', paddingBottom: '32px' }}>
                    <Stack gap="md">
                        <MantineAlert color="red" variant="filled">
                            방 정보를 불러올 수 없습니다. 로비로 돌아가세요.
                        </MantineAlert>
                        <MantineButton 
                            variant="gradient" 
                            gradient={{ from: 'blue', to: 'cyan' }}
                            onClick={gameActions.navigateToLobby}
                        >
                            로비로 돌아가기
                        </MantineButton>
                    </Stack>
                </MantineContainer>
            </motion.div>
        )
    }

    const playerPositions = usePlayersDistribution(gameState.players)

    const roomStateInfo = useRoomStateInfo(gameState.currentRoom.gameState)

    const effectiveCurrentTurnPlayerId = gameState.currentTurnPlayerId || gameState.currentRoom.currentTurnPlayerId

    const gameInfoComponent = (
        <HeaderBar
            currentRoom={gameState.currentRoom}
            isMobile={isMobile}
            roomStateInfo={roomStateInfo}
            playersCount={gameState.players.length}
            maxPlayers={gameState.currentRoom.maxPlayers || gameState.currentRoom.gameParticipants || 8}
            onOpenTutorial={handlers.dialogs.handleOpenTutorial}
            onOpenLeaveDialog={handlers.dialogs.handleOpenLeaveDialog}
        />
    )

    const chatComponent = useMemo(() => {
        console.log('[DEBUG_LOG] ChatComponent - currentUser:', gameState.currentUser)
        return (
            <ChatPanel
                messages={gameState.chatMessages}
                currentUser={gameState.currentUser}
                onSendMessage={handlers.chat.handleSendChatMessage}
                disabled={!gameState.socketConnected}
                placeholder={!gameState.socketConnected ? '서버에 연결 중...' : '메시지를 입력하세요...'}
            />
        )
    }, [gameState.chatMessages, gameState.currentUser, handlers.chat.handleSendChatMessage, gameState.socketConnected])


    const playersComponent = useMemo(() => (
        <PlayersPanel
            players={gameState.players}
            effectiveCurrentTurnPlayerId={effectiveCurrentTurnPlayerId}
            currentUserNickname={gameState.currentUser?.nickname}
            onAddFriend={handlers.player.handleAddFriend}
            onReportPlayer={handlers.player.handleReportPlayer}
        />
    ), [gameState.players, effectiveCurrentTurnPlayerId, gameState.currentUser?.nickname, handlers.player.handleAddFriend, handlers.player.handleReportPlayer])

    const centerComponent = (
        <CenterStage
            isMobile={isMobile}
            gameStatus={gameState.gameStatus}
            players={gameState.players}
            effectiveCurrentTurnPlayerId={effectiveCurrentTurnPlayerId}
            gameTimer={gameState.gameTimer}
            currentRoom={gameState.currentRoom}
            currentRound={gameState.currentRound}
            assignedWord={gameState.assignedWord}
            playerRole={gameState.playerRole}
            isHost={handlers.player.isHost}
            onStartGame={handlers.game.handleStartGame}
            castVote={gameActions.castVote}
            socketConnected={gameState.socketConnected}
            onDefenseSubmit={handlers.game.handleDefenseSubmit}
            onSurvivalVoteSubmit={handlers.game.handleSurvivalVoteSubmit}
            onWordGuessSubmit={handlers.game.handleWordGuessSubmit}
            onRestartGame={handlers.game.handleRestartGame}
            onHintSubmit={handlers.game.handleHintSubmit}
            submissionStates={submissionStates}
            loadingRoom={gameState.loading.room}
            accusedPlayerId={gameState.accusedPlayerId}
            currentUser={gameState.currentUser}
            mySurvivalVote={gameState.mySurvivalVote}
            survivalVotingProgress={gameState.survivalVotingProgress}
            wordGuessResult={gameState.wordGuessResult}
            finalGameResult={gameState.finalGameResult}
        />
    )

    const playersAroundScreen = (
        <AroundScreenPlayers
            playerPositions={playerPositions}
            effectiveCurrentTurnPlayerId={effectiveCurrentTurnPlayerId}
            speechBubbles={uiState.speechBubbles}
        />
    )

    return (
        <>
            <ActionGuidance
                gameStatus={gameState.gameStatus}
                isCurrentTurn={effectiveCurrentTurnPlayerId === gameState.currentUser?.id}
                currentPlayer={gameState.players.find(p => p.id === effectiveCurrentTurnPlayerId)}
                show={gameState.gameStatus !== 'WAITING'}
            />

            {gameState.error.room && (
                <Alert
                    severity="error"
                    style={{
                        position: 'fixed',
                        top: isMobile ? '120px' : '140px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 999,
                        maxWidth: isMobile ? 'calc(100vw - 32px)' : '400px'
                    }}
                >
                    {gameState.error.room}
                </Alert>
            )}

            {isMobile ? (
                <ResponsiveGameLayout
                    gameInfoComponent={gameInfoComponent}
                    chatComponent={chatComponent}  // 통일된 채팅 컴포넌트 사용
                    playersComponent={playersComponent}
                    centerComponent={centerComponent}
                    newMessageCount={newMessageCount}
                    players={players}
                >
                    {playersAroundScreen}
                </ResponsiveGameLayout>
            ) : (
                <AdaptiveGameLayout
                    gameStatus={gameStatus}
                    leftPanel={
                        <LeftInfoPanel
                            gameStatus={gameStatus}
                            currentRound={currentRound}
                            gameTimer={gameTimer}
                            currentUser={currentUser}
                            currentTurnPlayerId={effectiveCurrentTurnPlayerId}
                            players={players}
                            isCurrentTurn={effectiveCurrentTurnPlayerId === currentUser?.id}
                            playerRole={playerRole}
                            assignedWord={assignedWord}
                            accusedPlayerId={accusedPlayerId}
                            systemMessages={systemMessages.messages}
                            gamePhase={gamePhase}
                            subject={currentRoom?.subject}
                            votingResults={votingResults}
                            hintSubmitted={submissionStates.hint.submitted}
                            defenseSubmitted={submissionStates.defense.submitted}
                            survivalVoteSubmitted={submissionStates.survivalVote.submitted}
                            wordGuessSubmitted={submissionStates.wordGuess.submitted}
                            onDismissNotification={systemMessages.dismissMessage}
                        />
                    }
                    centerComponent={centerComponent}
                    rightPanel={chatComponent} // ExpandedChatPanel 대신 통일된 chatComponent 사용
                >
                    {playersAroundScreen}
                </AdaptiveGameLayout>
            )}


            <GameTutorialSystem
                open={tutorialOpen}
                onClose={() => setTutorialOpen(false)}
                showOnFirstVisit={true}
            />

            {showGameResult && finalGameResult && (
                <GameResultScreen
                    gameResult={finalGameResult}
                    players={players}
                    liarPlayer={players.find(p => p.isLiar)}
                    winningTeam={finalGameResult.winningTeam}
                    gameStats={finalGameResult.stats}
                    onRestartGame={handlers.game.handleRestartGame}
                    onReturnToLobby={navigateToLobby}
                />
            )}

            <VictoryAnimation 
                show={showGameResult && finalGameResult}
                winningTeam={finalGameResult?.winningTeam}
                onComplete={() => setShowGameResult(false)}
            />

            <Dialog open={leaveDialogOpen} onClose={() => setLeaveDialogOpen(false)}>
                <DialogTitle>방 나가기</DialogTitle>
                <DialogContent>
                    <Typography>
                        정말로 방을 나가시겠습니까?
                        {currentRoom.gameState === 'IN_PROGRESS' && (
                            <Box component="span" style={{color: '#ff9800', display: 'block', marginTop: '8px'}}>
                                게임이 진행 중입니다. 나가면 게임에서 제외됩니다.
                            </Box>
                        )}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setLeaveDialogOpen(false)}>취소</Button>
                    <Button
                        onClick={handlers.game.handleLeaveRoom}
                        color="error"
                        variant="contained"
                        disabled={loading.room}
                    >
                        {loading.room ? <CircularProgress size={20}/> : '나가기'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
})

GameRoomPage.displayName = 'GameRoomPage'

export default GameRoomPage