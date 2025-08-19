import React, {useCallback, useEffect, useState} from 'react'
import {Alert, CircularProgress, Typography} from '../components/ui'
import {Alert as MantineAlert, Button as MantineButton, Container as MantineContainer, Stack} from '@mantine/core'
import {motion} from 'framer-motion'
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
import {useParams} from 'react-router-dom'

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
    
    // URL 파라미터 기반으로 currentRoom 동기화 시도
    const { gameNumber: gameNumberParam } = useParams()
    const parsedGameNumber = useMemo(() => {
        const n = parseInt(gameNumberParam, 10)
        return Number.isFinite(n) && n > 0 ? n : null
    }, [gameNumberParam])

    // 상세 조회 시도 여부(로딩/미시도 단계에서 에러 표시/로비 유도 금지)
    const [triedFetch, setTriedFetch] = useState(false)

    useEffect(() => {
        let cancelled = false
        async function ensureRoomLoaded() {
            if (!parsedGameNumber) {
                setTriedFetch(true)
                return
            }
            const hasMismatch =
                !gameState.currentRoom ||
                parseInt(gameState.currentRoom.gameNumber, 10) !== parsedGameNumber

            if (hasMismatch) {
                try {
                    await gameActions.getCurrentRoom(parsedGameNumber)
                } catch (e) {
                    // 에러는 아래 표시 단계에서 처리
                } finally {
                    if (!cancelled) setTriedFetch(true)
                }
            } else {
                if (!cancelled) setTriedFetch(true)
            }
        }
        setTriedFetch(false)
        ensureRoomLoaded()
        return () => { cancelled = true }
        // gameActions.getCurrentRoom는 안정 참조라고 가정(파사드)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [parsedGameNumber])

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

    // currentRoom 미준비 또는 로딩/미시도 단계에서는 로딩 상태 유지(로비 유도 금지)
    if (!gameState.currentRoom) {
        const isLoadingRoom = gameState.loading?.room || !triedFetch
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <MantineContainer size="lg" style={{ paddingTop: '32px', paddingBottom: '32px' }}>
                    <Stack gap="md" align="center" justify="center">
                        {isLoadingRoom ? (
                            <>
                                <CircularProgress />
                                <Typography>방 정보를 불러오는 중입니다…</Typography>
                            </>
                        ) : (
                            <>
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
                            </>
                        )}
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
                    chatComponent={chatComponent}
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
                    rightPanel={chatComponent}
                >
                    {playersAroundScreen}
                </AdaptiveGameLayout>
            )}

            {/* ... existing code ... */}
        </>
    )
})

GameRoomPage.displayName = 'GameRoomPage'

export default GameRoomPage