import React, {useCallback, useEffect, useMemo, useReducer, useState} from 'react'
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
    IconButton,
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
    PersonAdd as PersonAddIcon,
    PlayArrow as PlayIcon,
    Report as ReportIcon
} from '@mui/icons-material'
import {useGame} from '../context/GameContext'
import {useToast} from '../components/EnhancedToastSystem'
import PlayerProfile from '../components/PlayerProfile'
import PlayerSpeechBubble from '../components/PlayerSpeechBubble'
import OptimizedEnhancedChatSystem from '../components/OptimizedEnhancedChatSystem'
import GameInfoDisplay from '../components/GameInfoDisplay'
import HintInputComponent from '../components/HintInputComponent'
import VotingComponent from '../components/VotingComponent'
import DefenseComponent from '../components/DefenseComponent'
import SurvivalVotingComponent from '../components/SurvivalVotingComponent'
import WordGuessComponent from '../components/WordGuessComponent'
import GameTimerComponent from '../components/GameTimerComponent'
import ResponsiveGameLayout from '../components/ResponsiveGameLayout'
import AdaptiveGameLayout from '../components/AdaptiveGameLayout'
import LeftInfoPanel from '../components/LeftInfoPanel'
import useGameLayout from '../hooks/useGameLayout'
import useSystemMessages from '../hooks/useSystemMessages'
import useGameGuidance from '../hooks/useGameGuidance'
import GameResultScreen from '../components/GameResultScreen'
import GameTutorialSystem, {ActionGuidance} from '../components/GameTutorialSystem'
import UserAvatar from '../components/UserAvatar'

const INITIAL_SUBMISSION_STATE = {
    hint: {submitted: false, error: null},
    defense: {submitted: false, error: null},
    survivalVote: {submitted: false, error: null},
    wordGuess: {submitted: false, error: null}
}

const ROOM_STATE_CONFIG = {
    WAITING: {color: 'success', text: '대기 중', icon: 'pause'},
    IN_PROGRESS: {color: 'warning', text: '진행 중', icon: 'play'},
    FINISHED: {color: 'default', text: '종료', icon: 'pause'}
}

const PLAYER_DISTRIBUTION_RULES = {
    maxPerSide: 8,
    minPerSide: 0
}

const submissionReducer = (state, action) => {
    switch (action.type) {
        case 'SET_SUBMITTED':
            return {
                ...state,
                [action.field]: {...state[action.field], submitted: true, error: null}
            }
        case 'SET_ERROR':
            return {
                ...state,
                [action.field]: {...state[action.field], error: action.error}
            }
        case 'RESET_FIELD':
            return {
                ...state,
                [action.field]: {submitted: false, error: null}
            }
        case 'RESET_ALL':
            return INITIAL_SUBMISSION_STATE
        default:
            return state
    }
}

