import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
    useMediaQuery,
    useTheme
} from '@mui/material'
import {useGame} from '../context/GameContext'
import {useToast} from '../components/EnhancedToastSystem'
import VictoryAnimation from '../components/VictoryAnimation'
import ResponsiveGameLayout from '../components/ResponsiveGameLayout'
import AdaptiveGameLayout from '../components/AdaptiveGameLayout'
import LeftInfoPanel from '../components/LeftInfoPanel'
import useGameLayout from '../hooks/useGameLayout'
import useSystemMessages from '../hooks/useSystemMessages'
import useGameGuidance from '../hooks/useGameGuidance'
import GameResultScreen from '../components/GameResultScreen'
import GameTutorialSystem, {ActionGuidance} from '../components/GameTutorialSystem'
import HeaderBar from './GameRoomPage/components/HeaderBar'
import ChatPanel from './GameRoomPage/components/ChatPanel'
import PlayersPanel from './GameRoomPage/components/PlayersPanel'
import CenterStage from './GameRoomPage/components/CenterStage'
import AroundScreenPlayers from './GameRoomPage/components/AroundScreenPlayers'
import useRoomConnectionEffect from './GameRoomPage/hooks/useRoomConnectionEffect'
import usePlayersDistribution from './GameRoomPage/hooks/usePlayersDistribution'
import useRoomStateInfo from './GameRoomPage/hooks/useRoomStateInfo'
import useSubmissionFlows from './GameRoomPage/hooks/useSubmissionFlows'


