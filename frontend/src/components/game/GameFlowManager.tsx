import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {GameLayout} from './GameLayout'
import {useGameLayoutViewModel} from './useGameLayoutViewModel'
import {WaitingRoomControls} from './WaitingRoomControls'
import {useWebSocket} from '@/hooks/useWebSocket'
import {useGameRecovery} from '@/hooks/useGameRecovery'
import {websocketService} from '@/services/websocketService'
import {toast} from 'sonner'
import type {ActivityEvent} from '@/types/game'
import type {ChatMessage, ChatMessageType, GameEvent} from '@/types/realtime'
import {useGameStore} from '@/stores'

interface GameFlowManagerProps {
  onReturnToLobby?: (options?: { skipServer?: boolean }) => void
  onNextRound?: () => void
}

const createActivityId = (prefix: string): string => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`

const resolveIdentifier = (value: unknown): string | undefined => {
  if (value == null) return undefined
  if (typeof value === 'string') return value
  if (typeof value === 'number' && Number.isFinite(value)) return value.toString()
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (record.id != null) return resolveIdentifier(record.id)
    if (record.userId != null) return resolveIdentifier(record.userId)
    if (record.playerId != null) return resolveIdentifier(record.playerId)
  }
  return undefined
}

const getPhaseForLog = () => useGameStore.getState().gamePhase

export function GameFlowManager({ onReturnToLobby, onNextRound }: GameFlowManagerProps) {
  const viewModel = useGameLayoutViewModel()
  useGameRecovery()
  const {
    gameNumber,
    gamePhase,
    currentRound,
    totalRounds,
    currentTopic,
    currentWord,
    isLiar,
    timer,
    players,
    currentPlayer,
    currentTurnPlayerId,
    voting,
    summary,
    isLoading,
    error,
    chatMessages,
    chatLoading,
    chatError,
    typingPlayers,
    currentLiar,
    roundStage,
    roundStageEnteredAt,
    roundHasStarted,
    roundSummaries,
    currentRoundSummary,
    scoreboardEntries,
    addHint,
    castVote,
    addDefense,
    setUserVote,
    sendChatMessage,
    loadChatHistory,
    startGame,
    toggleReady,
  } = viewModel

  const [activities, setActivities] = useState<ActivityEvent[]>([])
  const [isStartingGame, setIsStartingGame] = useState(false)
  const [isTogglingReady, setIsTogglingReady] = useState(false)
  const roomDeletionHandledRef = useRef(false)

  useWebSocket(gameNumber ? gameNumber.toString() : undefined)

  useEffect(() => {
    setActivities([])
  }, [gameNumber])

  useEffect(() => {
    roomDeletionHandledRef.current = false
  }, [gameNumber])

  const appendActivity = useCallback((activity: ActivityEvent) => {
    setActivities(prev => {
      const next = [...prev, activity]
      return next.slice(-80)
    })
  }, [])

  useEffect(() => {
    if (!gamePhase) return
    appendActivity({
      id: createActivityId('phase'),
      type: 'phase_change',
      phase: gamePhase,
      timestamp: Date.now(),
      highlight: true,
    })
  }, [gamePhase, appendActivity])

  useEffect(() => {
    if (!gameNumber) return

    const makeActivity = (
      type: ActivityEvent['type'],
      event: GameEvent,
      content: string,
      highlight = false,
      identifiers: { actor?: unknown; target?: unknown } = {}
    ): ActivityEvent => ({
      id: createActivityId(type),
      type,
      playerId: resolveIdentifier(identifiers.actor),
      targetId: resolveIdentifier(identifiers.target),
      content,
      phase: getPhaseForLog(),
      timestamp: event.timestamp ?? Date.now(),
      highlight,
    })

    const unsubscribeHint = websocketService.onHintProvided((event) => {
      if (event.type !== 'HINT_PROVIDED' && event.type !== 'HINT_SUBMITTED') return

      const nickname = event.payload.playerName ?? (event.payload as Record<string, unknown>).playerNickname ?? '플레이어'
      appendActivity(
        makeActivity('hint', event, `${nickname} 님이 힌트를 제출했습니다.`, false, {
          actor: event.payload.playerId,
        })
      )
    })

    const unsubscribeVote = websocketService.onVoteCast((event) => {
      if (event.type !== 'VOTE_CAST') return

      const fallbackPayload = event.payload as Record<string, unknown>
      const voter = event.payload.voterName ?? (fallbackPayload.playerName as string | undefined) ?? '플레이어'
      const target =
        event.payload.targetName
          ?? (fallbackPayload.targetNickname as string | undefined)
          ?? '누군가'

      appendActivity(
        makeActivity('vote', event, `${voter} 님이 ${target}에게 투표했습니다.`, false, {
          actor: event.payload.voterId,
          target: event.payload.targetId,
        })
      )
    })

    const unsubscribeDefense = websocketService.onDefenseSubmitted((event) => {
      if (event.type !== 'DEFENSE_SUBMITTED') return

      const defender = event.payload.defenderName ?? event.payload.playerName ?? '플레이어'
      appendActivity(
        makeActivity('defense', event, `${defender} 님이 변론을 제출했습니다.`, false, {
          actor: event.payload.defenderId ?? event.payload.playerId,
        })
      )
    })

    const unsubscribePhase = websocketService.onPhaseChanged((event) => {
      if (event.type !== 'PHASE_CHANGED') return

      const nextPhase = typeof event.payload.phase === 'string' ? event.payload.phase : gamePhase
      appendActivity(makeActivity('phase_change', event, `단계가 ${nextPhase}로 변경되었습니다.`, true))
    })

    const unsubscribeRound = websocketService.onRoundEnded((event) => {
      if (event.type !== 'ROUND_ENDED') return

      appendActivity(makeActivity('system', event, '라운드가 종료되었습니다.', true))
    })

    const unsubscribeRoomDeleted = websocketService.onRoomDeleted((event) => {
      if (event.type !== 'ROOM_DELETED' || roomDeletionHandledRef.current) return

      roomDeletionHandledRef.current = true
      toast.warning('방이 정리되었습니다.', {
        description: '로비로 이동합니다.'
      })
      useGameStore.getState().resetGame()
      onReturnToLobby?.({ skipServer: true })
    })

    return () => {
      unsubscribeHint()
      unsubscribeVote()
      unsubscribeDefense()
      unsubscribePhase()
      unsubscribeRound()
      unsubscribeRoomDeleted()
    }
  }, [appendActivity, gameNumber, gamePhase, onReturnToLobby])

  const suspectedPlayer = useMemo(() => {
    const candidate = voting.targetPlayerId
      ?? (voting.results?.actualLiar ? voting.results.actualLiar.toString() : undefined)
      ?? currentLiar

    if (!candidate) return null

    return players.find((player) => {
      if (player.id === candidate) return true
      if (player.userId != null && player.userId.toString() === candidate) return true
      if (player.nickname === candidate) return true
      return false
    }) ?? null
  }, [players, voting.targetPlayerId, voting.results, currentLiar])

  const handleSubmitHint = useCallback(async (hint: string) => {
    if (!gameNumber || !currentPlayer) return

    addHint(currentPlayer.id, currentPlayer.nickname, hint)
    try {
      websocketService.sendGameAction(gameNumber.toString(), 'hint', { hint })
    } catch (error) {
      console.error('Failed to send hint action:', error)
    }
  }, [addHint, currentPlayer, gameNumber])

  const handleVotePlayer = useCallback(async (playerId: string) => {
    if (!gameNumber || !currentPlayer) return

    castVote(currentPlayer.id, playerId)
    setUserVote(playerId)
    try {
      websocketService.sendGameAction(gameNumber.toString(), 'vote', { targetUserId: playerId })
    } catch (error) {
      console.error('Failed to send vote action:', error)
    }
  }, [castVote, currentPlayer, gameNumber, setUserVote])

  const handleSubmitDefense = useCallback(async (defense: string) => {
    if (!gameNumber || !currentPlayer) return

    addDefense(currentPlayer.id, currentPlayer.nickname, defense)
    try {
      websocketService.sendGameAction(gameNumber.toString(), 'defense', { defenseText: defense })
    } catch (error) {
      console.error('Failed to send defense action:', error)
    }
  }, [addDefense, currentPlayer, gameNumber])

  const handleGuessWord = useCallback(async (guess: string) => {
    if (!gameNumber || !currentPlayer) return

    try {
      websocketService.sendGameAction(gameNumber.toString(), 'guess', { guess })
    } catch (error) {
      console.error('Failed to send guess action:', error)
    }
  }, [currentPlayer, gameNumber])

  const handleCastFinalVote = useCallback(async (execute: boolean) => {
    if (!gameNumber || !currentPlayer) return

    try {
      websocketService.sendGameAction(gameNumber.toString(), 'final_vote', { execute })
    } catch (error) {
      console.error('Failed to send final vote action:', error)
    }
  }, [currentPlayer, gameNumber])

  const handleSendChatMessage = useCallback(async (content: string, type: ChatMessageType = 'DISCUSSION') => {
    await sendChatMessage(content, type)
  }, [sendChatMessage])

  const handleReloadChatHistory = useCallback(async () => {
    try {
      await loadChatHistory()
    } catch (error) {
      console.error('Failed to reload chat history:', error)
      toast.error('채팅 기록을 불러오지 못했습니다.')
    }
  }, [loadChatHistory])

  const handleReportChatMessage = useCallback((message: ChatMessage) => {
    toast.info('신고가 접수되었습니다.', {
      description: `${message.playerNickname ?? '알 수 없음'}: ${message.content}`
    })
  }, [])

  const handleToggleReady = useCallback(async () => {
    if (!toggleReady || !currentPlayer) return

    setIsTogglingReady(true)
    const nextReadyState = !(currentPlayer.isReady ?? false)
    try {
      await toggleReady()
      toast.success(nextReadyState ? '준비가 완료되었습니다.' : '준비 상태를 해제했습니다.')
    } catch (error) {
      console.error('Failed to toggle ready state:', error)
      toast.error('준비 상태 변경에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsTogglingReady(false)
    }
  }, [toggleReady, currentPlayer])

  const handleStartGame = useCallback(async () => {
    if (!startGame || !currentPlayer?.isHost) return

    setIsStartingGame(true)
    try {
      await startGame()
      toast.success('게임을 시작합니다!')
    } catch (error) {
      console.error('Failed to start game:', error)
      toast.error('게임을 시작하지 못했습니다. 조건을 확인하고 다시 시도하세요.')
    } finally {
      setIsStartingGame(false)
    }
  }, [startGame, currentPlayer?.isHost])

  const isWaitingForPlayers = gamePhase === 'WAITING_FOR_PLAYERS'
  const canStartGame = summary.totalPlayers >= 3 && summary.readyPlayers === summary.totalPlayers

  const waitingControls = isWaitingForPlayers ? (
    <WaitingRoomControls
      players={players}
      currentPlayer={currentPlayer}
      readyPlayers={summary.readyPlayers}
      totalPlayers={summary.totalPlayers}
      minimumPlayers={3}
      onToggleReady={handleToggleReady}
      onStartGame={handleStartGame}
      isTogglePending={isTogglingReady}
      isStartPending={isStartingGame}
      canStartGame={canStartGame}
    />
  ) : null

  return (
    <GameLayout
      gameNumber={gameNumber}
      currentRound={currentRound}
      totalRounds={totalRounds}
      currentTopic={currentTopic}
      currentWord={currentWord}
      isLiar={isLiar}
      currentPhase={gamePhase}
      timer={timer}
      players={players}
      currentPlayer={currentPlayer}
      currentTurnPlayerId={currentTurnPlayerId}
      voting={voting}
      suspectedPlayer={suspectedPlayer}
      activities={activities}
      summary={summary}
      isLoading={isLoading}
      error={error}
      actionSlot={waitingControls}
      roundStage={roundStage}
      roundStageEnteredAt={roundStageEnteredAt}
      roundHasStarted={roundHasStarted}
      roundSummaries={roundSummaries}
      currentRoundSummary={currentRoundSummary}
      scoreboardEntries={scoreboardEntries}
      chatMessages={chatMessages}
      chatLoading={chatLoading}
      chatError={chatError}
      typingPlayers={typingPlayers}
      onSendChatMessage={handleSendChatMessage}
      onReportChatMessage={handleReportChatMessage}
      onReloadChat={handleReloadChatHistory}
      onReturnToLobby={onReturnToLobby}
      onNextRound={onNextRound}
      onSubmitHint={handleSubmitHint}
      onVotePlayer={handleVotePlayer}
      onSubmitDefense={handleSubmitDefense}
      onGuessWord={handleGuessWord}
      onCastFinalVote={handleCastFinalVote}
    />
  )
}
