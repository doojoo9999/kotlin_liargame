import {type MutableRefObject} from 'react'

export type GameMonitoringEventType =
  | 'CONNECTION_LOST'
  | 'CONNECTION_RESTORED'
  | 'RECOVERY_SUCCEEDED'
  | 'RECOVERY_FAILED'
  | 'LATENCY_WARNING'
  | 'SYNC_ISSUE'

export interface GameMonitoringEvent<TMeta = Record<string, unknown>> {
  id: string
  type: GameMonitoringEventType
  timestamp: number
  metadata?: TMeta
}

export type GameMonitoringListener = (event: GameMonitoringEvent) => void

const HISTORY_LIMIT = 100
const history: GameMonitoringEvent[] = []
const listeners = new Set<GameMonitoringListener>()

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`

const emit = (event: Omit<GameMonitoringEvent, 'id' | 'timestamp'> & { timestamp?: number }) => {
  const payload: GameMonitoringEvent = {
    id: generateId(),
    timestamp: event.timestamp ?? Date.now(),
    type: event.type,
    metadata: event.metadata
  }

  history.push(payload)
  if (history.length > HISTORY_LIMIT) {
    history.shift()
  }

  if (typeof window !== 'undefined') {
    const registryWindow = window as Window & { __gameMonitoringEvents__?: GameMonitoringEvent[] }
    const registry = registryWindow.__gameMonitoringEvents__ ?? []
    registry.push(payload)
    registryWindow.__gameMonitoringEvents__ = registry.slice(-HISTORY_LIMIT)

    try {
      window.dispatchEvent(new CustomEvent('game-monitoring', { detail: payload }))
    } catch (error) {
      console.error('[gameMonitoring] Failed to dispatch browser event', error)
    }
  }

  if (import.meta.env.DEV) {
    console.debug('[gameMonitoring]', payload)
  }

  listeners.forEach((listener) => {
    try {
      listener(payload)
    } catch (error) {
      console.error('[gameMonitoring] Listener error', error)
    }
  })

  return payload
}

const subscribe = (listener: GameMonitoringListener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const getHistory = () => [...history]

export const gameMonitoring = {
  emit,
  subscribe,
  getHistory,
  attachToRef(ref: MutableRefObject<GameMonitoringEvent | null>, listener: GameMonitoringListener) {
    const wrapped: GameMonitoringListener = (event) => {
      ref.current = event
      listener(event)
    }
    listeners.add(wrapped)
    return () => listeners.delete(wrapped)
  }
}