const GameRoomPage = React.memo(() => {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('md'))
    const {addToast, showSystemMessage} = useToast()

    const [submissionStates, dispatchSubmission] = useReducer(submissionReducer, INITIAL_SUBMISSION_STATE)
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
        gameResults,
        accusedPlayerId,
        defenseText,
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

    const gameLayout = useGameLayout({
        gameStatus,
        playerCount: players.length,
        enableTransitions: true
    })

    const systemMessages = useSystemMessages({
        gameStatus,
        maxMessages: 50,
        enableAutoCleanup: true
    })

    const gameGuidance = useGameGuidance({
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

    useEffect(() => {
        if (!currentRoom?.gameNumber) {
            console.log('[DEBUG_LOG] No currentRoom or gameNumber available')
            return
        }

        const gameNumber = currentRoom.gameNumber
        console.log('[DEBUG_LOG] Connecting to room:', gameNumber)

        // Add debouncing to prevent rapid connection attempts
        const debounceTimer = setTimeout(() => {
            const connectWithRetry = async () => {
                try {
                    console.log('[DEBUG_LOG] Attempting to connect to room:', gameNumber)
                    await connectToRoom(gameNumber)
                    console.log('[DEBUG_LOG] Successfully connected to room:', gameNumber)
                } catch (error) {
                    console.error('[DEBUG_LOG] Failed to initialize room:', error)
                    // Let GameContext handle retries to avoid double retry mechanism
                    addToast('서버 연결에 실패했습니다. 게임 컨텍스트에서 재시도 중...', 'warning')
                }
            }

            connectWithRetry()
        }, 300) // 300ms debounce delay

        return () => {
            console.log('[DEBUG_LOG] GameRoomPage unmounting, disconnecting WebSocket')
            clearTimeout(debounceTimer) // Clear debounce timer
            try {
                disconnectSocket()
            } catch (error) {
                console.error('[DEBUG_LOG] Failed to disconnect WebSocket on unmount:', error)
            }
        }
    }, [currentRoom?.gameNumber, addToast]) // Removed connectToRoom and disconnectSocket from dependencies

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

    const handleHintSubmit = useCallback(async (hint) => {
        try {
            dispatchSubmission({type: 'RESET_FIELD', field: 'hint'})
            console.log('[DEBUG_LOG] Submitting hint:', hint)
            await submitHint(hint)
            dispatchSubmission({type: 'SET_SUBMITTED', field: 'hint'})
            console.log('[DEBUG_LOG] Hint submitted successfully')
        } catch (error) {
            console.error('[ERROR] Failed to submit hint:', error)
            dispatchSubmission({type: 'SET_ERROR', field: 'hint', error: error.message || '힌트 제출에 실패했습니다.'})
        }
    }, [submitHint, dispatchSubmission])

    const handleDefenseSubmit = useCallback(async (defenseText) => {
        try {
            dispatchSubmission({type: 'RESET_FIELD', field: 'defense'})
            console.log('[DEBUG_LOG] Submitting defense:', defenseText)
            await submitDefense(defenseText)
            dispatchSubmission({type: 'SET_SUBMITTED', field: 'defense'})
            console.log('[DEBUG_LOG] Defense submitted successfully')
        } catch (error) {
            console.error('[ERROR] Failed to submit defense:', error)
            dispatchSubmission({type: 'SET_ERROR', field: 'defense', error: error.message || '변론 제출에 실패했습니다.'})
        }
    }, [submitDefense, dispatchSubmission])

    const handleSurvivalVoteSubmit = useCallback(async (survival) => {
        try {
            dispatchSubmission({type: 'RESET_FIELD', field: 'survivalVote'})
            console.log('[DEBUG_LOG] Casting survival vote:', survival)
            await castSurvivalVote(survival)
            dispatchSubmission({type: 'SET_SUBMITTED', field: 'survivalVote'})
            console.log('[DEBUG_LOG] Survival vote cast successfully')
        } catch (error) {
            console.error('[ERROR] Failed to cast survival vote:', error)
            dispatchSubmission({type: 'SET_ERROR', field: 'survivalVote', error: error.message || '생존 투표에 실패했습니다.'})
        }
    }, [castSurvivalVote, dispatchSubmission])

    const handleWordGuessSubmit = useCallback(async (guessedWord) => {
        try {
            dispatchSubmission({type: 'RESET_FIELD', field: 'wordGuess'})
            console.log('[DEBUG_LOG] Submitting word guess:', guessedWord)
            await guessWord(guessedWord)
            dispatchSubmission({type: 'SET_SUBMITTED', field: 'wordGuess'})
            console.log('[DEBUG_LOG] Word guess submitted successfully')
        } catch (error) {
            console.error('[ERROR] Failed to submit word guess:', error)
            dispatchSubmission({type: 'SET_ERROR', field: 'wordGuess', error: error.message || '단어 추리에 실패했습니다.'})
        }
    }, [guessWord, dispatchSubmission])

    const handleRestartGame = useCallback(() => {
        console.log('[DEBUG_LOG] Restarting game')
        dispatchSubmission({type: 'RESET_ALL'})
        setSpeechBubbles({})
        startGame()
    }, [dispatchSubmission, startGame])

    useEffect(() => {
        const resetFields = []

        if (gameStatus !== 'SPEAKING' && gameStatus !== 'HINT_PHASE') {
            resetFields.push('hint')
        }
        if (gameStatus !== 'DEFENSE') {
            resetFields.push('defense')
        }
        if (gameStatus !== 'SURVIVAL_VOTING') {
            resetFields.push('survivalVote')
        }
        if (gameStatus !== 'WORD_GUESS') {
            resetFields.push('wordGuess')
        }

        resetFields.forEach(field => {
            dispatchSubmission({type: 'RESET_FIELD', field})
        })
    }, [gameStatus, dispatchSubmission])

    const calculatePlayerDistribution = useCallback((playerCount) => {
        if (playerCount <= 3) {
            return {top: 1, right: 1, bottom: 1, left: 0}
        } else if (playerCount <= 4) {
            return {top: 1, right: 1, bottom: 1, left: 1}
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
    }, [])

    const distributePlayersToPositions = useCallback((players) => {
        if (!players || players.length === 0) return {top: [], right: [], bottom: [], left: []}

        const distribution = calculatePlayerDistribution(players.length)
        const positions = {top: [], right: [], bottom: [], left: []}

        let index = 0

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
    }, [calculatePlayerDistribution])

    const getRoomStateInfo = useCallback((state) => {
        const config = ROOM_STATE_CONFIG[state] || ROOM_STATE_CONFIG.WAITING
        return {
            color: config.color,
            text: config.text,
            icon: config.icon === 'pause' ? <PauseIcon/> : <PlayIcon/>
        }
    }, [])

    const handlers = useMemo(() => ({
        chat: {
            handleSendChatMessage
        },
        game: {
            handleStartGame,
            handleLeaveRoom,
            handleRestartGame,
            handleHintSubmit,
            handleDefenseSubmit,
            handleSurvivalVoteSubmit,
            handleWordGuessSubmit,
            handleTimerExpired
        },
        player: {
            handleAddFriend,
            handleReportPlayer,
            isHost
        }
    }), [
        handleSendChatMessage,
        handleStartGame,
        handleLeaveRoom,
        handleRestartGame,
        handleHintSubmit,
        handleDefenseSubmit,
        handleSurvivalVoteSubmit,
        handleWordGuessSubmit,
        handleTimerExpired,
        handleAddFriend,
        handleReportPlayer,
        isHost
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

    const playerPositions = useMemo(() =>
            distributePlayersToPositions(players),
        [distributePlayersToPositions, players]
    )

    const roomStateInfo = useMemo(() =>
            getRoomStateInfo(currentRoom.gameState),
        [getRoomStateInfo, currentRoom.gameState]
    )

    const effectiveCurrentTurnPlayerId = currentTurnPlayerId || currentRoom.currentTurnPlayerId

    const gameInfoComponent = (
        <Box sx={{display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap'}}>
            <Typography variant="h6" component="div" sx={{flexGrow: 1, minWidth: 200}}>
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

            <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5}}>
                <PeopleIcon/>
                <Typography variant="body2">
                    {players.length}/{currentRoom.maxPlayers || currentRoom.gameParticipants || 8}
                </Typography>
            </Box>

            <Button
                variant="outlined"
                startIcon={<HelpIcon/>}
                onClick={() => setTutorialOpen(true)}
                size={isMobile ? 'small' : 'medium'}
            >
                도움말
            </Button>

            <Button
                color="error"
                variant="outlined"
                startIcon={<ExitIcon/>}
                onClick={() => setLeaveDialogOpen(true)}
                size={isMobile ? 'small' : 'medium'}
            >
                나가기
            </Button>
        </Box>
    )

    const chatComponent = useMemo(() => (
        <OptimizedEnhancedChatSystem
            messages={chatMessages || []}
            currentUser={currentUser}
            onSendMessage={handlers.chat.handleSendChatMessage}
            disabled={!socketConnected}
            placeholder={!socketConnected ? "서버에 연결 중..." : "메시지를 입력하세요..."}
            fallback={
                !socketConnected ? (
                    <Box sx={{p: 2, textAlign: 'center'}}>
                        <CircularProgress size={24}/>
                        <Typography variant="body2" sx={{mt: 1}}>
                            서버에 연결 중...
                        </Typography>
                    </Box>
                ) : null
            }
        />
    ), [chatMessages, currentUser, handlers.chat.handleSendChatMessage, socketConnected])

    const playersComponent = useMemo(() => (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 1}}>
            {players.length === 0 ? (
                <Box sx={{p: 2, textAlign: 'center'}}>
                    <Typography variant="body2" color="text.secondary">
                        플레이어를 불러오는 중...
                    </Typography>
                </Box>
            ) : (
                players.map((player) => {
                    const isTurn = effectiveCurrentTurnPlayerId === player.id
                    const isSelf = currentUser?.nickname && player.nickname === currentUser.nickname
                    return (
                        <Box key={player.id} sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                            <Box sx={{flex: '0 0 33%', minWidth: 0}}>
                                <Chip
                                    avatar={
                                        <UserAvatar
                                            userId={player.id}
                                            nickname={player.nickname}
                                            avatarUrl={player.avatarUrl}
                                            size="small"
                                        />
                                    }
                                    label={player.nickname}
                                    size="small"
                                    variant={isTurn ? 'filled' : 'outlined'}
                                    color={isTurn ? 'warning' : 'default'}
                                    sx={{
                                        width: '100%',
                                        justifyContent: 'flex-start',
                                        px: 0.5,
                                        '& .MuiChip-label': {overflow: 'hidden', textOverflow: 'ellipsis'}
                                    }}
                                />
                            </Box>

                            <Box sx={{flex: '1 1 67%', display: 'flex', justifyContent: 'flex-end', gap: 0.5}}>
                                {!isSelf && (
                                    <IconButton size="small" aria-label={`친구 추가: ${player.nickname}`}
                                                onClick={() => handlers.player.handleAddFriend(player)}>
                                        <PersonAddIcon fontSize="small"/>
                                    </IconButton>
                                )}
                                <IconButton size="small" aria-label={`신고: ${player.nickname}`}
                                            onClick={() => handlers.player.handleReportPlayer(player)}>
                                    <ReportIcon fontSize="small"/>
                                </IconButton>
                            </Box>
                        </Box>
                    )
                })
            )}
        </Box>
    ), [players, effectiveCurrentTurnPlayerId, currentUser?.nickname, handlers.player.handleAddFriend, handlers.player.handleReportPlayer])

    const centerComponent = (
        <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: '100%'}}>
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

            {gameStatus === 'WAITING' && handlers.player.isHost() && (
                <Button
                    variant="contained"
                    size="large"
                    startIcon={<PlayIcon/>}
                    onClick={handlers.game.handleStartGame}
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
                        <Typography variant="body2" sx={{mt: 1, opacity: 0.9}}>
                            라운드 {currentRound}
                        </Typography>
                    )}
                </Paper>
            )}

            {gameStatus !== 'WAITING' && gameTimer > 0 && (
                <GameTimerComponent
                    gameTimer={gameTimer}
                    maxTime={60}
                    gameStatus={gameStatus}
                    onTimeExpired={handlers.game.handleTimerExpired}
                    showCountdown={true}
                    size={isMobile ? 100 : 140}
                />
            )}

            {gameStatus === 'VOTING' && (
                <Box sx={{mb: 2, width: '100%'}}>
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

            {gameStatus === 'DEFENSE' && (
                <Box sx={{mb: 2, width: '100%'}}>
                    <DefenseComponent
                        gameTimer={gameTimer}
                        onSubmitDefense={handlers.game.handleDefenseSubmit}
                        isSubmitted={submissionStates.defense.submitted}
                        isLoading={loading.room}
                        error={submissionStates.defense.error}
                        accusedPlayerId={accusedPlayerId}
                        currentUserId={currentUser?.id}
                        accusedPlayerName={players.find(p => p.id === accusedPlayerId)?.nickname}
                    />
                </Box>
            )}

            {gameStatus === 'SURVIVAL_VOTING' && (
                <Box sx={{mb: 2, width: '100%'}}>
                    <SurvivalVotingComponent
                        gameTimer={gameTimer}
                        onCastSurvivalVote={handlers.game.handleSurvivalVoteSubmit}
                        isVoted={submissionStates.survivalVote.submitted || mySurvivalVote !== null}
                        isLoading={loading.room}
                        error={submissionStates.survivalVote.error}
                        accusedPlayer={players.find(p => p.id === accusedPlayerId)}
                        votingProgress={survivalVotingProgress}
                        players={players}
                    />
                </Box>
            )}

            {gameStatus === 'WORD_GUESS' && (
                <Box sx={{mb: 2, width: '100%'}}>
                    <WordGuessComponent
                        gameTimer={gameTimer}
                        onGuessWord={handlers.game.handleWordGuessSubmit}
                        onRestartGame={handlers.game.handleRestartGame}
                        isSubmitted={submissionStates.wordGuess.submitted}
                        isLoading={loading.room}
                        error={submissionStates.wordGuess.error}
                        playerRole={playerRole}
                        guessResult={wordGuessResult}
                        gameResult={finalGameResult}
                    />
                </Box>
            )}

            {(gameStatus === 'SPEAKING' || gameStatus === 'HINT_PHASE') && (
                <Box sx={{mb: 2, width: '100%'}}>
                    <HintInputComponent
                        gameTimer={gameTimer}
                        onSubmitHint={handlers.game.handleHintSubmit}
                        isSubmitted={submissionStates.hint.submitted}
                        isLoading={loading.room}
                        error={submissionStates.hint.error}
                    />
                </Box>
            )}
        </Box>
    )

    const playersAroundScreen = (
        <>
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
                    <Box key={player.id} sx={{position: 'relative'}}>
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
                    <Box key={player.id} sx={{position: 'relative'}}>
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
                    <Box key={player.id} sx={{position: 'relative'}}>
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
                    <Box key={player.id} sx={{position: 'relative'}}>
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