const GameRoomPage = React.memo(() => {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('md'))
    const {addToast} = useToast()


    const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
    const [speechBubbles, setSpeechBubbles] = useState({})
    const [tutorialOpen, setTutorialOpen] = useState(false)
    const [showGameResult, setShowGameResult] = useState(false)
    const [newMessageCount, setNewMessageCount] = useState(0)

    const {
        currentRoom,
        currentUser,
        loading,
        error,
        socketConnected,
        roomPlayers,
        currentTurnPlayerId,
        gameStatus,
        gamePhase,
        currentRound,
        playerRole,
        assignedWord,
        gameTimer,
        votingResults,
        accusedPlayerId,
        survivalVotingProgress,
        mySurvivalVote,
        wordGuessResult,
        finalGameResult,
        chatMessages,
        sendChatMessage,
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

    const players = useMemo(() =>
            roomPlayers.length > 0 ? roomPlayers : (currentRoom?.players || []),
        [roomPlayers, currentRoom?.players]
    )

    const {
        submissionStates,
        handleHintSubmit,
        handleDefenseSubmit,
        handleSurvivalVoteSubmit,
        handleWordGuessSubmit,
        handleRestartGame,
    } = useSubmissionFlows({
        gameStatus,
        submitHint,
        submitDefense,
        castSurvivalVote,
        guessWord,
        startGame,
    })

    const handleRestartGameWithClear = useCallback(() => {
        setSpeechBubbles({})
        handleRestartGame()
    }, [handleRestartGame])

    useGameLayout({
        gameStatus,
        playerCount: players.length,
        enableTransitions: true
    })

    const systemMessages = useSystemMessages({
        gameStatus,
        maxMessages: 10000,
        enableAutoCleanup: true
    })

    useGameGuidance({
        gameStatus,
        currentUser,
        currentTurnPlayerId,
        players,
        playerRole,
        gameTimer,
        accusedPlayerId,
        hintSubmitted: submissionStates.hint.submitted,
        defenseSubmitted: submissionStates.defense.submitted,
        survivalVoteSubmitted: submissionStates.survivalVote.submitted,
        wordGuessSubmitted: submissionStates.wordGuess.submitted
    })

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

    const handleTimerExpired = useCallback(() => {
        console.log('[DEBUG_LOG] Timer expired in GameRoomPage, current status:', gameStatus)
    }, [gameStatus])

    useRoomConnectionEffect({
        gameNumber: currentRoom?.gameNumber,
        connectToRoom,
        disconnectSocket,
        addToast,
    })

    useEffect(() => {
        if (socketConnected) {
            console.log('[DEBUG_LOG] WebSocket connected in GameRoomPage')
        } else {
            console.log('[DEBUG_LOG] WebSocket disconnected in GameRoomPage')
        }
    }, [socketConnected])

    const handleLeaveRoom = useCallback(async () => {
        try {
            if (currentRoom) {
                await leaveRoom(currentRoom.gameNumber)
            }
            setLeaveDialogOpen(false)
            navigateToLobby()
        } catch (error) {
            console.error('Failed to leave room:', error)
            navigateToLobby()
        }
    }, [currentRoom, leaveRoom, navigateToLobby])

    const handleStartGame = useCallback(() => {
        console.log('[DEBUG_LOG] Host starting game')
        startGame()
    }, [startGame])

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

    const isHost = useCallback(() => {
        if (!currentUser || !players.length) return false
        const currentPlayer = players.find(p => p.nickname === currentUser.nickname)
        return currentPlayer?.isHost || false
    }, [currentUser, players])



    const handlers = useMemo(() => ({
        chat: { handleSendChatMessage },
        game: {
            handleStartGame,
            handleLeaveRoom,
            handleRestartGame: handleRestartGameWithClear,
            handleHintSubmit,
            handleDefenseSubmit,
            handleSurvivalVoteSubmit,
            handleWordGuessSubmit,
            handleTimerExpired,
        },
        player: { handleAddFriend, handleReportPlayer, isHost },
    }), [
        handleSendChatMessage,
        handleStartGame,
        handleLeaveRoom,
        handleRestartGameWithClear,
        handleHintSubmit,
        handleDefenseSubmit,
        handleSurvivalVoteSubmit,
        handleWordGuessSubmit,
        handleTimerExpired,
        handleAddFriend,
        handleReportPlayer,
        isHost,
    ])

    if (!currentRoom) {
        return (
            <Container maxWidth="lg" sx={{py: 4}}>
                <Alert severity="error">
                    방 정보를 불러올 수 없습니다. 로비로 돌아가세요.
                </Alert>
                <Button variant="contained" onClick={navigateToLobby} sx={{mt: 2}}>
                    로비로 돌아가기
                </Button>
            </Container>
        )
    }

    const playerPositions = usePlayersDistribution(players)

    const roomStateInfo = useRoomStateInfo(currentRoom.gameState)

    const effectiveCurrentTurnPlayerId = currentTurnPlayerId || currentRoom.currentTurnPlayerId

    const gameInfoComponent = (
        <HeaderBar
            currentRoom={currentRoom}
            isMobile={isMobile}
            roomStateInfo={roomStateInfo}
            playersCount={players.length}
            maxPlayers={currentRoom.maxPlayers || currentRoom.gameParticipants || 8}
            onOpenTutorial={() => setTutorialOpen(true)}
            onOpenLeaveDialog={() => setLeaveDialogOpen(true)}
        />
    )

    const chatComponent = useMemo(() => {
        console.log('[DEBUG_LOG] ChatComponent - currentUser:', currentUser)
        return (
            <ChatPanel
                messages={chatMessages}
                currentUser={currentUser}
                onSendMessage={handlers.chat.handleSendChatMessage}
                disabled={!socketConnected}
                placeholder={!socketConnected ? '서버에 연결 중...' : '메시지를 입력하세요...'}
            />
        )
    }, [chatMessages, currentUser, handlers.chat.handleSendChatMessage, socketConnected])


    const playersComponent = useMemo(() => (
        <PlayersPanel
            players={players}
            effectiveCurrentTurnPlayerId={effectiveCurrentTurnPlayerId}
            currentUserNickname={currentUser?.nickname}
            onAddFriend={handlers.player.handleAddFriend}
            onReportPlayer={handlers.player.handleReportPlayer}
        />
    ), [players, effectiveCurrentTurnPlayerId, currentUser?.nickname, handlers.player.handleAddFriend, handlers.player.handleReportPlayer])

    const centerComponent = (
        <CenterStage
            isMobile={isMobile}
            gameStatus={gameStatus}
            players={players}
            effectiveCurrentTurnPlayerId={effectiveCurrentTurnPlayerId}
            gameTimer={gameTimer}
            currentRoom={currentRoom}
            currentRound={currentRound}
            assignedWord={assignedWord}
            playerRole={playerRole}
            isHost={handlers.player.isHost}
            onStartGame={handlers.game.handleStartGame}
            castVote={castVote}
            socketConnected={socketConnected}
            onDefenseSubmit={handlers.game.handleDefenseSubmit}
            onSurvivalVoteSubmit={handlers.game.handleSurvivalVoteSubmit}
            onWordGuessSubmit={handlers.game.handleWordGuessSubmit}
            onRestartGame={handlers.game.handleRestartGame}
            onHintSubmit={handlers.game.handleHintSubmit}
            submissionStates={submissionStates}
            loadingRoom={loading.room}
            accusedPlayerId={accusedPlayerId}
            currentUser={currentUser}
            mySurvivalVote={mySurvivalVote}
            survivalVotingProgress={survivalVotingProgress}
            wordGuessResult={wordGuessResult}
            finalGameResult={finalGameResult}
        />
    )

    const playersAroundScreen = (
        <AroundScreenPlayers
            playerPositions={playerPositions}
            effectiveCurrentTurnPlayerId={effectiveCurrentTurnPlayerId}
            speechBubbles={speechBubbles}
        />
    )

    return (
        <>
            <ActionGuidance
                gameStatus={gameStatus}
                isCurrentTurn={effectiveCurrentTurnPlayerId === currentUser?.id}
                currentPlayer={players.find(p => p.id === effectiveCurrentTurnPlayerId)}
                show={gameStatus !== 'WAITING'}
            />

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
                            <Box component="span" sx={{color: 'warning.main', display: 'block', mt: 1}}>
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