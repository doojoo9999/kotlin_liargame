import {act, renderHook} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {useGameStateSubscriber} from '@/versions/main/hooks/useGameStateSubscriber'
import {MainWebSocketManager} from '@/versions/main/socket/MainWebSocketManager'

// Mock WebSocket Manager
vi.mock('@/versions/main/socket/MainWebSocketManager', () => ({
  MainWebSocketManager: {
    getInstance: vi.fn(() => ({
      connect: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn(),
      isConnected: vi.fn(() => true),
      getConnectionState: vi.fn(() => 'connected'),
      getLatency: vi.fn(() => 50)
    }))
  }
}))

// Mock notifications
vi.mock('@/versions/main/providers/NotificationProvider', () => ({
  useNotification: () => ({
    addNotification: vi.fn()
  })
}))

// Mock game provider
vi.mock('@/versions/main/providers/GameProvider', () => ({
  useGame: () => ({
    actions: {
      setGame: vi.fn(),
      updatePhase: vi.fn(),
      updateTimer: vi.fn()
    }
  })
}))

describe('useGameStateSubscriber', () => {
  const mockConfig = {
    gameNumber: 123,
    onGameStateUpdate: vi.fn(),
    onPhaseChange: vi.fn(),
    onPlayerUpdate: vi.fn(),
    onTurnChange: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('initializes WebSocket connection on mount', async () => {
    const mockGetInstance = vi.mocked(MainWebSocketManager.getInstance)
    const mockConnect = vi.fn().mockResolvedValue(undefined)

    mockGetInstance.mockReturnValue({
      connect: mockConnect,
      subscribe: vi.fn(),
      isConnected: vi.fn(() => true),
      getConnectionState: vi.fn(() => 'connected'),
      getLatency: vi.fn(() => 50)
    } as any)

    renderHook(() => useGameStateSubscriber(mockConfig))

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(mockConnect).toHaveBeenCalled()
  })

  it('subscribes to game events when connected', async () => {
    const mockSubscribe = vi.fn()
    const mockGetInstance = vi.mocked(MainWebSocketManager.getInstance)

    mockGetInstance.mockReturnValue({
      connect: vi.fn().mockResolvedValue(undefined),
      subscribe: mockSubscribe,
      isConnected: vi.fn(() => true),
      getConnectionState: vi.fn(() => 'connected'),
      getLatency: vi.fn(() => 50)
    } as any)

    renderHook(() => useGameStateSubscriber(mockConfig))

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(mockSubscribe).toHaveBeenCalledWith(
      '/topic/game/123/state',
      expect.any(Function)
    )
    expect(mockSubscribe).toHaveBeenCalledWith(
      '/topic/game/123/players/joined',
      expect.any(Function)
    )
    expect(mockSubscribe).toHaveBeenCalledWith(
      '/topic/game/123/vote',
      expect.any(Function)
    )
  })

  it('handles phase change messages correctly', async () => {
    const mockSubscribe = vi.fn()
    const mockGetInstance = vi.mocked(MainWebSocketManager.getInstance)

    let phaseChangeHandler: Function
    mockSubscribe.mockImplementation((topic, handler) => {
      if (topic.includes('/state')) {
        phaseChangeHandler = handler
      }
    })

    mockGetInstance.mockReturnValue({
      connect: vi.fn().mockResolvedValue(undefined),
      subscribe: mockSubscribe,
      isConnected: vi.fn(() => true),
      getConnectionState: vi.fn(() => 'connected'),
      getLatency: vi.fn(() => 50)
    } as any)

    renderHook(() => useGameStateSubscriber(mockConfig))

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    // Simulate phase change message
    act(() => {
      phaseChangeHandler!({
        type: 'PHASE_CHANGED',
        gameNumber: 123,
        data: { phase: 'VOTING', timeRemaining: 60 },
        timestamp: new Date().toISOString()
      })
    })

    expect(mockConfig.onPhaseChange).toHaveBeenCalledWith('VOTING')
  })

  it('returns correct connection state', () => {
    const mockGetInstance = vi.mocked(MainWebSocketManager.getInstance)

    mockGetInstance.mockReturnValue({
      connect: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn(),
      isConnected: vi.fn(() => false),
      getConnectionState: vi.fn(() => 'disconnected'),
      getLatency: vi.fn(() => 0)
    } as any)

    const { result } = renderHook(() => useGameStateSubscriber(mockConfig))

    expect(result.current.isConnected).toBe(false)
    expect(result.current.connectionState).toBe('disconnected')
    expect(result.current.latency).toBe(0)
  })

  it('sends game actions through WebSocket', () => {
    const mockSend = vi.fn()
    const mockGetInstance = vi.mocked(MainWebSocketManager.getInstance)

    mockGetInstance.mockReturnValue({
      connect: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn(),
      isConnected: vi.fn(() => true),
      getConnectionState: vi.fn(() => 'connected'),
      getLatency: vi.fn(() => 50),
      send: mockSend
    } as any)

    const { result } = renderHook(() => useGameStateSubscriber(mockConfig))

    act(() => {
      result.current.sendGameAction('SUBMIT_HINT', { hint: 'test hint' })
    })

    expect(mockSend).toHaveBeenCalledWith(
      '/app/game/123/SUBMIT_HINT',
      { hint: 'test hint' }
    )
  })
})
