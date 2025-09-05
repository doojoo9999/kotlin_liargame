import {useCallback, useEffect, useRef} from 'react'
import {MainWebSocketManager} from '../socket/MainWebSocketManager'
import {useGame} from '../providers/GameProvider'
import {useNotification} from '../providers/NotificationProvider'
import type {GamePhase, Player} from '@/shared/types/api.types'

interface GameStateMessage {
  type: 'GAME_STATE_UPDATE' | 'PHASE_CHANGED' | 'PLAYER_UPDATE' | 'TURN_CHANGED'
  gameNumber: number
  data: any
  timestamp: string
}

interface GameStateSubscriberConfig {
  gameNumber: number
  onGameStateUpdate?: (gameState: any) => void
  onPhaseChange?: (phase: GamePhase) => void
  onPlayerUpdate?: (player: Player) => void
  onTurnChange?: (currentPlayerId: number) => void
}

export function useGameStateSubscriber(config: GameStateSubscriberConfig) {
  const { actions } = useGame()
  const { addNotification } = useNotification()
  const wsManager = useRef<MainWebSocketManager | null>(null)
  const subscriptions = useRef<Array<{ unsubscribe: () => void }>>([])

  const initializeWebSocket = useCallback(async () => {
    try {
      const baseUrl = import.meta.env.VITE_WS_BASE_URL || '/ws'
      wsManager.current = MainWebSocketManager.getInstance({
        url: baseUrl
      })
      await wsManager.current.connect()
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error)
      addNotification({
        type: 'error',
        title: '연결 실패',
        message: '실시간 연결에 실패했습니다.'
      })
    }
  }, [addNotification])

  const handleGameStateMessage = useCallback((message: GameStateMessage) => {
    switch (message.type) {
      case 'GAME_STATE_UPDATE':
        config.onGameStateUpdate?.(message.data)
        actions.setGame(message.data)
        break

      case 'PHASE_CHANGED':
        const { phase, timeRemaining } = message.data
        config.onPhaseChange?.(phase)
        actions.updatePhase(phase, timeRemaining)

        addNotification({
          type: 'info',
          title: '게임 단계 변경',
          message: `${getPhaseLabel(phase)} 단계로 변경되었습니다.`,
          duration: 3000
        })
        break

      case 'PLAYER_UPDATE':
        config.onPlayerUpdate?.(message.data)
        break

      case 'TURN_CHANGED':
        const { currentPlayerId } = message.data
        config.onTurnChange?.(currentPlayerId)
        break
    }
  }, [config, actions, addNotification])

  const handlePlayerJoined = useCallback((message: any) => {
    const { player } = message
    addNotification({
      type: 'success',
      title: '플레이어 입장',
      message: `${player.nickname}님이 게임에 참여했습니다.`,
      duration: 3000
    })
  }, [addNotification])

  const handlePlayerLeft = useCallback((message: any) => {
    const { player } = message
    addNotification({
      type: 'warning',
      title: '플레이어 퇴장',
      message: `${player.nickname}님이 게임을 떠났습니다.`,
      duration: 3000
    })
  }, [addNotification])

  const handleVoteUpdate = useCallback((message: any) => {
    const { voter, target, totalVotes } = message.data
    addNotification({
      type: 'info',
      title: '투표 현황',
      message: `${voter.nickname}님이 투표했습니다. (${totalVotes}명 투표 완료)`,
      duration: 2000
    })
  }, [addNotification])

  const handleTimerUpdate = useCallback((message: any) => {
    const { timeRemaining } = message.data
    actions.updateTimer(timeRemaining)

    if (timeRemaining <= 10 && timeRemaining > 0) {
      addNotification({
        type: 'warning',
        title: '시간 경고',
        message: `${timeRemaining}초 남았습니다!`,
        duration: 1000
      })
    }
  }, [actions, addNotification])

  const subscribeToGameEvents = useCallback(() => {
    if (!wsManager.current || !wsManager.current.isConnected()) {
      return
    }

    const gameNumber = config.gameNumber

    const subscriptionConfigs = [
      {
        topic: `/topic/game/${gameNumber}/state`,
        handler: handleGameStateMessage
      },
      {
        topic: `/topic/game/${gameNumber}/players/joined`,
        handler: handlePlayerJoined
      },
      {
        topic: `/topic/game/${gameNumber}/players/left`,
        handler: handlePlayerLeft
      },
      {
        topic: `/topic/game/${gameNumber}/vote`,
        handler: handleVoteUpdate
      },
      {
        topic: `/topic/game/${gameNumber}/timer`,
        handler: handleTimerUpdate
      }
    ]

    subscriptionConfigs.forEach(({ topic, handler }) => {
      const subscription = wsManager.current!.subscribe(topic, handler)
      subscriptions.current.push(subscription)
    })
  }, [
    config.gameNumber,
    handleGameStateMessage,
    handlePlayerJoined,
    handlePlayerLeft,
    handleVoteUpdate,
    handleTimerUpdate
  ])

  const unsubscribeAll = useCallback(() => {
    subscriptions.current.forEach(sub => sub.unsubscribe())
    subscriptions.current = []
  }, [])

  useEffect(() => {
    if (config.gameNumber) {
      initializeWebSocket().then(() => {
        subscribeToGameEvents()
      })
    }

    return () => {
      unsubscribeAll()
    }
  }, [config.gameNumber, initializeWebSocket, subscribeToGameEvents, unsubscribeAll])

  const sendGameAction = useCallback((action: string, data?: any) => {
    if (!wsManager.current?.isConnected()) {
      addNotification({
        type: 'error',
        title: '연결 오류',
        message: '서버와 연결이 끊어졌습니다.'
      })
      return false
    }

    try {
      wsManager.current.send(`/app/game/${config.gameNumber}/${action}`, data)
      return true
    } catch (error) {
      console.error('Failed to send game action:', error)
      addNotification({
        type: 'error',
        title: '액션 실패',
        message: '게임 액션 전송에 실패했습니다.'
      })
      return false
    }
  }, [config.gameNumber, addNotification])

  return {
    isConnected: wsManager.current?.isConnected() ?? false,
    connectionState: wsManager.current?.getConnectionState() ?? 'disconnected',
    latency: wsManager.current?.getLatency() ?? 0,
    sendGameAction,
    reconnect: initializeWebSocket
  }
}

function getPhaseLabel(phase: GamePhase): string {
  const labels: Record<GamePhase, string> = {
    'WAITING': '대기',
    'ROLE_ASSIGNMENT': '역할 배정',
    'HINT_PROVIDING': '힌트 제공',
    'DISCUSSION': '토론',
    'VOTING': '투표',
    'DEFENSE': '변론',
    'FINAL_VOTING': '최종 투표',
    'LIAR_GUESS': '라이어 추측',
    'RESULT': '결과 발표',
    'FINISHED': '게임 종료'
  }
  return labels[phase] || phase
}
