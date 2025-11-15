import {useEffect, useRef} from 'react'
import {toast} from 'sonner'
import {gameService} from '@/api/gameApi'
import {useGameStore} from '@/stores'
import {useConnectionStore} from '@/stores/connectionStore'
import {useGameplayStore} from '@/stores/gameplayStore'
import {gameMonitoring} from '@/services/gameMonitoring'
import type {ConnectionStatus} from '@/types/store'
import type {GameRecoveryResponse} from '@/types/backendTypes'

const LATENCY_WARNING_COOLDOWN = 15_000

const isRecoveryTriggerStatus = (status: ConnectionStatus, previous?: ConnectionStatus) => {
  if (status !== 'connected') {
    return false
  }
  if (!previous || previous === 'idle' || previous === 'connecting') {
    return false
  }
  return previous !== 'connected'
}

export function useGameRecovery() {
  const status = useConnectionStore((state) => state.status)
  const avgLatency = useConnectionStore((state) => state.avgLatency)
  const queueLength = useConnectionStore((state) => state.messageQueue.length)
  const pendingCount = useConnectionStore((state) => Object.keys(state.pendingMessages).length)
  const syncIssues = useConnectionStore((state) => state.syncIssues)
  const clearSyncIssues = useConnectionStore((state) => state.clearSyncIssues)

  const gameNumber = useGameStore((state) => state.gameNumber)
  const updateFromGameState = useGameStore((state) => state.updateFromGameState)
  const applyRecoverySnapshot = useGameStore((state) => state.applyRecoverySnapshot)
  const loadChatHistory = useGameStore((state) => state.loadChatHistory)

  const hydrateFromSnapshot = useGameplayStore((state) => state.actions.hydrateFromSnapshot)

  const previousStatusRef = useRef<ConnectionStatus>(status)
  const recoveryInFlight = useRef<Promise<void> | null>(null)
  const lastLatencyNoticeRef = useRef<number>(0)

  // Handle connection status transitions
  useEffect(() => {
    const previousStatus = previousStatusRef.current

    if (status !== previousStatus) {
      if (status === 'disconnected' && previousStatus === 'connected') {
        gameMonitoring.emit({ type: 'CONNECTION_LOST', metadata: { previousStatus } })
      }

      if (status === 'connected' && isRecoveryTriggerStatus(status, previousStatus)) {
        gameMonitoring.emit({ type: 'CONNECTION_RESTORED', metadata: { previousStatus } })

        if (gameNumber && !recoveryInFlight.current) {
          recoveryInFlight.current = (async () => {
            const startedAt = Date.now()
            try {
              let recoverySnapshot: GameRecoveryResponse | null = null
              try {
                recoverySnapshot = await gameService.recoverGameState(gameNumber)
                if (recoverySnapshot) {
                  applyRecoverySnapshot(recoverySnapshot)
                }
              } catch (recoveryError) {
                console.warn('[useGameRecovery] Failed to load recovery snapshot', recoveryError)
              }

              const snapshot = await gameService.getGameState(gameNumber)
              updateFromGameState(snapshot)
              hydrateFromSnapshot(snapshot)

              if (typeof loadChatHistory === 'function') {
                try {
                  await loadChatHistory(50)
                } catch (error) {
                  console.warn('[useGameRecovery] Failed to refresh chat history', error)
                }
              }

              toast.success('게임 상태가 복원되었습니다', {
                description: '연결이 다시 안정화되었습니다.'
              })

              gameMonitoring.emit({
                type: 'RECOVERY_SUCCEEDED',
                metadata: {
                  duration: Date.now() - startedAt,
                  gameNumber
                }
              })
            } catch (error) {
              const message = error instanceof Error ? error.message : '복구 요청에 실패했습니다.'
              if (recoverySnapshot) {
                toast.warning('게임 상태 일부만 복원되었습니다', {
                  description: message
                })
              } else {
                toast.error('게임 상태 복구 실패', {
                  description: message
                })
              }

              gameMonitoring.emit({
                type: 'RECOVERY_FAILED',
                metadata: {
                  error: message,
                  gameNumber
                }
              })
            } finally {
              recoveryInFlight.current = null
            }
          })()
        }
      }

      previousStatusRef.current = status
    }
  }, [status, gameNumber, updateFromGameState, hydrateFromSnapshot, loadChatHistory, applyRecoverySnapshot])

  // Surface high latency or queued message indicators
  useEffect(() => {
    const now = Date.now()
    const queuePressure = queueLength + pendingCount

    if (status === 'connected' && (queuePressure > 0 || (avgLatency ?? 0) > 1500)) {
      if (now - lastLatencyNoticeRef.current > LATENCY_WARNING_COOLDOWN) {
        const description = queuePressure > 0
          ? `처리 대기 중인 메시지 ${queuePressure}건`
          : `평균 지연 ${Math.round((avgLatency ?? 0) / 10) / 100}s`

        toast.warning('네트워크 지연이 감지되었습니다', {
          description
        })

        gameMonitoring.emit({
          type: 'LATENCY_WARNING',
          metadata: {
            queueLength,
            pendingCount,
            avgLatency
          }
        })

        lastLatencyNoticeRef.current = now
      }
    } else if (queuePressure === 0 && (avgLatency ?? 0) < 800) {
      lastLatencyNoticeRef.current = 0
    }
  }, [status, queueLength, pendingCount, avgLatency])

  // Surface sync issues (e.g. invalid phase actions)
  useEffect(() => {
    if (!syncIssues.length) {
      return
    }

    syncIssues.forEach((issue) => {
      const message = issue.description ?? '요청이 현재 단계와 일치하지 않습니다.'
      toast.error('동기화 문제 발생', {
        description: message
      })

      const metadata: Record<string, unknown> = { ...issue }
      gameMonitoring.emit({
        type: 'SYNC_ISSUE',
        metadata
      })
    })

    clearSyncIssues()
  }, [syncIssues, clearSyncIssues])
}
