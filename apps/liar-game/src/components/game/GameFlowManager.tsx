import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {GameLayout} from './GameLayout'
import {useGameLayoutViewModel} from './useGameLayoutViewModel'
import {WaitingRoomControls} from './WaitingRoomControls'
import {useWebSocket} from '@/hooks/useWebSocket'
import {useGameRecovery} from '@/hooks/useGameRecovery'
import {useGameFlow} from '@/hooks/useGameFlow'
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

  const {
    submitHint: submitHintRequest,
    voteForLiar: voteForLiarRequest,
    submitDefense: submitDefenseRequest,
    castFinalVote: castFinalVoteRequest,
    guessWord: guessWordRequest,
  } = useGameFlow()

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

    const unsubscribeCountdownStarted = websocketService.onGameEvent('COUNTDOWN_STARTED', (event) => {
      const durationSeconds = Number(event.payload?.durationSeconds ?? 0)
      const endTime = typeof event.payload?.endTime === 'string' ? Date.parse(event.payload.endTime) : null
      const computedRemaining = endTime ? Math.max(0, Math.round((endTime - Date.now()) / 1000)) : durationSeconds
      const remaining = Number.isFinite(computedRemaining) ? computedRemaining : 0

      useGameStore.getState().startTimer(Math.max(remaining, 0), 'COUNTDOWN')
      toast.info('게임 시작 카운트다운이 시작되었습니다.', {
        description: remaining > 0 ? `${remaining}초 후에 시작됩니다.` : undefined
      })
      appendActivity(makeActivity('system', event, '게임 시작 카운트다운이 시작되었습니다.', true))
    })

    const unsubscribeCountdownCancelled = websocketService.onGameEvent('COUNTDOWN_CANCELLED', (event) => {
      useGameStore.getState().stopTimer()
      toast.warning('카운트다운이 취소되었습니다.')
      appendActivity(makeActivity('system', event, '게임 시작 카운트다운이 취소되었습니다.', false))
    })

    const unsubscribeTimeExtended = websocketService.onGameEvent('TIME_EXTENDED', (event) => {
      const extendedUntilMs = typeof event.payload?.extendedUntil === 'string'
        ? Date.parse(event.payload.extendedUntil)
        : Number.NaN
      const extendedDate = Number.isFinite(extendedUntilMs) ? new Date(extendedUntilMs) : null
      const description = extendedDate
        ? `새 시작 예정 시각: ${extendedDate.toLocaleTimeString()}`
        : (event.payload?.message as string | undefined)

      if (extendedDate) {
        const remainingSeconds = Math.max(0, Math.round((extendedDate.getTime() - Date.now()) / 1000))
        const store = useGameStore.getState()
        if (store.gamePhase === 'WAITING_FOR_PLAYERS') {
          if (remainingSeconds > 0) {
            store.startTimer(remainingSeconds, 'COUNTDOWN')
          } else {
            store.stopTimer()
          }
        }
      }

      toast.success('게임 시작 시간이 연장되었습니다.', {
        description
      })
      appendActivity(makeActivity('system', event, '게임 시작 시간이 연장되었습니다.', false))
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
      unsubscribeCountdownStarted()
      unsubscribeCountdownCancelled()
      unsubscribeTimeExtended()
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

    try {
      await submitHintRequest(hint)
      addHint(currentPlayer.id, currentPlayer.nickname, hint)
    } catch (error) {
      console.error('Failed to send hint action:', error)
      toast.error('힌트를 전송하지 못했습니다. 다시 시도해주세요.')
    }
  }, [addHint, currentPlayer, gameNumber, submitHintRequest])

  const handleVotePlayer = useCallback(async (playerId: string) => {
    if (!gameNumber || !currentPlayer) return

    const targetPlayer = players.find((player) => {
      if (player.id === playerId) return true
      if (player.userId != null && String(player.userId) === playerId) return true
      if (player.nickname === playerId) return true
      return false
    })
    const resolvedTargetId = targetPlayer?.id ?? playerId
    const resolvedTargetUserId = targetPlayer?.userId ?? Number.parseInt(playerId, 10)

    if (!Number.isFinite(resolvedTargetUserId)) {
      console.warn('Unable to resolve target user id for vote', { playerId })
      return
    }

    try {
      await voteForLiarRequest(resolvedTargetUserId)
      castVote(currentPlayer.id, resolvedTargetId)
      setUserVote(resolvedTargetId)
    } catch (error) {
      console.error('Failed to send vote action:', error)
      toast.error('투표 요청이 실패했습니다. 다시 시도해주세요.')
    }
  }, [castVote, currentPlayer, gameNumber, players, setUserVote, voteForLiarRequest])

  const handleSubmitDefense = useCallback(async (defense: string) => {
    if (!gameNumber || !currentPlayer) return

    try {
      await submitDefenseRequest(defense)
      addDefense(currentPlayer.id, currentPlayer.nickname, defense)
    } catch (error) {
      console.error('Failed to send defense action:', error)
      toast.error('변론 전송에 실패했습니다. 다시 시도해주세요.')
    }
  }, [addDefense, currentPlayer, gameNumber, submitDefenseRequest])

  const handleGuessWord = useCallback(async (guess: string) => {
    if (!gameNumber || !currentPlayer) return

    try {
      await guessWordRequest(guess)
    } catch (error) {
      console.error('Failed to send guess action:', error)
    }
  }, [currentPlayer, gameNumber, guessWordRequest])

  const handleCastFinalVote = useCallback(async (execute: boolean) => {
    if (!gameNumber || !currentPlayer) return

    try {
      await castFinalVoteRequest(execute)
    } catch (error) {
      console.error('Failed to send final vote action:', error)
    }
  }, [castFinalVoteRequest, currentPlayer, gameNumber])

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
